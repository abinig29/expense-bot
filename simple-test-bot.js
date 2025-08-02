const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error(
    "❌ No bot token found. Please set TELEGRAM_BOT_TOKEN in .env file"
  );
  process.exit(1);
}

console.log("🤖 Starting simple test bot...");
console.log(
  "📝 This will help us test if the connection issue is with our code or network"
);

const bot = new TelegramBot(token, {
  polling: true,
  polling_options: {
    timeout: 10,
    limit: 100,
    retryTimeout: 5000,
  },
});

// Simple message handler
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "No text";

  console.log(`📨 Received message: ${text}`);

  bot
    .sendMessage(chatId, `✅ Test successful! I received: "${text}"`)
    .then(() => console.log("✅ Message sent successfully"))
    .catch((err) => console.error("❌ Failed to send message:", err.message));
});

// Error handlers
bot.on("error", (error) => {
  console.error("❌ Bot error:", error.message);
});

bot.on("polling_error", (error) => {
  console.error("❌ Polling error:", error.message);
});

bot.on("polling_start", () => {
  console.log("✅ Bot started successfully!");
  console.log("💡 Send any message to test the bot");
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down test bot...");
  bot.stopPolling();
  process.exit(0);
});

console.log("⏳ Waiting for connection...");
