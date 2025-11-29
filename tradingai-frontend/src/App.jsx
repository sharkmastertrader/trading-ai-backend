// src/App.jsx
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from "react-router-dom";
import { useState, useEffect } from "react";

import Dashboard from "./pages/Dashboard.jsx";

import TermsOfService from "./pages/termsofservice.jsx";
import PrivacyPolicy from "./pages/privacypolicy.jsx";
import RefundPolicy from "./pages/refundpolicy.jsx";
import Disclaimer from "./pages/disclaimer.jsx";

import HowItWorks from "./sections/HowItWorks.jsx";
import Features from "./sections/Features.jsx";
import Pricing from "./sections/Pricing.jsx";
import FAQ from "./sections/FAQ.jsx";
import AnalyzerUpload from "./sections/AnalyzerUpload.jsx";
import EliteTools from "./sections/EliteTools.jsx";

// 🔹 Your logo
import TradingAiLogo from "./assets/tradingai-logo.png";

// 🔹 Stripe checkout links (frontend -> backend)
const CHECKOUT_STARTER = "/checkout/starter";
const CHECKOUT_ELITE = "/checkout/elite";

// default CTA (navbar + hero) → Starter plan
const checkoutStarter = () => {
  window.location.href = CHECKOUT_STARTER;
};

// ---------------- HEADER ----------------
function Header({ user, onLoginClick, onLogout }) {
  return (
    <header className="nav">
      {/* ✅ Logo + name now clickable back to home */}
      <div className="nav-left">
        <Link
          to="/"
          className="nav-home-link"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            textDecoration: "none",
          }}
        >
          <div
            className="logo-mark"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "radial-gradient(circle at 30% 20%, #22c55e 0, #16a34a 40%, #022c22 100%)",
            }}
          >
            <img
              src={TradingAiLogo}
              alt="TradingAI Analyzer logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>

          <div className="logo-text">
            <div className="logo-title">TradingAI Analyzer</div>
            <div className="logo-sub">Screenshot-to-trade engine</div>
          </div>
        </Link>
      </div>

      <nav className="nav-links">
        <a href="/#how-it-works">How it works</a>
        <a href="/#features">Features</a>
        <a href="/#pricing">Pricing</a>
        <a href="/#faq">FAQ</a>
      </nav>

      <div className="nav-actions">
        {user ? (
          <>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>
              {user.email} ·{" "}
              <span style={{ textTransform: "uppercase" }}>{user.plan}</span>
            </span>
            <button className="btn-secondary" onClick={onLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <button className="btn-secondary" onClick={onLoginClick}>
              Log in
            </button>
            <button className="btn-primary" onClick={checkoutStarter}>
              Get started
            </button>
          </>
        )}
      </div>
    </header>
  );
}

// ---------------- FOOTER ----------------
function Footer({ year }) {
  return (
    <footer className="footer">
      © {year} Quantum Innovation Systems LLC. All rights reserved.{" "}
      <a href="/terms">Terms</a> • <a href="/privacy">Privacy</a> •{" "}
      <a href="/refund">Refunds</a> • <a href="/disclaimer">Disclaimer</a>
    </footer>
  );
}

// ---------------- AUTH MODAL (login / signup / reset) ----------------
function LoginModal({ onClose, onLoggedIn }) {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState("starter");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const title =
    mode === "login"
      ? "Log in"
      : mode === "signup"
      ? "Create your TradingAI account"
      : "Reset password";

  const passwordLabel = mode === "reset" ? "New password" : "Password";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      let url;
      let body;

      if (mode === "login") {
        url = "/api/auth/login";
        body = { email, password };
      } else if (mode === "signup") {
        url = "/api/auth/signup";
        body = { email, password, plan };
      } else {
        // reset
        url = "/api/auth/reset";
        body = { email, newPassword: password };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      if (mode === "reset") {
        setMessage("Password updated. You can now log in.");
        setMode("login");
        setPassword("");
        return;
      }

      // login / signup success → store token + user
      localStorage.setItem("taa_token", data.token);
      onLoggedIn(data.user);
      onClose();

      // send them to dashboard after auth
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#020617",
          borderRadius: 16,
          border: "1px solid rgba(148,163,184,0.6)",
          padding: "1.6rem 1.5rem",
          boxShadow: "0 24px 60px rgba(0,0,0,0.9)",
        }}
      >
        <h3 style={{ marginBottom: 6, fontSize: 18 }}>{title}</h3>
        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>
          One login for Starter and Pro Trader Elite.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #4b5563",
              background: "#020617",
              color: "#e5e7eb",
              fontSize: 13,
            }}
          />
          <input
            type="password"
            placeholder={passwordLabel}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #4b5563",
              background: "#020617",
              color: "#e5e7eb",
              fontSize: 13,
            }}
          />

          {mode === "signup" && (
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #4b5563",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: 13,
              }}
            >
              <option value="starter">Starter (chart analyzer)</option>
              <option value="elite">Pro Trader Elite</option>
            </select>
          )}

          {error && (
            <p style={{ fontSize: 12, color: "#f97373" }}>{error}</p>
          )}
          {message && (
            <p style={{ fontSize: 12, color: "#22c55e" }}>{message}</p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {loading
              ? mode === "login"
                ? "Logging in…"
                : mode === "signup"
                ? "Creating account…"
                : "Updating…"
              : mode === "login"
              ? "Log in"
              : mode === "signup"
              ? "Create account"
              : "Update password"}
          </button>
        </form>

        {/* Links under the form */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontSize: 12,
          }}
        >
          {mode !== "login" && (
            <button
              type="button"
              onClick={() => setMode("login")}
              style={{
                background: "transparent",
                border: "none",
                color: "#9ca3af",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              Already have an account? Log in
            </button>
          )}

          {mode !== "signup" && (
            <button
              type="button"
              onClick={() => setMode("signup")}
              style={{
                background: "transparent",
                border: "none",
                color: "#9ca3af",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              Need an account? Create one
            </button>
          )}

          {mode !== "reset" && (
            <button
              type="button"
              onClick={() => setMode("reset")}
              style={{
                background: "transparent",
                border: "none",
                color: "#9ca3af",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              Forgot password? Reset it
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "#9ca3af",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ---------------- HOME PAGE ----------------
function Home({ user }) {
  return (
    <>
      {/* HERO */}
      <main className="hero-layout">
        {/* Left side: copy */}
        <section className="hero-copy">
          <p className="hero-kicker">PLAN TRADES, NOT GUESSES</p>

          <h1 className="hero-title">
            Trade with confidence,{" "}
            <span className="hero-highlight">
              AI gives you clarity when markets don’t.
            </span>
          </h1>

          <p className="hero-subtitle">
            Upload a screenshot of your chart and TradingAI Analyzer returns a
            structured trade idea—where to enter, where you&apos;re wrong, and
            how to scale out—based on the patterns you actually trade.
          </p>

         <div className="hero-actions">
  <button className="btn-primary hero-btn" onClick={checkoutStarter}>
    Get started for $19.99 / mo
  </button>
  <a href="#how-it-works" className="btn-outline hero-btn">
    See everything it does
  </a>
</div>


          <p className="hero-note">
            Cancel anytime. No contracts, no hidden tiers.
          </p>

          <div className="hero-grid">
            <div className="hero-feature">
              <div className="hero-feature-title">Pattern-aware plans</div>
              <p>
                We scan for FVG, MSS, BSL/SSL, displacement and more—backed by
                your own trading style.
              </p>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-title">Risk-managed by default</div>
              <p>
                Stops, targets, and position size pre-computed for your account
                and risk per trade.
              </p>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-title">
                Multi-take-profit support
              </div>
              <p>
                Scale out across first, second, and final targets with clear
                invalidation.
              </p>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-title">Built for real workflows</div>
              <p>Works from screenshots, journaling, and Discord call-outs.</p>
            </div>
          </div>
        </section>

        {/* Right side: example card */}
        <aside className="plan-card-shell">
          <div className="plan-card-glow" />
          <div className="plan-card">
            <div className="plan-card-header">
              <span>SPY 5m Screenshot</span>
              <span className="pill pill-success">Plan ready in 3s</span>
            </div>

            <div className="plan-card-body">
              <p className="plan-label">AI ENTRY ZONE</p>
              <p className="plan-main">+2.3R swing-long setup</p>

              <div className="plan-progress">
                <div className="plan-progress-bar" />
              </div>

              <div className="plan-stats">
                <div className="stat">
                  <span className="stat-label">Stop</span>
                  <span className="stat-value stat-danger">422.15</span>
                </div>
                <div className="stat">
                  <span className="stat-label">First target</span>
                  <span className="stat-value">427.80</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Second target</span>
                  <span className="stat-value">430.20</span>
                </div>
              </div>

              <div className="mini-chart">
                <div className="mini-bar mini-bar-small" />
                <div className="mini-bar mini-bar-medium" />
                <div className="mini-bar mini-bar-highlight" />
                <div className="mini-bar mini-bar-medium" />
                <div className="mini-bar mini-bar-tall" />
              </div>
            </div>

            <p className="plan-footer">
              Every plan includes clear invalidation, a take-profit ladder, and
              suggested size based on your risk per trade. Export plans directly
              into your journal or Discord.
            </p>
          </div>
        </aside>
      </main>

      {/* Upload section */}
      <AnalyzerUpload />

      {/* SECTIONS */}
      <HowItWorks />
      <Features />
      <Pricing
        onStarter={() => (window.location.href = CHECKOUT_STARTER)}
        onElite={() => (window.location.href = CHECKOUT_ELITE)}
      />

      {/* 🔐 Elite tools only for elite plan (on home page) */}
      {user?.plan === "elite" && <EliteTools />}

      <FAQ />
    </>
  );
}

// ---------------- APP ROOT ----------------
function App() {
  const year = new Date().getFullYear();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // on page load, check /api/auth/me using token from localStorage
  useEffect(() => {
    const token = localStorage.getItem("taa_token");
    if (!token) {
      setLoadingUser(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok || !data.user) {
          throw new Error();
        }
        setUser(data.user);
      } catch {
        localStorage.removeItem("taa_token");
      } finally {
        setLoadingUser(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("taa_token");
    setUser(null);
    // ✅ Feel like a real logout: send them home
    window.location.href = "/";
  };

  return (
    <Router>
      <div className="app">
        <div className="page-shell">
          <Header
            user={user}
            onLoginClick={() => setShowLogin(true)}
            onLogout={handleLogout}
          />

          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={<Home user={user} />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/refund" element={<RefundPolicy />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
          </Routes>

          <Footer year={year} />

          {showLogin && (
            <LoginModal
              onClose={() => setShowLogin(false)}
              onLoggedIn={(u) => setUser(u)}
            />
          )}
        </div>
      </div>
    </Router>
  );
}

export default App;
