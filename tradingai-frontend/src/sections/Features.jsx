export default function Features() {
  return (
    <section id="features" className="section">
      <div className="section-inner">
        <h2 className="section-title">Features built for real traders</h2>
        <p className="section-sub">
          Not signals. Not hype. Just structure, risk and clarity.
        </p>

        <div className="section-grid section-grid-2">
          <div className="section-card">
            <h3>Pattern detection</h3>
            <p>
              FVG, MSS, BOS/CHOCH, liquidity sweeps and displacement identified
              directly from your screenshot.
            </p>
          </div>

          <div className="section-card">
            <h3>Risk engine</h3>
            <p>
              Stops, targets and position size framed around your risk per trade
              and instrument volatility.
            </p>
          </div>

          <div className="section-card">
            <h3>Multi-take-profit mapping</h3>
            <p>
              TP1, TP2 and final targets with clear invalidation so you always
              know what you’re holding for.
            </p>
          </div>

          <div className="section-card">
            <h3>Workflow ready</h3>
            <p>
              Copy-paste plans into your journal, Discord, Telegram or wherever
              you manage your trading.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
