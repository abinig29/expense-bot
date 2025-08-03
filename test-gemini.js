require("dotenv").config();
const { GeminiAIService } = require("./dist/services/geminiAIService");

console.log("🤖 Testing Gemini AI Integration...\n");

async function testGemini() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.log("❌ GEMINI_API_KEY not found in environment variables");
      console.log("💡 Run: npm run setup-gemini");
      return;
    }

    console.log("🔑 API Key found, testing connection...");

    const geminiService = new GeminiAIService();

    // Test connection
    console.log("🔍 Testing Gemini connection...");
    const isConnected = await geminiService.testConnection();

    if (isConnected) {
      console.log("✅ Gemini connection successful!");

      // Test conversation
      console.log("\n💬 Testing conversation...");
      const response = await geminiService.processConversation(
        "Hello! Can you help me with financial advice?",
        12345 // Test user ID
      );

      console.log("🤖 AI Response:");
      console.log("─".repeat(50));
      console.log(response);
      console.log("─".repeat(50));

      console.log("\n🎉 Gemini AI integration is working perfectly!");
      console.log(
        "💡 Your bot is ready to provide intelligent financial advice."
      );
    } else {
      console.log("❌ Gemini connection failed");
      console.log("💡 Please check your API key and try again");
    }
  } catch (error) {
    console.error("❌ Error testing Gemini:", error.message);
    console.log("\n💡 Common issues:");
    console.log(
      "• Invalid API key - Get a new one from https://makersuite.google.com/app/apikey"
    );
    console.log("• Network issues - Check your internet connection");
    console.log("• API quota exceeded - Check your Gemini usage limits");
  }
}

testGemini();
