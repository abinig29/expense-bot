import { DatabaseService } from "./databaseService";
import { CategoryService } from "./categoryService";
import { Expense, DailySummary } from "../types";

export class PostgresStorage {
  private dbService: DatabaseService;
  private categoryService: CategoryService;

  constructor() {
    this.dbService = DatabaseService.getInstance();
    this.categoryService = CategoryService.getInstance();
  }

  /**
   * Initialize the database tables
   */
  async initialize(): Promise<void> {
    await this.dbService.initializeTables();
  }

  /**
   * Add a new expense to storage
   */
  async addExpense(expense: Expense): Promise<void> {
    // Find or create the category
    const category = await this.categoryService.findOrCreateCategory(
      expense.category
    );

    const query = `
      INSERT INTO expenses (amount, category_id, category_name, description, date, user_id, message_id, chat_id, topic_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    await this.dbService.query(query, [
      expense.amount,
      category.id,
      expense.category,
      expense.description,
      expense.date,
      expense.userId,
      expense.messageId,
      expense.chatId,
      expense.topicId || null,
    ]);
  }

  /**
   * Get all expenses for a specific date
   */
  async getExpensesByDate(date: Date): Promise<Expense[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query = `
      SELECT amount, category_id, category_name, description, date, user_id, message_id, chat_id, topic_id
      FROM expenses
      WHERE date >= $1 AND date <= $2
      ORDER BY date ASC
    `;

    const result = await this.dbService.query(query, [startOfDay, endOfDay]);

    return result.rows.map((row) => ({
      amount: parseFloat(row.amount),
      category: row.category_name,
      description: row.description,
      date: new Date(row.date),
      userId: parseInt(row.user_id),
      messageId: parseInt(row.message_id),
      chatId: parseInt(row.chat_id),
      topicId: row.topic_id ? parseInt(row.topic_id) : undefined,
      categoryId: row.category_id ? parseInt(row.category_id) : undefined,
    }));
  }

  /**
   * Get daily summary for a specific date
   */
  async getDailySummary(date: Date): Promise<DailySummary> {
    const expenses = await this.getExpensesByDate(date);
    const totalAmount = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const categoryBreakdown: Record<string, number> = {};
    expenses.forEach((expense) => {
      categoryBreakdown[expense.category] =
        (categoryBreakdown[expense.category] || 0) + expense.amount;
    });

    return {
      date,
      totalAmount,
      expenses,
      categoryBreakdown,
    };
  }

  /**
   * Clear all expenses
   */
  async clearAll(): Promise<void> {
    await this.dbService.query("DELETE FROM expenses");
  }

  /**
   * Clear expenses for a specific date
   */
  async clearExpensesForDate(date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query = `
      DELETE FROM expenses
      WHERE date >= $1 AND date <= $2
    `;

    const result = await this.dbService.query(query, [startOfDay, endOfDay]);
    return result.rowCount;
  }

  /**
   * Clear expenses for a specific date range
   */
  async clearExpensesForDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const query = `
      DELETE FROM expenses
      WHERE date >= $1 AND date <= $2
    `;

    const result = await this.dbService.query(query, [startDate, endDate]);
    return result.rowCount;
  }

  /**
   * Get total count of stored expenses
   */
  async getExpenseCount(): Promise<number> {
    const result = await this.dbService.query(
      "SELECT COUNT(*) as count FROM expenses"
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Get all expenses (for debugging/testing)
   */
  async getAllExpenses(): Promise<Expense[]> {
    const query = `
      SELECT amount, category_id, category_name, description, date, user_id, message_id, chat_id, topic_id
      FROM expenses
      ORDER BY date DESC
    `;

    const result = await this.dbService.query(query);

    return result.rows.map((row) => ({
      amount: parseFloat(row.amount),
      category: row.category_name,
      description: row.description,
      date: new Date(row.date),
      userId: parseInt(row.user_id),
      messageId: parseInt(row.message_id),
      chatId: parseInt(row.chat_id),
      topicId: row.topic_id ? parseInt(row.topic_id) : undefined,
      categoryId: row.category_id ? parseInt(row.category_id) : undefined,
    }));
  }

  /**
   * Get expenses for a date range
   */
  async getExpensesByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Expense[]> {
    const query = `
      SELECT amount, category_id, category_name, description, date, user_id, message_id, chat_id, topic_id
      FROM expenses
      WHERE date >= $1 AND date <= $2
      ORDER BY date ASC
    `;

    const result = await this.dbService.query(query, [startDate, endDate]);

    return result.rows.map((row) => ({
      amount: parseFloat(row.amount),
      category: row.category_name,
      description: row.description,
      date: new Date(row.date),
      userId: parseInt(row.user_id),
      messageId: parseInt(row.message_id),
      chatId: parseInt(row.chat_id),
      topicId: row.topic_id ? parseInt(row.topic_id) : undefined,
      categoryId: row.category_id ? parseInt(row.category_id) : undefined,
    }));
  }

  /**
   * Get total expenses for a date range
   */
  async getTotalForDateRange(startDate: Date, endDate: Date): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date >= $1 AND date <= $2
    `;

    const result = await this.dbService.query(query, [startDate, endDate]);
    return parseFloat(result.rows[0].total);
  }

  /**
   * Get expenses for a specific topic
   */
  async getExpensesByTopic(topicId: number): Promise<Expense[]> {
    const query = `
      SELECT amount, category_id, category_name, description, date, user_id, message_id, chat_id, topic_id
      FROM expenses
      WHERE topic_id = $1
      ORDER BY date DESC
    `;

    const result = await this.dbService.query(query, [topicId]);

    return result.rows.map((row) => ({
      amount: parseFloat(row.amount),
      category: row.category_name,
      description: row.description,
      date: new Date(row.date),
      userId: parseInt(row.user_id),
      messageId: parseInt(row.message_id),
      chatId: parseInt(row.chat_id),
      topicId: row.topic_id ? parseInt(row.topic_id) : undefined,
      categoryId: row.category_id ? parseInt(row.category_id) : undefined,
    }));
  }

  /**
   * Get expenses for a specific chat
   */
  async getExpensesByChat(chatId: number): Promise<Expense[]> {
    const query = `
      SELECT amount, category_id, category_name, description, date, user_id, message_id, chat_id, topic_id
      FROM expenses
      WHERE chat_id = $1
      ORDER BY date DESC
    `;

    const result = await this.dbService.query(query, [chatId]);

    return result.rows.map((row) => ({
      amount: parseFloat(row.amount),
      category: row.category_name,
      description: row.description,
      date: new Date(row.date),
      userId: parseInt(row.user_id),
      messageId: parseInt(row.message_id),
      chatId: parseInt(row.chat_id),
      topicId: row.topic_id ? parseInt(row.topic_id) : undefined,
      categoryId: row.category_id ? parseInt(row.category_id) : undefined,
    }));
  }

  /**
   * Get expenses by category
   */
  async getExpensesByCategory(categoryName: string): Promise<Expense[]> {
    const query = `
      SELECT amount, category_id, category_name, description, date, user_id, message_id, chat_id, topic_id
      FROM expenses
      WHERE LOWER(category_name) = LOWER($1)
      ORDER BY date DESC
    `;

    const result = await this.dbService.query(query, [categoryName]);

    return result.rows.map((row) => ({
      amount: parseFloat(row.amount),
      category: row.category_name,
      description: row.description,
      date: new Date(row.date),
      userId: parseInt(row.user_id),
      messageId: parseInt(row.message_id),
      chatId: parseInt(row.chat_id),
      topicId: row.topic_id ? parseInt(row.topic_id) : undefined,
      categoryId: row.category_id ? parseInt(row.category_id) : undefined,
    }));
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<string[]> {
    const query = `
      SELECT DISTINCT category_name
      FROM expenses
      ORDER BY category_name ASC
    `;

    const result = await this.dbService.query(query);
    return result.rows.map((row) => row.category_name);
  }

  /**
   * Get category summary (total amount per category)
   */
  async getCategorySummary(): Promise<Record<string, number>> {
    const query = `
      SELECT category_name, SUM(amount) as total
      FROM expenses
      GROUP BY category_name
      ORDER BY total DESC
    `;

    const result = await this.dbService.query(query);
    const summary: Record<string, number> = {};

    result.rows.forEach((row) => {
      summary[row.category_name] = parseFloat(row.total);
    });

    return summary;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.dbService.close();
  }
}
