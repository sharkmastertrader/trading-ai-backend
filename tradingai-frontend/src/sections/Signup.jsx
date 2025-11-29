// src/sections/Signup.jsx
import { useState } from "react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState("starter");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, plan }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sign up failed");
      }

      // Save JWT for future requests
      if (data.token) {
        localStorage.setItem("taa_token", data.token);
      }

      setMessage("Account created. Redirecting to app…");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err) {
      setError(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="signup" className="section">
      <div className="section-inner">
        <h2 className="section-title">Create your TradingAI account</h2>
        <p className="section-sub">
          One login for Starter and Pro Trader Elite. Upgrade or downgrade
          anytime.
        </p>

        <form className="section-card" onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: "0.75rem" }}>Sign up</h3>

          <div style={{ display: "grid", gap: "0.75rem", fontSize: "0.9rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@trader.com"
                style={{
                  width: "100%",
                  padding: "0.5rem 0.6rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(148,163,184,0.6)",
                  background: "rgba(15,23,42,0.9)",
                  color: "#e5e7eb",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "0.5rem 0.6rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(148,163,184,0.6)",
                  background: "rgba(15,23,42,0.9)",
                  color: "#e5e7eb",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>
                Plan
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.6rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(148,163,184,0.6)",
                  background: "rgba(15,23,42,0.9)",
                  color: "#e5e7eb",
                }}
              >
                <option value="starter">Starter (chart analyzer)</option>
                <option value="elite">Pro Trader Elite</option>
              </select>
              <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 4 }}>
                Billing is handled via Stripe checkout. This account just gives
                you your login.
              </p>
            </div>

            {error && (
              <p style={{ color: "#f97373", fontSize: "0.85rem" }}>{error}</p>
            )}
            {message && (
              <p style={{ color: "#4ade80", fontSize: "0.85rem" }}>{message}</p>
            )}

            <button
              type="submit"
              className="btn-primary hero-btn"
              disabled={loading}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
