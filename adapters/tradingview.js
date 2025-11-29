import { runPatternDetectors } from "../patterns/index.js";

export default class TradingViewAdapter {
  constructor({ symbol, timeframe, patterns, onAlert }) {
    this.symbol = symbol;
    this.timeframe = timeframe;
    this.patterns = patterns || {};
    this.onAlert = onAlert;
    this.candles = [];
    this.active = false;
  }

  start() {
    this.active = true;
  }

  stop() {
    this.active = false;
    this.candles = [];
  }

  handleIncomingCandle(candle) {
    if (!this.active) return;

    this.candles.push(candle);
    if (this.candles.length > 500) this.candles.shift();

    const hits = runPatternDetectors(this.candles, {
      patterns: this.patterns,
    });

    hits.forEach((hit) => {
      this.onAlert?.({
        symbol: this.symbol,
        timeframe: this.timeframe,
        pattern: hit.pattern,
        direction: hit.direction,
        detail: hit.detail,
        lastCandle: candle,
      });
    });
  }
}
