import { ParsedExpense } from "../types";

export class ExpenseParser {
  /**
   * Parse expense message in the format:
   * amount:300
   * category: hair remover
   * Date:02 aug
   */
  static parseMessage(message: string): ParsedExpense | null {
    try {
      const lines = message
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      let amount: number | null = null;
      let category: string | null = null;
      let date: Date | null = null;

      for (const line of lines) {
        const lowerLine = line.toLowerCase();

        // Parse amount
        if (lowerLine.startsWith("amount:")) {
          const amountStr = line.substring(7).trim();
          const parsedAmount = parseFloat(amountStr);
          if (!isNaN(parsedAmount) && parsedAmount > 0) {
            amount = parsedAmount;
          }
        }

        // Parse category
        if (lowerLine.startsWith("category:")) {
          const categoryStr = line.substring(9).trim();
          if (categoryStr.length > 0) {
            category = categoryStr;
          }
        }

        // Parse date
        if (lowerLine.startsWith("date:")) {
          const dateStr = line.substring(5).trim();
          const parsedDate = this.parseDate(dateStr);
          if (parsedDate) {
            date = parsedDate;
          }
        }
      }

      // Validate that we have all required fields
      if (amount !== null && category !== null && date !== null) {
        return {
          amount,
          category,
          date,
        };
      }

      return null;
    } catch (error) {
      console.error("Error parsing expense message:", error);
      return null;
    }
  }

  /**
   * Parse multiple expenses from a single message
   * Each expense block should be separated by blank lines
   */
  static parseMultipleExpenses(message: string): ParsedExpense[] {
    try {
      const expenses: ParsedExpense[] = [];

      // Split message into blocks (separated by blank lines)
      const blocks = message
        .split(/\n\s*\n/)
        .filter((block) => block.trim().length > 0);

      for (const block of blocks) {
        const expense = this.parseMessage(block);
        if (expense) {
          expenses.push(expense);
        }
      }

      return expenses;
    } catch (error) {
      console.error("Error parsing multiple expenses:", error);
      return [];
    }
  }

  /**
   * Check if a message contains multiple expenses
   */
  static hasMultipleExpenses(message: string): boolean {
    const blocks = message
      .split(/\n\s*\n/)
      .filter((block) => block.trim().length > 0);
    return blocks.length > 1;
  }

  /**
   * Parse date string in format like "02 aug", "15 dec", etc.
   * Returns current year if year is not specified
   */
  private static parseDate(dateStr: string): Date | null {
    try {
      const months: Record<string, number> = {
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11,
      };

      const parts = dateStr.toLowerCase().trim().split(/\s+/);
      if (parts.length < 2) return null;

      const day = parseInt(parts[0]);
      const monthStr = parts[1];
      const month = months[monthStr];

      if (isNaN(day) || month === undefined || day < 1 || day > 31) {
        return null;
      }

      const currentYear = new Date().getFullYear();
      const date = new Date(currentYear, month, day);

      // If the parsed date is in the future, assume it's from last year
      if (date > new Date()) {
        date.setFullYear(currentYear - 1);
      }

      return date;
    } catch (error) {
      console.error("Error parsing date:", error);
      return null;
    }
  }

  /**
   * Check if a message looks like an expense message
   */
  static isExpenseMessage(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return (
      lowerMessage.includes("amount:") &&
      lowerMessage.includes("category:") &&
      lowerMessage.includes("date:")
    );
  }
}
