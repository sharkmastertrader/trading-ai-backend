// server.js – TradingAI Analyzer backend (Stripe + OpenAI + Auth + Elite tools + TradingView live)
import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import Stripe from "stripe";
import OpenAI from "openai";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

// ---------- Simple JSON "DB" for users ----------
const USERS_FILE = "users.json";

function loadUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

// ---------- Session + IP helpers ----------
function createSessionId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return crypto.randomBytes(16).toString("hex");
}

function getRequestIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length > 0) {
    return xf.split(",")[0].trim();
  }
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    ""
  );
}

function generateToken(user) {
  // include sessionId in token so we can enforce "one login at a time"
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      plan: user.plan,
      sessionId: user.activeSessionId || null,
    },
    process.env.JWT_SECRET || "dev_secret_change_me",
    { expiresIn: "30d" }
  );
}

function authRequired(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret_change_me"
    );

    // load user from "DB" so we can check activeSessionId and plan
    const users = loadUsers();
    const user = users.find((u) => u.id === decoded.id);

    if (!user || !user.activeSessionId) {
      return res
        .status(401)
        .json({ error: "Session expired. Please log in again." });
    }

    // enforce "one session per user"
    if (!decoded.sessionId || decoded.sessionId !== user.activeSessionId) {
      return res
        .status(401)
        .json({ error: "You were logged out from another device." });
    }

    // optional IP lock
    const lockIp =
      (process.env.LOCK_SESSION_TO_IP || "").toLowerCase() === "true";
    if (lockIp) {
      const requestIp = getRequestIp(req);

      if (user.lastIp && user.lastIp !== requestIp) {
        return res
          .status(401)
          .json({
            error: "Session in use from another IP. Please log in again.",
          });
      }

      // keep IP updated for this active session
      user.lastIp = requestIp;
      saveUsers(users);
    }

    req.user = {
      id: user.id,
      email: user.email,
      plan: user.plan,
    };
    next();
  } catch (err) {
    console.error("authRequired error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requirePlan(allowedPlans) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!allowedPlans.includes(req.user.plan)) {
      return res
        .status(403)
        .json({ error: "Plan not allowed for this feature" });
    }
    next();
  };
}

// ---------- Stripe + OpenAI clients ----------
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Multer for file uploads
const upload = multer({ dest: "uploads/" });

// ---- CORS ----
app.use(
  cors({
    origin: [
      "https://stunning-engine-4996v6wr97xhqq7j-5173.app.github.dev",
      "https://www.tradingaianalyzer.com",
    ],
  })
);

// ---------- STRIPE WEBHOOK (must be BEFORE express.json) ----------
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event = req.body;
    const sig = req.headers["stripe-signature"];

    try {
      if (process.env.STRIPE_WEBHOOK_SECRET) {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      }
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        const email =
          session.customer_details?.email || session.customer_email;
        const planFromMeta = session.metadata?.plan || "starter";

        if (!email) {
          console.warn("⚠️ checkout.session.completed without email");
          break;
        }

        const normEmail = String(email).toLowerCase();
        const users = loadUsers();
        let user = users.find((u) => u.email.toLowerCase() === normEmail);

        if (user) {
          // upgrade / sync plan
          user.plan = planFromMeta;
          console.log(
            `✅ Updated user ${user.email} to plan=${planFromMeta} from Stripe`
          );
        } else {
          // create new user with random password
          const randomPass = Math.random().toString(36).slice(2) + "TAA!";
          const passwordHash = await bcrypt.hash(randomPass, 10);

          user = {
            id: Date.now().toString(),
            email,
            passwordHash,
            plan: planFromMeta,
            createdAt: new Date().toISOString(),
            activeSessionId: null,
            lastIp: null,
            tvFeedKey: null,
          };
          users.push(user);
          console.log(
            `✅ Created new user ${user.email} with plan=${planFromMeta} from Stripe`
          );
        }

        saveUsers(users);
        break;
      }

      case "invoice.payment_succeeded":
        console.log("💸 Payment succeeded");
        break;
      default:
        console.log("Unhandled event type:", event.type);
    }

    res.json({ received: true });
  }
);

// Everything AFTER this can use JSON parser
app.use(express.json());

// ---------- AUTH ROUTES ----------

// helper: ensure per-user TradingView feed key
function generateFeedKey() {
  return crypto.randomBytes(16).toString("hex");
}

function ensureTvFeedKey(users, user) {
  if (!user.tvFeedKey) {
    user.tvFeedKey = generateFeedKey();
    saveUsers(users);
  }
  return user.tvFeedKey;
}

// Sign up (manual) – FREE plan only
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const users = loadUsers();
    const existing = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const requestIp = getRequestIp(req);
    const sessionId = createSessionId();

    const user = {
      id: Date.now().toString(),
      email,
      passwordHash,
      // manual signup is always FREE
      plan: "free",
      createdAt: new Date().toISOString(),
      activeSessionId: sessionId,
      lastIp: requestIp || null,
      tvFeedKey: null,
    };

    users.push(user);
    saveUsers(users);

    const token = generateToken(user);
    res.json({ token, user: { email: user.email, plan: user.plan } });
  } catch (err) {
    console.error("signup error", err);
    res.status(500).json({ error: "Failed to sign up" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = loadUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // create a fresh session, invalidate all old tokens
    const sessionId = createSessionId();
    const requestIp = getRequestIp(req);

    user.activeSessionId = sessionId;
    user.lastIp = requestIp || null;
    saveUsers(users);

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        plan: user.plan,
        sessionId,
      },
      process.env.JWT_SECRET || "dev_secret_change_me",
      { expiresIn: "30d" }
    );

    res.json({ token, user: { email: user.email, plan: user.plan } });
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({ error: "Failed to log in" });
  }
});

// Optional logout endpoint
app.post("/api/auth/logout", authRequired, (req, res) => {
  try {
    const users = loadUsers();
    const user = users.find((u) => u.id === req.user.id);
    if (user) {
      user.activeSessionId = null;
      saveUsers(users);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("logout error", err);
    res.status(500).json({ error: "Failed to log out" });
  }
});

// Simple password reset (MVP)
app.post("/api/auth/reset", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and newPassword required" });
    }

    const users = loadUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === String(email).toLowerCase()
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    // resetting password does NOT touch the current session; they stay logged in
    saveUsers(users);

    res.json({ ok: true });
  } catch (err) {
    console.error("reset error", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Current user
app.get("/api/auth/me", authRequired, (req, res) => {
  res.json({
    user: { email: req.user.email, plan: req.user.plan },
  });
});

// ---------- HEALTH ----------
app.get("/health", (_req, res) => res.json({ ok: true }));

// ---------- STRIPE CHECKOUT HELPERS ----------
app.get("/checkout/starter", async (_req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STARTER_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/?success=starter&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/?canceled=true`,
      allow_promotion_codes: false,
      metadata: { plan: "starter" },
    });

    res.redirect(303, session.url);
  } catch (err) {
    console.error("starter checkout error", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/checkout/elite", async (_req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.ELITE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/?success=elite&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/?canceled=true`,
      allow_promotion_codes: false,
      metadata: { plan: "elite" },
    });

    res.redirect(303, session.url);
  } catch (err) {
    console.error("elite checkout error", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Helpers: entry distance + tick / stop logic ----------

// keep entry a bit away from current price so it's a real limit
function adjustEntryForDistance(plan) {
  const dir = String(plan.direction || "").toLowerCase();
  const current = Number(plan.current_price);
  const entry = Number(plan.entry);

  if (!current || !entry || Number.isNaN(current) || Number.isNaN(entry)) {
    return plan;
  }

  const minDistance = current * 0.0015; // ~0.15%
  const diff = Math.abs(entry - current);
  if (diff >= minDistance) return plan;

  if (
    dir.includes("short") ||
    dir.includes("sell") ||
    dir.includes("bear")
  ) {
    plan.entry = current + minDistance;
  } else if (
    dir.includes("long") ||
    dir.includes("buy") ||
    dir.includes("bull")
  ) {
    plan.entry = current - minDistance;
  }

  return plan;
}

// snap prices to tick & force stop/targets to the correct side of entry
function normalizePlanStopsAndTargets(plan) {
  const dirStr = String(plan.direction || "").toLowerCase();
  const isLong =
    dirStr.includes("long") ||
    dirStr.includes("buy") ||
    dirStr.includes("bull");
  const isShort =
    dirStr.includes("short") ||
    dirStr.includes("sell") ||
    dirStr.includes("bear");

  // For now we assume MNQ/NQ-style 0.25 tick ladder.
  const TICK_SIZE = 0.25;

  const toTick = (val) => {
    const n = Number(val);
    if (!Number.isFinite(n)) return val;
    return Math.round(n / TICK_SIZE) * TICK_SIZE;
  };

  let entry = Number(plan.entry);
  let stop = Number(plan.stop);

  if (Number.isFinite(entry)) entry = toTick(entry);
  if (Number.isFinite(stop)) stop = toTick(stop);

  let targets = Array.isArray(plan.targets)
    ? plan.targets.map(Number).filter((x) => Number.isFinite(x))
    : [];

  targets = targets.map(toTick);

  if (isLong && Number.isFinite(entry)) {
    // stop MUST be below entry for longs
    if (!Number.isFinite(stop) || stop >= entry) {
      const baseDist =
        targets[0] && Number.isFinite(targets[0])
          ? Math.abs(targets[0] - entry) / 2
          : entry * 0.002;
      stop = entry - baseDist;
    }
    if (stop >= entry) stop = entry - TICK_SIZE;

    // all targets MUST be above entry for longs
    targets = targets.map((t, idx) => {
      if (!Number.isFinite(t) || t <= entry) {
        const step = TICK_SIZE * 4 * (idx + 1);
        return entry + step;
      }
      return t;
    });
  } else if (isShort && Number.isFinite(entry)) {
    // stop MUST be above entry for shorts
    if (!Number.isFinite(stop) || stop <= entry) {
      const baseDist =
        targets[0] && Number.isFinite(targets[0])
          ? Math.abs(targets[0] - entry) / 2
          : entry * 0.002;
      stop = entry + baseDist;
    }
    if (stop <= entry) stop = entry + TICK_SIZE;

    // all targets MUST be below entry for shorts
    targets = targets.map((t, idx) => {
      if (!Number.isFinite(t) || t >= entry) {
        const step = TICK_SIZE * 4 * (idx + 1);
        return entry - step;
      }
      return t;
    });
  }

  // final snap to ticks
  if (Number.isFinite(entry)) plan.entry = toTick(entry);
  if (Number.isFinite(stop)) plan.stop = toTick(stop);
  if (targets.length) plan.targets = targets;

  return plan;
}

// ---------- CORE ANALYZER (Starter + Elite) ----------
app.post(
  "/api/analyze",
  authRequired,
  requirePlan(["starter", "elite"]),
  upload.single("chart"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const base64Image = fs.readFileSync(req.file.path, {
        encoding: "base64",
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.15,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "trade_plan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                direction: { type: "string" },
                bias_reason: { type: "string" },
                current_price: {
                  type: "number",
                  description:
                    "The current/last traded price shown on the chart.",
                },
                entry: {
                  type: "number",
                  description:
                    "Entry price for the trade. Must be a limit-style level.",
                },
                stop: {
                  type: "number",
                  description: "Protective stop price from the chart.",
                },
                targets: {
                  type: "array",
                  items: { type: "number" },
                  minItems: 3,
                  maxItems: 3,
                },
                risk_to_reward: { type: "number" },
                notes: { type: "string" },
                ict_signals: {
                  type: "array",
                  items: { type: "string" },
                },
                liquidity_features: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: [
                "direction",
                "bias_reason",
                "current_price",
                "entry",
                "stop",
                "targets",
                "risk_to_reward",
                "notes",
                "ict_signals",
                "liquidity_features",
              ],
              additionalProperties: false,
            },
          },
        },
        messages: [
          {
            role: "system",
            content:
              "You are a professional intraday trader specialized in ICT concepts. " +
              "Return ONLY the JSON schema provided.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Analyze this trading chart screenshot and return ONLY the JSON object " +
                  "with direction, bias_reason, current_price, entry, stop, targets, risk_to_reward, " +
                  "notes, ict_signals, liquidity_features. Entry must not be equal to current_price.",
              },
              {
                type: "image_url",
                image_url: { url: `data:image/png;base64,${base64Image}` },
              },
            ],
          },
        ],
      });

      const raw = completion.choices[0].message.content;
      let plan = JSON.parse(raw);

      // 1) keep entry away from current price
      plan = adjustEntryForDistance(plan);
      // 2) snap to ticks & enforce stop/target side
      plan = normalizePlanStopsAndTargets(plan);

      res.json({ plan });
    } catch (err) {
      console.error("Error in /api/analyze:", err);
      res.status(500).json({ error: "Failed to analyze chart" });
    }
  }
);

// ---------- ELITE TOOLS (text-based + image daily prep) ----------

// Existing text-only daily prep (you can keep this if you still want it)
app.post(
  "/api/daily-prep",
  authRequired,
  requirePlan(["elite"]),
  async (req, res) => {
    try {
      const { symbol, timeframe, sessionStyle } = req.body || {};

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an ICT-style market prep assistant. Keep answer under 450 words.",
          },
          {
            role: "user",
            content: `Create a daily market prep for ${
              symbol || "ES"
            } on the ${timeframe || "15m"} timeframe. Session style: ${
              sessionStyle || "NY session intraday"
            }. Use generic structure (key levels, bias, setups).`,
          },
        ],
      });

      res.json({ prep: completion.choices[0].message.content });
    } catch (err) {
      console.error("Error in /api/daily-prep:", err);
      res.status(500).json({ error: "Failed to generate daily prep" });
    }
  }
);

// ✅ NEW: image-based daily prep using real chart screenshot
app.post(
  "/api/daily-prep-image",
  authRequired,
  requirePlan(["elite"]),
  upload.single("chart"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No chart screenshot uploaded" });
      }

      const { symbol, timeframe, sessionStyle } = req.body || {};

      const base64Image = fs.readFileSync(req.file.path, {
        encoding: "base64",
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.35,
        messages: [
          {
            role: "system",
            content:
              "You are a professional ICT-style intraday futures trader. " +
              "Based ONLY on the chart image and the provided symbol/timeframe/session, " +
              "produce a concise DAILY MARKET PREP in markdown. " +
              "Sections: 1) Bias, 2) Key Levels, 3) Killzones & timing, 4) Setups to watch, 5) Risk management notes. " +
              "Use PDH/PDL, overnight range, gaps, obvious liquidity pools, FVGs, order blocks, swings, etc. " +
              "Assume the screenshot is current. Do NOT invent a calendar date, just say 'today' or 'current session'. " +
              "Max ~350 words.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  `Symbol: ${symbol || "MNQ"}\n` +
                  `Timeframe: ${timeframe || "15m"}\n` +
                  `Session: ${sessionStyle || "NY session"}\n\n` +
                  "Look at this chart and write today's market prep using the actual structure and price action you see.",
              },
              {
                type: "image_url",
                image_url: { url: `data:image/png;base64,${base64Image}` },
              },
            ],
          },
        ],
      });

      const prep = completion.choices[0].message.content || "";
      res.json({ prep });
    } catch (err) {
      console.error("Error in /api/daily-prep-image:", err);
      res.status(500).json({ error: "Failed to generate image-based prep" });
    }
  }
);

// Weekly review
app.post(
  "/api/weekly-review",
  authRequired,
  requirePlan(["elite"]),
  async (req, res) => {
    try {
      const { tradesText } = req.body || {};

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an AI trading coach. Return a concise weekly review with win rate estimate, average R, best setups, worst habits, and 3 clear action items.",
          },
          {
            role: "user",
            content:
              tradesText ||
              "No trades provided. Assume a typical week of ICT intraday futures trading.",
          },
        ],
      });

      res.json({ review: completion.choices[0].message.content });
    } catch (err) {
      console.error("Error in /api/weekly-review:", err);
      res.status(500).json({ error: "Failed to generate weekly review" });
    }
  }
);

// Monthly coaching
app.post(
  "/api/monthly-coaching",
  authRequired,
  requirePlan(["elite"]),
  async (req, res) => {
    try {
      const { summaryText, goals } = req.body || {};

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a trading performance coach. Produce a coaching report and 4-week improvement roadmap.",
          },
          {
            role: "user",
            content: `Monthly summary:\n${
              summaryText || "No detailed summary."
            }\n\nGoals:\n${
              goals || "Get more consistent and avoid overtrading."
            }`,
          },
        ],
      });

      res.json({ report: completion.choices[0].message.content });
    } catch (err) {
      console.error("Error in /api/monthly-coaching:", err);
      res.status(500).json({ error: "Failed to generate coaching report" });
    }
  }
);

// Backtest analyzer
app.post(
  "/api/backtest-analyze",
  authRequired,
  requirePlan(["elite"]),
  upload.single("curve"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No equity curve uploaded" });
      }

      const base64Image = fs.readFileSync(req.file.path, {
        encoding: "base64",
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a quant who analyzes equity curve images. Return JSON with max_drawdown, best_run_up, win_streak_estimate, loss_streak_estimate, overall_edge_summary, risk_of_ruin_comment.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Analyze this backtest equity curve and return ONLY the JSON with those fields.",
              },
              {
                type: "image_url",
                image_url: { url: `data:image/png;base64,${base64Image}` },
              },
            ],
          },
        ],
      });

      const raw = completion.choices[0].message.content;
      const metrics = JSON.parse(raw);
      res.json({ metrics });
    } catch (err) {
      console.error("Error in /api/backtest-analyze:", err);
      res.status(500).json({ error: "Failed to analyze backtest" });
    }
  }
);

// ---------- ELITE LIVE ALERTS (TradingView) ----------

// In-memory live sessions: feedKey -> { engine, symbol, timeframe, patterns }
const liveSessions = new Map();

class LivePatternEngine {
  constructor({ symbol, timeframe, patterns, onAlert }) {
    this.symbol = symbol;
    this.timeframe = timeframe;
    this.patterns = patterns || { fvg: true, mss: true, liquidity: true };
    this.onAlert = onAlert;
    this.candles = []; // { time, open, high, low, close }
  }

  pushCandle(candle) {
    this.candles.push(candle);
    if (this.candles.length > 200) this.candles.shift();

    const alerts = [];

    if (this.patterns.fvg) {
      const fvg = this.detectFVG();
      if (fvg) alerts.push(fvg);
    }

    if (this.patterns.mss) {
      const mss = this.detectMSS();
      if (mss) alerts.push(mss);
    }

    if (this.patterns.liquidity) {
      const liq = this.detectLiquiditySweep();
      if (liq) alerts.push(liq);
    }

    alerts.forEach((a) => {
      this.onAlert({
        symbol: this.symbol,
        timeframe: this.timeframe,
        pattern: a.pattern,
        direction: a.direction,
        detail: a.detail,
        lastCandle: candle,
      });
    });
  }

  detectFVG() {
    const c = this.candles;
    if (c.length < 3) return null;
    const c0 = c[c.length - 3];
    const c2 = c[c.length - 1];

    // bullish FVG: low of current > high of 2 candles ago
    if (c2.low > c0.high) {
      return {
        pattern: "FVG",
        direction: "long",
        detail: `Bullish FVG: gap between ${c0.high} and ${c2.low}`,
      };
    }

    // bearish FVG: high of current < low of 2 candles ago
    if (c2.high < c0.low) {
      return {
        pattern: "FVG",
        direction: "short",
        detail: `Bearish FVG: gap between ${c2.high} and ${c0.low}`,
      };
    }

    return null;
  }

  detectMSS() {
    const c = this.candles;
    if (c.length < 5) return null;

    const recentHighs = c.slice(-5).map((x) => x.high);
    const recentLows = c.slice(-5).map((x) => x.low);
    const maxHigh = Math.max(...recentHighs);
    const minLow = Math.min(...recentLows);
    const last = c[c.length - 1];
    const prev = c[c.length - 2];

    // crude MSS down: previous made HH, last breaks recent lows
    if (prev.high === maxHigh && last.low < minLow) {
      return {
        pattern: "MSS",
        direction: "short",
        detail: "Market structure shift down after recent high.",
      };
    }

    // crude MSS up: previous made LL, last breaks recent highs
    if (prev.low === minLow && last.high > maxHigh) {
      return {
        pattern: "MSS",
        direction: "long",
        detail: "Market structure shift up after recent low.",
      };
    }

    return null;
  }

  detectLiquiditySweep() {
    const c = this.candles;
    if (c.length < 4) return null;
    const last = c[c.length - 1];
    const prev = c[c.length - 2];

    // sweep above previous high then close back inside, red candle
    if (
      last.high > prev.high &&
      last.close < prev.high &&
      last.close < last.open
    ) {
      return {
        pattern: "liquidity_sweep",
        direction: "short",
        detail: "Swept buy-side liquidity above previous high and rejected.",
      };
    }

    // sweep below previous low then close back inside, green candle
    if (
      last.low < prev.low &&
      last.close > prev.low &&
      last.close > last.open
    ) {
      return {
        pattern: "liquidity_sweep",
        direction: "long",
        detail: "Swept sell-side liquidity below previous low and rejected.",
      };
    }

    return null;
  }
}

async function buildAlertCard({
  symbol,
  timeframe,
  pattern,
  direction,
  detail,
  lastCandle,
}) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a professional intraday ICT trader. " +
          "Given a symbol, timeframe, detected pattern (FVG, MSS, liquidity sweep) and last candles, " +
          "you return a JSON trade idea with fields: " +
          "direction, bias_reason, entry, stop, targets (array of 3), risk_to_reward, notes.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `Symbol: ${symbol}\nTimeframe: ${timeframe}\n` +
              `Pattern: ${pattern} (${direction})\nDetail: ${detail}\n` +
              `Last candle: ${JSON.stringify(lastCandle)}\n` +
              "Return ONLY the JSON object.",
          },
        ],
      },
    ],
  });

  return JSON.parse(completion.choices[0].message.content);
}

// --- Elite live config: TradingView webhook + JSON template ---
app.get(
  "/api/elite-live/config",
  authRequired,
  requirePlan(["elite"]),
  (req, res) => {
    const users = loadUsers();
    const user = users.find((u) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const tvFeedKey = ensureTvFeedKey(users, user);
    const tvWebhookPath = `/api/tv-feed/${tvFeedKey}`;

    const alertTemplate = {
      symbol: "{{ticker}}",
      timeframe: "{{interval}}",
      time: "{{time}}",
      open: "{{open}}",
      high: "{{high}}",
      low: "{{low}}",
      close: "{{close}}",
    };

    res.json({ tvFeedKey, tvWebhookPath, alertTemplate });
  }
);

// --- Start live scan session (user clicks “Start live scan”) ---
app.post(
  "/api/elite-live/start",
  authRequired,
  requirePlan(["elite"]),
  async (req, res) => {
    try {
      const { symbol = "MNQ", timeframe = "1m", patterns, source } =
        req.body || {};

      const users = loadUsers();
      const user = users.find((u) => u.id === req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const tvFeedKey = ensureTvFeedKey(users, user);

      const engine = new LivePatternEngine({
        symbol,
        timeframe,
        patterns: patterns || { fvg: true, mss: true, liquidity: true },
        onAlert: async (hit) => {
          try {
            const plan = await buildAlertCard(hit);
            const payload = JSON.stringify({
              type: "live_alert",
              feedKey: tvFeedKey,
              symbol,
              timeframe,
              pattern: hit.pattern,
              direction: plan.direction,
              plan,
            });

            wss.clients.forEach((ws) => {
              if (
                ws.readyState === WebSocket.OPEN &&
                ws.feedKey === tvFeedKey
              ) {
                ws.send(payload);
              }
            });
          } catch (err) {
            console.error("Error building alert card:", err);
          }
        },
      });

      liveSessions.set(tvFeedKey, { engine, symbol, timeframe, source });

      const wsUrl = `/elite-live?feedKey=${tvFeedKey}`;
      res.json({
        feedKey: tvFeedKey,
        wsUrl,
        tvWebhookPath:
          source === "tradingview" ? `/api/tv-feed/${tvFeedKey}` : null,
      });
    } catch (err) {
      console.error("Error in /api/elite-live/start:", err);
      res.status(500).json({ error: "Failed to start live scan" });
    }
  }
);

// --- TradingView webhook: receives candles and feeds engine ---
app.post("/api/tv-feed/:feedKey", express.json(), (req, res) => {
  const { feedKey } = req.params;
  const session = liveSessions.get(feedKey);

  // Even if no active session, respond 200 so TradingView doesn't complain
  if (!session) {
    return res.json({ ok: true, inactive: true });
  }

  try {
    const body = req.body || {};

    const candle = {
      time: body.time || Date.now(),
      open: Number(body.open),
      high: Number(body.high),
      low: Number(body.low),
      close: Number(body.close),
    };

    if (
      !Number.isFinite(candle.open) ||
      !Number.isFinite(candle.high) ||
      !Number.isFinite(candle.low) ||
      !Number.isFinite(candle.close)
    ) {
      console.warn("Invalid candle payload from TradingView:", body);
      return res.status(400).json({ error: "Invalid candle data" });
    }

    session.engine.pushCandle(candle);

    res.json({ ok: true });
  } catch (err) {
    console.error("Error handling TradingView webhook:", err);
    res.status(500).json({ error: "Failed to process TradingView data" });
  }
});

// --- Optional: stop a live session manually ---
app.post(
  "/api/elite-live/stop",
  authRequired,
  requirePlan(["elite"]),
  (req, res) => {
    const { feedKey } = req.body || {};
    if (feedKey && liveSessions.has(feedKey)) {
      liveSessions.delete(feedKey);
    }
    res.json({ ok: true });
  }
);

// ---------- WEBSOCKET SERVER FOR LIVE ALERTS ----------
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const feedKey = url.searchParams.get("feedKey");
    ws.feedKey = feedKey || null;
    console.log("WS client connected for feedKey", feedKey);

    ws.on("close", () => {
      console.log("WS client disconnected", feedKey);
    });
  } catch (err) {
    console.error("WebSocket connection error:", err);
  }
});

// ---------- START SERVER ----------
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ API server + WS listening on port ${PORT}`);
});
