# Telegram Configuration Setup Checklist

Complete these steps to get Telegram working with the new backend-only configuration.

## Phase 1: Get Credentials (5 minutes)

- [ ] **Step 1**: Open Telegram, search for **@BotFather**
- [ ] **Step 2**: Send `/start` then `/newbot`
- [ ] **Step 3**: Create bot (pick a unique name)
- [ ] **Step 4**: Copy the bot token (looks like: `8612476614:AAErLL7CNMivZYmYpCBMEjzJQfhd2KQO65U`)
- [ ] **Step 5**: Save this token somewhere temporarily
- [ ] **Step 6**: Send `/getid` to @BotFather
- [ ] **Step 7**: Copy the Chat ID that's returned (usually 10 digits)
- [ ] **Step 8**: Save this Chat ID temporarily

**Example values (use YOUR values, not these):**
```
Bot Token:  8612476614:AAErLL7CNMivZYmYpCBMEjzJQfhd2KQO65U
Chat ID:    8612476614
```

## Phase 2: Set Environment Variables - Local Dev (3 minutes)

Choose **ONE** of these based on your setup:

### Option A: If using `.env.local` file (easiest for local dev)

- [ ] **Step 1**: Open project root directory
- [ ] **Step 2**: Create file `.env.local` (if doesn't exist)
- [ ] **Step 3**: Add these lines:
```bash
TELEGRAM_BOT_TOKEN=8612476614:AAErLL7CNMivZYmYpCBMEjzJQfhd2KQO65U
TELEGRAM_CHAT_ID=8612476614
```
- [ ] **Step 4**: Replace with YOUR actual token and chat ID
- [ ] **Step 5**: Save file
- [ ] **Step 6**: Make sure `.env.local` is in `.gitignore` (should already be)

### Option B: If using Vercel project

- [ ] **Step 1**: Go to your Vercel project dashboard
- [ ] **Step 2**: Click **Settings**
- [ ] **Step 3**: Click **Environment Variables**
- [ ] **Step 4**: Click **Add New**
- [ ] **Step 5**: 
  - Name: `TELEGRAM_BOT_TOKEN`
  - Value: `8612476614:AAErLL7CNMivZYmYpCBMEjzJQfhd2KQO65U` (your actual token)
  - Select: Development, Preview, Production
  - Click Add
- [ ] **Step 6**: Repeat for `TELEGRAM_CHAT_ID` with your chat ID
- [ ] **Step 7**: Redeploy project (or wait for next push)

### Option C: If using Docker/Server

- [ ] **Step 1**: Add to your `.env` file OR `docker-compose.yml`
- [ ] **Step 2**: Set variables in your deployment environment
- [ ] **Step 3**: Restart containers/services

## Phase 3: Restart & Verify (2 minutes)

- [ ] **Step 1**: Close any running dev server (Ctrl+C)
- [ ] **Step 2**: Restart dev server: `npm run dev`
- [ ] **Step 3**: Wait for "compiled successfully" message
- [ ] **Step 4**: Open app in browser (http://localhost:3000 or your URL)
- [ ] **Step 5**: Go to **Admin Settings** page
- [ ] **Step 6**: Look for **Telegram Bot Integration** section
- [ ] **Step 7**: Verify you see:
  - ✅ Bot Token: **Configured** (green)
  - ✅ Chat ID: **Configured** (green)
- [ ] **Step 8**: If either shows ❌ "Not Set" (red), go back to Phase 2

## Phase 4: Test Connection (2 minutes)

- [ ] **Step 1**: In Admin Settings, find **Test Telegram Connection** button
- [ ] **Step 2**: Button should be ENABLED (clickable)
- [ ] **Step 3**: Click the button
- [ ] **Step 4**: Button should show spinning icon for 3-5 seconds
- [ ] **Step 5**: Check your Telegram for a test message
  - Should arrive in the chat with ID you set
  - Says: "🔔 PRAVESHKAVACH™ TELEGRAM TEST" with bot info
- [ ] **Step 6**: Status should show:
  - ✅ "Telegram Connected Successfully (@YourBotName)"
- [ ] **Step 7**: If failed, check the browser console:
  - Press F12 to open Developer Tools
  - Go to Console tab
  - Look for `[v0]` messages showing what went wrong
  - Common issues:
    - "Invalid Bot Token" - token is wrong
    - "Chat ID not found" - chat ID is wrong
    - "Unauthorized" - token doesn't exist anymore

## Phase 5: Full System Test (10 minutes)

Now test the complete visitor registration and approval flow:

- [ ] **Step 1**: Go to main visitor registration page
- [ ] **Step 2**: Start new visitor registration
- [ ] **Step 3**: Enter visitor information (name, ID, building, etc.)
- [ ] **Step 4**: Click to scan Aadhaar Card (or use test image)
- [ ] **Step 5**: Complete the entire registration form
- [ ] **Step 6**: Submit for approval
- [ ] **Step 7**: Check Telegram - should receive approval request with:
  - Visitor name
  - Buttons to Approve/Reject
  - Reference ID
- [ ] **Step 8**: Click "Approve" in Telegram message
- [ ] **Step 9**: Check app - visitor should appear as approved
- [ ] **Step 10**: Verify real-time update on tablet/display screen

## Phase 6: Production Deployment (if applicable)

For Vercel/Production:

- [ ] **Step 1**: Ensure env vars are set in Vercel dashboard
- [ ] **Step 2**: Redeploy project (push to main or click redeploy)
- [ ] **Step 3**: Wait for deployment to complete
- [ ] **Step 4**: Go to live URL
- [ ] **Step 5**: Follow Phase 3 & 4 on production to verify
- [ ] **Step 6**: Do a full test with real visitors

## Troubleshooting Guide

### Status shows "Bot Token: Not Set"
**What to do:**
1. Check your `.env.local` file has `TELEGRAM_BOT_TOKEN=...` line
2. Verify no typos in variable name (must be exactly `TELEGRAM_BOT_TOKEN`)
3. Restart dev server: `npm run dev`
4. Reload browser page
5. Check format of token (should be: `NUMBERS:LETTERS_NUMBERS`)

### Status shows "Chat ID: Not Set"
**What to do:**
1. Check your `.env.local` file has `TELEGRAM_CHAT_ID=...` line
2. Verify chat ID is correct (ask @BotFather with `/getid`)
3. Restart dev server
4. Reload browser page

### Test button is disabled
**What to do:**
- Make sure BOTH status badges show ✅ "Configured"
- If one shows ❌, refer to troubleshooting above
- Restart dev server and reload page

### Test sends message but returns error
**What to do:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for `[v0]` messages
4. Common errors:
   - "Invalid bot token" - token expired or wrong
   - "Chat id not found" - chat ID wrong or bot has no access
   - "Forbidden" - bot was blocked or removed from chat
5. Try recreating bot with @BotFather

### No message appears in Telegram
**What to do:**
1. Check test returned "success"
2. Check Telegram notifications aren't muted
3. Check you're looking in correct chat/bot
4. Try sending something to bot first: `/start`
5. Check bot membership - was it removed from chat?

## Success Criteria

You know it's working when:

✅ Admin Settings shows both status as "Configured"  
✅ Test Telegram Connection succeeds  
✅ Test message appears in your Telegram chat within 5 seconds  
✅ Full visitor registration flow triggers Telegram notification  
✅ Approve/Reject buttons work and update app in real-time  

## Getting Help

If stuck, check these files for more details:
- `ENV_SETUP_GUIDE.md` - Detailed environment variable setup
- `BACKEND_CONFIG_SECURITY_UPDATE.md` - Why this change was made
- Browser Console (F12) - Look for `[v0]` debug messages
- Server logs - Check terminal running `npm run dev`

**All tests passing?** You're done! The system is ready for production.
