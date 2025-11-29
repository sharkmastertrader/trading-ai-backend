export default function Pricing({ onStarter, onElite }) {
  return (
    <section id="pricing" className="section">
      <div className="section-inner">
        <h2 className="section-title">Pricing</h2>
        <p className="section-sub">
          Two powerful plans. No contracts. Cancel anytime.
        </p>

        <div className="pricing-grid">

          {/* ⭐ STARTER PLAN — $19.99/mo */}
          <div className="pricing-card">
            <h3>Starter</h3>
            <p className="price">
              $19.99<span>/mo</span>
            </p>

            <ul>
              <li>Unlimited AI chart analysis</li>
              <li>ICT-focused detection (FVG, MSS, BSL/SSL)</li>
              <li>Displacement & liquidity sweep recognition</li>
              <li>3-target structured trade plans</li>
              <li>Screenshot-to-journal export</li>
              <li>Position size calculator</li>
              <li>Email support</li>
            </ul>

            <button className="btn-primary pricing-btn" onClick={onStarter}>
              Choose Starter
            </button>
          </div>

          {/* ⭐ PRO TRADER ELITE — $49.99/mo */}
          <div className="pricing-card popular">
            <div className="badge">Best value</div>

            <h3>Pro Trader Elite</h3>
            <p className="price">
              $49.99<span>/mo</span>
            </p>

            <ul>
              <li>Everything in Starter</li>
              <li>Live AI chart monitoring</li>
              <li>Alerts for new FVG, MSS, liquidity sweeps</li>
              <li>Daily market prep report</li>
              <li>Weekly AI performance breakdown</li>
              <li>Monthly AI coaching report</li>
              <li>Strategy backtest analyzer</li>
              <li>Priority support</li>
            </ul>

            <button className="btn-primary pricing-btn" onClick={onElite}>
              Choose Elite
            </button>
          </div>
        </div>

        <p className="pricing-note">
          Cancel anytime. No setup fees. No long-term contracts.
        </p>
      </div>
    </section>
  );
}
