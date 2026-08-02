# Test Your Integration Now - 15 Minute Verification

## ✅ Pre-Test Checklist
- [ ] App is deployed/running
- [ ] You have your OCR.Space API key
- [ ] You have your Telegram Bot token
- [ ] You know your Telegram Chat ID

---

## Test 1: OCR Works (3 minutes)

**Goal:** Verify OCR.Space is extracting document fields

### Steps:
1. Open the app → Go to **Scanner** page
2. Click **"Upload Document"**
3. Choose an image of an ID/Passport/Aadhaar
4. Wait 2-3 seconds

### ✅ Success = Fields Auto-Fill
```
Name: [Extracted]
ID Number: [Extracted]
Date of Birth: [Extracted]
Document Type: [Auto-detected]
```

### ❌ If Failed:
- Check: Is image clear and readable?
- Check: Is file size < 25MB?
- Open browser DevTools → Console → Look for errors
- Look in server logs for: `[v0] OCR extraction`

---

## Test 2: Telegram Works (3 minutes)

**Goal:** Verify Telegram Bot can send messages

### Steps:
1. Go to **Admin Settings** page
2. Scroll to **"Telegram Bot Configuration"**
3. Click **"Send Test Message"** button
4. Check your Telegram app

### ✅ Success = Message Received in Telegram
```
PraveshKavach System ✅
Test message from admin panel
Sent: [time]
```

### ❌ If Failed:
- Check: Is your Telegram Bot running? (Ask @BotFather)
- Check: Did you start the bot? (Send `/start` to your bot)
- Check: Is Chat ID correct? (Ask @userinfobot)
- Check server logs for: `[v0] Telegram message sent`

---

## Test 3: End-to-End Flow (8 minutes)

**Goal:** Complete full visitor approval workflow

### Step A: Register Visitor (2 min)
1. Go to **Scanner** page
2. Enter visitor info:
   - Name: "Test Visitor"
   - Phone: "9999999999"
   - Purpose: "Meeting"
3. Click **"Upload Document"**
4. Select an image (Aadhaar/PAN/Passport)
5. Click **"Submit"**

### ✅ Expected Result
- OCR extracts fields
- Status changes to: "PENDING_APPROVAL"
- Server logs show: `[v0] Visitor registered: Test Visitor`

### Step B: Check Telegram (2 min)
1. Open your Telegram app
2. Look for a message from your bot with:
   - Visitor name
   - Document info
   - Two buttons: ✅ APPROVE and ❌ REJECT

### ✅ Expected Result
- Message shows visitor details
- Buttons are clickable

### Step C: Approve in Telegram (2 min)
1. Click ✅ **APPROVE** button in Telegram message
2. Wait 1-2 seconds
3. Go back to the app → **Resident Dashboard**

### ✅ Expected Result
- Resident sees: "New visitor approved"
- Status shows: "APPROVED"
- QR code pass is generated
- Server logs show: `[v0] Visitor approved: Test Visitor`

### Step D: Check-In Visitor (1 min)
1. Go to **Gate Check-in** page
2. Scan the QR code pass
3. Wait for check-in

### ✅ Expected Result
- Visitor status: "CHECKED_IN"
- Time: Current time
- Gate log updated

---

## Verification Checklist

| Component | Test | Result | Status |
|-----------|------|--------|--------|
| OCR.Space API | Upload document → Fields auto-fill | ✅ or ❌ | |
| Telegram Bot | Send test message → Received in Telegram | ✅ or ❌ | |
| E2E Flow | Register → Approve → Check-in | ✅ or ❌ | |
| Real-time Sync | Approve in Telegram → Status updates | ✅ or ❌ | |
| QR Code Pass | Generate → Scan at gate | ✅ or ❌ | |

---

## Troubleshooting Quick Links

### OCR Not Working?
```
Check: Is OCR_SPACE_API_KEY in environment variables?
Fix: Get key from https://ocr.space/ocrapi
Verify: Image must be clear and readable
```

### Telegram Not Working?
```
Check: Is TELEGRAM_BOT_TOKEN correct?
Fix: Get token from @BotFather
Check: Is TELEGRAM_DEFAULT_CHAT_ID set?
Fix: Get chat ID from @userinfobot
```

### Real-Time Not Working?
```
Check: Is SSE connection active?
Open DevTools → Network → Look for /api/events
Should show "101 Switching Protocols"
```

---

## Common Issues & Solutions

### Issue: "OCR extraction failed"
**Solution:** Check image quality. Must be clear, at least 200x200px. Try a different document.

### Issue: "Telegram message failed"
**Solution:** Verify bot token with @BotFather and chat ID with @userinfobot. Did you start the bot with `/start`?

### Issue: "Visitor status not updating"
**Solution:** Clear browser cache. Check if real-time SSE connection is active (DevTools → Network).

### Issue: "Field values incorrect"
**Solution:** OCR might struggle with handwritten text. Try a printed document or clearer image.

---

## Success Criteria

✅ **All 3 tests pass** = Integration is working
✅ **No errors in console** = No JavaScript issues
✅ **Telegram messages received** = Bot connection working
✅ **Fields auto-fill** = OCR extraction working
✅ **Status updates in real-time** = SSE working

---

## What Now?

1. **Run all 3 tests** ← DO THIS FIRST
2. **Document your results** in this checklist
3. **If any fail** → Check troubleshooting section
4. **If all pass** → You're ready for production! 🎉

---

## Need Help?

Check these docs:
- `INTEGRATION_VERIFIED.md` - Full verification guide
- `INTEGRATION_GUIDE.md` - Complete API reference
- `WHAT_IS_ALREADY_DONE.md` - What's built, no setup needed
