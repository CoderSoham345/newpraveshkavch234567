# PraveshKavach™ Integration Quick-Start Checklist

## 🚀 Get Both Integrations Running in 10 Minutes

### Step 1: Get OCR.Space API Key (2 minutes)

- [ ] Visit https://ocr.space/ocrapi
- [ ] Click "Free API Key"
- [ ] Sign up with email
- [ ] Confirm email
- [ ] Copy your **API Key** (looks like: `K87654321`)
- [ ] Save it somewhere safe

### Step 2: Create Telegram Bot (3 minutes)

- [ ] Open Telegram
- [ ] Search for **@BotFather**
- [ ] Send `/start`
- [ ] Send `/newbot`
- [ ] Enter bot name: `PraveshKavach`
- [ ] Enter username: `praveshkavach_bot` (or similar)
- [ ] Copy **Bot Token** from response (looks like: `123456789:ABCD...`)
- [ ] Save it

### Step 3: Get Your Telegram Chat ID (2 minutes)

**Method 1 - Using getUpdates:**
- [ ] Open your Telegram bot and send any message
- [ ] Visit in browser: `https://api.telegram.org/bot<PASTE_YOUR_TOKEN>/getUpdates`
- [ ] Find your message
- [ ] Copy `chat.id` (example: `123456789`)

**Method 2 - Using @userinfobot:**
- [ ] Search Telegram for **@userinfobot**
- [ ] Send `/start`
- [ ] Copy your **ID** number

### Step 4: Add to Vercel (2 minutes)

1. **Go to Vercel:**
   - Open https://vercel.com/dashboard
   - Select your project: **praveshkavach**

2. **Settings → Environment Variables**
   - Click **Add New**

3. **Add OCR_SPACE_API_KEY:**
   - Name: `OCR_SPACE_API_KEY`
   - Value: (paste your API key)
   - Environment: Select all ✓
   - Click **Save**

4. **Add TELEGRAM_BOT_TOKEN:**
   - Name: `TELEGRAM_BOT_TOKEN`
   - Value: (paste your bot token)
   - Environment: Select all ✓
   - Click **Save**

5. **Add TELEGRAM_DEFAULT_CHAT_ID:**
   - Name: `TELEGRAM_DEFAULT_CHAT_ID`
   - Value: (paste your chat ID)
   - Environment: Select all ✓
   - Click **Save**

### Step 5: Redeploy Project (1 minute)

- [ ] Go to Vercel Dashboard
- [ ] Click your project
- [ ] Click **Deployments**
- [ ] Click **... (three dots)** on latest deployment
- [ ] Click **Redeploy**
- [ ] Wait for deployment to finish

### ✅ You're Done!

Now test both integrations:

#### Test OCR:
1. Go to app and login
2. Click **Scanner Workflow**
3. Take a photo of any ID/document
4. Check that fields are extracted automatically
5. Verify confidence scores show up

#### Test Telegram:
1. Go to **Admin Panel** → **Settings**
2. Scroll to **Telegram Configuration**
3. Click **Test Telegram Connection**
4. Check Telegram app - you should get a message
5. If you see ✅ in Telegram, you're good!

#### Test End-to-End:
1. Register a new visitor with a document scan
2. Check Telegram - you should get an approval request
3. Click ✅ Approve in Telegram
4. Check app - visitor status should update to APPROVED

---

## ⚠️ Troubleshooting

### "OCR service not configured"
- [ ] Double-check `OCR_SPACE_API_KEY` in Vercel env vars
- [ ] Make sure it's spelled exactly: `OCR_SPACE_API_KEY`
- [ ] Redeploy after adding variable

### "Telegram Bot not configured"
- [ ] Check `TELEGRAM_BOT_TOKEN` is in Vercel env vars
- [ ] Make sure bot token has no spaces/extra characters
- [ ] Make sure `TELEGRAM_DEFAULT_CHAT_ID` is also added
- [ ] Redeploy after adding variables

### No test message in Telegram
- [ ] Make sure you started the bot (send `/start` to bot first)
- [ ] Check chat ID is correct (use @userinfobot to verify)
- [ ] Check bot token is correct (should start with numbers)
- [ ] Try test button again

### OCR extraction shows no fields
- [ ] Take a clearer photo (good lighting, no glare)
- [ ] Make sure document is fully visible in frame
- [ ] Try a different document type to test
- [ ] Check API key is valid at https://ocr.space

### Telegram button clicks don't work
- [ ] Make sure webhook is configured (backend handles callbacks)
- [ ] Check server logs for errors
- [ ] Make sure you're using the latest code version

---

## 📝 Environment Variables Summary

```
OCR_SPACE_API_KEY = K87654321
TELEGRAM_BOT_TOKEN = 123456789:ABCDefGHijKlmnoPQRstUVwxyzABCDefGH
TELEGRAM_DEFAULT_CHAT_ID = 123456789
```

**NEVER share these values!**

---

## 🎯 What Works Now

- ✅ Document OCR with automatic field extraction
- ✅ Multi-document type support (Aadhaar, PAN, Passport, DL, Voter ID, RC, etc.)
- ✅ Per-field confidence scoring (0-100%)
- ✅ Telegram approval workflow
- ✅ Visitor photos and document images in Telegram
- ✅ Inline buttons for approve/reject/call guard
- ✅ Real-time status updates
- ✅ All existing features preserved (no redesign)

---

## 💬 Next Steps

1. **For Residents:** Add their Telegram chat ID to their profile
2. **For Admins:** Monitor integrations via Admin Settings
3. **For Security:** Store API keys securely, rotate quarterly
4. **For Operations:** Set up approval notification alerts

**Done! Your integrations are live.**
