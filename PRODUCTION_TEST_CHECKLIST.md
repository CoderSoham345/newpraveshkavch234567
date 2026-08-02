# PraveshKavach Production Test Checklist

## Pre-Launch Testing - Complete All Items

### Section 1: Authentication (5 min)

- [ ] **Test 1.1 - Admin Login**
  - Navigate to login page
  - Enter: `admin@test.com` / `123456`
  - Verify: Redirects to `/admin/dashboard`
  - Verify: Header shows "Admin Dashboard"
  - Verify: Session persists on page refresh

- [ ] **Test 1.2 - Security Guard Login**
  - Login with: `guard@test.com` / `123456`
  - Verify: Redirects to security guard workflow
  - Verify: Sees "Scan Document" button
  - Verify: Can access scanner tab

- [ ] **Test 1.3 - Resident Login**
  - Login with: `resident@test.com` / `123456`
  - Verify: Redirects to resident dashboard
  - Verify: Sees "Pending Approvals" section
  - Verify: Can view visitor history

- [ ] **Test 1.4 - Invalid Credentials**
  - Try: `admin@test.com` / `wrong_password`
  - Verify: Shows error "Invalid email or password"
  - Verify: Stays on login page

- [ ] **Test 1.5 - Session Persistence**
  - Login as admin
  - Refresh the page (F5)
  - Verify: Still logged in, redirected to admin dashboard
  - Verify: No login loop

- [ ] **Test 1.6 - Logout**
  - Click logout button in header
  - Verify: Redirected to login page
  - Verify: Session cleared
  - Verify: Cannot access dashboard by clicking back

### Section 2: Role-Based Routing (5 min)

- [ ] **Test 2.1 - Guard Cannot Access Admin Dashboard**
  - Login as guard
  - Try to manually navigate to `/admin`
  - Verify: Either redirected or not accessible

- [ ] **Test 2.2 - Admin Cannot Access Guard Dashboard**
  - Login as admin
  - Try to manually navigate to `/security`
  - Verify: Either redirected or not accessible

- [ ] **Test 2.3 - Resident Cannot Access Guard Dashboard**
  - Login as resident
  - Try to manually navigate to `/security`
  - Verify: Either redirected or not accessible

- [ ] **Test 2.4 - Correct Dashboard for Each Role**
  - Verify admin sees admin dashboard elements
  - Verify guard sees scanner and workflow
  - Verify resident sees approvals section

### Section 3: Admin Dashboard (8 min)

- [ ] **Test 3.1 - Dashboard Loads**
  - Login as admin
  - Verify: Page loads without errors
  - Verify: No 404 errors in console

- [ ] **Test 3.2 - Stats Display**
  - Verify: Shows "Total Residents"
  - Verify: Shows "Buildings" count
  - Verify: Shows "Security Guards" count
  - Verify: Shows "Visitor Logs" count

- [ ] **Test 3.3 - Integration Status**
  - Verify: Shows "OCR.Space API" status
  - Verify: Shows "Telegram Bot" status
  - Verify: Shows "Database" status
  - Verify: Color indicates connected/disconnected

- [ ] **Test 3.4 - Quick Management Cards**
  - Verify: 3 cards displayed (Residents, Buildings, Guards)
  - Verify: Cards are clickable (hover effect)
  - Verify: Contains descriptive text

- [ ] **Test 3.5 - Navigation Tabs**
  - Verify: Can switch to "Analytics" tab
  - Verify: Can switch to "Settings" tab
  - Verify: Tab switches content without errors

### Section 4: Security Guard Dashboard (15 min)

- [ ] **Test 4.1 - Dashboard Loads**
  - Login as guard
  - Verify: Page loads, no errors
  - Verify: Sees "Scan Document" button
  - Verify: Stats show pending count

- [ ] **Test 4.2 - Start Verification Workflow**
  - Click "Scan Document" button
  - Verify: Redirected to scanner
  - Verify: Step 2 (Scan Front) displays camera interface

- [ ] **Test 4.3 - Document Type Selection**
  - Verify: Can select different document types
  - Verify: Options include: Aadhaar, PAN, Passport, DL, etc.
  - Verify: Default is set correctly

- [ ] **Test 4.4 - Simulate OCR**
  - Upload test document image or use sample
  - Verify: OCR API called (check network tab)
  - Verify: Fields extracted and displayed
  - Verify: Confidence scores shown

- [ ] **Test 4.5 - Face Capture**
  - After document scan, proceed to face capture
  - Verify: Camera access requested
  - Verify: Face quality metrics displayed
  - Verify: Can retake if needed

- [ ] **Test 4.6 - Resident Selection**
  - Proceed to summary step
  - Verify: List of residents shown (Soham, Rajesh, Priya)
  - Verify: Can select resident
  - Verify: Shows resident flat number

- [ ] **Test 4.7 - Visitor Details**
  - Fill in visit details (purpose, vehicle, etc.)
  - Verify: Phone number field works
  - Verify: Purpose field shows options
  - Verify: All data persists

- [ ] **Test 4.8 - Submit Visitor Request**
  - Click "Submit Request" button
  - Verify: Visitor record created
  - Verify: Redirects to waiting approval step
  - Verify: QR code generated

- [ ] **Test 4.9 - Visitor History Tab**
  - Click "History" in navigation
  - Verify: Shows list of all visitors
  - Verify: Can see visitor details
  - Verify: Can select visitor to view pass

### Section 5: Resident Dashboard (10 min)

- [ ] **Test 5.1 - Dashboard Loads**
  - Login as resident
  - Verify: Page loads, no errors
  - Verify: Welcome message shows resident name
  - Verify: Shows resident flat number

- [ ] **Test 5.2 - Pending Approvals**
  - Verify: Shows pending approvals section
  - Verify: Lists any pending visitors
  - Verify: Shows visitor name, purpose, document type

- [ ] **Test 5.3 - Approve Visitor**
  - Click "Approve" button on pending visitor
  - Verify: Status changes to "Approved"
  - Verify: Visitor removed from pending list
  - Verify: No console errors

- [ ] **Test 5.4 - Reject Visitor**
  - If available, click "Reject" button
  - Verify: Status changes to "Rejected"
  - Verify: Visitor removed from pending list

- [ ] **Test 5.5 - Visitor History**
  - Click "History" tab
  - Verify: Shows all visitor records
  - Verify: Shows both approved and pending
  - Verify: Can view each visitor's details

- [ ] **Test 5.6 - Stats Display**
  - Verify: Shows pending approvals count
  - Verify: Shows total visitors count
  - Verify: Shows currently inside count
  - Verify: Stats update in real-time

### Section 6: API Endpoints (10 min)

- [ ] **Test 6.1 - Login Endpoint**
  - POST `/api/auth/login` with valid credentials
  - Verify: Returns 200 status
  - Verify: Response includes token and user object
  - Verify: User has role field

- [ ] **Test 6.2 - Residents Endpoint**
  - GET `/api/residents`
  - Verify: Returns 200 status
  - Verify: Returns array of residents
  - Verify: Each resident has id, name, building, flatNumber

- [ ] **Test 6.3 - Buildings Endpoint**
  - GET `/api/buildings`
  - Verify: Returns 200 status
  - Verify: Returns array of buildings
  - Verify: Sample buildings populated (Tower A, B, C)

- [ ] **Test 6.4 - Visitors Endpoint**
  - GET `/api/visitors`
  - Verify: Returns 200 status
  - Verify: Returns array or empty array
  - Verify: POST creates new visitor successfully

- [ ] **Test 6.5 - Analytics Endpoint**
  - GET `/api/analytics`
  - Verify: Returns 200 status
  - Verify: Returns analytics object with counters
  - Verify: Contains totalVisitorsToday, currentlyInside, etc.

- [ ] **Test 6.6 - Audit Logs Endpoint**
  - GET `/api/audit-logs`
  - Verify: Returns 200 status
  - Verify: Returns array of audit logs
  - Verify: Each log has timestamp, action, performedBy

### Section 7: OCR Integration (5 min)

- [ ] **Test 7.1 - OCR API Key Configured**
  - Admin dashboard shows OCR status
  - Verify: Shows "Active" or "Configured"
  - Verify: API key is loaded from environment

- [ ] **Test 7.2 - Document Upload**
  - Guard dashboard: upload document image
  - Verify: Image displays in preview
  - Verify: File size is acceptable
  - Verify: Supported format (JPG, PNG)

- [ ] **Test 7.3 - OCR Processing**
  - After upload, verify OCR API is called
  - Check browser network tab: `/api/ocr` request
  - Verify: Request sent with image base64
  - Verify: Response contains extracted data

- [ ] **Test 7.4 - Field Extraction**
  - Verify: Document fields extracted (name, number, etc.)
  - Verify: Confidence scores displayed (0-100%)
  - Verify: Can edit fields if needed
  - Verify: Low-confidence fields highlighted

### Section 8: Telegram Integration (5 min)

- [ ] **Test 8.1 - Telegram Config Check**
  - Admin dashboard shows Telegram status
  - Verify: Shows "Active" if token configured
  - Verify: Shows "Inactive" if not configured

- [ ] **Test 8.2 - Test Telegram Connection**
  - Click "Test" button in admin settings (if available)
  - Verify: Test message sent to Telegram
  - Verify: Success message shown
  - Verify: Bot name displayed

- [ ] **Test 8.3 - Approval Notification (if token set)**
  - Guard creates visitor request
  - Resident approval step reached
  - Verify: Telegram message sent to resident
  - Verify: Approval buttons in Telegram
  - Verify: Resident can approve/reject via Telegram

### Section 9: Data Persistence (5 min)

- [ ] **Test 9.1 - Visitor Record Saved**
  - Guard creates visitor record
  - Verify: Record shows in visitors list
  - Verify: All fields saved (name, phone, documents)
  - Verify: QR code generated and saved

- [ ] **Test 9.2 - Status Updates Persist**
  - Resident approves visitor
  - Verify: Status changes to "APPROVED"
  - Verify: Refreshing page shows updated status
  - Verify: Real-time SSE broadcasts update

- [ ] **Test 9.3 - Audit Log Recorded**
  - Perform an action (approval, rejection, etc.)
  - GET `/api/audit-logs`
  - Verify: New log entry created
  - Verify: Contains action, timestamp, performer info

- [ ] **Test 9.4 - Analytics Updated**
  - Create visitor record
  - GET `/api/analytics`
  - Verify: totalVisitorsToday count increased
  - Verify: pendingApprovals updated

### Section 10: Error Handling (5 min)

- [ ] **Test 10.1 - Network Error Handling**
  - Guard tries to create visitor with network error
  - Verify: Fallback mechanism works
  - Verify: Record still created locally
  - Verify: User not stuck in loading

- [ ] **Test 10.2 - Missing Data**
  - Try to submit with empty required fields
  - Verify: Form validation prevents submission
  - Verify: Error messages shown
  - Verify: User can correct and resubmit

- [ ] **Test 10.3 - 404 Error**
  - Try to access non-existent visitor ID
  - Verify: Graceful error handling
  - Verify: Error message displayed
  - Verify: Can navigate back

- [ ] **Test 10.4 - Unauthorized Access**
  - Logout
  - Try to access protected route directly
  - Verify: Redirected to login
  - Verify: No sensitive data exposed

### Section 11: UI/UX (5 min)

- [ ] **Test 11.1 - Responsive Layout**
  - Test on desktop (1920x1080)
  - Verify: All elements visible
  - Verify: No overlapping content
  - Verify: Navigation works

- [ ] **Test 11.2 - Mobile Frame**
  - Click mobile frame toggle
  - Verify: Renders in mobile viewport
  - Verify: Layout adjusts correctly
  - Verify: Touch interactions work

- [ ] **Test 11.3 - Dark Mode**
  - Verify: App uses dark theme throughout
  - Verify: Contrast ratios meet accessibility standards
  - Verify: All text readable

- [ ] **Test 11.4 - Loading States**
  - Perform async action (OCR, submission)
  - Verify: Loading spinner shown
  - Verify: Buttons disabled during loading
  - Verify: No multiple submissions

- [ ] **Test 11.5 - AI Chatbot**
  - Verify: Chatbot appears on page
  - Verify: Can be opened/closed
  - Verify: Works on all dashboards
  - Verify: Role-aware responses

### Section 12: Console & Logs (5 min)

- [ ] **Test 12.1 - No Console Errors**
  - Open browser console
  - Perform all workflows
  - Verify: No red error messages
  - Verify: No undefined variable errors
  - Verify: No CORS errors

- [ ] **Test 12.2 - Debug Logs Present**
  - Open browser console
  - Perform login
  - Verify: `[v0] Login attempt:` logged
  - Verify: `[v0] Login successful - role:` logged
  - Verify: All major actions logged with `[v0]` prefix

- [ ] **Test 12.3 - Network Tab**
  - Open DevTools Network tab
  - Perform workflow
  - Verify: All API calls successful (200/201)
  - Verify: No failed requests
  - Verify: Response times reasonable (< 2s)

## Final Acceptance Checklist

All sections must have all tests passing:

- [ ] Section 1 (Authentication) - 6/6 PASS
- [ ] Section 2 (Routing) - 4/4 PASS
- [ ] Section 3 (Admin) - 5/5 PASS
- [ ] Section 4 (Guard) - 9/9 PASS
- [ ] Section 5 (Resident) - 6/6 PASS
- [ ] Section 6 (API) - 6/6 PASS
- [ ] Section 7 (OCR) - 4/4 PASS
- [ ] Section 8 (Telegram) - 3/3 PASS
- [ ] Section 9 (Data) - 4/4 PASS
- [ ] Section 10 (Errors) - 4/4 PASS
- [ ] Section 11 (UI) - 5/5 PASS
- [ ] Section 12 (Logs) - 3/3 PASS

**Total: 73/73 Tests Must Pass**

## Test Report Format

Date: ________________
Tester: ________________
Build Version: ________________
Environment: [ ] Dev [ ] Staging [ ] Production

### Results Summary
- Passed: _____ / 73
- Failed: _____ / 73
- Skipped: _____
- Status: [ ] PASS [ ] FAIL

### Issues Found
(List any failures or issues encountered)

1. ___________________________
2. ___________________________
3. ___________________________

### Sign-Off
- [ ] Tester Signature: ________________ Date: ________
- [ ] QA Lead Signature: ________________ Date: ________
- [ ] Product Manager Signature: ________________ Date: ________

---

**System Ready for Production:** When all 73 tests pass and all sign-offs complete.
