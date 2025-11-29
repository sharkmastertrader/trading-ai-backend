// src/sections/ResetPassword.jsx
import { useState } from "react";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email || !newPassword) {
      setError("Email and new password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Reset failed");
      }

      setMessage("Password updated. You can now log in with the new password.");
    } catch (err) {
      setError(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="reset" className="section">
      <div className="section-inner">
        <h2 className="section-title">Reset password</h2>
        <p className="section-sub">
          Forgot your password? Set a new one using the email you signed up
          with.
        </p>

        <form className="section-card" onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: "0.75rem" }}>Set a new password</h3>

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
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

            {error && (
              <p style={{ color: "#f97373", fontSize: "0.85rem" }}>{error}</p>
            )}
            {message && (
              <p style={{ color: "#4ade80", fontSize: "0.85rem" }}>{message}</p>
            )}

            <button
              type="submit"
              className="btn-secondary hero-btn"
              disabled={loading}
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
