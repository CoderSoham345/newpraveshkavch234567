# PHASE 2: PRODUCTION OCR & FIREBASE IMPLEMENTATION PLAN

## OVERVIEW
Replace all fake OCR with production-grade ML Kit + CameraX pipeline. Implement complete resident registration, real-time Telegram approvals, and Firebase integration.

---

## MODULE 1: REAL OCR PIPELINE

### Architecture
```
Camera Input
    ↓
CameraX (Auto Focus + Preview)
    ↓
Auto Crop Detection
    ↓
Perspective Correction
    ↓
Deskew
    ↓
Contrast Enhancement
    ↓
Sharpen
    ↓
Noise Reduction
    ↓
ML Kit Text Recognition v2
    ↓
Raw OCR Text Extraction
    ↓
Field Parser (Aadhaar/PAN specific)
    ↓
Confidence Scoring (0-100%)
    ↓
Validation (Checksum verification)
```

### Files to Create

#### 1. `src/utils/mlKitOCREngine.ts` (NEW - 400 lines)
**Classes:**
- `MLKitOCREngine` - Main OCR processor
  - `processImage(imageData): OcrResult`
  - `extractAadhaarFront(text): AadhaarFrontData`
  - `extractAadhaarBack(text): AadhaarBackData`
  - `calculateConfidence(field, confidence): number`

**Functions:**
- `imagePreprocessing(image): ProcessedImage` - Contrast, sharpen, denoise
- `extractAadhaarFrontFields(text): FieldMap` - Parse name, aadhaar, DOB, gender
- `extractAadhaarBackFields(text): FieldMap` - Parse address, pincode
- `verifyAadhaarChecksum(number): boolean`
- `calculateAgeFromDOB(dob): number` - Never store age

**Exports:**
```typescript
interface OcrResult {
  rawText: string;
  fields: Map<string, FieldData>;
  overallConfidence: number;
  warnings: string[];
}

interface FieldData {
  value: string;
  confidence: number; // 0-100
  color: 'green' | 'yellow' | 'red'; // Based on confidence
  requiresManualVerification: boolean;
}
```

#### 2. `src/components/Step2ScanFront.tsx` (MODIFY - Add ML Kit integration)
- Add ML Kit text recognition on image capture
- Display raw OCR text in developer panel
- Show field confidence scores (green/yellow/red)
- Remove sample data buttons (already done)

#### 3. `src/components/Step4ScanBack.tsx` (MODIFY - Add back side OCR)
- Process back side image with ML Kit
- Extract address fields
- Merge with front data

#### 4. `src/components/DevOCRPanel.tsx` (MODIFY - Already created)
- Display raw ML Kit OCR text (no formatting)
- Show per-field confidence
- Show raw image analysis

---

## MODULE 2: RESIDENT REGISTRATION

### Files to Create

#### 1. `src/components/ResidentRegistration.tsx` (NEW - 500 lines)
**Form Fields:**
- Name (text)
- Mobile (tel)
- Email (email)
- Building (select - from Firebase)
- Wing (text)
- Flat (text)
- Telegram Chat ID (text - user copies from @userinfobot)
- Resident Photo (file upload)
- ID Proof (Aadhaar/PAN - file upload)
- Emergency Contact (text)
- Status (active/inactive - toggle)

**Functions:**
- `handlePhotoUpload(file)` - Upload to Firebase Storage
- `handleIDProofUpload(file)` - Upload to Firebase Storage
- `validateForm()` - All fields required
- `submitResident()` - Save to Firestore

#### 2. `src/services/residentService.ts` (NEW - 250 lines)
**Class: ResidentService**
- `createResident(data): Promise<string>` - Save to Firestore
- `updateResident(id, data): Promise<void>`
- `getResidentByFlatNumber(building, wing, flat): Promise<Resident>`
- `searchResidentByName(name): Promise<Resident[]>`
- `uploadResidentPhoto(file): Promise<url>`
- `uploadIDProof(file): Promise<url>`

---

## MODULE 3: FIREBASE INTEGRATION

### Files to Create

#### 1. `src/services/firebaseService.ts` (COMPLETE - 600 lines)
**Class: FirebaseService (Singleton)**

Methods:
```typescript
// Authentication
initialize(): Promise<boolean>
isConnected(): boolean

// Residents CRUD
createResident(data: Resident): Promise<string>
updateResident(id: string, data: Partial<Resident>): Promise<void>
getResident(id: string): Promise<Resident>
getResidentByLocation(building, wing, flat): Promise<Resident>
getAllResidents(): Promise<Resident[]>
deleteResident(id: string): Promise<void>
listenToResidents(callback): Unsubscribe

// Visitors CRUD
createVisitor(data: VisitorRecord): Promise<string>
updateVisitor(id: string, data: Partial<VisitorRecord>): Promise<void>
getVisitor(id: string): Promise<VisitorRecord>
getAllVisitors(): Promise<VisitorRecord[]>

// Approvals
createApproval(data: VisitorApproval): Promise<string>
updateApprovalStatus(approvalId, status, details): Promise<void>
getApprovalsByResident(residentId): Promise<VisitorApproval[]>
listenToApprovalUpdates(approvalId, callback): Unsubscribe

// Storage
uploadImage(path: string, file: File): Promise<url>
deleteImage(path: string): Promise<void>

// Real-time Listeners
onVisitorStatusChange(visitorId, callback): Unsubscribe
onApprovalStatusChange(approvalId, callback): Unsubscribe
```

#### 2. Database Schema (Firestore Collections)

**Collections:**
```
/residents
  /residentId1
    - name: string
    - building: string
    - wing: string
    - flat: string
    - mobile: string
    - email: string
    - telegramChatId: string
    - telegramUsername: string
    - photoUrl: string
    - idProofUrl: string
    - emergencyContact: string
    - status: 'active' | 'inactive'
    - createdAt: timestamp
    - updatedAt: timestamp

/visitors
  /visitorId1
    - name: string
    - dob: string (never store age)
    - gender: string
    - aadhaarNumber: string
    - phone: string
    - address: string
    - purpose: string
    - building: string
    - wing: string
    - flat: string
    - residentId: string (FK)
    - facePhotoUrl: string
    - aadhaarFrontUrl: string
    - aadhaarBackUrl: string
    - status: 'pending' | 'approved' | 'rejected' | 'checked_in' | 'checked_out'
    - vehicleNumber: string
    - gateName: string
    - securityGuardName: string
    - createdAt: timestamp
    - approvedAt: timestamp
    - checkInAt: timestamp
    - checkOutAt: timestamp

/approvals
  /approvalId1
    - visitorId: string (FK)
    - residentId: string (FK)
    - status: 'pending' | 'viewed' | 'approved' | 'rejected' | 'timed_out'
    - telegramMessageId: string
    - approverName: string
    - rejectionReason: string
    - createdAt: timestamp
    - updatedAt: timestamp

/auditLogs
  /logId1
    - action: string
    - performedBy: string
    - role: string
    - details: string
    - timestamp: timestamp
```

---

## MODULE 4: TELEGRAM INTEGRATION

### Files to Modify

#### 1. `server.ts` (MODIFY - Telegram endpoint)
**Existing endpoint to update:**
- `/api/telegram/send-approval` - Already fixed in Phase 1

**Modifications needed:**
- Query Firestore for resident by building/wing/flat
- Fetch resident's telegramChatId
- Send to resident ONLY
- Include inline buttons

**Endpoint:**
```typescript
POST /api/telegram/send-approval
Body: {
  visitorId: string
  visitorName: string
  dob: string (format: DD/MM/YYYY)
  gender: string
  aadhaarNumber: string
  address: string
  purpose: string
  vehicleNumber: string
  facePhotoUrl: string
  aadhaarFrontUrl: string
  aadhaarBackUrl: string
  building: string
  wing: string
  flat: string
  gateName: string
  guardName: string
}

Response: {
  success: boolean
  telegramMessageId: string (for callbacks)
}
```

#### 2. `server.ts` (ADD - Telegram callbacks)
**New endpoints:**
```typescript
POST /api/telegram/webhook
- Receive button clicks from Telegram
- Update approval status in Firebase
- Notify security tablet via SSE

POST /api/telegram/callback/approve
POST /api/telegram/callback/reject
POST /api/telegram/callback/details
POST /api/telegram/callback/call-security
```

---

## MODULE 5: REAL-TIME UPDATES

### Files to Create

#### 1. `src/hooks/useRealtimeListener.ts` (NEW - 150 lines)
**Hook:**
```typescript
useRealtimeListener(docId: string) {
  const [status, setStatus] = useState<ApprovalStatus>('pending');
  
  useEffect(() => {
    const unsubscribe = FirebaseService.getInstance()
      .onApprovalStatusChange(docId, (newStatus) => {
        setStatus(newStatus);
      });
    
    return unsubscribe;
  }, [docId]);
  
  return status;
}
```

### Files to Modify

#### 1. `src/components/Step7WaitingApproval.tsx` (MODIFY)
- Replace polling with Firebase listener
- Real-time status updates: Waiting → Viewed → Approved/Rejected → Timeout
- No page refresh needed
- Auto-proceed to Step 8 when approved

---

## MODULE 6: FACE DETECTION

### Files to Create

#### 1. `src/utils/mlKitFaceDetection.ts` (NEW - 200 lines)
**Class: FaceDetector**
- `detectFace(imageData): FaceResult`
- `validateFaceQuality(face): boolean`
- `extractFaceMetrics(face): FaceMetrics`

**Exports:**
```typescript
interface FaceResult {
  faceDetected: boolean;
  faceCount: number;
  quality: {
    brightness: number; // 0-100
    sharpness: number; // 0-100
    landmarks: number; // count of detected landmarks
    bounds: {x, y, width, height}; // face position in frame
  };
  recommendations: string[];
}
```

### Files to Modify

#### 1. `src/components/Step5CaptureFace.tsx` (MODIFY)
- Add ML Kit face detection
- Show quality feedback (brightness, sharpness)
- Store face photo in Firebase Storage
- Display face metrics

---

## SUMMARY OF ALL CHANGES

### NEW FILES (6 files)
1. `src/utils/mlKitOCREngine.ts` - OCR pipeline
2. `src/components/ResidentRegistration.tsx` - Resident form
3. `src/services/residentService.ts` - Resident CRUD
4. `src/services/firebaseService.ts` - Firebase integration
5. `src/utils/mlKitFaceDetection.ts` - Face detection
6. `src/hooks/useRealtimeListener.ts` - Real-time listener hook

### MODIFIED FILES (6 files)
1. `src/App.tsx` - Initialize Firebase on startup
2. `src/components/Step2ScanFront.tsx` - Add ML Kit OCR + display confidence
3. `src/components/Step4ScanBack.tsx` - Add back side OCR
4. `src/components/Step5CaptureFace.tsx` - Add face detection
5. `src/components/Step7WaitingApproval.tsx` - Add Firebase listener
6. `server.ts` - Add Telegram callbacks + update approval endpoint

### DEPENDENCIES TO ADD
```json
{
  "@google/genai": "^2.4.0",
  "firebase": "^10.0.0",
  "@firebase/firestore": "^10.0.0",
  "@firebase/storage": "^10.0.0",
  "ml-kit": "^1.0.0" (or use web APIs)
}
```

### DATABASE SCHEMA
- `/residents` collection
- `/visitors` collection
- `/approvals` collection
- `/auditLogs` collection

### API ENDPOINTS
- `POST /api/telegram/send-approval` - MODIFIED (send to resident)
- `POST /api/telegram/webhook` - NEW
- `POST /api/telegram/callback/approve` - NEW
- `POST /api/telegram/callback/reject` - NEW

---

## IMPLEMENTATION ORDER

1. **Firebase Service Setup** - Complete core CRUD operations
2. **OCR Engine** - ML Kit integration for Aadhaar parsing
3. **Resident Registration** - UI + Service
4. **Face Detection** - ML Kit faces
5. **Step components** - Update all 8 steps with real functionality
6. **Telegram Integration** - Complete approval workflow
7. **Real-time Listeners** - Connect Firebase to UI
8. **Testing** - End-to-end flow validation

---

## KEY RULES

✅ Never store age - always calculate from DOB
✅ Never fabricate OCR fields - empty if not detected
✅ Confidence scores: Green (>90%), Yellow (80-90%), Red (<80%)
✅ Telegram sent to resident's personal chat ID only
✅ Real-time updates via Firebase listeners (no polling)
✅ All data persisted in Firestore
✅ All images in Firebase Storage

