# Usage Guide - New Features

## Clear Commands

### Clear All Expenses
```
/clear
```
The bot will ask for confirmation. Reply with "yes" to proceed.

### Clear Specific Date
```
/clear 2024-12-15
```
Clears all expenses for December 15, 2024.

### Clear Date Range
```
/clear 2024-12-01 2024-12-31
```
Clears all expenses from December 1 to December 31, 2024.

## Disable Confirmation Messages

To stop the bot from sending confirmation messages when you add expenses:

1. Edit your `.env` file
2. Add or change this line:
   ```
   SEND_CONFIRMATIONS=false
   ```
3. Restart the bot

Now when you send expense messages, the bot will silently add them without confirmation.

## Forum Topic Support

### Automatic Topic Detection
The bot automatically detects if a message is in a forum topic and stores the topic ID.

### Restrict to Specific Topics
To make the bot only work in specific topics:

1. Get the topic ID (you can ask the bot admin or check the message details)
2. Edit your `.env` file:
   ```
   ALLOWED_TOPIC_IDS=1,2,3
   ```
3. Restart the bot

### Example Topic Usage
- Send expense messages in any topic
- Use `/summary` to get daily summary
- Use `/clear` to clear expenses
- All commands work within topics

## Chat Restrictions

### Restrict to Specific Chats
To make the bot only work in specific groups/chats:

1. Get the chat ID (you can ask the bot admin)
2. Edit your `.env` file:
   ```
   ALLOWED_CHAT_IDS=123456789,987654321
   ```
3. Restart the bot

## Settings Command

Use `/settings` to see current bot configuration:
- Whether confirmations are enabled
- Which chats are allowed
- Which topics are allowed

## Example Workflow

### Daily Usage
1. Send expense messages in your group/topic
2. Use `/summary` to check daily total
3. Use `/clear 2024-12-15` to clear yesterday's expenses
4. Start fresh for the new day

### Weekly Usage
1. Track expenses throughout the week
2. Use `/summary 2024-12-16` to check specific day
3. Use `/stats` to see overall statistics
4. Use `/clear 2024-12-16 2024-12-22` to clear the week

## Environment Variables Reference

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `SEND_CONFIRMATIONS` | Enable/disable confirmation messages | `true` | `false` |
| `ALLOWED_CHAT_IDS` | Restrict to specific chat IDs | `(empty)` | `123456789,987654321` |
| `ALLOWED_TOPIC_IDS` | Restrict to specific topic IDs | `(empty)` | `1,2,3` |

## Tips

1. **Use clear commands carefully** - They require confirmation but are irreversible
2. **Disable confirmations** for less chat spam in busy groups
3. **Use topic restrictions** to keep expenses organized by category
4. **Use chat restrictions** for security in multi-group setups
5. **Check settings** with `/settings` to verify your configuration 