const fs = require("fs");
const path = require("path");

console.log("🤖 Telegram Expense Bot Setup\n");

// Check if .env file exists
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  console.log("⚠️  .env file already exists. Skipping setup.");
  console.log(
    "If you need to update your bot token, edit the .env file manually."
  );
  process.exit(0);
}

console.log("📝 Setting up your Telegram Expense Bot...\n");

console.log("To get your bot token:");
console.log("1. Open Telegram and search for @BotFather");
console.log("2. Send /newbot command");
console.log("3. Follow the instructions to create your bot");
console.log(
  "4. Copy the bot token (it looks like: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)\n"
);

const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter your bot token: ", (token) => {
  if (!token || token.trim() === "") {
    console.log("❌ Bot token is required. Please run setup again.");
    rl.close();
    return;
  }

  // Create .env file
  const envContent = `# Telegram Bot Token (get this from @BotFather)
TELEGRAM_BOT_TOKEN=${token.trim()}

# Optional: Set to true to enable debug logging
DEBUG=false
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log("✅ .env file created successfully!");
    console.log("\n🚀 You can now start your bot:");
    console.log("   npm start");
    console.log("\n💡 For development mode:");
    console.log("   npm run dev");
  } catch (error) {
    console.error("❌ Error creating .env file:", error.message);
  }

  rl.close();
});
