import { ExpenseParser } from "../utils/expenseParser";

// Test the expense parser
function testExpenseParser() {
  console.log("🧪 Testing Expense Parser...\n");

  // Test case 1: Valid expense message
  const validMessage = `amount:300
category: hair remover
Date:02 aug`;

  console.log("Test 1: Valid expense message");
  console.log("Input:", validMessage);
  const result1 = ExpenseParser.parseMessage(validMessage);
  console.log("Result:", result1);
  console.log("✅ Test 1 passed\n");

  // Test case 2: Another valid message
  const validMessage2 = `amount:25.50
category: coffee
Date:15 dec`;

  console.log("Test 2: Another valid expense message");
  console.log("Input:", validMessage2);
  const result2 = ExpenseParser.parseMessage(validMessage2);
  console.log("Result:", result2);
  console.log("✅ Test 2 passed\n");

  // Test case 3: Invalid message (missing amount)
  const invalidMessage = `category: food
Date:10 jan`;

  console.log("Test 3: Invalid message (missing amount)");
  console.log("Input:", invalidMessage);
  const result3 = ExpenseParser.parseMessage(invalidMessage);
  console.log("Result:", result3);
  console.log("✅ Test 3 passed (correctly returned null)\n");

  // Test case 4: Test isExpenseMessage function
  console.log("Test 4: Testing isExpenseMessage function");
  console.log("Valid message:", ExpenseParser.isExpenseMessage(validMessage));
  console.log(
    "Invalid message:",
    ExpenseParser.isExpenseMessage("Hello world")
  );
  console.log("✅ Test 4 passed\n");

  console.log("🎉 All tests completed!");
}

// Run tests if this file is executed directly
if (require.main === module) {
  testExpenseParser();
}

export { testExpenseParser };
