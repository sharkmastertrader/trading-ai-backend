import { useEffect, useState } from "react";

export default function RefundPolicy() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem("taa_token");
      setIsLoggedIn(!!token);
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  const backHref = isLoggedIn ? "/dashboard" : "/";

  return (
    <div
      className="legal-page"
      style={{
        padding: "3rem 1.5rem",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      {/* Back pill */}
      <div style={{ marginBottom: "1rem" }}>
        <a
          href={backHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.35rem 0.75rem",
            borderRadius: "999px",
            border: "1px solid rgba(148,163,184,0.5)",
            fontSize: "0.8rem",
            color: "#e5e7eb",
            textDecoration: "none",
            background: "rgba(15,23,42,0.9)",
          }}
        >
          <span style={{ fontSize: "0.95rem" }}>←</span>
          <span>
            Back to {isLoggedIn ? "dashboard" : "home"}
          </span>
        </a>
      </div>

      {/* Header */}
      <header
        style={{
          marginBottom: "2rem",
          borderBottom: "1px solid rgba(148,163,184,0.4)",
          paddingBottom: "1.5rem",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#a1a1aa",
            marginBottom: "0.4rem",
          }}
        >
          Quantum Innovation Systems LLC
        </p>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>
          Refund Policy
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          How refunds and cancellations work for TradingAI Analyzer™
          subscriptions.
        </p>
        <p
          style={{
            marginTop: "0.75rem",
            fontSize: "0.8rem",
            color: "#6b7280",
          }}
        >
          Last updated: January 2025
        </p>
      </header>

      {/* Shell */}
      <div
        style={{
          borderRadius: "1rem",
          border: "1px solid rgba(148,163,184,0.35)",
          padding: "1.75rem 1.6rem",
          background:
            "radial-gradient(circle at top, rgba(244,244,245,0.03), transparent 55%) #020617",
        }}
      >
        <section style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.95rem", color: "#e5e7eb" }}>
            This Refund Policy is provided by{" "}
            <strong>Quantum Innovation Systems LLC</strong>, the owner of the
            TradingAI Analyzer™ Platform. It explains how subscription renewals,
            cancellations, and refunds are handled.
          </p>
        </section>

        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.4rem" }}>
            Subscription Renewals
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#e5e7eb" }}>
            All paid plans renew automatically at the end of each billing
            period (for example, monthly) using the payment method on file. You
            can see your current plan and renewal date in your account area.
          </p>
        </section>

        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.4rem" }}>
            Refunds
          </h2>
          <ul
            style={{
              fontSize: "0.95rem",
              color: "#e5e7eb",
              paddingLeft: "1.1rem",
            }}
          >
            <li>
              <strong>Initial purchase:</strong> Your first subscription
              payment may be eligible for a refund within 7 days of purchase,
              at our discretion.
            </li>
            <li>
              <strong>Renewals:</strong> Renewal charges are generally{" "}
              <strong>non-refundable</strong>.
            </li>
            <li>
              <strong>Abuse or misuse:</strong> We reserve the right to deny
              refunds in cases of suspected abuse, misuse, or excessive refund
              requests.
            </li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.4rem" }}>
            Cancel Anytime
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#e5e7eb" }}>
            You may cancel your subscription at any time through your account
            or billing page. When you cancel, your access will remain active
            until the end of the current billing period, and you will not be
            charged again unless you restart your subscription.
          </p>
        </section>
      </div>
    </div>
  );
}
