# PraveshKavach™ - API Endpoints & Data Schema

**Generated:** August 1, 2026  
**API Version:** v1.0  
**Base URL:** `http://localhost:3000` (dev) or deployed domain

---

## Table of Contents

1. [Visitor Management](#visitor-management-endpoints)
2. [Vision & OCR APIs](#vision--ocr-apis)
3. [Telegram Integration](#telegram-integration-endpoints)
4. [Real-time Events](#real-time-events-sse)
5. [Data Types](#data-structures)
6. [Error Handling](#error-handling)

---

## Visitor Management Endpoints

### GET /api/visitors
**Fetch all visitor records**

**Query Parameters:**
```
?status=APPROVED       // Filter by status (optional)
?resident=res-101      // Filter by resident ID (optional)
?date=2026-08-01       // Filter by date (optional)
?limit=50              // Pagination limit (default: all)
?offset=0              // Pagination offset (default: 0)
```

**Response (200 OK):**
```json
{
  "success": true,
  "visitors": [
    {
      "id": "vis-1001",
      "passNumber": "VP-2026-8812",
      "visitorName": "Ramesh Kumar",
      "phone": "+91 98989 12345",
      "documentType": "Aadhaar Card",
      "documentNumber": "5482 1111 2222",
      "frontDocUrl": "data:image/jpeg;base64,...",
      "backDocUrl": "data:image/jpeg;base64,...",
      "liveFaceUrl": "data:image/jpeg;base64,...",
      "extractedData": { /* ExtractedDocData */ },
      "faceMetrics": { /* FaceVerificationData */ },
      "residentId": "res-101",
      "residentName": "Rajesh Sharma",
      "buildingUnit": "Tower A - Apex Heights (Flat 302)",
      "purpose": "Personal Visit",
      "vehicleNumber": "TN 01 AB 1234",
      "numAccompanying": 1,
      "status": "CHECKED_IN",
      "createdAt": "2026-08-01T10:30:00Z",
      "approvedAt": "2026-08-01T10:35:00Z",
      "checkInAt": "2026-08-01T10:40:00Z",
      "gateName": "Main Gate 01",
      "guardName": "Security Officer Suresh",
      "qrCodeValue": "PRAVESHKAVACH-VIS-1001"
    }
  ]
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Database error message"
}
```

---

### POST /api/visitors
**Create new visitor record with verification data**

**Request Body:**
```json
{
  "visitorName": "Ramesh Kumar",
  "phone": "+91 98989 12345",
  "documentType": "Aadhaar Card",
  "documentNumber": "5482 1111 2222",
  "frontDocUrl": "data:image/jpeg;base64,...",
  "backDocUrl": "data:image/jpeg;base64,...",
  "liveFaceUrl": "data:image/jpeg;base64,...",
  "extractedData": {
    "fullName": "RAMESH KUMAR",
    "dob": "15/08/1990",
    "gender": "Male",
    "fatherName": "RAMESH PRASAD",
    "address": "123, Green Street, Chennai, TN",
    "pinCode": "600001",
    "documentNumber": "5482 1111 2222",
    "documentType": "Aadhaar Card",
    "confidenceScore": 98,
    "lowConfidenceFields": []
  },
  "faceMetrics": {
    "faceDetected": true,
    "qualityScore": 96,
    "brightness": 92,
    "sharpness": 94,
    "framingPass": true,
    "livenessPassed": true,
    "maskDetected": false,
    "faceMatchScore": 98
  },
  "residentId": "res-101",
  "residentName": "Rajesh Sharma",
  "buildingUnit": "Tower A - Apex Heights (Flat 302)",
  "purpose": "Personal Visit",
  "vehicleNumber": "TN 01 AB 1234",
  "numAccompanying": 1,
  "autoApprove": false
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "visitor": {
    "id": "vis-1001",
    "passNumber": "VP-2026-8812",
    "visitorName": "Ramesh Kumar",
    "phone": "+91 98989 12345",
    "documentType": "Aadhaar Card",
    "documentNumber": "5482 1111 2222",
    "frontDocUrl": "data:image/jpeg;base64,...",
    "backDocUrl": "data:image/jpeg;base64,...",
    "liveFaceUrl": "data:image/jpeg;base64,...",
    "extractedData": { /* as in request */ },
    "faceMetrics": { /* as in request */ },
    "residentId": "res-101",
    "residentName": "Rajesh Sharma",
    "buildingUnit": "Tower A - Apex Heights (Flat 302)",
    "purpose": "Personal Visit",
    "vehicleNumber": "TN 01 AB 1234",
    "numAccompanying": 1,
    "status": "PENDING",
    "createdAt": "2026-08-01T10:30:00Z",
    "gateName": "Main Gate 01",
    "guardName": "Security Officer Suresh",
    "qrCodeValue": "PRAVESHKAVACH-1234567890"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Invalid request body or missing required fields"
}
```

---

### PATCH /api/visitors/{id}/status
**Update visitor status (approve, reject, check-in, check-out)**

**Path Parameters:**
```
id: string        // Visitor ID or pass number
```

**Request Body:**
```json
{
  "status": "APPROVED",
  "rejectionReason": "Not allowed"  // Only required if status=REJECTED
}
```

**Valid Status Transitions:**
```
PENDING          → APPROVED / REJECTED
APPROVED         → CHECKED_IN
REJECTED         → (no transitions)
CHECKED_IN       → CHECKED_OUT
CHECKED_OUT      → (no transitions)
CANCELLED        → (final state)
```

**Response (200 OK):**
```json
{
  "success": true,
  "visitor": {
    "id": "vis-1001",
    "status": "APPROVED",
    "approvedAt": "2026-08-01T10:35:00Z",
    "approvedBy": "Rajesh Sharma",
    "/* rest of visitor object */"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Visitor not found"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Invalid status transition"
}
```

---

## Vision & OCR APIs

### POST /api/ocr
**Extract document data using Google Gemini API**

**Request Body:**
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "docType": "Aadhaar Card"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "extractedData": {
    "fullName": "RAMESH KUMAR",
    "dob": "15/08/1990",
    "age": "34 Years",
    "gender": "Male",
    "fatherName": "RAMESH PRASAD",
    "address": "123, Green Street, Lake View Apartment, Chennai, TN - 600001",
    "pinCode": "600001",
    "documentNumber": "5482 1111 2222",
    "documentType": "Aadhaar Card",
    "confidenceScore": 98,
    "lowConfidenceFields": [],
    "fieldConfidences": {
      "fullName": { "value": "RAMESH KUMAR", "confidence": 99, "isValid": true },
      "dob": { "value": "15/08/1990", "confidence": 98, "isValid": true },
      "documentNumber": { "value": "5482 1111 2222", "confidence": 99, "isValid": true }
    },
    "aadhaarVersion": "v2.0 UIDAI Cryptographic QR",
    "uidaiInfo": "UIDAI Verified Government Identity"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Invalid image format or OCR processing failed",
  "fallback": {
    "fullName": "Not Detected – Please Verify Manually",
    "documentNumber": "Not Detected – Please Verify Manually"
  }
}
```

---

### POST /api/face-match
**Verify if live face matches ID document photo using Gemini API**

**Request Body:**
```json
{
  "faceImageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "idImageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "faceMetrics": {
    "faceDetected": true,
    "qualityScore": 96,
    "brightness": 92,
    "sharpness": 94,
    "framingPass": true,
    "livenessPassed": true,
    "maskDetected": false,
    "faceMatchScore": 98,
    "capturedFaceUrl": "data:image/jpeg;base64,...",
    "matchDetails": {
      "distanceBetweenEyes": "0.15",
      "faceWidthPercentage": "0.45",
      "symmetryScore": "0.94",
      "livenessIndicators": ["eye_blink", "head_turn"]
    }
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Face not detected or quality too low",
  "faceMetrics": {
    "faceDetected": false,
    "qualityScore": 35,
    "brightness": 25,
    "sharpness": 40,
    "framingPass": false,
    "livenessPassed": false,
    "maskDetected": false,
    "faceMatchScore": 0
  }
}
```

---

## Telegram Integration Endpoints

### GET /api/telegram/config
**Get current Telegram bot configuration**

**Response (200 OK):**
```json
{
  "success": true,
  "config": {
    "botEnabled": true,
    "hasBotToken": true,
    "botTokenMasked": "8612476614:AAErLL...dKQO65U",
    "defaultChatId": "8612476614",
    "lastMessageTime": "2026-08-01T10:25:30Z"
  }
}
```

---

### POST /api/telegram/config
**Update Telegram bot configuration**

**Request Body:**
```json
{
  "botToken": "8612476614:AAErLL7CNMivZYmYpCBMEjzJQfhd2KQO65U",
  "defaultChatId": "8612476614",
  "botEnabled": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Telegram Bot configuration saved successfully",
  "config": {
    "botEnabled": true,
    "hasBotToken": true,
    "defaultChatId": "8612476614",
    "lastMessageTime": "2026-08-01T10:25:30Z"
  }
}
```

---

### POST /api/telegram/test
**Test Telegram bot connection**

**Request Body (optional):**
```json
{
  "botToken": "8612476614:AAErLL7CNMivZYmYpCBMEjzJQfhd2KQO65U",
  "defaultChatId": "8612476614"
}
```

**Response (200 OK - Connected):**
```json
{
  "success": true,
  "botInfo": {
    "id": 5687364521,
    "is_bot": true,
    "first_name": "PraveshKavach",
    "username": "pravesh_kavach_bot",
    "can_join_groups": true,
    "can_read_all_group_messages": true,
    "supports_inline_queries": false,
    "can_connect_to_business": false
  },
  "testMessageSent": true,
  "message": "Telegram Connected Successfully (@pravesh_kavach_bot)"
}
```

**Response (200 OK - Failed):**
```json
{
  "success": false,
  "message": "Telegram Connection Failed: Invalid Bot Token"
}
```

---

### GET /api/telegram/messages
**Fetch chat message history between guard and resident**

**Response (200 OK):**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg-101",
      "chatId": "8612476614",
      "sender": "resident",
      "senderName": "Rajesh Sharma (Flat 302)",
      "text": "Please ask the delivery executive to leave the package at the security cabin.",
      "timestamp": "2026-08-01T10:15:00Z"
    },
    {
      "id": "msg-102",
      "chatId": "8612476614",
      "sender": "guard",
      "senderName": "Security Officer Suresh",
      "text": "Noted sir! Delivery package received at Main Gate Cabin 01.",
      "timestamp": "2026-08-01T10:17:00Z"
    }
  ]
}
```

---

### POST /api/telegram/messages/send
**Send message from security guard to Telegram resident**

**Request Body:**
```json
{
  "chatId": "8612476614",
  "text": "Visitor Ramesh Kumar is waiting at main gate. Please confirm entry.",
  "guardName": "Security Officer Suresh"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": {
    "id": "msg-103",
    "chatId": "8612476614",
    "sender": "guard",
    "senderName": "Security Officer Suresh",
    "text": "Visitor Ramesh Kumar is waiting at main gate. Please confirm entry.",
    "timestamp": "2026-08-01T10:30:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Message text cannot be empty"
}
```

---

### POST /api/telegram/send-approval
**Send interactive approval request to Telegram with callback buttons**

**Request Body:**
```json
{
  "visitorId": "vis-1001",
  "passNumber": "VP-2026-8812",
  "visitorName": "Ramesh Kumar",
  "residentName": "Rajesh Sharma",
  "buildingUnit": "Tower A - Apex Heights (Flat 302)",
  "purpose": "Personal Visit",
  "faceUrl": "data:image/jpeg;base64,...",
  "docUrl": "data:image/jpeg;base64,...",
  "documentType": "Aadhaar Card",
  "documentNumber": "5482 1111 2222",
  "guardName": "Security Officer Suresh",
  "gateName": "Main Gate 01",
  "dob": "15/08/1990",
  "age": "34 Years",
  "gender": "Male",
  "address": "123, Green Street, Chennai, TN",
  "building": "Tower A",
  "wing": "Main Wing",
  "flatNumber": "Flat 302"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "sentViaRealTelegram": true,
  "telegramError": null,
  "message": "Interactive approval notification dispatched to Telegram!",
  "simulatedTelegramMessage": {
    "caption": "🔔 *NEW VISITOR APPROVAL REQUEST*\n---------------------------------------\n👤 *Visitor Name:* Ramesh Kumar\n🆔 *Visitor ID / Pass:* VP-2026-8812\n📄 *Document:* Aadhaar Card (5482 1111 2222)\n🎂 *Date of Birth:* 15/08/1990\n⏳ *Calculated Age:* 34 Years\n🚻 *Gender:* Male\n📍 *Address:* 123, Green Street, Chennai, TN\n🎯 *Purpose of Visit:* Personal Visit\n🏢 *Building:* Tower A | *Wing:* Main Wing\n🚪 *Flat Number:* Flat 302\n👨‍👩‍👧 *Resident Name:* Rajesh Sharma\n👮 *Security Guard:* Security Officer Suresh (Main Gate 01)\n🕒 *Date & Time:* 08/01/2026 at 10:30:15 AM\n\n*Please select an action below to respond:*",
    "inlineKeyboard": {
      "inline_keyboard": [
        [
          { "text": "✅ Approve", "callback_data": "approve_vis-1001" },
          { "text": "❌ Reject", "callback_data": "reject_vis-1001" }
        ],
        [
          { "text": "📞 Call Security", "callback_data": "call_vis-1001" },
          { "text": "👤 View Visitor Details", "callback_data": "view_vis-1001" }
        ]
      ]
    }
  }
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Failed to send approval request"
}
```

---

### POST /api/telegram/webhook
**Telegram callback handler (approve/reject buttons)**

**Telegram sends:**
```json
{
  "update_id": 123456789,
  "callback_query": {
    "id": "4382bfdwdbdwdbd",
    "from": {
      "id": 8612476614,
      "is_bot": false,
      "first_name": "Rajesh",
      "username": "rajesh_sharma"
    },
    "chat_instance": "5892038054",
    "data": "approve_vis-1001",
    "message": {
      "message_id": 42,
      "chat": { "id": 8612476614 }
    }
  }
}
```

**Endpoint Processes:**
1. Extracts action (approve/reject/call/view) and visitorId
2. Updates visitor status in visitorsStore
3. Broadcasts SSE event to all connected clients
4. Answers callback query on Telegram with alert
5. Updates message caption to show decision

**Response (200 OK):**
```json
{
  "ok": true
}
```

---

## Real-time Events (SSE)

### GET /api/events
**Server-Sent Events endpoint for real-time updates**

**Usage:**
```javascript
const eventSource = new EventSource('/api/events');

eventSource.addEventListener('visitor_updated', (event) => {
  const visitor = JSON.parse(event.data);
  console.log('Visitor status changed:', visitor);
});

eventSource.addEventListener('telegram_approval_sent', (event) => {
  const { visitorId, visitorName, residentName } = JSON.parse(event.data);
  console.log(`Approval request sent to ${residentName} for ${visitorName}`);
});

eventSource.addEventListener('telegram_chat_message', (event) => {
  const message = JSON.parse(event.data);
  console.log(`New message from ${message.senderName}: ${message.text}`);
});

eventSource.addEventListener('connected', (event) => {
  console.log('SSE connection established');
});
```

**Event Types:**

#### visitor_updated
```json
{
  "id": "vis-1001",
  "status": "APPROVED",
  "approvedAt": "2026-08-01T10:35:00Z",
  "approvedBy": "Rajesh Sharma",
  "/* rest of visitor object */"
}
```

#### telegram_approval_sent
```json
{
  "visitorId": "vis-1001",
  "visitorName": "Ramesh Kumar",
  "residentName": "Rajesh Sharma",
  "buildingUnit": "Tower A - Apex Heights (Flat 302)",
  "timestamp": "2026-08-01T10:30:00Z"
}
```

#### telegram_chat_message
```json
{
  "id": "msg-103",
  "chatId": "8612476614",
  "sender": "guard",
  "senderName": "Security Officer Suresh",
  "text": "Visitor approved. Please proceed to main entrance.",
  "timestamp": "2026-08-01T10:31:00Z"
}
```

---

## Data Structures

### ExtractedDocData
```typescript
interface ExtractedDocData {
  fullName: string;                    // e.g., "RAMESH KUMAR"
  dob: string;                         // e.g., "15/08/1990"
  gender: string;                      // "Male" | "Female" | "Other"
  fatherName?: string;                 // e.g., "RAMESH PRASAD"
  address?: string;                    // Full address from document
  pinCode?: string;                    // e.g., "600001"
  documentNumber: string;              // e.g., "5482 1111 2222"
  issueDate?: string;                  // e.g., "01/01/2021"
  expiryDate?: string;                 // e.g., "31/12/2030"
  nationality?: string;                // e.g., "Indian"
  documentType: DocumentType;          // e.g., "Aadhaar Card"
  confidenceScore: number;             // 0-100
  lowConfidenceFields: string[];       // Field names with <80% confidence
  
  // Document-specific fields
  age?: string;                        // e.g., "34 Years"
  state?: string;                      // For Aadhaar
  qrCodeData?: string;                 // QR code content
  aadhaarVersion?: string;             // e.g., "v2.0 UIDAI Cryptographic QR"
  uidaiInfo?: string;                  // UIDAI verification info
  panType?: string;                    // For PAN: "Individual" | "Company" | ...
  placeOfBirth?: string;               // For Passport
  issuingAuthority?: string;           // Issuing authority
  mrzCode?: string;                    // Machine Readable Zone for Passport
  bloodGroup?: string;                 // For Driving Licence (O+, A+, B+, AB+, etc.)
  vehicleCategories?: string;          // For Driving Licence (MCWG, LMV, etc.)
  epicNumber?: string;                 // For Voter ID
  constituency?: string;               // For Voter ID
  employeeId?: string;                 // For Employee Card
  companyName?: string;                // For Employee Card
  department?: string;                 // For Employee Card
  designation?: string;                // For Employee Card
  validTill?: string;                  // For Employee/Student ID
  studentId?: string;                  // For Student ID
  collegeName?: string;                // For Student ID
  course?: string;                     // For Student ID
  academicYear?: string;               // For Student ID
  
  // Per-field confidence map
  fieldConfidences?: Record<string, FieldWithConfidence>;
}
```

### FaceVerificationData
```typescript
interface FaceVerificationData {
  faceDetected: boolean;               // Face found in frame
  qualityScore: number;                // 0-100 overall quality
  brightness: number;                  // 0-100 (40-90 ideal)
  sharpness: number;                   // 0-100 (Laplacian variance)
  framingPass: boolean;                // Face occupies 30-70% of frame
  livenessPassed: boolean;             // Blink/movement detected
  maskDetected: boolean;               // Face mask or sunglasses
  faceMatchScore: number;              // 0-100 (vs ID document)
  capturedFaceUrl?: string;            // Base64 image URL
}
```

### FieldWithConfidence
```typescript
interface FieldWithConfidence {
  value: string;                       // Extracted field value
  confidence: number;                  // 0-100 confidence
  isValid: boolean;                    // Passes validation regex
  errorMessage?: string;               // Validation error if any
}
```

### VisitorRecord
```typescript
interface VisitorRecord {
  id: string;                          // Unique ID (e.g., "vis-1001")
  passNumber: string;                  // Visible pass number (e.g., "VP-2026-8812")
  visitorName: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
  frontDocUrl: string;                 // Base64 JPEG
  backDocUrl?: string;                 // Base64 JPEG
  liveFaceUrl: string;                 // Base64 JPEG
  extractedData: ExtractedDocData;     // Full OCR results
  faceMetrics: FaceVerificationData;   // Full face verification results
  residentId: string;
  residentName: string;
  buildingUnit: string;                // e.g., "Tower A - Apex Heights (Flat 302)"
  purpose: string;                     // Visit purpose
  vehicleNumber?: string;              // Optional vehicle
  numAccompanying?: number;            // Number of accompanying persons
  status: VisitorStatus;               // Current status
  rejectionReason?: string;            // Reason if rejected
  createdAt: string;                   // ISO timestamp
  approvedAt?: string;                 // ISO timestamp
  approvedBy?: string;                 // Name of approver
  rejectedAt?: string;                 // ISO timestamp
  checkInAt?: string;                  // ISO timestamp
  checkOutAt?: string;                 // ISO timestamp
  gateName: string;                    // e.g., "Main Gate 01"
  guardName: string;                   // e.g., "Security Officer Suresh"
  qrCodeValue: string;                 // For pass generation
  dob?: string;                        // Derived from document
  age?: string;                        // Calculated age
  gender?: string;                     // From document
  address?: string;                    // From document
}
```

### Resident
```typescript
interface Resident {
  id: string;                          // e.g., "res-101"
  name: string;
  building: string;                    // e.g., "Tower A - Apex Heights"
  flatNumber: string;                  // e.g., "Flat 302"
  department?: string;                 // e.g., "Software Engineering"
  phone: string;
  email: string;
  avatarUrl?: string;                  // Unsplash URL
  autoApproveGuests?: boolean;         // Auto-approve flag
}
```

### SystemBuilding
```typescript
interface SystemBuilding {
  id: string;                          // e.g., "bld-1"
  name: string;                        // e.g., "Tower A - Apex Heights"
  code: string;                        // e.g., "TWR-A"
  totalUnits: number;                  // Number of flats
  occupancyRate: number;               // Percentage (0-100)
  managerName: string;                 // Building manager name
}
```

### AuditLogItem
```typescript
interface AuditLogItem {
  id: string;
  timestamp: string;                   // ISO timestamp
  action: string;                      // e.g., "VISITOR_APPROVED"
  performedBy: string;                 // User name
  role: UserRole;                      // User role
  details: string;                     // Action description
  ipAddress: string;                   // Client IP or "TelegramBot"
}
```

### AnalyticsStats
```typescript
interface AnalyticsStats {
  totalVisitorsToday: number;
  currentlyInside: number;
  pendingApprovals: number;
  rejectedVisitorsToday: number;
  avgVerificationTimeSec: number;
  peakHour: string;                    // e.g., "11:00 AM"
  weeklyTrends: Array<{
    day: string;                       // "Mon", "Tue", etc.
    count: number;
    approved: number;
    rejected: number;
  }>;
  hourlyTraffic: Array<{
    hour: string;                      // "08:00", "09:00", etc.
    count: number;
  }>;
  purposeBreakdown: Array<{
    purpose: string;
    count: number;
    percentage: number;
  }>;
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK - Request successful | GET /api/visitors |
| 201 | Created - Resource created | POST /api/visitors |
| 400 | Bad Request - Invalid input | Missing required fields |
| 404 | Not Found - Resource doesn't exist | GET /api/visitors/invalid-id |
| 500 | Server Error - Internal server error | Database failure |

### Error Response Format

**Standard Error Response:**
```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details (optional)",
  "timestamp": "2026-08-01T10:30:00Z"
}
```

**Validation Error Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "visitorName": "Visitor name is required",
    "phone": "Invalid phone format"
  }
}
```

---

## Rate Limiting (Optional for Production)

**Recommended Limits:**
- `/api/ocr` - 30 requests/minute per IP (expensive Gemini API calls)
- `/api/face-match` - 30 requests/minute per IP
- `/api/visitors` (POST) - 60 requests/minute per user
- `/api/telegram/send-approval` - 100 requests/minute per guard
- `/api/telegram/test` - 5 requests/minute per user

---

## Authentication (Optional for Production)

**Add Bearer token to requests:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Required for protected routes:**
- POST /api/visitors
- PATCH /api/visitors/{id}/status
- POST /api/telegram/send-approval
- POST /api/telegram/config

---

## API Testing with cURL

### Create Visitor
```bash
curl -X POST http://localhost:3000/api/visitors \
  -H "Content-Type: application/json" \
  -d '{
    "visitorName": "Ramesh Kumar",
    "phone": "+91 98989 12345",
    "documentType": "Aadhaar Card",
    "documentNumber": "5482 1111 2222",
    "frontDocUrl": "data:image/jpeg;base64,...",
    "residentId": "res-101",
    "purpose": "Personal Visit"
  }'
```

### Update Status
```bash
curl -X PATCH http://localhost:3000/api/visitors/vis-1001/status \
  -H "Content-Type: application/json" \
  -d '{"status": "APPROVED"}'
```

### Test Telegram
```bash
curl -X POST http://localhost:3000/api/telegram/test \
  -H "Content-Type: application/json" \
  -d '{
    "botToken": "your_token_here",
    "defaultChatId": "your_chat_id"
  }'
```

### Listen to SSE Events
```bash
curl -N http://localhost:3000/api/events
```

---

## API Versioning

**Current Version:** v1.0  
**Base URL:** `/api` (implicit v1)

**Future Versions:**
- `/api/v2` - For breaking changes
- `/api/v1` - Deprecated

---

## CORS Configuration

**Allowed Origins (for production):**
```
https://yourdomain.com
https://*.yourdomain.com
https://localhost:3000 (dev)
```

**Allowed Methods:**
- GET, POST, PATCH, DELETE, OPTIONS

**Allowed Headers:**
- Content-Type, Authorization, X-Requested-With

---

## Webhook Security (Telegram)

**Verify Telegram Signature:**
```javascript
const crypto = require('crypto');

function verifyTelegramWebhook(req) {
  const botToken = process.env.BOT_TOKEN;
  const hmacSha256 = (str, secret) => crypto
    .createHmac('sha256', secret)
    .update(str)
    .digest('hex');
  
  const secretKey = hmacSha256(botToken, 'WebAppData');
  // Implementation...
}
```

---

## Conclusion

This API documentation provides complete specifications for all endpoints, data structures, and integration patterns. For implementation guidance, refer to the server.ts file and component code in the codebase.

---

*End of API & Schema Documentation*
