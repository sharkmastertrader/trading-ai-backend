import { useEffect, useState } from "react";

export default function TermsOfService() {
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
          Terms of Service
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          The rules that apply when you create an account and use the
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

      {/* Shell */}
      <div
        style={{
          borderRadius: "1rem",
          border: "1px solid rgba(148,163,184,0.35)",
          padding: "1.75rem 1.6rem",
          background:
            "radial-gradient(circle at top, rgba(52,211,153,0.05), transparent 55%) #020617",
        }}
      >
        {/* Intro */}
        <section style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.95rem", color: "#e5e7eb" }}>
            These Terms of Service (“Terms”) are a legal agreement between you
            and <strong>Quantum Innovation Systems LLC</strong> (“we”, “our”,
            “us”), the owner and operator of the TradingAI Analyzer™ Platform
            (“the Platform”). By accessing or using the Platform, you agree to
            be bound by these Terms.
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
            Sections
          </p>
          <ul
            style={{
              fontSize: "0.9rem",
              color: "#e5e7eb",
              paddingLeft: "1.1rem",
            }}
          >
            <li>
              <a href="#accept" style={{ color: "#22c55e", textDecoration: "none" }}>
                1. Acceptance of Terms
              </a>
            </li>
            <li>
              <a href="#use" style={{ color: "#22c55e", textDecoration: "none" }}>
                2. Use of the Platform
              </a>
            </li>
            <li>
              <a
                href="#billing"
                style={{ color: "#22c55e", textDecoration: "none" }}
              >
                3. Subscriptions & Billing
              </a>
            </li>
            <li>
              <a
                href="#refunds"
                style={{ color: "#22c55e", textDecoration: "none" }}
              >
                4. Refund Policy
              </a>
            </li>
            <li>
              <a href="#edu" style={{ color: "#22c55e", textDecoration: "none" }}>
                5. Educational Use Only
              </a>
            </li>
            <li>
              <a
                href="#term"
                style={{ color: "#22c55e", textDecoration: "none" }}
              >
                6. Termination
              </a>
            </li>
            <li>
              <a
                href="#liability"
                style={{ color: "#22c55e", textDecoration: "none" }}
              >
                7. Limitation of Liability
              </a>
            </li>
            <li>
              <a
                href="#changes"
                style={{ color: "#22c55e", textDecoration: "none" }}
              >
                8. Changes to Terms
              </a>
            </li>
          </ul>
        </section>

        <section id="accept" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.4rem" }}>
            1. Acceptance of Terms
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#e5e7eb" }}>
            By creating an account, starting a subscription, or using any part
            of the Platform, you confirm that you have read, understood, and
            agree to these Terms. If you do not agree, you must not use the
            Platform.
          </p>
        </section>

        <section id="use" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.4rem" }}>
            2. Use of the Platform
          </h2>
          <ul
            style={{
              fontSize: "0.95rem",
              color: "#e5e7eb",
              paddingLeft: "1.1rem",
            }}
          >
            <li>You must be at least 18 years old to use the Platform.</li>
            <li>
              You may not share, resell, or sublicense your account or
              subscription access.
            </li>
            <li>
              You are responsible for maintaining the confidentiality of your
              login credentials.
            </li>
            <li>
              You agree not to misuse the Platform, attempt to reverse
              engineer it, or interfere with its normal operation.
            </li>
          </ul>
        </section>

        <section id="billing" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.4rem" }}>
            3. Subscriptions & Billing
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#e5e7eb" }}>
            TradingAI Analyzer™ is offered as a subscription service. Plans
            renew automatically until canceled. By starting a subscription, you
            authorize recurring billing through our payment processor (such as
            Stripe) using the payment method you provide.
          </p>
        </section>

        <section id="refunds" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.4rem" }}>
            4. Refund Policy
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#e5e7eb" }}>
            Initial subscription purchases may be eligible for a refund within
            the first 7 days, as described in our separate Refund Policy.
            Renewal payments are generally non-refundable unless required by
            applicable law.
          </p>
        </section>

        <section id="edu" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.4rem" }}>
            5. Educational Use Only
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#e5e7eb" }}>
            The Platform provides tools for educational and informational
            purposes only. We do not provide personalized financial, legal, or
            tax advice. You are solely responsible for any trading or
            investment decisions you make.
          </p>
        </section>

        <section id="term" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.4rem" }}>
            6. Termination
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#e5e7eb" }}>
            We may suspend or terminate your account at our discretion if you
            violate these Terms, abuse the Platform, or engage in behavior we
            reasonably consider harmful. You may stop using the Platform and
            cancel your subscription at any time.
          </p>
        </section>

        <section id="liability" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.4rem" }}>
            7. Limitation of Liability
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#e5e7eb" }}>
            The Platform is provided “as is” and “as available”. To the maximum
            extent permitted by law, Quantum Innovation Systems LLC is not
            liable for any trading losses, lost profits, or indirect, special,
            incidental, or consequential damages arising from your use of the
            Platform.
          </p>
        </section>

        <section id="changes">
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.4rem" }}>
            8. Changes to Terms
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#e5e7eb" }}>
            We may update these Terms from time to time. When changes are
            made, we will update the “Last updated” date above. Continued use
            of the Platform after changes take effect constitutes acceptance of
            the revised Terms.
          </p>
        </section>
      </div>
    </div>
  );
}
