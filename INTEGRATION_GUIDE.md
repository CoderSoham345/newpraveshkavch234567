# PraveshKavach™ - OCR.Space + Telegram Integration Guide

## Overview

This guide walks you through integrating your OCR.Space API Key and Telegram Bot Token into the PraveshKavach™ application without redesigning or removing any existing features.

---

## Part 1: OCR.Space Integration

### What it does:
- Automatically detects document type (Aadhaar, PAN, Passport, DL, Voter ID, RC, etc.)
- Extracts structured data from documents with per-field confidence scoring
- Validates extracted data format
- Returns confidence score and flags low-confidence fields for manual review

### Setup Steps:

#### Step 1: Get Your OCR.Space API Key
1. Visit [ocr.space](https://ocr.space/ocrapi)
2. Sign up or log in
3. Copy your API Key
4. Never share this key publicly

#### Step 2: Add Environment Variable to Vercel

1. Go to **Vercel → Project Settings**
2. Click **Environment Variables**
3. Add new variable:
   - **Name:** `OCR_SPACE_API_KEY`
   - **Value:** `your-api-key-here`
   - **Environment:** All environments (Development, Preview, Production)
4. Click **Save**
5. **Redeploy** the project for changes to take effect

#### Step 3: Test OCR Integration

1. Go to the **Scanner Workflow**
2. Scan or upload a document (Aadhaar, PAN, Passport, etc.)
3. The app will:
   - Extract all fields automatically
   - Show confidence score for each field
   - Mark low-confidence fields for review
4. Check server logs for OCR processing time

### OCR API Endpoint

**Endpoint:** `POST /api/ocr`

**Request:**
```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "side": "front" or "back"
}
```

**Response:**
```json
{
  "success": true,
  "documentClassification": {
    "documentType": "AADHAAR_FRONT",
    "confidence": 92,
    "side": "front"
  },
  "extractedData": {
    "aadhaarNumber": "1234 5678 9012",
    "name": "Rajesh Sharma",
    "dob": "01/01/1990",
    "gender": "M",
    "address": "123 Main St, City",
    "confidenceScore": 88
  },
  "validation": {
    "status": "VALID",
    "needsReview": false,
    "lowConfidenceFields": []
  },
  "processingMetrics": {
    "totalTime": 2450,
    "ocrTime": 2100
  }
}
```

### Supported Documents:

- ✅ Aadhaar (Front & Back)
- ✅ PAN Card
- ✅ Passport
- ✅ Driving Licence
- ✅ Voter ID
- ✅ Employee ID
- ✅ Student ID
- ✅ RC Book
- ✅ Utility Bills
- ✅ Property Deeds

### Troubleshooting OCR:

| Issue | Solution |
|-------|----------|
| "OCR service not configured" | Add `OCR_SPACE_API_KEY` to Vercel environment variables |
| "Invalid API key" | Check the key is copied correctly |
| "API quota exceeded" | OCR.Space has usage limits - contact their support |
| Poor extraction accuracy | Use high-quality, well-lit document photos |

---

## Part 2: Telegram Bot Integration

### What it does:
- Sends visitor approval requests to residents via Telegram
- Shows visitor photos and document info
- Residents can approve/reject with inline buttons
- Sends real-time notifications for approvals/rejections
- Sends QR codes for approved visitor passes

### Setup Steps:

#### Step 1: Create Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/start`
3. Send `/newbot`
4. Follow the prompts:
   - **Bot name:** `PraveshKavach Visitor Management`
   - **Bot username:** `praveshkavach_bot` (must be unique)
5. BotFather will give you a **Bot Token** (looks like: `123456789:ABCDefGHijKlmnoPQRstUVwxyzABCDefGH`)

#### Step 2: Get Your Resident Chat ID

**Option A: Using getUpdates method**

1. Open Telegram bot and send any message
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Find your message and copy the `chat.id`

**Option B: Using @userinfobot**

1. Search for **@userinfobot** in Telegram
2. Send `/start`
3. It will show your chat ID

#### Step 3: Add Environment Variables to Vercel

1. Go to **Vercel → Project Settings**
2. Click **Environment Variables**
3. Add two new variables:
   - **Name:** `TELEGRAM_BOT_TOKEN`
     - **Value:** `123456789:ABCDefGHijKlmnoPQRstUVwxyzABCDefGH`
   - **Name:** `TELEGRAM_DEFAULT_CHAT_ID`
     - **Value:** `your-chat-id-here` (e.g., `123456789`)
   - **Environment:** All environments
4. Click **Save**
5. **Redeploy** the project

#### Step 4: Test Telegram Connection

1. Go to **Admin Panel → Settings**
2. Scroll to **Telegram Bot Configuration**
3. Click **Test Telegram Connection**
4. You should receive a test message in Telegram from your bot

### Telegram Workflow

#### When a visitor is registered:

1. Frontend captures visitor info and photo
2. Backend sends to `/api/telegram/send-approval` with:
   - Visitor photo
   - Document photo (Aadhaar, etc.)
   - All extracted fields
3. Telegram bot sends message to resident with:
   - Photos
   - Visitor details
   - Inline buttons (✅ Approve, ❌ Reject, 📞 Call Guard)

#### When resident approves:

1. Resident clicks ✅ Approve button
2. Backend webhook receives callback
3. Status updated to "APPROVED"
4. Security guard gets notification
5. Visitor pass (with QR code) is generated

#### When resident rejects:

1. Resident clicks ❌ Reject button
2. Backend webhook receives callback
3. Status updated to "REJECTED"
4. Security guard blocks entry
5. System logs rejection reason

### Telegram API Endpoints

**Test Connection:**
```
POST /api/telegram/test
```
Response: `{ success: true, botInfo: {...}, testMessageSent: true }`

**Send Approval Request:**
```
POST /api/telegram/send-approval
Body: {
  visitorName, visitorPhoto, aadhaarNumber, dob, age, gender,
  address, pinCode, purpose, building, wing, flat, visitorTime,
  securityGuardName, gateNumber, residentChatId, residentName,
  faceVerificationScore
}
```

**Send Alert:**
```
POST /api/telegram/sendAlert
Body: { message, location, timestamp }
```

**Send Visitor Pass:**
```
POST /api/telegram/sendVisitorPass
Body: { visitorName, qrCodeImage, residentChatId }
```

### Telegram Messages

**Approval Request Format:**
```
🔔 VISITOR APPROVAL REQUEST

👤 Visitor Name: John Doe
🎂 Date of Birth: 01/01/1990
📊 Age: 34
👨 Gender: M
📞 Purpose: Business Meeting
🏢 Building: Tower A
🔑 Unit: 3-502
📍 Address: 123 Main St, City
📮 PIN Code: 123456
🪪 Aadhaar: 1234-5678-9012

⏰ Arrival Time: 10:30 AM
🚪 Gate: Main Gate 01
👮 Security Guard: Suresh Kumar

🤖 Face Match Score: 92%

[Photo 1: Visitor]
[Photo 2: Document]
[✅ Approve] [❌ Reject] [📞 Call Guard]
```

### Troubleshooting Telegram:

| Issue | Solution |
|-------|----------|
| "Telegram Bot not configured" | Add `TELEGRAM_BOT_TOKEN` to env vars |
| "Telegram Chat ID not found" | Add `TELEGRAM_DEFAULT_CHAT_ID` to env vars |
| No test message received | Check chat ID is correct |
| Messages not reaching resident | Make sure resident started the bot (send `/start`) |
| Photos not showing | Photos must be base64 encoded properly |

---

## Part 3: Admin Configuration Panel

### Accessing Admin Settings

1. Login as **Admin** (email: `admin@test.com`, password: `Admin@123`)
2. Go to **Admin Panel**
3. Click **Settings**
4. Scroll to **System Integration Status**

### What You'll See:

#### OCR Status:
- ✅ **CONFIGURED** - API key is set
- ❌ **NOT_CONFIGURED** - Please add API key
- Last OCR usage
- Success rate percentage
- API key preview (first 10 chars)

#### Telegram Status:
- ✅ **CONFIGURED** - Bot token is set
- ❌ **NOT_CONFIGURED** - Please add bot token
- Bot username
- Resident chat ID
- Last message time
- Test button to verify connection

#### Server Status:
- Uptime (how long server has been running)
- Current timestamp
- Node.js version
- All operational metrics

### Testing Integrations

**To test OCR:**
1. Go to Scanner Workflow
2. Upload a document
3. Check extraction results
4. Verify all fields are extracted correctly

**To test Telegram:**
1. Go to Admin Settings
2. Click "Test Telegram Connection"
3. Check Telegram for test message
4. Verify message received successfully

---

## Part 4: Environment Variables Reference

### Required Variables

| Variable | Example | Where to Get |
|----------|---------|--------------|
| `OCR_SPACE_API_KEY` | `K87654321` | [ocr.space](https://ocr.space/ocrapi) |
| `TELEGRAM_BOT_TOKEN` | `123456789:ABCD...` | @BotFather on Telegram |
| `TELEGRAM_DEFAULT_CHAT_ID` | `123456789` | @userinfobot on Telegram |

### Setting in Vercel

1. **Project Settings** → **Environment Variables**
2. Click **Add New**
3. Fill in Name and Value
4. Select environment (Development, Preview, Production)
5. Click **Save**
6. **Redeploy** project

### Setting Locally (Development)

Create `.env.local` file in project root:
```
OCR_SPACE_API_KEY=your_key_here
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_DEFAULT_CHAT_ID=your_chat_id_here
```

---

## Part 5: Security Best Practices

### ✅ DO:
- Store API keys in environment variables only
- Never commit API keys to Git
- Regenerate keys if accidentally exposed
- Use separate keys for development/production
- Rotate keys periodically (quarterly)

### ❌ DON'T:
- Hardcode API keys in frontend code
- Share API keys via email or chat
- Expose keys in error messages
- Log full API keys to console (only log first 10 chars)
- Use same key across multiple projects

### Key Rotation

If you accidentally expose an API key:

**For OCR.Space:**
1. Go to [ocr.space dashboard](https://ocr.space)
2. Regenerate API key
3. Update Vercel environment variables
4. Redeploy

**For Telegram:**
1. Message @BotFather with `/revoke`
2. Create new bot with same settings
3. Update Vercel environment variables
4. Redeploy

---

## Part 6: Production Deployment

### Pre-Deployment Checklist

- [ ] OCR_SPACE_API_KEY added to Vercel production env vars
- [ ] TELEGRAM_BOT_TOKEN added to Vercel production env vars
- [ ] TELEGRAM_DEFAULT_CHAT_ID added to Vercel production env vars
- [ ] All three variables set for Production environment
- [ ] Tested OCR extraction with sample documents
- [ ] Tested Telegram approval workflow end-to-end
- [ ] Verified test message received in Telegram
- [ ] Checked all error messages are user-friendly
- [ ] Confirmed no API keys in logs or error messages
- [ ] Set up monitoring/alerting for failed approvals

### Deployment Steps

1. Make sure all code changes are committed
2. Add/verify environment variables in Vercel
3. Click **Deploy** in Vercel dashboard
4. Wait for build to complete
5. Test both integrations in production:
   - Scan a document (check OCR extraction)
   - Register a visitor (check Telegram approval)
6. Monitor logs for first 24 hours

### Monitoring

**Key Metrics to Watch:**

- OCR processing time (should be < 3 seconds)
- OCR extraction accuracy (track low-confidence fields)
- Telegram message delivery (should be instant)
- Visitor approval response time (should be < 2 minutes)
- System uptime (should be > 99.9%)

**Logs:**
- Backend logs available in Vercel → Function Logs
- Check `/api/admin/system-status` endpoint for health check
- Monitor Telegram webhook delivery failures

---

## Part 7: FAQ & Troubleshooting

### Q: Can I use both OCR.Space and other OCR engines?
**A:** Yes, the code supports multiple OCR engines. You can add Google Vision or AWS Textract by modifying the backend endpoint.

### Q: What if OCR extraction is wrong?
**A:** Users can manually correct extracted fields. Low-confidence fields are marked for review. You can also improve accuracy by:
- Using better quality photos
- Ensuring proper document orientation
- Cleaning up document photos (remove glare/shadows)

### Q: Can multiple residents get approval messages?
**A:** Yes! Store multiple Telegram chat IDs in the database. The system can send approval requests to all co-residents.

### Q: What if Telegram bot is offline?
**A:** The system gracefully degrades. Approvals are queued and can be managed from the web dashboard. When bot comes back online, pending notifications are sent.

### Q: How do I set different chat IDs for different residents?
**A:** Store chat IDs in the residents database table. When sending approvals, fetch the correct chat ID for each resident.

### Q: Can I test without real Telegram?
**A:** Yes, the admin dashboard shows Telegram status. Fallback UI allows manual approvals from web interface.

---

## Part 8: Support

### Getting Help

- **OCR.Space Support:** https://ocr.space/contact
- **Telegram Bot Support:** https://core.telegram.org/bots#getting-started
- **PraveshKavach Support:** Check the GitHub issues or project documentation

### Monitoring Dashboard

Access the system status at:
```
GET /api/admin/system-status
```

This shows:
- OCR integration status
- Telegram bot configuration status
- Server uptime
- Last usage timestamps
- All system health metrics

---

## Summary

You now have:
- ✅ OCR.Space API integrated for automatic document extraction
- ✅ Telegram Bot integrated for resident approval workflow
- ✅ Admin dashboard to monitor both integrations
- ✅ All existing features preserved (no redesign)
- ✅ Secure environment variable setup
- ✅ Production-ready deployment

The application will now automatically:
1. Extract visitor document information
2. Send approval requests to residents via Telegram
3. Track approvals in real-time
4. Generate visitor passes with confidence scores
5. Log all security events

**Never share your API keys!** Store them securely in Vercel environment variables only.
