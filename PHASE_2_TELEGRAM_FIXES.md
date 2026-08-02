# Phase 2: Telegram Workflow Fixes

**Status:** Implementation in Progress  
**Date:** August 1, 2026  
**Priority:** CRITICAL - Fixes core approval workflow

---

## Problem Statement

### Current (WRONG)
- Approval messages sent to SECURITY GUARD
- Guard cannot approve for resident
- Workflow is backwards
- No resident control over visitor entry

### Fixed (CORRECT)
- Approval messages sent to RESIDENT's Telegram chat ID
- Resident approves/rejects entry directly
- Guard sees real-time status updates
- Resident has full control

---

## Implementation Summary

### 1. New Services Created

#### A. Firebase Service (`src/services/firebaseService.ts`)
- Manages resident profiles in Firestore
- Stores visitor records with approval tracking
- Real-time listeners for status updates
- Image storage in Firebase Storage

**Key Collections:**
- `residents` - Resident profiles with Telegram Chat IDs
- `visitors` - Visitor records
- `approvals` - Approval workflow tracking

#### B. Telegram Service (`src/services/telegramService.ts`)
- Fixed: `sendApprovalRequestToResident()` - Sends to resident's Telegram Chat ID
- Inline buttons for approve/reject
- Photo attachments (visitor photo + Aadhaar)
- Status update notifications
- QR pass generation and delivery

**CRITICAL METHODS:**
```typescript
// SENDS TO RESIDENT, NOT GUARD
sendApprovalRequestToResident(approval: TelegramApprovalMessage)

// Inline buttons for resident actions
// ✅ Approve Entry
// ❌ Reject Entry  
// 📄 View Details
// 📞 Call Security
```

### 2. Type Definitions Updated

#### New Resident Type (`src/types.ts`)
```typescript
interface Resident {
  residentId: string;
  name: string;
  building: string;
  wing: string;
  flat: string;
  mobile: string;
  email: string;
  telegramChatId: string;  // CRITICAL: Where approvals are sent
  telegramUsername: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}
```

### 3. Correct Approval Workflow (8 Steps)

```
1. Guard Scan Front
   ↓
2. Guard Verify & Scan Back
   ↓
3. Guard Capture Face
   ↓
4. Guard Select RESIDENT (from Firebase resident list)
   ↓
5. System sends Telegram message to RESIDENT's Chat ID
   ├─ Visitor Photo
   ├─ Aadhaar Front
   ├─ Visitor Details
   └─ [Approve] [Reject] [Details] [Call Security] Buttons
   ↓
6. RESIDENT receives Telegram message on their phone
   ↓
7. RESIDENT clicks [Approve] or [Reject]
   ↓
8. Tablet receives real-time Firebase update
   └─ Shows QR Pass (if approved)
   └─ Shows Rejection reason (if rejected)
```

---

## Configuration Required

### Environment Variables

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Telegram Bot
BOT_TOKEN=your_telegram_bot_token
```

### Telegram Bot Setup

1. **Create Bot with @BotFather**
   - Command: `/newbot`
   - Name: "PraveshKavach Visitor Manager"
   - Username: "pravesh_kavach_bot"
   - Get Token: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

2. **Enable Inline Buttons**
   - Already supported by Telegram API

3. **Get Chat IDs**
   - Start bot: Click "Start" button
   - Bot saves chat ID: `8612476614`
   - Store in Firebase resident profile

### Firebase Setup

1. **Create Firestore Database**
   - Google Cloud Console → Firestore
   - Create collection: `residents`
   - Create collection: `visitors`
   - Create collection: `approvals`

2. **Create Storage Bucket**
   - For storing visitor photos
   - Path: `visitors/{visitorId}/photos/`

3. **Enable Real-time Listeners**
   - For tablet to show live status updates
   - Listens on: `/visitors/{visitorId}/status`

---

## API Endpoints (New)

### 1. Send Approval to Resident
```
POST /api/approval/send-to-resident

Body:
{
  "visitorId": "vis-123",
  "visitorName": "John Doe",
  "visitorPhoto": "data:image/jpeg;base64,...",
  "aadhaarPhoto": "data:image/jpeg;base64,...",
  "aadhaarNumber": "5482 1111 2222",
  "dob": "15/08/1990",
  "age": "33",
  "gender": "Male",
  "address": "...",
  "pinCode": "110001",
  "purpose": "Personal Visit",
  "building": "Tower A",
  "wing": "North",
  "flat": "302",
  "visitorTime": "2026-08-01 14:30",
  "securityGuardName": "Suresh Kumar",
  "gateNumber": "Main Gate 01",
  "residentChatId": "8612476614",
  "residentName": "Rajesh Sharma",
  "faceVerificationScore": 94
}

Response:
{
  "success": true,
  "visitorId": "vis-123",
  "residentId": "8612476614",
  "approvalStatus": "pending",
  "telegramMessageId": "12345",
  "message": "Approval request sent to resident: Rajesh Sharma"
}
```

### 2. Webhook - Resident Approval/Rejection
```
POST /api/webhook/telegram

Body:
{
  "update_id": 123456789,
  "callback_query": {
    "id": "callback_id",
    "from": {
      "id": 8612476614,
      "username": "rajesh_sharma"
    },
    "data": "approve_vis-123" or "reject_vis-123"
  }
}

Action:
1. Parse callback_data: "approve_vis-123" → visitorId
2. Update visitor status in Firebase
3. Broadcast SSE event to tablet
4. Send confirmation to resident
```

### 3. Get Real-time Visitor Status
```
GET /api/visitors/{visitorId}/status

Response:
{
  "visitorId": "vis-123",
  "status": "approved",
  "approvalTime": "2026-08-01T14:35:00Z",
  "approverName": "Rajesh Sharma",
  "qrPass": {
    "qrCode": "PRAVESHKAVACH-vis-123",
    "qrImage": "data:image/png;base64,...",
    "validUntil": "2026-08-01T15:35:00Z"
  }
}
```

---

## Data Flow Diagram

```
Security Guard (Tablet)          Resident (Phone)              Firebase
      │                                 │                          │
      │ Enter visitor details           │                          │
      ├─────────────────────────────────→ Scan Aadhaar front        │
      │                                 │                          │
      │ Select resident from Firebase   │                          │
      ├─────────────────────────────────────────────────────────→  │
      │                                 │                          │ Query residents
      │                                 │                  ← Return resident list
      │                                 │                          │
      │ Create approval request         │                          │
      ├─────────────────────────────────────────────────────────→  │
      │                                 │                          │ Create approval doc
      │ ← Real-time SSE update          │                          │
      │                                 │                          │
      │                            Telegram Bot sends message      │
      │                                 ← Receive approval prompt  │
      │                                 │                          │
      │                           [Approve] or [Reject]            │
      │                                 │                          │
      │                           ← Webhook callback               │
      │                                 │                          │
      │                                 ├─→ Update approval status
      │                                 │                          │
      │ ← Real-time Firebase update     ← Broadcast event         │
      │                                 │                          │
      │ Generate QR Pass                │                          │
      └─────────────────────────────────→ Send QR to Telegram      │
```

---

## Key Changes from Original

| Aspect | Before | After |
|--------|--------|-------|
| **Approval Recipient** | Security Guard (WRONG) | Resident (CORRECT) |
| **Decision Maker** | Guard clicks approve | Resident clicks approve |
| **Status Source** | Manual entry | Real-time Firebase |
| **Telegram Messages** | Default chat ID | Resident's Chat ID |
| **Resident Control** | None | Full approval authority |
| **Update Mechanism** | Polling | Real-time listeners |
| **Photo Attachments** | No | Yes (visitor + Aadhaar) |
| **Inline Buttons** | No | Yes (4 action buttons) |

---

## Implementation Checklist

### Backend (server.ts)
- [ ] Add residents endpoint: `GET /api/residents`
- [ ] Add approval endpoint: `POST /api/approval/send-to-resident`
- [ ] Add webhook handler: `POST /api/webhook/telegram`
- [ ] Add real-time status endpoint: `GET /api/visitors/{id}/status`
- [ ] Add Firebase initialization
- [ ] Add Telegram webhook setup
- [ ] Add real-time SSE for tablet updates

### Frontend Components
- [ ] Update Step6Summary.tsx - Select resident from Firebase list
- [ ] Update approval flow - Call sendApprovalRequestToResident()
- [ ] Add DevOCRPanel.tsx - Debug OCR output
- [ ] Add real-time status listener component
- [ ] Update QR Pass display with resident confirmation

### Firebase Setup
- [ ] Create Firestore collections (residents, visitors, approvals)
- [ ] Create Storage bucket for images
- [ ] Setup security rules
- [ ] Enable real-time listeners

### Telegram Bot
- [ ] Create bot with @BotFather
- [ ] Set webhook for updates
- [ ] Test with inline buttons
- [ ] Configure photo message sending

---

## Testing Checklist

### Unit Tests
- [ ] validateAadhaar() with checksum
- [ ] validatePINCode() format
- [ ] validateDOB() date logic
- [ ] Firebase service methods
- [ ] Telegram message formatting

### Integration Tests
- [ ] End-to-end visitor approval flow
- [ ] Real-time status updates on tablet
- [ ] Photo uploads to Telegram
- [ ] Webhook callback processing
- [ ] QR pass generation

### Manual Testing
- [ ] Guard enters visitor details
- [ ] System sends Telegram to resident
- [ ] Resident approves on phone
- [ ] Tablet shows QR pass immediately
- [ ] Check-in/out workflow

---

## Success Criteria

✅ Approval messages go to RESIDENT only (not guard)
✅ Resident can approve/reject from Telegram
✅ Tablet shows real-time status updates
✅ QR pass generates on approval
✅ Complete audit trail in Firebase
✅ No hallucinated data in OCR
✅ Confidence scores displayed
✅ All photos stored in Firebase

---

## Next Steps

1. **Immediate:** Deploy Firebase integration
2. **Short-term:** Test Telegram webhook callbacks
3. **Medium-term:** Complete Android app integration
4. **Long-term:** Scale to multi-building support

---

## Security Notes

- Resident Chat IDs stored securely in Firestore
- No sensitive data in Telegram messages (no full Aadhaar)
- All approvals logged with resident name & timestamp
- Images stored in Firebase Storage with access control
- Webhook signature validation for Telegram updates

---

**Phase 2 Status:** Ready for Backend Implementation  
**Estimated Completion:** 2-3 days  
**Dependencies:** Firebase setup + Telegram bot token
