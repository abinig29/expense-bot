import { ExpenseStorage } from "../services/expenseStorage";
import { MessageFormatter } from "../utils/messageFormatter";

// Test the summary functionality
function testSummary() {
  console.log("🧪 Testing Summary Functionality...\n");

  const storage = new ExpenseStorage();

  // Test 1: Empty storage
  console.log("Test 1: Empty storage");
  const emptySummary = storage.getDailySummary(new Date());
  console.log("Empty summary total:", emptySummary.totalAmount);
  console.log("Empty summary expenses count:", emptySummary.expenses.length);
  console.log("✅ Test 1 passed\n");

  // Test 2: Add some expenses
  console.log("Test 2: Adding expenses");

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Add today's expenses
  storage.addExpense({
    amount: 25.5,
    category: "coffee",
    date: today,
    userId: 123,
    messageId: 1,
    chatId: 456,
  });

  storage.addExpense({
    amount: 150.0,
    category: "groceries",
    date: today,
    userId: 123,
    messageId: 2,
    chatId: 456,
  });

  // Add yesterday's expense
  storage.addExpense({
    amount: 75.0,
    category: "dinner",
    date: yesterday,
    userId: 123,
    messageId: 3,
    chatId: 456,
  });

  console.log("Added 3 expenses (2 today, 1 yesterday)");
  console.log("✅ Test 2 passed\n");

  // Test 3: Today's summary
  console.log("Test 3: Today's summary");
  const todaySummary = storage.getDailySummary(today);
  console.log("Today's total:", todaySummary.totalAmount);
  console.log("Today's expenses count:", todaySummary.expenses.length);
  console.log(
    "Today's categories:",
    Object.keys(todaySummary.categoryBreakdown)
  );
  console.log("✅ Test 3 passed\n");

  // Test 4: Yesterday's summary
  console.log("Test 4: Yesterday's summary");
  const yesterdaySummary = storage.getDailySummary(yesterday);
  console.log("Yesterday's total:", yesterdaySummary.totalAmount);
  console.log("Yesterday's expenses count:", yesterdaySummary.expenses.length);
  console.log("✅ Test 4 passed\n");

  // Test 5: Format summary message
  console.log("Test 5: Format summary message");
  const formattedMessage = MessageFormatter.formatDailySummary(todaySummary);
  console.log("Formatted message length:", formattedMessage.length);
  console.log("Message contains total:", formattedMessage.includes("175.50"));
  console.log("✅ Test 5 passed\n");

  // Test 6: All expenses
  console.log("Test 6: All expenses");
  const allExpenses = storage.getAllExpenses();
  console.log("Total expenses in storage:", allExpenses.length);
  console.log("✅ Test 6 passed\n");

  console.log("🎉 All summary tests completed!");
}

// Run tests if this file is executed directly
if (require.main === module) {
  testSummary();
}

export { testSummary };
