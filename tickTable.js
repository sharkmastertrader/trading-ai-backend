// server/tickTable.js

// Master tick + value table for common futures
const TICK_TABLE = {
  // 🧾 Equity Index (CME)
  ES:  { description: "E-mini S&P 500",          tickSize: 0.25,      tickValue: 12.50 },
  MES: { description: "Micro E-mini S&P 500",    tickSize: 0.25,      tickValue: 1.25 },
  NQ:  { description: "E-mini Nasdaq-100",       tickSize: 0.25,      tickValue: 5.00 },
  MNQ: { description: "Micro E-mini Nasdaq-100", tickSize: 0.25,      tickValue: 0.50 },
  YM:  { description: "E-mini Dow",              tickSize: 1.0,       tickValue: 5.00 },
  MYM: { description: "Micro E-mini Dow",        tickSize: 1.0,       tickValue: 0.50 },
  RTY: { description: "E-mini Russell 2000",     tickSize: 0.10,      tickValue: 5.00 },
  M2K: { description: "Micro E-mini Russell 2000", tickSize: 0.10,    tickValue: 1.00 },

  // 🪙 FX futures (CME)
  "6E":  { description: "Euro FX",               tickSize: 0.00005,   tickValue: 6.25 },
  "6J":  { description: "Japanese Yen",          tickSize: 0.0000005, tickValue: 6.25 },
  "6B":  { description: "British Pound",         tickSize: 0.0001,    tickValue: 6.25 },
  "6A":  { description: "Australian Dollar",     tickSize: 0.0001,    tickValue: 10.00 },
  "6C":  { description: "Canadian Dollar",       tickSize: 0.00005,   tickValue: 5.00 },
  "6N":  { description: "New Zealand Dollar",    tickSize: 0.0001,    tickValue: 5.00 },
  M6E:   { description: "Micro Euro FX",         tickSize: 0.00005,   tickValue: 1.25 },
  M6B:   { description: "Micro British Pound",   tickSize: 0.0001,    tickValue: 1.25 },

  // 💰 Interest rate futures (CME)
  ZN:  { description: "10-Year T-Note",          tickSize: 0.015625,  tickValue: 15.625 }, // 1/64
  ZB:  { description: "30-Year T-Bond",          tickSize: 0.03125,   tickValue: 31.25 },  // 1/32
  ZF:  { description: "5-Year T-Note",           tickSize: 0.0078125, tickValue: 7.8125 }, // 1/128
  ZT:  { description: "2-Year T-Note",           tickSize: 0.00390625, tickValue: 7.8125 }, // 1/256
  GE:  { description: "3-Month SOFR (SR3)",      tickSize: 0.0025,    tickValue: 6.25 },
  SR3: { description: "3-Month SOFR",            tickSize: 0.0025,    tickValue: 6.25 },

  // 🔩 Metals (COMEX)
  GC:  { description: "Gold",                    tickSize: 0.10,      tickValue: 10.00 },
  MGC: { description: "Micro Gold",              tickSize: 0.10,      tickValue: 1.00 },
  SI:  { description: "Silver",                  tickSize: 0.005,     tickValue: 25.00 },
  SIL: { description: "Micro Silver",            tickSize: 0.005,     tickValue: 2.50 },
  HG:  { description: "Copper",                  tickSize: 0.0005,    tickValue: 12.50 },
  PL:  { description: "Platinum",                tickSize: 0.10,      tickValue: 5.00 },
  PA:  { description: "Palladium",               tickSize: 0.50,      tickValue: 5.00 },

  // 🛢 Energy (NYMEX)
  CL:  { description: "Crude Oil",               tickSize: 0.01,      tickValue: 10.00 },
  MCL: { description: "Micro Crude Oil",         tickSize: 0.01,      tickValue: 1.00 },
  NG:  { description: "Natural Gas",             tickSize: 0.001,     tickValue: 10.00 },
  RB:  { description: "RBOB Gasoline",           tickSize: 0.0001,    tickValue: 4.20 },
  HO:  { description: "Heating Oil",             tickSize: 0.0001,    tickValue: 4.20 },

  // 🌾 Agricultural (CBOT)
  ZC:  { description: "Corn",                    tickSize: 0.0025,    tickValue: 12.50 }, // 0.25¢
  ZS:  { description: "Soybeans",                tickSize: 0.0025,    tickValue: 12.50 },
  ZW:  { description: "Wheat",                   tickSize: 0.0025,    tickValue: 12.50 },
  ZO:  { description: "Oats",                    tickSize: 0.0025,    tickValue: 12.50 },
  ZL:  { description: "Soybean Oil",             tickSize: 0.0001,    tickValue: 6.00 },
  ZM:  { description: "Soybean Meal",            tickSize: 0.10,      tickValue: 10.00 },

  // 🌎 Equity index (Europe / ICE / Eurex)
  FDAX: { description: "DAX 40 (Eurex)",         tickSize: 0.5,       tickValue: 12.50 },
  FDXM: { description: "Mini-DAX (Eurex)",       tickSize: 0.5,       tickValue: 2.50 },
  FESX: { description: "Euro Stoxx 50 (Eurex)",  tickSize: 1.0,       tickValue: 10.00 },
  Z:    { description: "FTSE 100 (ICE)",         tickSize: 0.5,       tickValue: 5.00 },
  DX:   { description: "US Dollar Index (ICE)",  tickSize: 0.005,     tickValue: 5.00 },

  // ₿ Crypto futures (CME)
  BTC: { description: "Bitcoin",                 tickSize: 5.0,       tickValue: 25.00 },
  MBT: { description: "Micro Bitcoin",           tickSize: 5.0,       tickValue: 0.50 },
  ET:  { description: "Ether",                   tickSize: 0.25,      tickValue: 12.50 },
  MET: { description: "Micro Ether",             tickSize: 0.25,      tickValue: 1.25 },
};

// Get tick info for a symbol (case-insensitive)
function getTickInfo(symbol) {
  if (!symbol) return null;
  const key = String(symbol).trim().toUpperCase();
  return TICK_TABLE[key] || null;
}

// Round a price to the nearest valid tick for that symbol
function roundToTick(price, symbol) {
  const info = getTickInfo(symbol);
  if (!info || !info.tickSize) return price; // fallback: no rounding
  const { tickSize } = info;
  const factor = Math.round(price / tickSize);
  return Number((factor * tickSize).toFixed(10)); // to avoid float issues
}

module.exports = {
  TICK_TABLE,
  getTickInfo,
  roundToTick,
};
