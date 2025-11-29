// src/sections/AnalyzerUpload.jsx
import { useState, useEffect, useRef } from "react";

const POPULAR_FUTURES = [
  "MNQ",
  "NQ",
  "MES",
  "ES",
  "MYM",
  "YM",
  "MCL",
  "CL",
  "MGC",
  "GC",
  "6E",
  "6B",
  "6J",
  "ZN",
  "ZB",
];

export default function AnalyzerUpload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");

  // 🔹 symbol the user is analyzing (used for tick rounding on backend)
  const [symbol, setSymbol] = useState("MNQ");

  // 🔹 show/hide advanced options
  const [showOptions, setShowOptions] = useState(false);

  // 👇 auth state
  const [authedUser, setAuthedUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // 👇 we'll use this to scroll the result into view
  const resultRef = useRef(null);

  // 🔹 Journal lives in localStorage (simple in-browser journal)
  const [journal, setJournal] = useState([]);

  // Load journal from localStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("taa_journal");
      if (saved) {
        setJournal(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Load last-used symbol from localStorage
  useEffect(() => {
    try {
      const savedSym = window.localStorage.getItem("taa_last_symbol");
      if (savedSym) {
        setSymbol(savedSym.toUpperCase());
      }
    } catch {
      // ignore
    }
  }, []);

  const updateJournal = (next) => {
    setJournal(next);
    try {
      window.localStorage.setItem("taa_journal", JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleSymbolChange = (value) => {
    const upper = (value || "").toUpperCase();
    setSymbol(upper);
    try {
      window.localStorage.setItem("taa_last_symbol", upper);
    } catch {
      // ignore
    }
  };

  // 🔐 Check auth on mount using token in localStorage
  useEffect(() => {
    const token = localStorage.getItem("taa_token");
    if (!token) {
      setAuthChecked(true);
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
        setAuthedUser(data.user);
      } catch {
        // bad/expired token → clear it
        localStorage.removeItem("taa_token");
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  // 🔹 Position size calculator inputs (percent / $ risk + points / ticks / $ stops)
  const [sizeInputs, setSizeInputs] = useState({
    accountSize: "",
    riskValue: "",
    riskMode: "percent", // "percent" | "dollars"
    stopDistance: "",
    stopMode: "points", // "points" | "ticks" | "dollars"
    dollarPerUnit: "", // $ per point or per tick when using those modes
  });

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setPlan(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("taa_token");
    if (!token) {
      setError("Please log in to analyze charts.");
      return;
    }

    if (!file) {
      setError("Please upload a chart screenshot first.");
      return;
    }

    setLoading(true);
    setError("");
    setPlan(null);

    try {
      const formData = new FormData();
      formData.append("chart", file);

      // ✅ send symbol so backend can round to correct tick increment
      formData.append("symbol", symbol || "");

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // NOTE: do NOT set Content-Type when using FormData
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze chart");
      }

      setPlan(data.plan);

      // 👇 after we have a plan, scroll it into view
      setTimeout(() => {
        if (resultRef.current) {
          resultRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 50);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to analyze chart");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!plan) return;
    const text = `
Direction: ${plan.direction}
Entry: ${plan.entry}
Stop: ${plan.stop}
Targets: ${
      Array.isArray(plan.targets) ? plan.targets.join(" / ") : plan.targets
    }
R-multiple: ${plan.risk_to_reward}

ICT signals: ${
      Array.isArray(plan.ict_signals) ? plan.ict_signals.join(", ") : ""
    }
Liquidity features: ${
      Array.isArray(plan.liquidity_features)
        ? plan.liquidity_features.join(", ")
        : ""
    }

Why: ${plan.bias_reason || ""}
Notes: ${plan.notes || ""}
    `.trim();

    try {
      await navigator.clipboard.writeText(text);
      alert("Plan copied to clipboard ✅");
    } catch {
      alert("Could not copy plan, sorry.");
    }
  };

  const handleSaveToJournal = () => {
    if (!plan) return;
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      plan,
    };
    const next = [entry, ...journal];
    updateJournal(next);
    alert("Saved to journal ✅");
  };

  // 🔹 Basic position size math (percent / $ risk, points / ticks / $ stop)
  const {
    accountSize,
    riskValue,
    riskMode,
    stopDistance,
    stopMode,
    dollarPerUnit,
  } = sizeInputs;

  // how much $ you're willing to lose on the trade total
  let riskAmount = 0;
  if (riskMode === "percent") {
    riskAmount =
      Number(accountSize) && Number(riskValue)
        ? (Number(accountSize) * Number(riskValue)) / 100
        : 0;
  } else {
    // fixed $ risk
    riskAmount = Number(riskValue) || 0;
  }

  // how much $ you lose per contract/share if the stop is hit
  let perUnitLoss = 0;

  if (stopMode === "dollars") {
    // user typed stopDistance as $ loss per contract
    perUnitLoss = Number(stopDistance) || 0;
  } else {
    // user typed stopDistance in points or ticks
    // we convert to $ using dollarPerUnit (e.g. MNQ = 0.5 per tick)
    const unitVal = Number(dollarPerUnit) || 0;
    if (unitVal && Number(stopDistance)) {
      perUnitLoss = unitVal * Number(stopDistance);
    }
  }

  const positionSize =
    riskAmount && perUnitLoss
      ? (riskAmount / perUnitLoss).toFixed(2)
      : null;

  // ⏳ While we’re checking auth, show nothing special (just section shell)
  if (!authChecked) {
    return (
      <section id="upload" className="section upload-section">
        <div className="section-inner">
          <h2 className="section-title">Upload a chart, get a plan</h2>
          <p className="section-sub">Checking your account…</p>
        </div>
      </section>
    );
  }

  // 🚫 Not logged in → show CTA instead of the upload form
  if (!authedUser) {
    return (
      <section id="upload" className="section upload-section">
        <div className="section-inner">
          <h2 className="section-title">Upload a chart, get a plan</h2>
          <p className="section-sub">
            Log in or start your subscription to unlock the AI chart analyzer.
          </p>

          <div className="upload-card">
            <p
              style={{
                fontSize: "0.9rem",
                color: "#cbd5f5",
                marginBottom: 12,
              }}
            >
              The analyzer is available for active subscribers only. Use the{" "}
              <strong>Log in</strong> or <strong>Get started</strong> buttons in
              the top-right to access your account, then return here.
            </p>
            <a
              href="/#pricing"
              className="btn-primary"
              style={{ fontSize: 13 }}
            >
              View plans & get access
            </a>
          </div>
        </div>
      </section>
    );
  }

  // ✅ Logged in → full analyzer UI
  return (
    <section id="upload" className="section upload-section">
      <div className="section-inner">
        <h2 className="section-title">Upload a chart, get a plan</h2>
        <p className="section-sub">
          Drop in a screenshot and let TradingAI Analyzer build a structured
          trade idea around it.
        </p>

        <form className="upload-card" onSubmit={handleSubmit}>
          {/* Compact, modern inline row */}
          <div
            className="upload-row"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              alignItems: "center",
            }}
          >
            <label className="upload-input" style={{ flex: "1 1 220px" }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>

            {/* Symbol as a compact combo box (input + dropdown suggestions) */}
            <div
              className="symbol-group"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                minWidth: 140,
                maxWidth: 170,
              }}
            >
              <span
                className="symbol-label"
                style={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#9ca3af",
                }}
              >
                Symbol
              </span>

              <input
                type="text"
                list="taa-symbol-suggestions"
                value={symbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                placeholder="MNQ"
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.6)",
                  background: "rgba(15,23,42,0.9)",
                  color: "#e5e7eb",
                  fontSize: "0.85rem",
                }}
              />

              <datalist id="taa-symbol-suggestions">
                {POPULAR_FUTURES.map((sym) => (
                  <option key={sym} value={sym} />
                ))}
              </datalist>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !file}
              style={{ flexShrink: 0 }}
            >
              {loading ? "Analyzing…" : "Analyze chart"}
            </button>
          </div>

          {/* Advanced / Options toggle */}
          <button
            type="button"
            onClick={() => setShowOptions((v) => !v)}
            style={{
              marginTop: 8,
              fontSize: "0.8rem",
              color: "#9ca3af",
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            {showOptions ? "Hide options" : "Options"}
          </button>

          {showOptions && (
            <p
              style={{
                marginTop: 6,
                fontSize: "0.8rem",
                color: "#9ca3af",
              }}
            >
              The symbol is used for tick rounding and risk math (e.g. MNQ, ES,
              CL). We&apos;ll remember your last symbol automatically.
            </p>
          )}

          {error && <p className="error-text">{error}</p>}
        </form>

        {/* 👉 Show the AI plan FIRST, right under the button */}
        {plan && (
          <>
            <div ref={resultRef} className="plan-result-card">
              <div className="plan-result-header">
                <span
                  className={
                    "pill pill-direction " +
                    (String(plan.direction || "")
                      .toLowerCase()
                      .includes("short") ||
                    String(plan.direction || "")
                      .toLowerCase()
                      .includes("sell")
                      ? "pill-bearish"
                      : "pill-bullish")
                  }
                >
                  {plan.direction || "Trade idea"}
                </span>
                <span className="pill pill-rr">
                  {plan.risk_to_reward
                    ? `${plan.risk_to_reward}R`
                    : "R-multiple"}
                </span>
              </div>

              <div className="plan-result-grid">
                <div>
                  <div className="plan-label-sm">Entry</div>
                  <div className="plan-value-sm">{plan.entry}</div>
                </div>
                <div>
                  <div className="plan-label-sm">Stop</div>
                  <div className="plan-value-sm">{plan.stop}</div>
                </div>
                <div>
                  <div className="plan-label-sm">Targets</div>
                  <div className="plan-value-sm">
                    {Array.isArray(plan.targets)
                      ? plan.targets.join(" • ")
                      : plan.targets}
                  </div>
                </div>
              </div>

              {/* ICT + Liquidity */}
              {Array.isArray(plan.ict_signals) &&
                plan.ict_signals.length > 0 && (
                  <p className="plan-result-notes">
                    <strong>ICT signals:</strong>{" "}
                    {plan.ict_signals.join(" • ")}
                  </p>
                )}

              {Array.isArray(plan.liquidity_features) &&
                plan.liquidity_features.length > 0 && (
                  <p className="plan-result-notes">
                    <strong>Liquidity:</strong>{" "}
                    {plan.liquidity_features.join(" • ")}
                  </p>
                )}

              {plan.bias_reason && (
                <p className="plan-result-notes">
                  <strong>Why:</strong> {plan.bias_reason}
                </p>
              )}

              {plan.notes && (
                <p className="plan-result-notes">
                  <strong>Notes:</strong> {plan.notes}
                </p>
              )}

              <div className="plan-actions-row">
                <button
                  type="button"
                  className="btn-outline-sm"
                  onClick={handleCopy}
                >
                  Copy plan
                </button>
                <button
                  type="button"
                  className="btn-outline-sm"
                  onClick={handleSaveToJournal}
                >
                  Save to journal
                </button>
              </div>
            </div>

            {/* Position size calculator */}
            <div className="position-card">
              <h3 className="position-title">Position size calculator</h3>
              <div className="position-grid">
                {/* Account size */}
                <label>
                  <span>Account size ($)</span>
                  <input
                    type="number"
                    value={accountSize}
                    onChange={(e) =>
                      setSizeInputs((prev) => ({
                        ...prev,
                        accountSize: e.target.value,
                      }))
                    }
                  />
                </label>

                {/* Risk per trade: % or $ */}
                <label>
                  <span>
                    Risk per trade{" "}
                    <select
                      value={riskMode}
                      onChange={(e) =>
                        setSizeInputs((prev) => ({
                          ...prev,
                          riskMode: e.target.value,
                        }))
                      }
                      style={{
                        marginLeft: "0.4rem",
                        padding: "2px 6px",
                        fontSize: "0.8rem",
                        borderRadius: "999px",
                        border: "1px solid rgba(148,163,184,0.6)",
                        background: "rgba(15,23,42,0.9)",
                      }}
                    >
                      <option value="percent">% of account</option>
                      <option value="dollars">$ fixed</option>
                    </select>
                  </span>
                  <input
                    type="number"
                    value={riskValue}
                    placeholder={
                      riskMode === "percent" ? "e.g. 1.0" : "e.g. 100"
                    }
                    onChange={(e) =>
                      setSizeInputs((prev) => ({
                        ...prev,
                        riskValue: e.target.value,
                      }))
                    }
                  />
                </label>

                {/* Stop size: points / ticks / $ */}
                <label>
                  <span>
                    Stop size{" "}
                    <select
                      value={stopMode}
                      onChange={(e) =>
                        setSizeInputs((prev) => ({
                          ...prev,
                          stopMode: e.target.value,
                        }))
                      }
                      style={{
                        marginLeft: "0.4rem",
                        padding: "2px 6px",
                        fontSize: "0.8rem",
                        borderRadius: "999px",
                        border: "1px solid rgba(148,163,184,0.6)",
                        background: "rgba(15,23,42,0.9)",
                      }}
                    >
                      <option value="points">points</option>
                      <option value="ticks">ticks</option>
                      <option value="dollars">dollars</option>
                    </select>
                  </span>
                  <input
                    type="number"
                    value={stopDistance}
                    placeholder={
                      stopMode === "dollars"
                        ? "e.g. 50 (per contract)"
                        : "e.g. 10"
                    }
                    onChange={(e) =>
                      setSizeInputs((prev) => ({
                        ...prev,
                        stopDistance: e.target.value,
                      }))
                    }
                  />
                </label>

                {/* Dollar value per point/tick when needed */}
                {stopMode !== "dollars" && (
                  <label>
                    <span>
                      $
                      {stopMode === "points"
                        ? " per point"
                        : stopMode === "ticks"
                        ? " per tick"
                        : " per unit"}
                    </span>
                    <input
                      type="number"
                      value={dollarPerUnit}
                      placeholder={
                        stopMode === "ticks"
                          ? "e.g. 0.5 for MNQ"
                          : "e.g. 50 for 1 point = $50"
                      }
                      onChange={(e) =>
                        setSizeInputs((prev) => ({
                          ...prev,
                          dollarPerUnit: e.target.value,
                        }))
                      }
                    />
                  </label>
                )}
              </div>

              {positionSize && (
                <p className="position-output">
                  Size: <strong>{positionSize}</strong> units (contracts /
                  shares)
                </p>
              )}
            </div>
          </>
        )}

        {/* Chart preview – now under the plan and smaller */}
        {preview && (
          <div className="upload-preview">
            <p className="preview-label">Chart analyzed</p>
            <img src={preview} alt="Uploaded chart" className="preview-img" />
          </div>
        )}

        {/* Journal list */}
        {journal.length > 0 && (
          <div className="journal-section">
            <h3 className="journal-title">Saved trades journal</h3>
            <p className="journal-sub">
              Stored in your browser only. Clear your browser data to remove.
            </p>
            <ul className="journal-list">
              {journal.map((entry) => (
                <li key={entry.id} className="journal-item">
                  <div className="journal-row">
                    <span className="journal-direction">
                      {entry.plan.direction || "Trade"}
                    </span>
                    <span className="journal-time">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="journal-line">
                    Entry {entry.plan.entry} · Stop {entry.plan.stop} · Targets{" "}
                    {Array.isArray(entry.plan.targets)
                      ? entry.plan.targets.join(" • ")
                      : entry.plan.targets}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
