import { DailySummary, Expense } from "../types";

export class MessageFormatter {
  /**
   * Format daily summary into a readable message
   */
  static formatDailySummary(summary: DailySummary): string {
    const dateStr = summary.date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let message = `📊 *Daily Expense Summary*\n`;
    message += `📅 *Date:* ${dateStr}\n`;
    message += `💰 *Total:* $${summary.totalAmount.toFixed(2)}\n\n`;

    if (summary.expenses.length === 0) {
      message += `No expenses recorded for this day.`;
      return message;
    }

    message += `📋 *Category Breakdown:*\n`;

    // Sort categories by amount (highest first)
    const sortedCategories = Object.entries(summary.categoryBreakdown).sort(
      ([, a], [, b]) => b - a
    );

    sortedCategories.forEach(([category, amount]) => {
      const percentage = ((amount / summary.totalAmount) * 100).toFixed(1);
      message += `• ${category}: $${amount.toFixed(2)} (${percentage}%)\n`;
    });

    message += `\n📝 *All Expenses:*\n`;
    summary.expenses.forEach((expense, index) => {
      const timeStr = expense.date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      message += `${index + 1}. $${expense.amount.toFixed(2)} - ${
        expense.category
      } (${timeStr})\n`;
    });

    return message;
  }

  /**
   * Format a single expense for display
   */
  static formatExpense(expense: Expense): string {
    const dateStr = expense.date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      `💰 *New Expense Added*\n` +
      `Amount: $${expense.amount.toFixed(2)}\n` +
      `Category: ${expense.category}\n` +
      `Date: ${dateStr}`
    );
  }

  /**
   * Format help message
   */
  static formatHelpMessage(): string {
    return (
      `🤖 *Expense Tracker Bot Help*\n\n` +
      `*How to add expenses:*\n` +
      `Send a message in this format:\n` +
      `\`\`\`\n` +
      `amount:300\n` +
      `category: hair remover\n` +
      `Date:02 aug\n` +
      `\`\`\`\n\n` +
      `*Available commands:*\n` +
      `• /summary - Get today's expense summary\n` +
      `• /summary YYYY-MM-DD - Get summary for specific date\n` +
      `• /clear - Clear all expenses\n` +
      `• /clear YYYY-MM-DD - Clear expenses for specific date\n` +
      `• /clear YYYY-MM-DD YYYY-MM-DD - Clear expenses for date range\n` +
      `• /help - Show this help message\n` +
      `• /stats - Show overall statistics\n` +
      `• /settings - Show current bot settings\n\n` +
      `*Notes:*\n` +
      `• Date format: DD MMM (e.g., "02 aug", "15 dec")\n` +
      `• If no year is specified, current year is assumed\n` +
      `• Categories are case-sensitive\n` +
      `• Use /clear carefully - this action cannot be undone`
    );
  }

  /**
   * Format error message
   */
  static formatErrorMessage(error: string): string {
    return `❌ *Error*\n${error}\n\nUse /help for instructions.`;
  }

  /**
   * Format success message for expense addition
   */
  static formatExpenseAddedMessage(expense: Expense): string {
    return (
      `✅ *Expense Added Successfully!*\n\n` +
      `💰 Amount: $${expense.amount.toFixed(2)}\n` +
      `📂 Category: ${expense.category}\n` +
      `📅 Date: ${expense.date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}\n\n` +
      `Use /summary to see today's total.`
    );
  }

  /**
   * Format success message for multiple expenses addition
   */
  static formatMultipleExpensesAddedMessage(expenses: Expense[]): string {
    const totalAmount = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const dateStr =
      expenses[0]?.date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) || "Unknown date";

    let message =
      `✅ *Multiple Expenses Added Successfully!*\n\n` +
      `📊 Total Amount: $${totalAmount.toFixed(2)}\n` +
      `📅 Date: ${dateStr}\n` +
      `📝 Number of Expenses: ${expenses.length}\n\n` +
      `📋 *Expenses Added:*\n`;

    expenses.forEach((expense, index) => {
      message += `${index + 1}. $${expense.amount.toFixed(2)} - ${
        expense.category
      }\n`;
    });

    message += `\nUse /summary to see today's total.`;
    return message;
  }

  /**
   * Format clear confirmation message
   */
  static formatClearConfirmation(
    count: number,
    date?: Date,
    endDate?: Date
  ): string {
    if (date && endDate) {
      const startStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const endStr = endDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return (
        `🗑️ *Cleared ${count} expenses*\n\n` +
        `📅 Date range: ${startStr} to ${endStr}\n` +
        `✅ All expenses in this range have been removed.`
      );
    } else if (date) {
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return (
        `🗑️ *Cleared ${count} expenses*\n\n` +
        `📅 Date: ${dateStr}\n` +
        `✅ All expenses for this date have been removed.`
      );
    } else {
      return (
        `🗑️ *Cleared all expenses*\n\n` +
        `📊 Total removed: ${count} expenses\n` +
        `✅ All stored expenses have been cleared.`
      );
    }
  }

  /**
   * Format settings message
   */
  static formatSettingsMessage(settings: {
    sendConfirmations: boolean;
    allowedChatIds: number[];
    allowedTopicIds: number[];
  }): string {
    return (
      `⚙️ *Bot Settings*\n\n` +
      `📨 Confirmations: ${
        settings.sendConfirmations ? "✅ Enabled" : "❌ Disabled"
      }\n` +
      `💬 Allowed chats: ${
        settings.allowedChatIds.length > 0
          ? settings.allowedChatIds.join(", ")
          : "All chats"
      }\n` +
      `📋 Allowed topics: ${
        settings.allowedTopicIds.length > 0
          ? settings.allowedTopicIds.join(", ")
          : "All topics"
      }\n\n` +
      `💡 Use /help for available commands.`
    );
  }

  /**
   * Format confirmation message for clear command
   */
  static formatClearConfirmationPrompt(date?: Date, endDate?: Date): string {
    if (date && endDate) {
      const startStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const endStr = endDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return (
        `⚠️ *Confirm Clear Action*\n\n` +
        `Are you sure you want to clear all expenses from ${startStr} to ${endStr}?\n\n` +
        `This action cannot be undone!\n\n` +
        `Reply with "yes" to confirm or "no" to cancel.`
      );
    } else if (date) {
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return (
        `⚠️ *Confirm Clear Action*\n\n` +
        `Are you sure you want to clear all expenses for ${dateStr}?\n\n` +
        `This action cannot be undone!\n\n` +
        `Reply with "yes" to confirm or "no" to cancel.`
      );
    } else {
      return (
        `⚠️ *Confirm Clear Action*\n\n` +
        `Are you sure you want to clear ALL expenses?\n\n` +
        `This action cannot be undone!\n\n` +
        `Reply with "yes" to confirm or "no" to cancel.`
      );
    }
  }
}
