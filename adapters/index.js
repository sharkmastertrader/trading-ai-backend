import TradingViewAdapter from "./tradingview.js";
import BinanceAdapter from "./binance.js";
import AlpacaAdapter from "./alpaca.js";
import Mt4BridgeAdapter from "./mt4bridge.js";
import Nt8BridgeAdapter from "./nt8bridge.js";

/**
 * Registry of available adapters.
 * key = source id your frontend will send: "tradingview", "binance" etc.
 */
const ADAPTERS = {
  tradingview: TradingViewAdapter,
  binance: BinanceAdapter,
  alpaca: AlpacaAdapter,
  mt4: Mt4BridgeAdapter,
  mt5: Mt4BridgeAdapter, // same bridge, different MT version
  nt8: Nt8BridgeAdapter,
};

export function createAdapter(sourceId, options) {
  const AdapterClass = ADAPTERS[sourceId];
  if (!AdapterClass) {
    throw new Error(`Unknown data source: ${sourceId}`);
  }
  return new AdapterClass(options);
}
