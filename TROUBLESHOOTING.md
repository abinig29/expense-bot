# Troubleshooting Guide

## Connection Issues

### ETIMEDOUT Error
If you see `ETIMEDOUT` errors, this means the bot can't connect to Telegram's servers.

**Common Causes:**
1. **Firewall blocking the connection**
2. **Network connectivity issues**
3. **VPN or proxy interference**
4. **Corporate network restrictions**

**Solutions:**
1. **Check your internet connection**
   ```bash
   ping api.telegram.org
   ```

2. **Disable VPN/Proxy temporarily**
   - Turn off any VPN services
   - Disable proxy settings
   - Try connecting from a different network

3. **Check Windows Firewall**
   - Open Windows Defender Firewall
   - Allow Node.js through the firewall
   - Or temporarily disable firewall for testing

4. **Use a different network**
   - Try mobile hotspot
   - Try a different WiFi network
   - Try from a different location

### Authentication Errors

**Unauthorized/Forbidden Errors:**
- Check your bot token is correct
- Ensure the bot token is in the `.env` file
- Verify the bot token with @BotFather

**Invalid Token:**
- Get a new token from @BotFather
- Use `/mybots` to see your bots
- Use `/token` to regenerate token

## Setup Issues

### Missing .env file
```bash
npm run setup
```

### Invalid bot token format
Bot tokens should look like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

### Bot not responding in group
1. Add the bot to your group
2. Make sure the bot has permission to read messages
3. Send `/start` to the bot first

## Network Testing

### Test basic connectivity
```bash
# Test if you can reach Telegram
curl -I https://api.telegram.org

# Test DNS resolution
nslookup api.telegram.org
```

### Test with a simple script
Create `test-connection.js`:
```javascript
const https = require('https');

const options = {
  hostname: 'api.telegram.org',
  port: 443,
  path: '/',
  method: 'GET'
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end();
```

Run it:
```bash
node test-connection.js
```

## Alternative Solutions

### Use a different Telegram library
If the current library has issues, try:
```bash
npm uninstall node-telegram-bot-api
npm install telegraf
```

### Use webhooks instead of polling
For production environments, consider using webhooks instead of polling.

### Run on a different platform
- Try running on a cloud service (Heroku, Railway, etc.)
- Use a VPS or cloud server
- Try running from a different computer

## Debug Mode

Enable debug mode to see more information:
```bash
# Edit .env file
DEBUG=true
```

Then run:
```bash
npm run dev
```

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `ETIMEDOUT` | Network timeout | Check firewall, try different network |
| `ECONNRESET` | Connection reset | Disable VPN, check network |
| `ENOTFOUND` | DNS resolution failed | Check internet connection |
| `Unauthorized` | Invalid bot token | Check token with @BotFather |
| `Forbidden` | Bot blocked | Check bot permissions |

## Getting Help

If you're still having issues:

1. **Check the logs** - Look for specific error messages
2. **Test connectivity** - Use the test scripts above
3. **Try different network** - Mobile hotspot, different WiFi
4. **Check Telegram status** - Visit https://status.telegram.org
5. **Contact support** - If all else fails, the issue might be with your network setup

## Quick Fix Checklist

- [ ] Bot token is correct and in `.env` file
- [ ] Internet connection is working
- [ ] No VPN/proxy is interfering
- [ ] Firewall allows Node.js
- [ ] Bot is added to your group
- [ ] You sent `/start` to the bot
- [ ] Try running from a different network 