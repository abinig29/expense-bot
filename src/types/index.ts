export interface Expense {
  amount: number;
  category: string;
  date: Date;
  userId: number;
  messageId: number;
  chatId: number;
  topicId?: number; // For forum topics
}

export interface DailySummary {
  date: Date;
  totalAmount: number;
  expenses: Expense[];
  categoryBreakdown: Record<string, number>;
}

export interface ParsedExpense {
  amount: number;
  category: string;
  date: Date;
}

export interface BotConfig {
  token: string;
  debug: boolean;
  sendConfirmations: boolean;
  allowedChatIds: number[];
  allowedTopicIds?: number[];
}

export interface BotSettings {
  sendConfirmations: boolean;
  allowedChatIds: number[];
  allowedTopicIds: number[];
}
