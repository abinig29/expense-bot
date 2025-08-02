import { Expense, DailySummary } from "../types";

export class ExpenseStorage {
  private expenses: Expense[] = [];

  /**
   * Add a new expense to storage
   */
  addExpense(expense: Expense): void {
    this.expenses.push(expense);
  }

  /**
   * Get all expenses for a specific date
   */
  getExpensesByDate(date: Date): Expense[] {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.expenses.filter(
      (expense) => expense.date >= startOfDay && expense.date <= endOfDay
    );
  }

  /**
   * Get daily summary for a specific date
   */
  getDailySummary(date: Date): DailySummary {
    const expenses = this.getExpensesByDate(date);
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
  clearAll(): void {
    this.expenses = [];
  }

  /**
   * Clear expenses for a specific date
   */
  clearExpensesForDate(date: Date): number {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const initialCount = this.expenses.length;

    this.expenses = this.expenses.filter(
      (expense) => !(expense.date >= startOfDay && expense.date <= endOfDay)
    );

    return initialCount - this.expenses.length;
  }

  /**
   * Clear expenses for a specific date range
   */
  clearExpensesForDateRange(startDate: Date, endDate: Date): number {
    const initialCount = this.expenses.length;

    this.expenses = this.expenses.filter(
      (expense) => !(expense.date >= startDate && expense.date <= endDate)
    );

    return initialCount - this.expenses.length;
  }

  /**
   * Get total count of stored expenses
   */
  getExpenseCount(): number {
    return this.expenses.length;
  }

  /**
   * Get all expenses (for debugging/testing)
   */
  getAllExpenses(): Expense[] {
    return [...this.expenses];
  }

  /**
   * Get expenses for a date range
   */
  getExpensesByDateRange(startDate: Date, endDate: Date): Expense[] {
    return this.expenses.filter(
      (expense) => expense.date >= startDate && expense.date <= endDate
    );
  }

  /**
   * Get total expenses for a date range
   */
  getTotalForDateRange(startDate: Date, endDate: Date): number {
    const expenses = this.getExpensesByDateRange(startDate, endDate);
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  /**
   * Get expenses for a specific topic
   */
  getExpensesByTopic(topicId: number): Expense[] {
    return this.expenses.filter((expense) => expense.topicId === topicId);
  }

  /**
   * Get expenses for a specific chat
   */
  getExpensesByChat(chatId: number): Expense[] {
    return this.expenses.filter((expense) => expense.chatId === chatId);
  }
}
