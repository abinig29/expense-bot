import TelegramBot from "node-telegram-bot-api";
import { ExpenseParser } from "../utils/expenseParser";
import { MessageFormatter } from "../utils/messageFormatter";
import { PostgresStorage } from "../services/postgresStorage";
import { CategoryService } from "../services/categoryService";
import { ConfigService } from "../services/configService";
import { Expense, ParsedExpense, BotSettings } from "../types";

export class BotHandler {
  private bot: TelegramBot;
  private storage: PostgresStorage;
  private categoryService: CategoryService;
  private configService: ConfigService;
  private pendingConfirmations: Map<number, { action: string; data: any }> =
    new Map();

  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.storage = new PostgresStorage();
    this.categoryService = CategoryService.getInstance();
    this.configService = ConfigService.getInstance();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handle text messages
    this.bot.on("message", (msg) => this.handleMessage(msg));

    // Handle commands
    this.bot.onText(/\/start/, (msg) => this.handleStart(msg));
    this.bot.onText(/\/help/, (msg) => this.handleHelp(msg));
    this.bot.onText(/\/summary(?:\s+(.+))?/, (msg, match) =>
      this.handleSummary(msg, match)
    );
    this.bot.onText(/\/stats/, (msg) => this.handleStats(msg));
    this.bot.onText(/\/clear(?:\s+(.+))?/, (msg, match) =>
      this.handleClear(msg, match)
    );
    this.bot.onText(/\/settings/, (msg) => this.handleSettings(msg));
    this.bot.onText(/\/debug/, (msg) => this.handleDebug(msg));
    this.bot.onText(/\/categories/, (msg) => this.handleCategories(msg));
    this.bot.onText(/\/category(?:\s+(.+))?/, (msg, match) =>
      this.handleCategoryFilter(msg, match)
    );
    this.bot.onText(/\/addcategory(?:\s+(.+))?/, (msg, match) =>
      this.handleAddCategory(msg, match)
    );
    this.bot.onText(/\/suggest(?:\s+(.+))?/, (msg, match) =>
      this.handleCategorySuggestions(msg, match)
    );
  }

  private async handleMessage(msg: TelegramBot.Message): Promise<void> {
    if (!msg.text || !msg.from) return;

    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const messageText = msg.text.trim();
    const topicId = msg.message_thread_id; // For forum topics

    // Check if this is a confirmation response
    if (this.pendingConfirmations.has(userId)) {
      await this.handleConfirmation(msg, userId, messageText);
      return;
    }

    // Skip if it's a command
    if (messageText.startsWith("/")) return;

    // Check if it looks like an expense message
    if (ExpenseParser.isExpenseMessage(messageText)) {
      await this.handleExpenseMessage(
        msg,
        messageText,
        userId,
        chatId,
        topicId
      );
    }
  }

  private async handleExpenseMessage(
    msg: TelegramBot.Message,
    messageText: string,
    userId: number,
    chatId: number,
    topicId?: number
  ): Promise<void> {
    try {
      // Check if message contains multiple expenses
      if (ExpenseParser.hasMultipleExpenses(messageText)) {
        await this.handleMultipleExpenses(
          msg,
          messageText,
          userId,
          chatId,
          topicId
        );
      } else {
        await this.handleSingleExpense(
          msg,
          messageText,
          userId,
          chatId,
          topicId
        );
      }
    } catch (error) {
      console.error("Error handling expense message:", error);
      await this.bot.sendMessage(
        chatId,
        MessageFormatter.formatErrorMessage(
          "An error occurred while processing your expense."
        ),
        { parse_mode: "Markdown" }
      );
    }
  }

  private async handleSingleExpense(
    msg: TelegramBot.Message,
    messageText: string,
    userId: number,
    chatId: number,
    topicId?: number
  ): Promise<void> {
    const parsedExpense = await ExpenseParser.parseMessage(messageText);

    if (!parsedExpense) {
      await this.bot.sendMessage(
        chatId,
        MessageFormatter.formatErrorMessage(
          "Could not parse expense message. Please check the format."
        ),
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Create expense object
    const expense: Expense = {
      ...parsedExpense,
      userId,
      messageId: msg.message_id,
      chatId,
      topicId,
    };

    // Store the expense
    await this.storage.addExpense(expense);

    // Send confirmation only if enabled
    if (this.configService.isConfirmationEnabled()) {
      await this.bot.sendMessage(
        chatId,
        MessageFormatter.formatExpenseAddedMessage(expense),
        { parse_mode: "Markdown" }
      );
    }
  }

  private async handleMultipleExpenses(
    msg: TelegramBot.Message,
    messageText: string,
    userId: number,
    chatId: number,
    topicId?: number
  ): Promise<void> {
    const parsedExpenses = await ExpenseParser.parseMultipleExpenses(
      messageText
    );

    if (parsedExpenses.length === 0) {
      await this.bot.sendMessage(
        chatId,
        MessageFormatter.formatErrorMessage(
          "Could not parse any expenses from the message. Please check the format."
        ),
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Store all expenses
    const storedExpenses: Expense[] = [];
    for (const parsedExpense of parsedExpenses) {
      const expense: Expense = {
        ...parsedExpense,
        userId,
        messageId: msg.message_id,
        chatId,
        topicId,
      };
      await this.storage.addExpense(expense);
      storedExpenses.push(expense);
    }

    // Send confirmation only if enabled
    if (this.configService.isConfirmationEnabled()) {
      await this.bot.sendMessage(
        chatId,
        MessageFormatter.formatMultipleExpensesAddedMessage(storedExpenses),
        { parse_mode: "Markdown" }
      );
    }
  }

  private async handleConfirmation(
    msg: TelegramBot.Message,
    userId: number,
    response: string
  ): Promise<void> {
    const chatId = msg.chat.id;
    const confirmation = this.pendingConfirmations.get(userId);

    if (!confirmation) return;

    const isConfirmed =
      response.toLowerCase() === "yes" || response.toLowerCase() === "y";

    if (isConfirmed) {
      if (confirmation.action === "clear") {
        await this.executeClear(chatId, confirmation.data);
      }
    } else {
      await this.bot.sendMessage(chatId, "❌ Clear action cancelled.", {
        parse_mode: "Markdown",
      });
    }

    // Remove the pending confirmation
    this.pendingConfirmations.delete(userId);
  }

  private async handleClear(
    msg: TelegramBot.Message,
    match: RegExpExecArray | null
  ): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    if (!userId) return;

    try {
      if (match && match[1]) {
        const dateArgs = match[1].trim().split(/\s+/);

        if (dateArgs.length === 1) {
          // Clear for specific date
          const date = this.parseDateFromCommand(dateArgs[0]);
          if (!date) {
            await this.bot.sendMessage(
              chatId,
              MessageFormatter.formatErrorMessage(
                "Invalid date format. Use YYYY-MM-DD"
              ),
              { parse_mode: "Markdown" }
            );
            return;
          }

          // Ask for confirmation
          this.pendingConfirmations.set(userId, {
            action: "clear",
            data: { date },
          });
          await this.bot.sendMessage(
            chatId,
            MessageFormatter.formatClearConfirmationPrompt(date),
            { parse_mode: "Markdown" }
          );
        } else if (dateArgs.length === 2) {
          // Clear for date range
          const startDate = this.parseDateFromCommand(dateArgs[0]);
          const endDate = this.parseDateFromCommand(dateArgs[1]);

          if (!startDate || !endDate) {
            await this.bot.sendMessage(
              chatId,
              MessageFormatter.formatErrorMessage(
                "Invalid date format. Use YYYY-MM-DD YYYY-MM-DD"
              ),
              { parse_mode: "Markdown" }
            );
            return;
          }

          // Ask for confirmation
          this.pendingConfirmations.set(userId, {
            action: "clear",
            data: { startDate, endDate },
          });
          await this.bot.sendMessage(
            chatId,
            MessageFormatter.formatClearConfirmationPrompt(startDate, endDate),
            { parse_mode: "Markdown" }
          );
        } else {
          await this.bot.sendMessage(
            chatId,
            MessageFormatter.formatErrorMessage(
              "Invalid clear command. Use /clear, /clear YYYY-MM-DD, or /clear YYYY-MM-DD YYYY-MM-DD"
            ),
            { parse_mode: "Markdown" }
          );
        }
      } else {
        // Clear all expenses
        this.pendingConfirmations.set(userId, { action: "clear", data: {} });
        await this.bot.sendMessage(
          chatId,
          MessageFormatter.formatClearConfirmationPrompt(),
          { parse_mode: "Markdown" }
        );
      }
    } catch (error) {
      console.error("Error handling clear command:", error);
      await this.bot.sendMessage(
        chatId,
        MessageFormatter.formatErrorMessage(
          "An error occurred while processing the clear command."
        ),
        { parse_mode: "Markdown" }
      );
    }
  }

  private async executeClear(chatId: number, data: any): Promise<void> {
    try {
      let count = 0;

      if (data.date) {
        count = await this.storage.clearExpensesForDate(data.date);
        await this.bot.sendMessage(
          chatId,
          MessageFormatter.formatClearConfirmation(count, data.date),
          { parse_mode: "Markdown" }
        );
      } else if (data.startDate && data.endDate) {
        count = await this.storage.clearExpensesForDateRange(
          data.startDate,
          data.endDate
        );
        await this.bot.sendMessage(
          chatId,
          MessageFormatter.formatClearConfirmation(
            count,
            data.startDate,
            data.endDate
          ),
          { parse_mode: "Markdown" }
        );
      } else {
        count = await this.storage.getExpenseCount();
        await this.storage.clearAll();
        await this.bot.sendMessage(
          chatId,
          MessageFormatter.formatClearConfirmation(count),
          { parse_mode: "Markdown" }
        );
      }
    } catch (error) {
      console.error("Error executing clear:", error);
      await this.bot.sendMessage(
        chatId,
        MessageFormatter.formatErrorMessage(
          "An error occurred while clearing expenses."
        ),
        { parse_mode: "Markdown" }
      );
    }
  }

  private async handleSettings(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    await this.bot.sendMessage(
      chatId,
      MessageFormatter.formatSettingsMessage(this.configService.getSettings()),
      { parse_mode: "Markdown" }
    );
  }

  private async handleStart(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const welcomeMessage =
      `🎉 *Welcome to Expense Tracker Bot!*\n\n` +
      `I can help you track your daily expenses. ` +
      `Send me expense messages in the specified format or use /help for instructions.\n\n` +
      `💡 *New Features:*\n` +
      `• Use /clear to remove expenses\n` +
      `• Confirmation messages can be disabled\n` +
      `• Support for forum topics\n` +
      `• Category management with templates`;

    await this.bot.sendMessage(chatId, welcomeMessage, {
      parse_mode: "Markdown",
    });
  }

  private async handleHelp(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    await this.bot.sendMessage(chatId, MessageFormatter.formatHelpMessage(), {
      parse_mode: "Markdown",
    });
  }

  private async handleSummary(
    msg: TelegramBot.Message,
    match: RegExpExecArray | null
  ): Promise<void> {
    const chatId = msg.chat.id;

    try {
      let targetDate: Date;

      if (match && match[1]) {
        // Parse specific date from command
        const dateStr = match[1].trim();
        targetDate = this.parseDateFromCommand(dateStr);

        if (!targetDate) {
          await this.bot.sendMessage(
            chatId,
            MessageFormatter.formatErrorMessage(
              "Invalid date format. Use YYYY-MM-DD or leave empty for today."
            ),
            { parse_mode: "Markdown" }
          );
          return;
        }
      } else {
        // Use today's date
        targetDate = new Date();
        targetDate.setHours(0, 0, 0, 0);
      }

      const summary = await this.storage.getDailySummary(targetDate);
      const summaryMessage = MessageFormatter.formatDailySummary(summary);

      await this.bot.sendMessage(chatId, summaryMessage, {
        parse_mode: "Markdown",
      });
    } catch (error) {
      console.error("Error handling summary command:", error);
      await this.bot.sendMessage(
        chatId,
        MessageFormatter.formatErrorMessage(
          "An error occurred while generating the summary."
        ),
        { parse_mode: "Markdown" }
      );
    }
  }

  private async handleStats(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    try {
      const allExpenses = await this.storage.getAllExpenses();

      if (allExpenses.length === 0) {
        await this.bot.sendMessage(
          chatId,
          "📊 *Statistics*\n\nNo expenses recorded yet.",
          { parse_mode: "Markdown" }
        );
        return;
      }

      const totalAmount = allExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
      const uniqueCategories = new Set(allExpenses.map((e) => e.category));

      // Get this month's total
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthTotal = await this.storage.getTotalForDateRange(
        startOfMonth,
        now
      );

      const statsMessage =
        `📊 *Overall Statistics*\n\n` +
        `💰 Total Expenses: $${totalAmount.toFixed(2)}\n` +
        `📂 Total Categories: ${uniqueCategories.size}\n` +
        `📅 This Month: $${thisMonthTotal.toFixed(2)}\n` +
        `📝 Total Entries: ${allExpenses.length}`;

      await this.bot.sendMessage(chatId, statsMessage, {
        parse_mode: "Markdown",
      });
    } catch (error) {
      console.error("Error handling stats command:", error);
      await this.bot.sendMessage(
        chatId,
        MessageFormatter.formatErrorMessage(
          "An error occurred while generating statistics."
        ),
        { parse_mode: "Markdown" }
      );
    }
  }

  private async handleDebug(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    try {
      const allExpenses = await this.storage.getAllExpenses();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const message =
        `🔍 *Debug Information*\n\n` +
        `📊 Total Expenses: ${allExpenses.length}\n` +
        `📅 Today's Date: ${today.toISOString().slice(0, 10)}\n\n` +
        `📝 All Expenses:\n${
          allExpenses.length > 0
            ? allExpenses
                .map(
                  (e, i) =>
                    `${i + 1}. ${e.date.toISOString().slice(0, 10)}: $${
                      e.amount
                    } - ${e.category}`
                )
                .join("\n")
            : "No expenses found"
        }`;

      await this.bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error handling debug command:", error);
      await this.bot.sendMessage(
        chatId,
        MessageFormatter.formatErrorMessage(
          "An error occurred while fetching debug information."
        ),
        { parse_mode: "Markdown" }
      );
    }
  }

  private async handleCategories(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    try {
      const categories = await this.categoryService.getAllCategories();
      const usageStats = await this.categoryService.getCategoryUsageStats();

      if (categories.length === 0) {
        await this.bot.sendMessage(
          chatId,
          "📂 *Categories*\n\nNo categories found. Add some expenses first!",
          { parse_mode: "Markdown" }
        );
        return;
      }

      let message = "📂 *All Categories*\n\n";

      categories.forEach((category) => {
        const stats = usageStats[category.name] || { count: 0, total: 0 };
        const icon = category.icon || "📦";
        const isDefault = category.is_default ? " (default)" : "";
        message += `${icon} **${category.name}**${isDefault}\n`;
        message += `   💰 $${stats.total.toFixed(2)} (${
          stats.count
        } expenses)\n\n`;
      });

      message +=
        "💡 Use `/category <category_name>` to see expenses for a specific category.";

      await this.bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error handling categories command:", error);
      await this.bot.sendMessage(
        chatId,
        MessageFormatter.formatErrorMessage(
          "An error occurred while fetching categories."
        ),
        { parse_mode: "Markdown" }
      );
    }
  }

  private async handleCategoryFilter(
    msg: TelegramBot.Message,
    match: RegExpExecArray | null
  ): Promise<void> {
    const chatId = msg.chat.id;

    try {
      if (!match || !match[1]) {
        await this.bot.sendMessage(
          chatId,
          "❌ *Category Filter*\n\nPlease specify a category name.\n\nExample: `/category food`",
          { parse_mode: "Markdown" }
        );
        return;
      }

      const categoryName = match[1].trim();
      const expenses = await this.storage.getExpensesByCategory(categoryName);

      if (expenses.length === 0) {
        await this.bot.sendMessage(
          chatId,
          `📂 *Category: ${categoryName}*\n\nNo expenses found for this category.`,
          { parse_mode: "Markdown" }
        );
        return;
      }

      const totalAmount = expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

      let message = `📂 *Category: ${categoryName}*\n\n`;
      message += `💰 Total: $${totalAmount.toFixed(2)}\n`;
      message += `📝 Count: ${expenses.length} expenses\n\n`;
      message += `*Expenses:*\n`;

      expenses.forEach((expense, index) => {
        const dateStr = expense.date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        message += `${index + 1}. $${expense.amount.toFixed(2)} - ${
          expense.description
        } (${dateStr})\n`;
      });

      await this.bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error handling category filter command:", error);
      await this.bot.sendMessage(
        chatId,
        MessageFormatter.formatErrorMessage(
          "An error occurred while filtering by category."
        ),
        { parse_mode: "Markdown" }
      );
    }
  }

  private async handleAddCategory(
    msg: TelegramBot.Message,
    match: RegExpExecArray | null
  ): Promise<void> {
    const chatId = msg.chat.id;

    try {
      if (!match || !match[1]) {
        await this.bot.sendMessage(
          chatId,
          "❌ *Add Category*\n\nPlease specify a category name.\n\nExample: `/addcategory Gaming`",
          { parse_mode: "Markdown" }
        );
        return;
      }

      const categoryName = match[1].trim();

      // Check if category already exists
      const existing = await this.categoryService.getCategoryByName(
        categoryName
      );
      if (existing) {
        await this.bot.sendMessage(
          chatId,
          `❌ *Category Already Exists*\n\nCategory "${categoryName}" already exists.`,
          { parse_mode: "Markdown" }
        );
        return;
      }

      // Create new category
      const newCategory = await this.categoryService.createCategory(
        categoryName
      );

      await this.bot.sendMessage(
        chatId,
        `✅ *Category Created*\n\n📂 **${newCategory.name}**\n${newCategory.icon} Icon: ${newCategory.icon}\n🎨 Color: ${newCategory.color}`,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Error handling add category command:", error);
      await this.bot.sendMessage(
        chatId,
        MessageFormatter.formatErrorMessage(
          "An error occurred while creating the category."
        ),
        { parse_mode: "Markdown" }
      );
    }
  }

  private async handleCategorySuggestions(
    msg: TelegramBot.Message,
    match: RegExpExecArray | null
  ): Promise<void> {
    const chatId = msg.chat.id;

    try {
      if (!match || !match[1]) {
        await this.bot.sendMessage(
          chatId,
          "❌ *Category Suggestions*\n\nPlease specify a search term.\n\nExample: `/suggest food`",
          { parse_mode: "Markdown" }
        );
        return;
      }

      const searchTerm = match[1].trim();
      const suggestions = await ExpenseParser.getCategorySuggestions(
        searchTerm
      );

      if (suggestions.length === 0) {
        await this.bot.sendMessage(
          chatId,
          `🔍 *Category Suggestions*\n\nNo categories found matching "${searchTerm}".\n\n💡 Try a different search term or use /addcategory to create a new one.`,
          { parse_mode: "Markdown" }
        );
        return;
      }

      let message = `🔍 *Category Suggestions for "${searchTerm}"*\n\n`;
      suggestions.forEach((category, index) => {
        message += `${index + 1}. ${category}\n`;
      });

      message += "\n💡 Use one of these categories in your expense message.";

      await this.bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error handling category suggestions command:", error);
      await this.bot.sendMessage(
        chatId,
        MessageFormatter.formatErrorMessage(
          "An error occurred while searching for categories."
        ),
        { parse_mode: "Markdown" }
      );
    }
  }

  private parseDateFromCommand(dateStr: string): Date | null {
    try {
      // Expected format: YYYY-MM-DD
      const [year, month, day] = dateStr.split("-").map(Number);

      if (!year || !month || !day) return null;

      const date = new Date(year, month - 1, day); // month is 0-indexed

      // Validate the date
      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        return null;
      }

      return date;
    } catch (error) {
      return null;
    }
  }
}
