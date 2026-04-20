const axios = require("axios");

// ===== SETTINGS =====
const SYMBOL = "BTCUSDT";
const INTERVAL = "5m";
const LENGTH = 10;
const RANGE_PERCENT = 0.5;

// ===== GET CANDLES =====
async function getCandles() {
  try {
    const res = await axios.get("https://api.binance.com/api/v3/klines", {
      params: {
        symbol: SYMBOL,
        interval: INTERVAL,
        limit: 100
      }
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching data:", err.message);
    return null;
  }
}

// ===== MAIN LOGIC =====
function calculateBOS(candles) {
  const highs = candles.map(c => parseFloat(c[2]));
  const lows = candles.map(c => parseFloat(c[3]));
  const closes = candles.map(c => parseFloat(c[4]));

  const lastClose = closes[closes.length - 1];

  // Structure (previous candles only)
  const recentHighs = highs.slice(-LENGTH - 1, -1);
  const recentLows = lows.slice(-LENGTH - 1, -1);

  const prevHigh = Math.max(...recentHighs);
  const prevLow = Math.min(...recentLows);

  // Sideways filter
  const range = ((prevHigh - prevLow) / lastClose) * 100;
  const isSideways = range < RANGE_PERCENT;

  // BOS conditions
  const bullishBOS = lastClose > prevHigh && !isSideways;
  const bearishBOS = lastClose < prevLow && !isSideways;

  return {
    bullishBOS,
    bearishBOS,
    prevHigh,
    prevLow,
    lastClose
  };
}

// ===== RUN BOT =====
async function runBot() {
  const candles = await getCandles();
  if (!candles) return;

  const result = calculateBOS(candles);

  console.log("\nPrice:", result.lastClose.toFixed(2));
  console.log("Prev High:", result.prevHigh.toFixed(2));
  console.log("Prev Low:", result.prevLow.toFixed(2));

  if (result.bullishBOS) {
    console.log("BUY SIGNAL (Bullish BOS)");
  } else if (result.bearishBOS) {
    console.log("SELL SIGNAL (Bearish BOS)");
  } else {
    console.log("No Trade");
  }
}

// ===== LOOP =====
setInterval(runBot, 60000);

console.log("Bot started...");