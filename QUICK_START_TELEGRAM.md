# Quick Start: Telegram Configuration (5 minutes)

## TL;DR

Bot credentials go in **environment variables**, not the app UI.

## Get Credentials (2 minutes)

```bash
# 1. Open Telegram → Search @BotFather → /newbot
# 2. Copy your bot token from BotFather

TELEGRAM_BOT_TOKEN=8612476614:AAErLL7CNMivZYmYpCBMEjzJQfhd2KQO65U

# 3. Send /getid to @BotFather
# 4. Copy your Chat ID

TELEGRAM_CHAT_ID=8612476614
```

## Set Environment (2 minutes)

### For Local Dev:
Create `.env.local` in project root:
```bash
TELEGRAM_BOT_TOKEN=8612476614:AAErLL7CNMivZYmYpCBMEjzJQfhd2KQO65U
TELEGRAM_CHAT_ID=8612476614
```

### For Vercel:
Settings → Environment Variables → Add both variables

### For Docker:
Add to `.env` or `docker-compose.yml`

## Test (1 minute)

1. Restart: `npm run dev`
2. Go to Admin Settings
3. Look for "Telegram Bot Integration"
4. Both should show ✅ "Configured"
5. Click "Test Telegram Connection"
6. Check Telegram for test message
7. Done! ✅

## If Something's Wrong

| Problem | Fix |
|---------|-----|
| Status shows "Not Set" | Restart server, check env var name spelling |
| Test button disabled | Make sure BOTH show ✅ "Configured" |
| No test message | Token/chat ID might be wrong, check console |
| "Invalid Bot Token" | Get new token from @BotFather, recreate bot |

## What Changed

- ❌ No more input fields in Admin Settings
- ❌ Can't save config from UI anymore
- ✅ Configuration via environment variables (secure)
- ✅ Status badges show if configured
- ✅ More secure, follows best practices

## Full Docs

- `ENV_SETUP_GUIDE.md` - Detailed setup
- `SETUP_CHECKLIST.md` - Step-by-step checklist
- `BACKEND_CONFIG_SECURITY_UPDATE.md` - Why this changed

## That's it! 🎉

Your Telegram bot is configured backend-only now. Much more secure!
