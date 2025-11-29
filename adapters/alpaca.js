import WebSocket from "ws";
import { runPatternDetectors } from "../patterns/index.js";

export default class AlpacaAdapter {
  constructor({ apiKey, secretKey, paper = true, symbol, timeframe, patterns, onAlert }) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.paper = paper;
    this.symbol = symbol;
    this.timeframe = timeframe;
    this.patterns = patterns || {};
    this.onAlert = onAlert;
    this.candles = [];
    this.ws = null;
  }

  start() {
    const base = this.paper
      ? "wss://stream.data.alpaca.markets/v2/iex"
      : "wss://stream.data.alpaca.markets/v2/sip";

    this.ws = new WebSocket(base);

    this.ws.on("open", () => {
      this.ws.send(
        JSON.stringify({
          action: "auth",
          key: this.apiKey,
          secret: this.secretKey,
        })
      );
      this.ws.send(
        JSON.stringify({
          action: "subscribe",
          bars: [this.symbol],
        })
      );
    });

    this.ws.on("message", (raw) => {
      try {
        const msgs = JSON.parse(raw.toString());
        for (const msg of msgs) {
          if (msg.T === "b" && msg.S === this.symbol) {
            const candle = {
              time: msg.t,
              open: Number(msg.o),
              high: Number(msg.h),
              low: Number(msg.l),
              close: Number(msg.c),
            };
            this._handleCandle(candle);
          }
        }
      } catch (e) {
        console.error("Alpaca WS error", e);
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

  handleIncomingCandle(candle) {
    this._handleCandle(candle);
  }
}
