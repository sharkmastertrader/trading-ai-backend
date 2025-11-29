import detectFVG from "./fvg.js";
import detectMSS from "./mss.js";
import detectLiquiditySweep from "./liquiditySweep.js";
import detectOrderBlock from "./orderBlock.js";
import detectBreaker from "./breaker.js";
import detectKillzone from "./killzone.js";
import detectFvgRetest from "./fvgRetest.js";

/**
 * candles: array of { time, open, high, low, close, volume? }
 * options.patterns: { fvg, mss, liquidity, orderBlock, breaker, killzone, fvgRetest }
 */
export function runPatternDetectors(candles, options = {}) {
  const active = {
    fvg: true,
    mss: true,
    liquidity: true,
    orderBlock: false,
    breaker: false,
    killzone: false,
    fvgRetest: false,
    ...(options.patterns || {}),
  };

  const alerts = [];

  if (active.fvg) {
    const hit = detectFVG(candles);
    if (hit) alerts.push(hit);
  }
  if (active.mss) {
    const hit = detectMSS(candles);
    if (hit) alerts.push(hit);
  }
  if (active.liquidity) {
    const hit = detectLiquiditySweep(candles);
    if (hit) alerts.push(hit);
  }
  if (active.orderBlock) {
    const hit = detectOrderBlock(candles);
    if (hit) alerts.push(hit);
  }
  if (active.breaker) {
    const hit = detectBreaker(candles);
    if (hit) alerts.push(hit);
  }
  if (active.killzone) {
    const hit = detectKillzone(candles);
    if (hit) alerts.push(hit);
  }
  if (active.fvgRetest) {
    const hit = detectFvgRetest(candles);
    if (hit) alerts.push(hit);
  }

  return alerts;
}
