export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section">
      <div className="section-inner">
        <h2 className="section-title">How it works</h2>
        <p className="section-sub">
          From screenshot to structured trade idea in three steps.
        </p>

        <div className="section-grid">
          <div className="section-card">
            <div className="section-step">01</div>
            <h3>Upload your chart</h3>
            <p>
              Upload a screenshot of any trading chart — from any platform — and get AI analysis instantly.
            </p>
          </div>

          <div className="section-card">
            <div className="section-step">02</div>
            <h3>AI reads structure</h3>
            <p>
              The engine scans for FVG, MSS, BSL/SSL, liquidity sweeps, trend
              and context based on your style.
            </p>
          </div>

          <div className="section-card">
            <div className="section-step">03</div>
            <h3>Get the plan</h3>
            <p>
              Entry, stop, targets, invalidation and R-multiple—packaged in a
              clean plan you can execute or journal.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
