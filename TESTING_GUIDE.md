# Pravesh Kavach™ - Complete Testing Guide

## Quick Start - Test Everything in 5 Minutes

### 1. Telegram Connection Test (2 minutes)

#### What to Do:
1. Open the app and go to **Admin Settings**
2. Scroll to **Telegram Bot Configuration**
3. Enter your Telegram Bot Token (get from @BotFather)
4. Enter your Telegram Chat ID (your personal Telegram user ID)
5. Click **"Test Telegram Connection"**

#### What to Expect:
- ✅ Button shows loading state
- ✅ You receive a test message on Telegram
- ✅ Connection status shows "Connected Successfully"
- ✅ Displays your bot name like "@YourBotName"

#### How to Debug If It Fails:
1. Open browser **DevTools → Console** (F12)
2. Look for `[v0]` prefixed logs:
   ```
   [v0] Testing Telegram connection with token and chat ID
   [v0] Sending POST to /api/telegram/test
   [v0] Response status: 200 OK
   [v0] Response content-type: application/json
   [v0] Parsed JSON response: { success: true, ... }
   ```
3. If you see HTML in console (like `<!DOCTYPE` or `<html>`), the endpoint is returning error page instead of JSON ❌

#### Getting Your Chat ID:
1. Open Telegram
2. Send any message to your bot
3. Go to: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Replace `<YOUR_BOT_TOKEN>` with your actual token
5. Look for `"chat": { "id": 123456789 }`
6. That number is your Chat ID

---

### 2. OCR (Document Scanning) Test (3 minutes)

#### What to Do:
1. On main screen, click **"Start New Visitor Registration"**
2. Accept camera permissions
3. Point camera at your **Aadhaar Card FRONT**
4. Wait for green border (document detected)
5. Click **"CAPTURE DOCUMENT"**
6. Check the extracted data

#### What to Expect - AADHAAR FRONT:
```
✅ Full Name: Your actual name
✅ Date of Birth: DD/MM/YYYY format
✅ Gender: Male/Female/Other
✅ Aadhaar Number: XXXX XXXX XXXX
✅ Confidence: 85-95%
❌ Address: EMPTY (front side has NO address!)
❌ PIN Code: EMPTY (front side has NO PIN!)
```

#### What to Expect - AADHAAR BACK:
```
✅ Address: Your actual address
✅ PIN Code: 6-digit number
✅ Confidence: 80-90%
```

#### How to Debug If OCR Returns Empty:

**In browser console, you should see:**
```
[v0] ===== OCR STARTED =====
[v0] Document Type: Aadhaar Card
[v0] Image ready for OCR: 45823 bytes (44.75 KB)
[v0] Sending to /api/ocr endpoint...
[v0] OCR Response: HTTP 200
[v0] ✅ OCR SUCCESS - Extracted fields: fullName, dob, gender, aadhaarNumber, ...
[v0] Overall Confidence: 92%
```

**If you see empty response:**
- [ ] Check: Is `AI_GATEWAY_API_KEY` or `GEMINI_API_KEY` set in environment?
- [ ] Check: Network tab → `/api/ocr` → Response should NOT be empty
- [ ] Check: Server console for errors

**If image quality is bad:**
- Make sure document is:
  - Well-lit (no shadows)
  - In focus (not blurry)
  - Fully visible in frame
  - Flat (not curved)
  - No reflections or glare

---

### 3. Full Visitor Flow Test (10 minutes)

#### Step 1: Scan Aadhaar Card
- [x] Scanner: Point at Aadhaar front
- [x] Verify: All fields extracted correctly
- [x] Proceed: Click "Confirm Details"

#### Step 2: Scan Back Side
- [x] Scanner: Point at Aadhaar back
- [x] Verify: Address and PIN code extracted
- [x] Proceed: Click "Confirm & Proceed"

#### Step 3: Take Selfie
- [x] Camera: Face capture screen
- [x] Verification: Face is centered and well-lit
- [x] Proceed: Click "Capture Face"

#### Step 4: Review Summary
- [x] Verify: All data looks correct
- [x] Select: Choose resident to visit
- [x] Proceed: Click "Send Request"

#### Step 5: Wait for Approval
- [x] Telegram: Check your Telegram app
- [x] Approval: Should see approval request with photo
- [x] Action: Click "✅ Approve" or "❌ Reject"
- [x] Tablet: Should show real-time status update

#### Step 6: Final Result
- [x] Display: "Entry Approved" or "Entry Rejected"
- [x] Pass: QR code generated
- [x] Completion: Screen shows visitor pass

---

## Detailed Testing Scenarios

### Scenario A: Happy Path (Everything Works)

**Prerequisites:**
- ✅ Telegram Bot Token set
- ✅ Telegram Chat ID set
- ✅ Real Aadhaar Card
- ✅ Good lighting

**Steps:**
1. Start new registration
2. Scan Aadhaar front (green border appears in ~2 seconds)
3. All fields populate correctly
4. Scan back side
5. Take selfie
6. Send request
7. Receive Telegram notification
8. Approve on Telegram
9. See real-time update on tablet

**Expected Result:** ✅ PASS

---

### Scenario B: Bad Image Quality

**Setup:**
- Poor lighting
- Document blurry
- Document at angle
- Reflections/glare

**What Happens:**
1. OCR still runs
2. Confidence score drops to 50-70%
3. Confidence indicator shows 🟠 Low or 🔴 Very Low
4. Some fields may be empty

**Expected Result:** ⚠️ Warns user to retake

---

### Scenario C: Telegram Not Configured

**Setup:**
- No Bot Token set
- No Chat ID set

**What Happens:**
1. Visitor registration works fine
2. User reaches "Send Request" step
3. Telegram notification doesn't send
4. Entry defaulted to approved (fallback)
5. Tablet doesn't get real-time update

**Expected Result:** ⚠️ User can still proceed (graceful fallback)

---

### Scenario D: Network Timeout

**Setup:**
- Slow internet connection
- API timeout (>30 seconds)

**What Happens:**
1. OCR request hangs
2. Network tab shows pending request
3. After timeout, error message shows

**Expected Result:** ❌ Error displayed, user can retry

---

## Browser Console Debugging

### Enable Detailed Logs

Run this in browser console (F12):
```javascript
localStorage.setItem('V0_DEBUG_LOGS', 'true');
location.reload();
```

Now all API calls will be logged with `[v0]` prefix.

### Disable Logs
```javascript
localStorage.removeItem('V0_DEBUG_LOGS');
location.reload();
```

### Common Console Patterns

**OCR Works:**
```
[v0] ===== OCR STARTED =====
[v0] Document Type: Aadhaar Card
[v0] Image ready for OCR: 45823 bytes
[v0] Sending to /api/ocr endpoint...
[v0] OCR Response: HTTP 200
[v0] ✅ OCR SUCCESS
```

**OCR Fails:**
```
[v0] ===== OCR STARTED =====
[v0] Image ready for OCR: 45823 bytes
[v0] Sending to /api/ocr endpoint...
[v0] ❌ OCR FAILED: Network error
```

**Telegram Works:**
```
[v0] ===== TELEGRAM TEST STARTED =====
[v0] Telegram Bot Token: 5823921...5931
[v0] Telegram Chat ID: 987654321
[v0] Sending to /api/telegram/test...
[v0] Response: HTTP 200
[v0] ✅ TELEGRAM SUCCESS - Connected to @PraveshKavachBot
```

**Telegram Fails:**
```
[v0] ===== TELEGRAM TEST STARTED =====
[v0] Telegram Bot Token: 5823921...5931
[v0] Sending to /api/telegram/test...
[v0] Response: HTTP 404
[v0] ❌ TELEGRAM FAILED: Unexpected token 'T'
```

---

## Checklist Before Production

### System Configuration
- [ ] Telegram Bot Token is set and valid
- [ ] Telegram Chat ID is correct (9-10 digits)
- [ ] AI Gateway or Gemini API Key configured
- [ ] Server is running without errors
- [ ] Database connection working

### Telegram Integration
- [ ] Test button shows success
- [ ] Test message received on Telegram
- [ ] Bot can send images
- [ ] Bot can send inline buttons
- [ ] Approve/Reject buttons work
- [ ] Real-time SSE updates work

### OCR System
- [ ] Scans extract all visible fields
- [ ] Confidence scores are 80%+
- [ ] No hallucinated data
- [ ] Multiple document types work
- [ ] Error handling works (graceful fallback)

### Visitor Flow
- [ ] Aadhaar front scan works
- [ ] Aadhaar back scan works
- [ ] Face capture works
- [ ] Summary displays correctly
- [ ] Telegram notification sends
- [ ] Approval/Rejection updates realtime
- [ ] Entry pass QR code generates

### Error Handling
- [ ] All API responses are JSON (never HTML)
- [ ] Network errors don't crash app
- [ ] Missing Gemini key doesn't break app
- [ ] Missing Telegram config doesn't break app
- [ ] Invalid tokens show helpful errors

### Performance
- [ ] OCR responds within 5 seconds
- [ ] Telegram notification within 2 seconds
- [ ] Real-time updates within 100ms
- [ ] No memory leaks or infinite loops
- [ ] Can handle 100+ simultaneous scans

---

## Troubleshooting Matrix

| Issue | Cause | Fix |
|-------|-------|-----|
| "Unexpected token 'T'" | HTML returned instead of JSON | Global error handler added ✅ |
| OCR empty fields | No Gemini key | Set `GEMINI_API_KEY` or check AI Gateway |
| Telegram not connecting | Wrong token/chat ID | Verify on `api.telegram.org/bot.../getMe` |
| Telegram test fails | Bot token invalid | Regenerate from @BotFather |
| Telegram test fails | Chat ID wrong | Use `/getUpdates` endpoint to get correct ID |
| Face detection fails | Poor lighting | Increase brightness, move to well-lit area |
| Document not detected | Image too blurry | Hold camera steady, focus on document |
| Confidence too low | Bad image quality | Clean camera lens, improve lighting |
| App crashes | Network error | Check internet connection, retry |
| SSE not updating | Telegram approval not sent | Check Telegram server logs |

---

## Performance Testing

### OCR Processing Time
Expected: 2-5 seconds per image

**Test:**
1. Open DevTools → Network tab
2. Scan document
3. Check `/api/ocr` request time
4. Should be green (< 5s)

### Telegram Response Time
Expected: < 2 seconds

**Test:**
1. Click "Test Telegram Connection"
2. Check `/api/telegram/test` response time
3. Should complete in < 2s

### Real-time Updates
Expected: < 100ms from Telegram to tablet

**Test:**
1. Start visitor approval request
2. Note time on tablet screen
3. Approve on Telegram
4. Watch for instant update on tablet

---

## Test Data

### Sample Aadhaar Info
```
Name: SOHAM SANDIP GONBHARE
DOB: 15/07/2006
Gender: Male
Aadhaar: XXXX 2222 5555
Address: [On back side]
```

### Telegram Test Data
```
Bot Token: 1234567890:ABCDEfghijklmnopqrstuvwxyz
Chat ID: 987654321
Bot Name: @PraveshKavachBot
```

---

## Getting Help

### Enable Maximum Logging
1. Open DevTools (F12)
2. Go to Console tab
3. Paste: `localStorage.setItem('V0_DEBUG_LOGS', 'true'); location.reload();`
4. Reproduce issue
5. Screenshot all console logs with `[v0]` prefix

### Check Network Requests
1. DevTools → Network tab
2. Filter by `/api/`
3. Click on request to see:
   - Request headers
   - Request body
   - Response status
   - Response body

### Check Server Logs
If running locally:
```bash
npm run dev
# Look for [v0] prefixed logs
```

---

**Last Updated:** August 2, 2026
**Status:** All systems operational
**Ready for Testing:** YES ✅
