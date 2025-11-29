// src/pages/Dashboard.jsx
import AnalyzerUpload from "../sections/AnalyzerUpload.jsx";
import EliteTools from "../sections/EliteTools.jsx";

export default function Dashboard({ user }) {
  const planLabel =
    user?.plan === "elite" ? "Pro Trader Elite" : user?.plan === "starter" ? "Starter" : "";

  return (
    <main className="dashboard-page">
      {/* Header / welcome strip */}
      <section className="section">
        <div className="section-inner">
          <h1 className="section-title">Trader dashboard</h1>
          <p className="section-sub">
            {user
              ? `Signed in as ${user.email} · ${planLabel}`
              : "You’re logged in."}
          </p>
        </div>
      </section>

      {/* 🔥 Elite tools FIRST */}
      <EliteTools />

      {/* Screenshot analyzer — NO title or intro */}
      <section className="section" style={{ marginTop: "2rem" }}>
        <AnalyzerUpload />
      </section>
    </main>
  );
}
