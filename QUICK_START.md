# PraveshKavach™ - Quick Start Guide

## 🚀 First Time Launch

### Step 1: Start the Server
```bash
cd /vercel/share/v0-project
npm run dev
```

Server runs on `http://localhost:3000`

### Step 2: Login with Demo Account

Choose one of these three accounts:

**Admin:**
- Email: `admin@test.com`
- Password: `123456`
- Dashboard: System overview, integration status, analytics

**Security Guard:**
- Email: `guard@test.com`
- Password: `123456`
- Dashboard: Scanner, visitor verification, pass generation

**Resident:**
- Email: `resident@test.com`
- Password: `123456`
- Dashboard: Pending approvals, visitor history

### Step 3: Test the Workflow

#### As Security Guard:
1. Click "Scan Document"
2. Upload a document image (or use sample)
3. System extracts fields automatically
4. Capture face photo for verification
5. Select resident (Soham Gonbhare)
6. Submit for approval
7. Visit approval will be sent to resident

#### As Resident:
1. See pending approval notification
2. Click "Approve" button
3. Visitor status updates instantly
4. Guard can now check in the visitor

#### As Admin:
1. View system integration status
2. Monitor OCR and Telegram connectivity
3. View analytics and audit logs
4. Manage residents and buildings

---

## 🔧 Environment Variables

Required for full functionality:

```env
# OCR Document Processing (required for document scanning)
OCR_SPACE_API_KEY=your_ocr_space_api_key

# Telegram Notifications (optional but recommended)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_DEFAULT_CHAT_ID=your_chat_id_for_testing
```

**Where to set:**
1. Go to Vercel Project Settings
2. Click "Environment Variables"
3. Add each variable
4. Redeploy or restart dev server

---

## 📋 Test Scenarios

### Scenario 1: Complete Visitor Verification (15 min)
1. Login as guard
2. Start new verification
3. Scan/upload document
4. Capture face
5. Select resident
6. Submit request
7. Logout
8. Login as resident
9. Approve visitor
10. Login as guard
11. Check in visitor
12. Verify status in admin dashboard

### Scenario 2: Quick Feature Check (5 min)
1. Login as admin - verify dashboard loads
2. Login as guard - verify scanner accessible
3. Login as resident - verify pending section
4. Check each role can only access their dashboard
5. Verify logout works

### Scenario 3: API Testing (5 min)
Using Postman or curl:
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456"}'

# Get residents
curl http://localhost:3000/api/residents

# Get analytics
curl http://localhost:3000/api/analytics

# Get audit logs
curl http://localhost:3000/api/audit-logs
```

---

## 🐛 Troubleshooting

### Login Not Working
- [ ] Check you're using correct credentials
- [ ] Open browser console for errors
- [ ] Check network tab for `/api/auth/login` response
- [ ] Try a different browser

### Dashboard Not Loading
- [ ] Verify you're logged in
- [ ] Check browser console for TypeScript errors
- [ ] Verify API is running (`curl http://localhost:3000/api/residents`)
- [ ] Try clearing sessionStorage: Open DevTools → Application → Clear all cookies/storage

### OCR Not Extracting Fields
- [ ] Verify `OCR_SPACE_API_KEY` is set in environment variables
- [ ] Check image file is valid (JPG/PNG)
- [ ] Check image is readable (not too dark/blurry)
- [ ] Check network tab for `/api/ocr` response

### Telegram Not Sending Notifications
- [ ] Verify `TELEGRAM_BOT_TOKEN` is set correctly
- [ ] Verify `TELEGRAM_DEFAULT_CHAT_ID` is set correctly
- [ ] Test with admin dashboard "Send Test" button
- [ ] Check Telegram bot is active and has required permissions

### Resident Not Receiving Approval Request
- [ ] Verify Telegram is configured
- [ ] Check resident has Telegram bot chat open
- [ ] Verify `/api/telegram/test` shows "Active"
- [ ] Check Telegram notification settings

---

## 📱 Testing on Mobile

### Using Browser DevTools:
1. Press `F12` to open DevTools
2. Click device icon (top-left of DevTools)
3. Select device (iPhone 12, Pixel 5, etc.)
4. Refresh page
5. App should adapt to mobile layout

### Or Use Mobile Frame Toggle:
1. Click mobile frame button in header
2. App renders in mobile viewport
3. Test touch interactions

---

## 🔍 Debug Mode

All major actions logged to browser console with `[v0]` prefix:

```javascript
// Search console for debug messages:
// [v0] Login attempt
// [v0] Login successful - role: ADMIN
// [v0] SecurityGuardWorkflow mounted
// [v0] Front capture completed
// [v0] OCR API response
// [v0] Visitor saved
// [v0] Telegram notification sent
```

Enable console logging:
1. Open DevTools (F12)
2. Go to Console tab
3. Look for messages starting with `[v0]`

---

## 📊 Sample Data

System automatically populates with test data:

### Buildings
- Tower A, Tower B, Tower C
- Each with 80-120 units

### Residents
- Soham Gonbhare (A-702, Tower A)
- Rajesh Sharma (A-301, Tower A)
- Priya Patel (B-405, Tower B)

### Security Guards
- Ramesh Patil (Main Gate, Morning Shift)

---

## ✅ Quick Verification Checklist

- [ ] Can login with admin@test.com / 123456
- [ ] Can login with guard@test.com / 123456
- [ ] Can login with resident@test.com / 123456
- [ ] Each role sees their own dashboard
- [ ] Can't access other role's dashboard
- [ ] Session persists on page refresh
- [ ] Logout works and redirects to login
- [ ] Admin dashboard shows system status
- [ ] Guard can start verification workflow
- [ ] Resident can see pending approvals
- [ ] No console errors (F12)
- [ ] All API endpoints return 200 status

---

## 🚀 Ready for Production?

Run full test suite:
```bash
# See: PRODUCTION_TEST_CHECKLIST.md
# 73 tests must pass
# Check all sections: Authentication, Routing, Dashboards, API, OCR, Telegram, etc.
```

---

## 📚 Full Documentation

- **COMPLETE_SYSTEM_FIX.md** - Technical implementation details
- **PRODUCTION_TEST_CHECKLIST.md** - 73-test production readiness suite
- **DELIVERY_SUMMARY.md** - Executive summary and architecture
- **API Endpoints** - See server.ts for all routes

---

## 🎯 Common Tasks

### Add a New Resident
```bash
curl -X POST http://localhost:3000/api/residents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Resident",
    "building": "Tower A",
    "flatNumber": "A-101",
    "phone": "+91 98765 43210",
    "email": "resident@example.com"
  }'
```

### Add a New Building
```bash
curl -X POST http://localhost:3000/api/buildings \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tower D",
    "code": "TWR-D",
    "totalUnits": 100,
    "managerName": "Manager Name"
  }'
```

### Create a Test Visitor
```bash
curl -X POST http://localhost:3000/api/visitors \
  -H "Content-Type: application/json" \
  -d '{
    "visitorName": "Test Visitor",
    "phone": "+91 99999 99999",
    "documentType": "AADHAAR_FRONT",
    "documentNumber": "XXXX-XXXX-XXXX",
    "residentId": "resident-1",
    "residentName": "Soham Gonbhare",
    "purpose": "Personal Visit",
    "status": "PENDING"
  }'
```

---

## 🆘 Getting Help

1. **Check Console:** Press F12, look for `[v0]` debug messages
2. **Check Network:** DevTools → Network tab, verify API calls
3. **Check Env Vars:** Verify all required variables are set
4. **Read Logs:** `/api/audit-logs` shows all system actions
5. **Review Docs:** Full documentation in COMPLETE_SYSTEM_FIX.md

---

## 📞 Support Contacts

For issues:
1. Check documentation first (DELIVERY_SUMMARY.md)
2. Search browser console for errors
3. Verify environment variables
4. Check network requests in DevTools
5. Review server logs in terminal

---

**PraveshKavach™ Ready to Use!**

🎉 Your enterprise visitor management system is ready for testing and deployment.

Good luck! 🚀
