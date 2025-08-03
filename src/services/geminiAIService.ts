import { GoogleGenerativeAI } from "@google/generative-ai";
import { PostgresStorage } from "./postgresStorage";
import { CategoryService } from "./categoryService";

export class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private storage: PostgresStorage;
  private categoryService: CategoryService;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.storage = new PostgresStorage();
    this.categoryService = CategoryService.getInstance();
  }

  /**
   * Process conversation with Gemini AI
   */
  async processConversation(message: string, userId: number): Promise<string> {
    try {
      // Get user's expense data for context
      const expenseContext = await this.getExpenseContext(userId);

      // Create the prompt with context
      const prompt = this.createPrompt(message, expenseContext);

      // Generate response from Gemini with retry logic
      const text = await this.generateWithRetry(prompt);

      return text;
    } catch (error) {
      console.error("Error with Gemini AI:", error);
      return this.getFallbackResponse(message);
    }
  }

  /**
   * Generate content with retry logic
   */
  private async generateWithRetry(
    prompt: string,
    maxRetries: number = 3
  ): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 Gemini AI attempt ${attempt}/${maxRetries}...`);

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log(`✅ Gemini AI response generated successfully`);

        // Sanitize the response for Telegram markdown
        const sanitizedText = this.sanitizeMarkdown(text);

        return sanitizedText;
      } catch (error) {
        console.error(`❌ Gemini AI attempt ${attempt} failed:`, error.message);

        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    throw new Error("All retry attempts failed");
  }

  /**
   * Sanitize markdown for Telegram compatibility
   */
  private sanitizeMarkdown(text: string): string {
    // Convert to simple, safe format for Telegram
    let sanitized = text;

    // Remove complex markdown that causes issues
    sanitized = sanitized
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, "")
      // Remove complex markdown
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Convert links to plain text
      .replace(/`([^`]+)`/g, "$1") // Remove code formatting
      .replace(/~~([^~]+)~~/g, "$1") // Remove strikethrough
      .replace(/__([^_]+)__/g, "$1") // Remove underline

      // Simplify headers to bold
      .replace(/^#{1,6}\s+(.+)$/gm, "**$1**")
      .replace(/\n#{1,6}\s+(.+)/g, "\n**$1**")

      // Clean up excessive formatting
      .replace(/\*\*\*\*([^*]+)\*\*\*\*/g, "**$1**") // Fix double bold
      .replace(/\*\*([^*]+)\*\*/g, "**$1**") // Ensure proper bold

      // Clean up excessive newlines
      .replace(/\n{3,}/g, "\n\n")

      // Ensure the message isn't too long
      .substring(0, 4000);

    // If there are still markdown parsing issues, convert to plain text
    if (
      sanitized.includes("*") ||
      sanitized.includes("_") ||
      sanitized.includes("[")
    ) {
      sanitized = sanitized
        .replace(/\*/g, "")
        .replace(/_/g, "")
        .replace(/\[/g, "")
        .replace(/\]/g, "")
        .replace(/`/g, "")
        .replace(/~/g, "");
    }

    return sanitized;
  }

  /**
   * Get user's expense data for context
   */
  private async getExpenseContext(userId: number): Promise<string> {
    try {
      // Get recent expenses (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const expenses = await this.storage.getExpensesByDateRange(
        thirtyDaysAgo,
        new Date()
      );
      const userExpenses = expenses.filter((e) => e.userId === userId);

      if (userExpenses.length === 0) {
        return "The user has no recent expense data.";
      }

      // Calculate totals
      const totalSpent = userExpenses.reduce((sum, e) => sum + e.amount, 0);
      const avgDaily = totalSpent / 30;

      // Category analysis
      const categoryTotals: Record<string, number> = {};
      userExpenses.forEach((expense) => {
        categoryTotals[expense.category] =
          (categoryTotals[expense.category] || 0) + expense.amount;
      });

      // Find top categories
      const sortedCategories = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      // Create context string
      let context = `User's Financial Data (Last 30 Days):\n`;
      context += `- Total spent: $${totalSpent.toFixed(2)}\n`;
      context += `- Daily average: $${avgDaily.toFixed(2)}\n`;
      context += `- Number of transactions: ${userExpenses.length}\n\n`;

      context += `Top Spending Categories:\n`;
      sortedCategories.forEach(([category, amount], index) => {
        const percentage = ((amount / totalSpent) * 100).toFixed(1);
        context += `${index + 1}. ${category}: $${amount.toFixed(
          2
        )} (${percentage}%)\n`;
      });

      context += `\nRecent Expenses:\n`;
      userExpenses.slice(0, 10).forEach((expense) => {
        context += `- $${expense.amount.toFixed(2)} on ${expense.category} (${
          expense.description
        }) - ${expense.date.toLocaleDateString()}\n`;
      });

      return context;
    } catch (error) {
      console.error("Error getting expense context:", error);
      return "Unable to retrieve user's expense data.";
    }
  }

  /**
   * Create a comprehensive prompt for Gemini
   */
  private createPrompt(userMessage: string, expenseContext: string): string {
    return `You are a helpful and friendly AI financial assistant for a Telegram expense tracking bot. 

Your role is to:
1. Provide personalized financial advice based on the user's spending data
2. Help users understand their spending patterns
3. Suggest ways to save money and improve financial health
4. Answer questions about budgeting, saving, and financial planning
5. Be encouraging and supportive while being honest about financial realities

User's Expense Context:
${expenseContext}

User's Message: "${userMessage}"

Instructions:
- Respond in a friendly, conversational tone
- Use emojis appropriately to make responses engaging
- Provide specific, actionable advice when possible
- Reference the user's actual spending data when relevant
- Keep responses concise but informative (max 500 words)
- Use markdown formatting for better readability
- If the user asks about saving money, provide specific tips based on their spending patterns
- If they ask about their financial health, give an honest assessment with suggestions for improvement
- Always be encouraging and supportive

Please respond to the user's message:`;
  }

  /**
   * Fallback response when Gemini is unavailable
   */
  private getFallbackResponse(message: string): string {
    return (
      `🤖 *AI Assistant*\n\n` +
      `I'm having trouble connecting to my AI brain right now, but I'm here to help!\n\n` +
      `💡 *How I can help you:*\n` +
      `• Analyze your spending patterns\n` +
      `• Provide savings advice\n` +
      `• Help with budgeting\n` +
      `• Answer financial questions\n\n` +
      `Try asking me about:\n` +
      `• "How can I save more money?"\n` +
      `• "What's my biggest expense?"\n` +
      `• "Give me budget tips"\n` +
      `• "How am I doing financially?"\n\n` +
      `I'll be back to full AI power soon! 💰`
    );
  }

  /**
   * Test the Gemini connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.model.generateContent(
        "Hello, can you hear me?"
      );
      const response = await result.response;
      return response.text().length > 0;
    } catch (error) {
      console.error("Gemini connection test failed:", error);
      return false;
    }
  }
}
