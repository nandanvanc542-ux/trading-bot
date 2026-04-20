const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ===== SETTINGS =====
const SYMBOL = "BTCUSDT";
const INTERVAL = "5m";
const LENGTH = 10;
const RANGE_PERCENT = 0.5;

// ===== WEBHOOK =====
app.post("/webhook", (req, res) => {
  console.log("📩 Signal Received:", req.body);
  res.send("OK");
});

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
    console.error("Error:", err.message);
    return null;
  }
}

// ===== BOS LOGIC =====
function calculateBOS(candles) {
  const highs = candles.map(c => parseFloat(c[2]));
  const lows = candles.map(c => parseFloat(c[3]));
  const closes = candles.map(c => parseFloat(c[4]));

  const lastClose = closes[closes.length - 1];

  const prevHigh = Math.max(...highs.slice(-LENGTH - 1, -1));
  const prevLow = Math.min(...lows.slice(-LENGTH - 1, -1));

  const range = ((prevHigh - prevLow) / lastClose) * 100;
  const isSideways = range < RANGE_PERCENT;

  const bullishBOS = lastClose > prevHigh && !isSideways;
  const bearishBOS = lastClose < prevLow && !isSideways;

  return { bullishBOS, bearishBOS, lastClose };
}

// ===== BOT LOOP =====
async function runBot() {
  const candles = await getCandles();
  if (!candles) return;

  const result = calculateBOS(candles);

  console.log("Price:", result.lastClose);

  if (result.bullishBOS) console.log("BUY SIGNAL");
  else if (result.bearishBOS) console.log("SELL SIGNAL");
}

setInterval(runBot, 60000);

// ===== SERVER =====
app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});