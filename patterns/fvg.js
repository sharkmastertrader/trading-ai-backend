export default function detectFVG(candles) {
  const c = candles;
  if (c.length < 3) return null;
  const c0 = c[c.length - 3];
  const c2 = c[c.length - 1];

  // bullish FVG: low of current > high 2 candles ago
  if (c2.low > c0.high) {
    return {
      pattern: "FVG",
      direction: "long",
      detail: `Bullish FVG: gap between ${c0.high} and ${c2.low}`,
    };
  }

  // bearish FVG: high of current < low 2 candles ago
  if (c2.high < c0.low) {
    return {
      pattern: "FVG",
      direction: "short",
      detail: `Bearish FVG: gap between ${c2.high} and ${c0.low}`,
    };
  }

  return null;
}
