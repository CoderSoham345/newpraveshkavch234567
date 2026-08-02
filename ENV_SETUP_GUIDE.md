# Environment Variables Setup Guide

## Telegram Configuration (CRITICAL)

The Telegram bot token and chat ID are **NO LONGER** entered in the frontend UI. Instead, they must be configured via backend environment variables for security.

### Required Environment Variables

```bash
# Your Telegram Bot Token (from @BotFather)
TELEGRAM_BOT_TOKEN=8612476614:AAErLL7CNMivZYmYpCBMEjzJQfhd2KQO65U

# Telegram Chat ID where approval notifications are sent
TELEGRAM_CHAT_ID=8612476614

# Alternative name (also supported)
BOT_TOKEN=8612476614:AAErLL7CNMivZYmYpCBMEjzJQfhd2KQO65U
```

### How to Get These Values

#### 1. Create a Telegram Bot (Get TELEGRAM_BOT_TOKEN)
1. Open Telegram and search for **@BotFather**
2. Click `/start` and then `/newbot`
3. Follow the prompts to create your bot
4. BotFather will give you a token like: `8612476614:AAErLL7CNMivZYmYpCBMEjzJQfhd2KQO65U`
5. Copy this token

#### 2. Get Your Chat ID (Get TELEGRAM_CHAT_ID)
**Option A: From BotFather**
1. Send `/getid` to @BotFather
2. The bot will reply with your user ID

**Option B: From Your Bot**
1. Send any message to your bot
2. Get the bot link from @BotFather
3. Click it to start the bot
4. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
5. Replace `<YOUR_BOT_TOKEN>` with your actual token
6. Look for `"chat":{"id":XXXXXXXXX}` - that's your Chat ID

### How to Set These Variables

#### For Local Development

Create a `.env.local` file in the project root:

```bash
TELEGRAM_BOT_TOKEN=8612476614:AAErLL7CNMivZYmYpCBMEjzJQfhd2KQO65U
TELEGRAM_CHAT_ID=8612476614
GEMINI_API_KEY=your_gemini_key_here
```

#### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:
   - `TELEGRAM_BOT_TOKEN` = `8612476614:AAErLL7CNMivZYmYpCBMEjzJQfhd2KQO65U`
   - `TELEGRAM_CHAT_ID` = `8612476614`
   - `GEMINI_API_KEY` = (if using direct API, optional if using AI Gateway)

#### For Docker/Server Deployment

Add to your `.env` file or docker-compose.yml:

```yaml
environment:
  TELEGRAM_BOT_TOKEN: "8612476614:AAErLL7CNMivZYmYpCBMEjzJQfhd2KQO65U"
  TELEGRAM_CHAT_ID: "8612476614"
  GEMINI_API_KEY: "your_key_here"
```

## Other Required Variables

### Gemini API (for OCR)

Choose **one** of these options:

**Option 1: Direct Gemini API**
```bash
GEMINI_API_KEY=your_gemini_api_key
```

**Option 2: Vercel AI Gateway** (recommended if available)
```bash
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
```

The system will try `GEMINI_API_KEY` first, then fall back to `AI_GATEWAY_API_KEY`.

## Verification

### 1. Check Configuration Status
- Go to **Admin Settings** in the app
- Look at **Telegram Bot Integration** section
- You should see:
  - ✅ Bot Token: Configured
  - ✅ Chat ID: Configured

### 2. Test Connection
- Click **Test Telegram Connection** button
- Check browser console for `[v0]` debug logs
- Should receive test message on Telegram within 5 seconds
- Status should show: "Telegram Connected Successfully"

### 3. Test Full Flow
1. Register a new visitor
2. Scan their Aadhaar
3. System should send approval request to Telegram chat
4. Approve from Telegram
5. Check tablet/app for real-time update

## Security Notes

- **NEVER** put credentials in frontend code
- **NEVER** commit `.env.local` to Git (add to `.gitignore`)
- **NEVER** share your bot token or chat ID publicly
- Always use environment variables for sensitive data
- In production, use Vercel/hosting provider's secure env var system

## Troubleshooting

### "Bot Token: Not Set" in Admin Settings
- Check if `TELEGRAM_BOT_TOKEN` or `BOT_TOKEN` is set in your environment
- Verify the token format: should be `NUMBERS:LETTERS_AND_NUMBERS`
- Restart the server after adding env vars

### "Chat ID: Not Set" in Admin Settings
- Check if `TELEGRAM_CHAT_ID` is set in your environment
- Verify it's a valid number (usually 10 digits)
- Restart the server after adding env vars

### "Test Telegram Connection" button is disabled
- Both Bot Token AND Chat ID must be configured
- Check the status badges to see which one is missing
- Set the missing variable and restart

### Test sends message but no approval notification during visitor flow
- Verify Chat ID is correct (you should receive test message)
- Check Telegram notifications are not muted
- Check bot has permission to send messages to this chat
- Review server logs for errors

## Next Steps

1. Get your Telegram Bot Token from @BotFather
2. Get your Chat ID using one of the methods above
3. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in your environment
4. Restart the development server or redeploy
5. Verify in Admin Settings that both show "Configured"
6. Click "Test Telegram Connection" to verify
