import { runPatternDetectors } from "../patterns/index.js";

export default class Mt4BridgeAdapter {
  constructor({ symbol, timeframe, patterns, onAlert }) {
    this.symbol = symbol;
    this.timeframe = timeframe;
    this.patterns = patterns || {};
    this.onAlert = onAlert;
    this.candles = [];
  }

  start() {
    // MT4/5 will push candles via HTTP POST to /api/mt-bridge/:feedKey
  }

  stop() {
    this.candles = [];
  }

  handleIncomingCandle(candle) {
    this.candles.push(candle);
    if (this.candles.length > 500) this.candles.shift();

    const hits = runPatternDetectors(this.candles, { patterns: this.patterns });
    hits.forEach((hit) =>
      this.onAlert?.({
        symbol: this.symbol,
        timeframe: this.timeframe,
        pattern: hit.pattern,
        direction: hit.direction,
        detail: hit.detail,
        lastCandle: candle,
      })
    );
  }
}
