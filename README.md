# Telegram Expense Tracker Bot

A TypeScript Telegram bot that helps you track daily expenses and provides summaries. The bot can parse expense messages in a specific format and generate daily summaries with category breakdowns.

## Features

- 📝 **Expense Parsing**: Automatically detects and parses expense messages
- 📊 **Daily Summaries**: Get detailed breakdowns of daily expenses
- 📂 **Category Tracking**: Organize expenses by categories
- 📈 **Statistics**: View overall spending statistics
- 🤖 **Easy Commands**: Simple commands for quick access to information

## Message Format

The bot expects expense messages in this exact format:

```
amount:300
category: hair remover
Date:02 aug
```

**Notes:**
- Date format: `DD MMM` (e.g., "02 aug", "15 dec")
- If no year is specified, current year is assumed
- Categories are case-sensitive
- Amount should be a positive number

## Commands

- `/start` - Welcome message and introduction
- `/help` - Show help and usage instructions
- `/summary` - Get today's expense summary
- `/summary YYYY-MM-DD` - Get summary for specific date
- `/clear` - Clear all expenses (with confirmation)
- `/clear YYYY-MM-DD` - Clear expenses for specific date
- `/clear YYYY-MM-DD YYYY-MM-DD` - Clear expenses for date range
- `/stats` - Show overall statistics
- `/settings` - Show current bot settings

## Setup Instructions

### 1. Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the bot token (you'll need this later)

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and add your bot token:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   DEBUG=false
   
   # Bot Settings
   SEND_CONFIRMATIONS=true
   ALLOWED_CHAT_IDS=
   ALLOWED_TOPIC_IDS=
   ```

### 4. Build and Run

```bash
# Build the TypeScript code
npm run build

# Start the bot
npm start
```

### 5. Development Mode

For development with auto-reload:

```bash
npm run dev
```

## Usage Examples

### Adding Expenses

Send these messages to your bot:

```
amount:25.50
category: coffee
Date:15 dec
```

```
amount:150
category: groceries
Date:16 dec
```

### Getting Summaries

- `/summary` - Get today's summary
- `/summary 2024-12-15` - Get summary for December 15, 2024

### Example Summary Output

```
📊 Daily Expense Summary
📅 Date: Monday, December 16, 2024
💰 Total: $175.50

📋 Category Breakdown:
• groceries: $150.00 (85.5%)
• coffee: $25.50 (14.5%)

📝 All Expenses:
1. $150.00 - groceries (14:30)
2. $25.50 - coffee (09:15)
```

## Project Structure

```
src/
├── types/
│   └── index.ts          # TypeScript interfaces
├── utils/
│   ├── expenseParser.ts  # Message parsing logic
│   └── messageFormatter.ts # Message formatting
├── services/
│   └── expenseStorage.ts # Data storage and retrieval
├── handlers/
│   └── botHandler.ts     # Main bot logic
└── index.ts              # Application entry point
```

## Technical Details

- **Language**: TypeScript
- **Framework**: node-telegram-bot-api
- **Storage**: In-memory (can be extended to database)
- **Date Parsing**: Supports various date formats
- **Error Handling**: Comprehensive error handling and user feedback
- **Forum Topics**: Support for Telegram forum topics
- **Configurable**: Settings via environment variables

## New Features

### Clear Commands
- **`/clear`** - Clear all expenses with confirmation
- **`/clear YYYY-MM-DD`** - Clear expenses for a specific date
- **`/clear YYYY-MM-DD YYYY-MM-DD`** - Clear expenses for a date range

All clear operations require confirmation by typing "yes" to prevent accidental deletions.

### Optional Confirmations
- Set `SEND_CONFIRMATIONS=false` in your `.env` file to disable confirmation messages
- When disabled, the bot will silently add expenses without sending confirmation messages

### Forum Topic Support
- The bot automatically detects and stores the topic ID for forum messages
- Use `ALLOWED_TOPIC_IDS=1,2,3` to restrict the bot to specific topics
- Leave empty to allow all topics

### Chat Restrictions
- Use `ALLOWED_CHAT_IDS=123456789,987654321` to restrict the bot to specific chats
- Leave empty to allow all chats

## Extending the Bot

### Adding Database Storage

The current implementation uses in-memory storage. To add persistent storage:

1. Create a new storage service (e.g., `DatabaseStorage`)
2. Implement the same interface as `ExpenseStorage`
3. Update the bot handler to use the new storage

### Adding New Commands

1. Add command handler in `botHandler.ts`
2. Add corresponding method to handle the command
3. Update help message in `messageFormatter.ts`

### Adding New Message Formats

1. Extend the `ExpenseParser` class
2. Add new parsing methods
3. Update the `isExpenseMessage` method

## Troubleshooting

### Bot Not Responding
- Check if the bot token is correct
- Ensure the bot is added to your group
- Check console logs for errors

### Message Not Parsed
- Verify the message format is exactly as specified
- Check that all required fields are present
- Ensure date format is correct

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript version compatibility
- Verify `tsconfig.json` settings

## License

MIT License - feel free to use and modify as needed. 