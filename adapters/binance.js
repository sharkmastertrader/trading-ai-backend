import WebSocket from "ws";
import { runPatternDetectors } from "../patterns/index.js";

export default class BinanceAdapter {
  constructor({ symbol, timeframe, patterns, onAlert }) {
    this.symbol = symbol; // e.g. "btcusdt"
    this.timeframe = timeframe; // e.g. "1m"
    this.patterns = patterns || {};
    this.onAlert = onAlert;
    this.candles = [];
    this.ws = null;
  }

  start() {
    const stream = `${this.symbol.toLowerCase()}@kline_${this.timeframe}`;
    this.ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);

    this.ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        const k = msg.k;
        if (!k || !k.x) return; // only on candle close

        const candle = {
          time: k.T,
          open: Number(k.o),
          high: Number(k.h),
          low: Number(k.l),
          close: Number(k.c),
        };

        this._handleCandle(candle);
      } catch (e) {
        console.error("Binance WS parse error", e);
      }
    });

    this.ws.on("close", () => {
      this.ws = null;
    });
  }

  stop() {
    if (this.ws) this.ws.close();
    this.ws = null;
    this.candles = [];
  }

  _handleCandle(candle) {
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

  // For consistency with other adapters (not used here)
  handleIncomingCandle(candle) {
    this._handleCandle(candle);
  }
}
