// src/sections/EliteTools.jsx
import { useState, useEffect, useRef } from "react";

const TV_ALERT_JSON_TEMPLATE = `{
  "symbol": "{{ticker}}",
  "timeframe": "{{interval}}",
  "time": "{{time}}",
  "open": {{open}},
  "high": {{high}},
  "low": {{low}},
  "close": {{close}}
}`;

// ✅ New: image-based Daily Market Prep card
function DailyMarketPrepCard() {
  const [symbol, setSymbol] = useState("MNQ");
  const [timeframe, setTimeframe] = useState("15m");
  const [sessionStyle, setSessionStyle] = useState("NY session");

  const [chartFile, setChartFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [prepText, setPrepText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setChartFile(f);
    setPreview(URL.createObjectURL(f));
    setPrepText("");
    setError("");
  };

  const handleGenerate = async () => {
    setError("");
    setPrepText("");

    const token = localStorage.getItem("taa_token");
    if (!token) {
      setError("Please log in again to generate daily prep.");
      return;
    }

    if (!chartFile) {
      setError("Please upload a 15m session screenshot first.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("chart", chartFile);
      formData.append("symbol", symbol);
      formData.append("timeframe", timeframe);
      formData.append("sessionStyle", sessionStyle);

      const res = await fetch("/api/daily-prep-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate prep");
      }

      setPrepText(data.prep || "");
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-card">
      <h3>Daily market prep</h3>
      <p>Upload a real 15m chart and get an ICT-flavored morning plan from the actual candles.</p>

      <div style={{ marginTop: "0.8rem", fontSize: "0.85rem" }}>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Symbol (e.g. MNQ)"
          style={{ width: "100%", marginBottom: "0.4rem" }}
        />
        <input
          type="text"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          placeholder="Timeframe (e.g. 15m)"
          style={{ width: "100%", marginBottom: "0.4rem" }}
        />
        <input
          type="text"
          value={sessionStyle}
          onChange={(e) => setSessionStyle(e.target.value)}
          placeholder="Session (e.g. NY session)"
          style={{ width: "100%", marginBottom: "0.6rem" }}
        />
      </div>

      <div className="elite-upload-row" style={{ marginBottom: "0.6rem" }}>
        <label className="upload-input">
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </label>

        <button
          className="btn-primary"
          type="button"
          onClick={handleGenerate}
          disabled={loading || !chartFile}
          style={{ marginLeft: "0.5rem" }}
        >
          {loading ? "Generating…" : "Generate prep"}
        </button>
      </div>

      {error && (
        <p className="error-text" style={{ marginTop: 8 }}>
          {error}
        </p>
      )}

      {preview && (
        <div className="upload-preview" style={{ marginTop: 12 }}>
          <p className="preview-label">Chart for today&apos;s prep</p>
          <img src={preview} alt="Daily prep chart" className="preview-img" />
        </div>
      )}

      {prepText && (
        <div
          className="elite-output"
          style={{
            marginTop: "0.8rem",
            padding: "0.75rem",
            borderRadius: "0.75rem",
            background: "rgba(15,23,42,0.9)",
          }}
        >
          <h4 style={{ marginBottom: 8 }}>Today&apos;s market prep</h4>
          <div className="elite-prep-text">
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
                fontSize: 13,
              }}
            >
              {prepText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EliteTools() {
  // 🔐 Auth state
  const [plan, setPlan] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Weekly review
  const [tradesText, setTradesText] = useState("");
  const [weeklyReview, setWeeklyReview] = useState("");
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  // Monthly coaching
  const [summaryText, setSummaryText] = useState("");
  const [goals, setGoals] = useState("");
  const [coaching, setCoaching] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);

  // Live scan / multi-broker
  const [liveSymbol, setLiveSymbol] = useState("MNQ");
  const [liveTimeframe, setLiveTimeframe] = useState("1m");
  const [liveStatus, setLiveStatus] = useState("Idle");
  const [liveConfig, setLiveConfig] = useState(null); // { feedKey, wsUrl, tvWebhookPath, fullWebhookUrl }
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [liveConnecting, setLiveConnecting] = useState(false);
  const wsRef = useRef(null);

  // Broker/source selection
  const [liveSource, setLiveSource] = useState("tradingview"); // "tradingview" | "binance" | "alpaca" | "mt4" | "nt8"

  // NEW: pattern toggles
  const [patternConfig, setPatternConfig] = useState({
    fvg: true,
    mss: true,
    liquidity: true,
    orderBlock: true,
    breaker: true,
    killzone: true,
    fvgRetest: true,
  });

  // Backtest analyzer
  const [curveFile, setCurveFile] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // 🔐 Check auth/plan on mount
  useEffect(() => {
    const token = localStorage.getItem("taa_token");
    if (!token) {
      setAuthChecked(true);
      return;
    }

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setPlan(data.user.plan);
        } else {
          localStorage.removeItem("taa_token");
        }
      })
      .catch(() => {
        localStorage.removeItem("taa_token");
      })
      .finally(() => setAuthChecked(true));
  }, []);

  // Cleanup WS on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // helper: toggle pattern
  const togglePattern = (key) => {
    setPatternConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // ---------- Weekly review ----------
  const handleWeeklyReview = async () => {
    if (!tradesText.trim()) {
      alert("Paste at least a few trades or notes.");
      return;
    }

    const token = localStorage.getItem("taa_token");
    if (!token) {
      alert("Log in with an Elite account to use this tool.");
      return;
    }

    setWeeklyReview("");
    setWeeklyLoading(true);
    try {
      const res = await fetch("/api/weekly-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tradesText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setWeeklyReview(data.review);
    } catch (e) {
      setWeeklyReview("Failed to generate review: " + e.message);
    } finally {
      setWeeklyLoading(false);
    }
  };

  // ---------- Monthly coaching ----------
  const handleMonthlyCoaching = async () => {
    if (!summaryText.trim()) {
      alert("Add a short summary of your month.");
      return;
    }

    const token = localStorage.getItem("taa_token");
    if (!token) {
      alert("Log in with an Elite account to use this tool.");
      return;
    }

    setCoaching("");
    setCoachLoading(true);
    try {
      const res = await fetch("/api/monthly-coaching", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ summaryText, goals }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCoaching(data.report);
    } catch (e) {
      setCoaching("Failed to generate report: " + e.message);
    } finally {
      setCoachLoading(false);
    }
  };

  // ---------- Live scan ----------
  const handleStartLiveScan = async () => {
    const token = localStorage.getItem("taa_token");
    if (!token) {
      alert("Log in with an Elite account to use this tool.");
      return;
    }

    setLiveConnecting(true);
    setLiveStatus("Connecting…");
    setLiveAlerts([]);

    try {
      const res = await fetch("/api/elite-live/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          source: liveSource,
          symbol: liveSymbol,
          timeframe: liveTimeframe,
          patterns: patternConfig,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start live scan");

      const { feedKey, wsUrl, tvWebhookPath } = data;

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const fullWebhookUrl =
        tvWebhookPath && liveSource === "tradingview"
          ? origin + tvWebhookPath
          : null;

      const config = {
        feedKey,
        wsUrl,
        tvWebhookPath,
        fullWebhookUrl,
      };
      setLiveConfig(config);

      // Open WebSocket
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      if (typeof window !== "undefined") {
        const proto = window.location.protocol === "https:" ? "wss" : "ws";
        const wsFullUrl = `${proto}://${window.location.host}${wsUrl}`;
        const ws = new WebSocket(wsFullUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setLiveStatus("Running – waiting for candles…");
          setLiveConnecting(false);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "live_alert") {
              setLiveAlerts((prev) => [msg, ...prev].slice(0, 20));
              setLiveStatus("Live alert received");
            }
          } catch (err) {
            console.error("WS message parse error:", err);
          }
        };

        ws.onerror = () => {
          setLiveStatus("WebSocket error");
        };

        ws.onclose = () => {
          setLiveStatus("Disconnected");
          wsRef.current = null;
        };
      }
    } catch (err) {
      console.error(err);
      setLiveStatus("Error: " + err.message);
      setLiveConnecting(false);
    }
  };

  const handleStopLiveScan = async () => {
    const token = localStorage.getItem("taa_token");
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setLiveStatus("Idle");

    if (!liveConfig || !token) return;

    try {
      await fetch("/api/elite-live/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ feedKey: liveConfig.feedKey }),
      });
    } catch (err) {
      console.error("stop live scan error:", err);
    }
  };

  const handleCopyWebhookUrl = async () => {
    if (!liveConfig?.fullWebhookUrl) return;
    try {
      await navigator.clipboard.writeText(liveConfig.fullWebhookUrl);
      alert("Webhook URL copied ✅");
    } catch {
      alert("Could not copy URL, sorry.");
    }
  };

  const handleCopyAlertJson = async () => {
    try {
      await navigator.clipboard.writeText(TV_ALERT_JSON_TEMPLATE);
      alert("JSON template copied ✅");
    } catch {
      alert("Could not copy JSON, sorry.");
    }
  };

  // ---------- Backtest analyzer ----------
  const handleBacktestAnalyze = async () => {
    if (!curveFile) {
      alert("Upload an equity curve screenshot first.");
      return;
    }

    const token = localStorage.getItem("taa_token");
    if (!token) {
      alert("Log in with an Elite account to use this tool.");
      return;
    }

    setMetrics(null);
    setMetricsLoading(true);
    try {
      const fd = new FormData();
      fd.append("curve", curveFile);

      const res = await fetch("/api/backtest-analyze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMetrics(data.metrics);
    } catch (e) {
      setMetrics({ error: "Failed to analyze backtest: " + e.message });
    } finally {
      setMetricsLoading(false);
    }
  };

  // ---------- Render ----------
  return (
    <section id="elite-tools" className="section">
      <div className="section-inner">
        <h2 className="section-title">Pro Trader Elite tools</h2>
        <p className="section-sub">
          Everything in Starter, plus live ICT-style scans, market prep, and
          performance coaching built for serious traders.
        </p>

        {/* 🔐 Gate */}
        {authChecked && plan !== "elite" && (
          <div
            className="section-card"
            style={{ marginTop: "0.75rem", borderColor: "rgba(250,204,21,0.7)" }}
          >
            <h3 style={{ marginBottom: "0.4rem" }}>
              Locked for Pro Trader Elite
            </h3>
            <p style={{ fontSize: "0.9rem" }}>
              Upgrade to <strong>Pro Trader Elite</strong> to unlock live chart
              scans, daily prep, coaching reports, and the backtest analyzer.
            </p>
            <button
              type="button"
              className="btn-primary hero-btn"
              style={{ marginTop: "0.75rem" }}
              onClick={() => {
                window.location.href = "/checkout/elite";
              }}
            >
              Upgrade to Elite
            </button>
          </div>
        )}

        {authChecked && plan === "elite" && (
          <>
            <div className="section-grid section-grid-2">
              {/* ✅ New daily prep card (image-based) */}
              <DailyMarketPrepCard />

              {/* Live scan card */}
              <div className="section-card">
                <h3>TradingView live scan & alerts</h3>
                <p>
                  Connect a broker feed, stream candles, and get live FVG / MSS
                  / liquidity sweep trade cards in real time.
                </p>

                {/* Step 1 – Source, symbol, timeframe, patterns */}
                <div style={{ marginTop: "0.8rem", fontSize: "0.85rem" }}>
                  {/* Source / broker selection */}
                  <select
                    value={liveSource}
                    onChange={(e) => setLiveSource(e.target.value)}
                    style={{ width: "100%", marginBottom: "0.4rem" }}
                  >
                    <option value="tradingview">TradingView (webhook)</option>
                    <option value="binance">Binance (crypto)</option>
                    <option value="alpaca">Alpaca (stocks)</option>
                    <option value="mt4">MT4 / MT5 bridge</option>
                    <option value="nt8">NinjaTrader 8 bridge</option>
                  </select>

                  <input
                    value={liveSymbol}
                    onChange={(e) => setLiveSymbol(e.target.value)}
                    placeholder="Symbol (e.g. MNQ, BTCUSDT, AAPL)"
                    style={{ width: "100%", marginBottom: "0.4rem" }}
                  />
                  <input
                    value={liveTimeframe}
                    onChange={(e) => setLiveTimeframe(e.target.value)}
                    placeholder="Timeframe (e.g. 1m, 5m, 15m)"
                    style={{ width: "100%", marginBottom: "0.6rem" }}
                  />

                  {/* Pattern toggles */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: "0.35rem",
                      marginBottom: "0.6rem",
                      fontSize: "0.78rem",
                    }}
                  >
                    <label style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <input
                        type="checkbox"
                        checked={patternConfig.fvg}
                        onChange={() => togglePattern("fvg")}
                      />
                      FVG
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <input
                        type="checkbox"
                        checked={patternConfig.mss}
                        onChange={() => togglePattern("mss")}
                      />
                      MSS
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <input
                        type="checkbox"
                        checked={patternConfig.liquidity}
                        onChange={() => togglePattern("liquidity")}
                      />
                      Liquidity
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <input
                        type="checkbox"
                        checked={patternConfig.orderBlock}
                        onChange={() => togglePattern("orderBlock")}
                      />
                      Order Block
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <input
                        type="checkbox"
                        checked={patternConfig.breaker}
                        onChange={() => togglePattern("breaker")}
                      />
                      Breaker
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <input
                        type="checkbox"
                        checked={patternConfig.killzone}
                        onChange={() => togglePattern("killzone")}
                      />
                      Killzone
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <input
                        type="checkbox"
                        checked={patternConfig.fvgRetest}
                        onChange={() => togglePattern("fvgRetest")}
                      />
                      FVG Retest
                    </label>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleStartLiveScan}
                      disabled={liveConnecting}
                    >
                      {liveConnecting ? "Starting…" : "Start live scan"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleStopLiveScan}
                    >
                      Stop
                    </button>
                  </div>
                  <p
                    style={{
                      marginTop: "0.4rem",
                      fontSize: "0.8rem",
                      color: "#9ca3af",
                    }}
                  >
                    Status: {liveStatus}
                  </p>
                </div>

                {/* Step 2 – TradingView setup instructions */}
                <div
                  style={{
                    marginTop: "0.9rem",
                    padding: "0.75rem",
                    borderRadius: "0.9rem",
                    background: "rgba(15,23,42,0.9)",
                    fontSize: "0.8rem",
                  }}
                >
                  <p
                    style={{
                      fontWeight: 600,
                      marginBottom: "0.4rem",
                      fontSize: "0.82rem",
                    }}
                  >
                    Step 2 – Set up your TradingView alert:
                  </p>
                  <ol style={{ paddingLeft: "1.1rem", marginBottom: "0.6rem" }}>
                    <li>Open the same symbol / timeframe in TradingView.</li>
                    <li>Create an alert (e.g. once per bar close).</li>
                    <li>
                      Paste this URL into the <strong>Webhook URL</strong> box:
                    </li>
                  </ol>

                  {liveConfig && liveConfig.fullWebhookUrl && liveSource === "tradingview" ? (
                    <>
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.78rem",
                          background: "#020617",
                          padding: "0.45rem 0.55rem",
                          borderRadius: "0.5rem",
                          wordBreak: "break-all",
                        }}
                      >
                        {liveConfig.fullWebhookUrl}
                      </div>
                      <button
                        type="button"
                        className="btn-outline-sm"
                        style={{ marginTop: "0.4rem" }}
                        onClick={handleCopyWebhookUrl}
                      >
                        Copy webhook URL
                      </button>
                    </>
                  ) : (
                    <p style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
                      Start a live scan with source = TradingView to generate
                      your personal webhook URL.
                    </p>
                  )}

                  <p
                    style={{
                      marginTop: "0.8rem",
                      fontWeight: 600,
                      marginBottom: "0.3rem",
                      fontSize: "0.82rem",
                    }}
                  >
                    Use this JSON as the alert message:
                  </p>
                  <pre
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.78rem",
                      background: "#020617",
                      padding: "0.55rem 0.6rem",
                      borderRadius: "0.5rem",
                      overflowX: "auto",
                      marginBottom: "0.4rem",
                    }}
                  >
                    {TV_ALERT_JSON_TEMPLATE}
                  </pre>
                  <button
                    type="button"
                    className="btn-outline-sm"
                    onClick={handleCopyAlertJson}
                  >
                    Copy JSON template
                  </button>

                  <p
                    style={{
                      marginTop: "0.7rem",
                      fontSize: "0.78rem",
                      color: "#9ca3af",
                    }}
                  >
                    Every bar close, TradingView sends a candle here. When an
                    ICT pattern hits, you&apos;ll see a live trade card below.
                  </p>
                </div>

                {/* Live alert cards */}
                {liveAlerts.length > 0 && (
                  <div style={{ marginTop: "0.9rem" }}>
                    {liveAlerts.map((alert, i) => {
                      const plan = alert.plan || {};
                      return (
                        <div
                          key={i}
                          className="plan-result-card"
                          style={{ marginTop: i === 0 ? 0 : "0.7rem" }}
                        >
                          <div className="plan-result-header">
                            <span className="pill pill-direction pill-bullish">
                              {alert.symbol} {alert.timeframe} ·{" "}
                              {alert.pattern || "Pattern"}
                            </span>
                            <span className="pill pill-rr">
                              {plan.risk_to_reward
                                ? `${plan.risk_to_reward}R`
                                : "R-multiple"}
                            </span>
                          </div>
                          <div className="plan-result-grid">
                            <div>
                              <div className="plan-label-sm">Direction</div>
                              <div className="plan-value-sm">
                                {plan.direction || alert.direction || "-"}
                              </div>
                            </div>
                            <div>
                              <div className="plan-label-sm">Entry</div>
                              <div className="plan-value-sm">
                                {plan.entry ?? "-"}
                              </div>
                            </div>
                            <div>
                              <div className="plan-label-sm">Stop</div>
                              <div className="plan-value-sm">
                                {plan.stop ?? "-"}
                              </div>
                            </div>
                            <div>
                              <div className="plan-label-sm">Targets</div>
                              <div className="plan-value-sm">
                                {Array.isArray(plan.targets)
                                  ? plan.targets.join(" • ")
                                  : plan.targets ?? "-"}
                              </div>
                            </div>
                          </div>
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
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Weekly review card */}
              <div className="section-card">
                <h3>Weekly AI trading review</h3>
                <p>Paste your trades and get a performance breakdown.</p>
                <textarea
                  value={tradesText}
                  onChange={(e) => setTradesText(e.target.value)}
                  placeholder="Paste your week's trades, notes or journal here..."
                  style={{
                    marginTop: "0.8rem",
                    width: "100%",
                    minHeight: "120px",
                    fontSize: "0.85rem",
                  }}
                />
                <button
                  type="button"
                  className="btn-primary"
                  style={{ marginTop: "0.6rem" }}
                  onClick={handleWeeklyReview}
                  disabled={weeklyLoading}
                >
                  {weeklyLoading ? "Analyzing…" : "Generate weekly review"}
                </button>
                {weeklyReview && (
                  <div
                    style={{
                      marginTop: "0.8rem",
                      padding: "0.75rem",
                      borderRadius: "0.75rem",
                      background: "rgba(15,23,42,0.9)",
                      fontSize: "0.85rem",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {weeklyReview}
                  </div>
                )}
              </div>

              {/* Monthly coaching card */}
              <div className="section-card">
                <h3>Monthly coaching report</h3>
                <p>Turn a full month of trading into a clear improvement plan.</p>
                <textarea
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  placeholder="Short summary of your month (wins, losses, emotions, etc.)"
                  style={{
                    marginTop: "0.8rem",
                    width: "100%",
                    minHeight: "80px",
                    fontSize: "0.85rem",
                  }}
                />
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="Goals for next month (optional)"
                  style={{
                    marginTop: "0.4rem",
                    width: "100%",
                    minHeight: "60px",
                    fontSize: "0.85rem",
                  }}
                />
                <button
                  type="button"
                  className="btn-primary"
                  style={{ marginTop: "0.6rem" }}
                  onClick={handleMonthlyCoaching}
                  disabled={coachLoading}
                >
                  {coachLoading ? "Building report…" : "Generate coaching report"}
                </button>
                {coaching && (
                  <div
                    style={{
                      marginTop: "0.8rem",
                      padding: "0.75rem",
                      borderRadius: "0.75rem",
                      background: "rgba(15,23,42,0.9)",
                      fontSize: "0.85rem",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {coaching}
                  </div>
                )}
              </div>

              {/* Backtest analyzer card */}
              <div className="section-card">
                <h3>Strategy backtest analyzer</h3>
                <p>Upload an equity curve and get a quant-style breakdown.</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCurveFile(e.target.files[0] || null)}
                  style={{ marginTop: "0.8rem", marginBottom: "0.6rem" }}
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleBacktestAnalyze}
                  disabled={metricsLoading || !curveFile}
                >
                  {metricsLoading ? "Analyzing…" : "Analyze backtest"}
                </button>
                {metrics && (
                  <div
                    style={{
                      marginTop: "0.8rem",
                      padding: "0.75rem",
                      borderRadius: "0.75rem",
                      background: "rgba(15,23,42,0.9)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {metrics.error ? (
                      <span>{metrics.error}</span>
                    ) : (
                      <ul style={{ paddingLeft: "1rem" }}>
                        <li>Max drawdown: {metrics.max_drawdown}</li>
                        <li>Best run-up: {metrics.best_run_up}</li>
                        <li>
                          Win streak estimate: {metrics.win_streak_estimate}
                        </li>
                        <li>
                          Loss streak estimate: {metrics.loss_streak_estimate}
                        </li>
                        <li>Edge: {metrics.overall_edge_summary}</li>
                        <li>Risk of ruin: {metrics.risk_of_ruin_comment}</li>
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

            <p className="pricing-note" style={{ marginTop: "2rem" }}></p>
          </>
        )}
      </div>
    </section>
  );
}
