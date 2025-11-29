import { useEffect, useState } from "react";

export default function PrivacyPolicy() {
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
          Privacy Policy
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          How we collect, use, and protect information when you use the
          TradingAI Analyzer™ Platform.
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

      {/* Content shell */}
      <div
        style={{
          borderRadius: "1rem",
          border: "1px solid rgba(148,163,184,0.35)",
          padding: "1.75rem 1.6rem",
          background:
            "radial-gradient(circle at top, rgba(34,197,94,0.06), transparent 55%) #020617",
        }}
      >
        {/* Intro */}
        <section style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.95rem", color: "#e5e7eb" }}>
            This Privacy Policy explains how{" "}
            <strong>Quantum Innovation Systems LLC</strong> (“we”, “our”,
            “us”), owner of the TradingAI Analyzer™ Platform (“the Platform”),
            collects, uses, and protects your information.
          </p>
        </section>

        {/* TOC */}
        <section
          style={{
            marginBottom: "1.75rem",
            padding: "0.9rem 1rem",
            borderRadius: "0.75rem",
            background: "rgba(15,23,42,0.9)",
            border: "1px solid rgba(148,163,184,0.35)",
          }}
        >
          <p
            style={{
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "#9ca3af",
              marginBottom: "0.4rem",
            }}
          >
            In this policy
          </p>
          <ul
            style={{
              fontSize: "0.9rem",
              color: "#e5e7eb",
              paddingLeft: "1.1rem",
            }}
          >
            <li>
              <a href="#info" style={{ color: "#22c55e", textDecoration: "none" }}>
                Information we collect
              </a>
            </li>
            <li>
              <a href="#use" style={{ color: "#22c55e", textDecoration: "none" }}>
                How we use information
              </a>
            </li>
            <li>
              <a
                href="#sharing"
                style={{ color: "#22c55e", textDecoration: "none" }}
              >
                Data sharing
              </a>
            </li>
            <li>
              <a
                href="#retention"
                style={{ color: "#22c55e", textDecoration: "none" }}
              >
                Data retention
              </a>
            </li>
            <li>
              <a href="#rights" style={{ color: "#22c55e", textDecoration: "none" }}>
                Your rights
              </a>
            </li>
          </ul>
        </section>

        <section id="info" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.4rem" }}>
            Information We Collect
          </h2>
          <ul
            style={{
              fontSize: "0.95rem",
              color: "#e5e7eb",
              paddingLeft: "1.1rem",
            }}
          >
            <li>Email address and basic account information</li>
            <li>Subscription and billing details (processed via Stripe)</li>
            <li>Uploaded trading chart images and related analysis data</li>
            <li>Usage metrics, logs, and interaction history with the Platform</li>
          </ul>
        </section>

        <section id="use" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.4rem" }}>
            How We Use Your Information
          </h2>
          <ul
            style={{
              fontSize: "0.95rem",
              color: "#e5e7eb",
              paddingLeft: "1.1rem",
            }}
          >
            <li>To provide AI-powered chart and trade-idea analysis</li>
            <li>To process payments and manage active subscriptions</li>
            <li>To monitor performance and improve features over time</li>
            <li>To provide technical support and respond to your requests</li>
          </ul>
        </section>

        <section id="sharing" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.4rem" }}>
            Data Sharing
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#e5e7eb" }}>
            We do <strong>not</strong> sell your personal information. We share
            data only with trusted service providers that help us operate the
            Platform, such as hosting providers, storage and analytics tools,
            and payment processors (e.g., Stripe). These providers are granted
            access only to the minimum data necessary to perform their
            functions.
          </p>
        </section>

        <section id="retention" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.4rem" }}>
            Data Retention
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#e5e7eb" }}>
            Uploaded charts, plans, and usage data may be retained to improve
            model quality, reliability, and the overall user experience. If you
            request deletion of your account, we will remove or anonymize
            personally identifiable information where reasonably possible,
            subject to legal and operational requirements.
          </p>
        </section>

        <section id="rights">
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.4rem" }}>
            Your Rights
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#e5e7eb" }}>
            You may request:
          </p>
          <ul
            style={{
              fontSize: "0.95rem",
              color: "#e5e7eb",
              paddingLeft: "1.1rem",
            }}
          >
            <li>Access to the personal data associated with your account</li>
            <li>Correction of inaccurate or outdated information</li>
            <li>Deletion of your account and associated data, where feasible</li>
          </ul>
          <p
            style={{
              fontSize: "0.9rem",
              color: "#9ca3af",
              marginTop: "0.75rem",
            }}
          >
            To exercise these rights, contact us through the support channel
            listed in your account or on our website.
          </p>
        </section>
      </div>
    </div>
  );
}
