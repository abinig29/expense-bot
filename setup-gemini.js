const fs = require("fs");
const path = require("path");
const readline = require("readline");

console.log("🤖 Setting up Gemini AI for your Expense Bot...\n");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function setupGemini() {
  try {
    console.log("📋 To use the AI features, you need a Gemini API key:");
    console.log("1. Go to: https://makersuite.google.com/app/apikey");
    console.log("2. Sign in with your Google account");
    console.log('3. Click "Create API Key"');
    console.log("4. Copy the generated API key\n");

    const apiKey = await new Promise((resolve) => {
      rl.question("🔑 Enter your Gemini API key: ", (answer) => {
        resolve(answer.trim());
      });
    });

    if (!apiKey) {
      console.log("❌ No API key provided. AI features will not work.");
      rl.close();
      return;
    }

    // Read existing .env file
    const envPath = path.join(__dirname, ".env");
    let envContent = "";

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }

    // Check if GEMINI_API_KEY already exists
    if (envContent.includes("GEMINI_API_KEY=")) {
      // Update existing key
      envContent = envContent.replace(
        /GEMINI_API_KEY=.*/,
        `GEMINI_API_KEY=${apiKey}`
      );
    } else {
      // Add new key
      envContent += `\n# AI Configuration\nGEMINI_API_KEY=${apiKey}\n`;
    }

    // Write back to .env file
    fs.writeFileSync(envPath, envContent);

    console.log("\n✅ Gemini API key configured successfully!");
    console.log("🤖 Your bot now has AI capabilities!");
    console.log("\n💡 You can now:");
    console.log('• Mention "ai" in any message to chat with the AI');
    console.log("• Ask for financial advice and savings tips");
    console.log("• Get personalized spending analysis");
    console.log("• Have natural conversations about your finances");
  } catch (error) {
    console.error("❌ Error setting up Gemini:", error.message);
  } finally {
    rl.close();
  }
}

setupGemini();
