# PraveshKavach™ - Complete File Index

**Generated:** August 1, 2026  
**Total Files:** 25+ source files + configuration

---

## Root Directory Files

### Configuration & Metadata

| File | Size | Purpose | Status |
|---|---|---|---|
| `package.json` | 40 lines | NPM dependencies, build scripts, project metadata | ✅ Complete |
| `tsconfig.json` | 20 lines | TypeScript compiler configuration (ES2022, React JSX) | ✅ Complete |
| `vite.config.ts` | 15 lines | Vite bundler config (Tailwind + React plugins) | ✅ Complete |
| `index.html` | 20 lines | HTML entry point, OpenCV.js loader, root div | ✅ Complete |
| `.env.example` | 10 lines | Environment variable template (API keys, URLs) | ✅ Complete |
| `.gitignore` | Standard | Git ignore patterns (node_modules, dist, .env) | ✅ Complete |
| `bun.lock` | Auto-generated | Bun package manager lock file | ✅ Complete |
| `metadata.json` | 8 lines | Project metadata (camera permission, capabilities) | ✅ Complete |

---

## Backend

### `server.ts` (1150 lines)
**Express.js backend server with API routes, Telegram integration, SSE event broadcasting**

**Key Sections:**
- **Lines 1-25:** Imports & initialization
- **Lines 25-40:** In-memory data stores initialization
- **Lines 40-55:** SSE clients array & broadcast function
- **Lines 41-55:** GET /api/events (SSE endpoint)
- **Lines 58-87:** Telegram config management (GET/POST /api/telegram/config)
- **Lines 90-149:** POST /api/telegram/test (connection test)
- **Lines 152-187:** GET /api/telegram/messages (fetch chat history)
- **Lines 190-240:** POST /api/telegram/messages/send (send from guard to resident)
- **Lines 243-345:** POST /api/telegram/send-approval (interactive approval with buttons)
- **Lines 348-447:** POST /api/telegram/webhook (Telegram callback handler)
- **Lines 451-530:** GET /api/visitors (fetch all visitors)
- **Lines 530-600:** POST /api/visitors (create new visitor record)
- **Lines 600-700:** GET /api/residents (fetch residents)
- **Lines 700-750:** PATCH /api/visitors/{id}/status (update status)
- **Lines 750-850:** POST /api/ocr (Gemini OCR extraction)
- **Lines 850-950:** POST /api/face-match (Gemini face verification)
- **Lines 950-1050:** Telegram polling loop (getUpdates)
- **Lines 1050-1150:** Vite dev server setup

**API Endpoints Provided:**
- Visitor CRUD operations
- OCR via Google Gemini API
- Face verification matching
- Telegram bot configuration & callbacks
- Real-time SSE broadcasts
- Chat message history

---

## Frontend - React Source Code

### Core Application

#### `src/main.tsx` (20 lines)
**React application entry point**
- Imports React 19, ReactDOM
- Mounts App component to #root
- Imports global CSS

#### `src/index.css` (50+ lines)
**Global Tailwind CSS styles**
- Font imports (Plus Jakarta Sans, Space Grotesk)
- Base layer utilities
- Custom color schemes
- Animation definitions

#### `src/App.tsx` (320+ lines)
**Main application orchestrator & state manager**

**State Management:**
```
Global State:
- currentRole: UserRole (SECURITY_GUARD, RESIDENT, RECEPTIONIST, ADMIN, VISITOR, FACILITY_MANAGER)
- activeTab: 'scanner' | 'dashboard' | 'history' | 'residents' | 'reports' | 'admin'
- currentStep: WorkflowStep (1-8)
- isMobileView: boolean

Master Data Stores:
- visitors: VisitorRecord[]
- residents: Resident[]
- buildings: SystemBuilding[]
- auditLogs: AuditLogItem[]
- analytics: AnalyticsStats

Workflow Temporary States:
- selectedDocType: DocumentType
- frontDocImage, backDocImage, liveFaceImage: string (base64)
- extractedData: ExtractedDocData
- faceMetrics: FaceVerificationData
- selectedResidentId, visitPurpose, vehicleNumber, visitorPhone: string
- currentVisitorRecord: VisitorRecord | null
```

**Key Functions:**
- `handleStartWorkflow()`: Initialize document scanning
- `handleFrontCaptureCompleted()`: Process front document, call OCR API
- `handleBackCaptureCompleted()`: Process back document for address
- `handleFaceCaptureCompleted()`: Process face capture, call face-match API
- `handleSendRequest()`: Submit visitor record to backend
- `handleApproveStatus()`: Approve visitor via API
- `handleRejectStatus()`: Reject visitor with reason
- `handleCheckInPass()`: Mark visitor as checked in
- `handleCheckOutPass()`: Mark visitor as checked out
- `handleResetVerification()`: Clear workflow state for new verification

**Component Tree:**
```
App
├── Header
├── Navigation
└── MobileFrame
    └── [Active Tab Component]
        ├── Step1Dashboard | Step2ScanFront | Step3VerifyFront | ...
        ├── VisitorHistory | ResidentsDirectory | ReportsAnalytics | AdminSettings
        └── TelegramGuardChatModal
```

---

### Type Definitions

#### `src/types.ts` (150+ lines)
**Complete TypeScript type definitions & interfaces**

**User Roles:**
- `UserRole`: 'SECURITY_GUARD' | 'RESIDENT' | 'RECEPTIONIST' | 'ADMIN' | 'VISITOR' | 'FACILITY_MANAGER'

**Document Types:**
- `DocumentType`: 'Aadhaar Card' | 'PAN Card' | 'Passport' | 'Driving Licence' | 'Voter ID' | 'Employee Card' | 'Student ID' | 'Visitor Pass'

**Workflow:**
- `WorkflowStep`: 1-8 (Dashboard → Approval Result)
- `VisitorStatus`: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'

**Core Entities:**
- `ExtractedDocData`: OCR-extracted fields, per-field confidence, document-specific fields
- `FaceVerificationData`: Face detection, quality metrics, liveness checks, face match score
- `Resident`: Building occupant with auto-approval flag
- `VisitorRecord`: Complete visitor transaction with all metadata
- `SystemBuilding`: Building/tower information
- `AuditLogItem`: Action logging for compliance
- `AnalyticsStats`: Aggregated metrics (daily, weekly, hourly)

**Interfaces:**
- `FieldWithConfidence`: Per-field OCR confidence (value, confidence, isValid, errorMessage)

---

### Data & Utilities

#### `src/data/mockData.ts` (200+ lines)
**Initial state data for development & testing**

**Exports:**
- `INITIAL_RESIDENTS[]`: 5 sample residents (Rajesh, Priya, Vikram, Ananya, David)
- `INITIAL_VISITORS[]`: 2 sample visitor records (Ramesh Kumar, Sanjay Verma)
- `INITIAL_BUILDINGS[]`: 3 sample buildings (Tower A, B, C)
- `INITIAL_AUDIT_LOGS[]`: Sample audit events
- `INITIAL_ANALYTICS`: Sample analytics metrics
- `MOCK_SAMPLE_IDS[]`: Sample OCR data for testing (Aadhaar, PAN)

**Use Case:** Development, demo, testing without API calls

---

#### `src/utils/cvEngine.ts` (400+ lines)
**Computer vision engine for document quad detection & perspective transformation**

**Key Types:**
```typescript
interface Point { x: number; y: number }
interface QuadCorners { topLeft, topRight, bottomRight, bottomLeft: Point }
interface DetectedQuad { corners, width, height, aspectRatio, areaRatio, confidence }
interface ScanValidationResult {
  quadDetected, quad, hasFaceInFrame, faceWarningMessage,
  blurDetected, blurScore, glareDetected, glareScore, brightnessScore,
  aspectRatioValid, allCriteriaPassed, failureReasons, qrCodeData
}
```

**Key Functions:**
- `isOpenCVReady()`: Check if OpenCV.js is loaded
- `sortQuadCorners(pts: Point[])`: Sort 4 points into QuadCorners
- `smoothCorners(current, previous, factor)`: Smooth jitter across frames
- `checkFaceInFrame(ctx, width, height)`: RGB skin tone detection
- `analyzeDocumentFrame(canvas, docType)`: Main frame analyzer
  - Detects document quad using OpenCV.js (with Canvas 2D fallback)
  - Detects faces in frame
  - Validates aspect ratio (1.25-1.85 for ID-1 cards)
  - Calculates blur & glare scores
  - QR code detection via jsQR
- `cropAndStraightenDocument(sourceCanvas, corners)`: Perspective transform
  - Maps quad to 856x540 rectangle
  - Uses OpenCV.js warpPerspective or Canvas 2D fallback
  - Returns JPEG base64 URL

**OpenCV.js Features Used:**
- Grayscale conversion (`cvtColor`)
- Gaussian blur (`GaussianBlur`)
- Canny edge detection (`Canny`)
- Contour finding (`findContours`, `contourArea`)
- Polygon approximation (`approxPolyDP`, `isContourConvex`)
- Laplacian blur detection (`Laplacian`, `meanStdDev`)
- Perspective transform (`getPerspectiveTransform`, `warpPerspective`)

**Canvas 2D Fallbacks:**
- Skin tone detection via getImageData pixel analysis
- Dynamic quad based on canvas margins (15% X, 20% Y)
- Simple crop without perspective transform

---

#### `src/utils/documentParsers.ts` (350+ lines)
**OCR field schemas, document classification, age calculation, field validation**

**Key Types:**
```typescript
interface DocTypeSchema {
  type: DocumentType
  label: string
  iconName: string
  fields: {
    key: keyof ExtractedDocData
    label: string
    type: 'text' | 'date' | 'select' | 'number'
    validationRegex?: RegExp
    required?: boolean
  }[]
}
```

**Key Exports:**
- `DOCUMENT_SCHEMAS`: Registry of 8 document types with field definitions
  - Aadhaar Card: 11 fields (number, name, DOB, gender, father name, address, PIN, state, version, UIDAI info)
  - PAN Card: 5 fields (number, name, father name, DOB, PAN type)
  - Passport: 9 fields (number, name, nationality, gender, DOB, birth place, issue date, expiry, authority, MRZ)
  - Driving Licence: 8 fields (number, name, DOB, address, blood group, vehicle categories, issue, expiry, RTO)
  - Voter ID: 6 fields (EPIC, name, gender, DOB, address, constituency)
  - Employee Card: 6 fields (ID, name, company, department, designation, valid till)
  - Student ID: 6 fields (roll no, name, college, course, academic year, valid till)
  - Visitor Pass: 2 fields (pass number, visitor name)

**Key Functions:**
- `classifyDocumentType(ocrText: string)`: Classify doc type by keywords & regex patterns
- `calculateAgeFromDOB(dob: string)`: Calculate age from DD/MM/YYYY format
- `validateAndComputeFieldConfidences(docData)`: Compute per-field confidence scores
  - Auto-calculate age from DOB if present
  - Validate fields against schema regex
  - Mark low-confidence fields (<80%)
  - Return overall average confidence
- `getSampleExtractionDataForDoc(docType)`: Get preset sample data for each document type

**Validation Rules:**
- Aadhaar: 12 digits (XXXX XXXX XXXX)
- PAN: 10 chars (ABCDE1234F)
- Passport: 1 letter + 7 digits (Z9821034)
- Driving Licence: RTO code + digits (DL-0420110012345)
- Voter ID: 3 letters + 7 digits (ABC1234567)
- PIN Code: 6 digits

---

### Components - User Interface

#### `src/components/Header.tsx` (180+ lines)
**Top navigation header with role switcher, sync status, camera status, pending count**

**Props:**
```typescript
interface HeaderProps {
  currentRole: UserRole
  setCurrentRole: (role: UserRole) => void
  isMobileView: boolean
  setIsMobileView: (val: boolean) => void
  pendingApprovalsCount: number
  cameraActive: boolean
  syncTime: string
  onNavigateHome: () => void
  onOpenTelegramChat?: () => void
}
```

**Features:**
- Brand logo with gradient background
- Role switcher dropdown (6 roles)
- Sync status indicator (Connected with time)
- Camera status badge (Camera Ready / Idle)
- Pending approvals badge
- Mobile view toggle
- Home navigation button
- Telegram chat button (if provided)

**Styling:** Tailwind CSS with glass-morphism effect

---

#### `src/components/Navigation.tsx` (100+ lines)
**Primary tab navigation bar**

**Tabs:**
1. `scanner` - Document & face capture workflow
2. `dashboard` - Analytics & stats
3. `history` - Visitor records
4. `residents` - Resident directory
5. `reports` - Detailed analytics
6. `admin` - Settings & audit logs

**Features:**
- Active tab highlight
- Pending approvals counter on scanner tab
- Icon + label display
- Responsive scrolling on mobile

---

#### `src/components/MobileFrame.tsx` (80+ lines)
**Responsive container with optional mobile device frame**

**Props:**
```typescript
interface MobileFrameProps {
  isMobileView: boolean
  children: React.ReactNode
}
```

**Features:**
- Toggles between desktop and mobile viewport
- Mobile device frame styling (rounded corners, bezel, notch)
- Responsive padding
- Maintains aspect ratio

**Responsive Breakpoints:**
- Mobile: Full width (320-639px)
- Tablet: Medium frame (640-1023px)
- Desktop: Full width (1024px+)

---

#### `src/components/DocumentScannerCanvas.tsx` (250+ lines)
**Real-time camera interface for document scanning**

**Props:**
```typescript
interface DocumentScannerCanvasProps {
  selectedDocType: DocumentType
  onCaptured: (croppedImageUrl: string, qrCodeData?: string | null) => void
}
```

**Key State:**
- `stream`: MediaStream from getUserMedia
- `cameraPermission`: 'prompt' | 'granted' | 'denied'
- `scanResult`: ScanValidationResult from cvEngine
- `isCapturing`: Boolean capture state

**Key Functions:**
- `initCamera()`: Request camera access
- Real-time frame processing loop:
  1. Capture video frame to canvas
  2. Call `analyzeDocumentFrame()` from cvEngine
  3. Draw quad overlay (green if valid, red if invalid)
  4. Display validation messages (blur, glare, face detected)
- `captureFrame()`: When validation passes, crop & send to parent

**Real-time Feedback:**
- Green quad overlay: Document detected & valid
- Red quad overlay: Document invalid
- Status messages:
  - "Face detected. Please place your ID card inside the frame."
  - "Image is blurry. Please hold camera steady"
  - "Reflection or glare detected"
  - "Invalid document proportions"

**Supported Doc Types:** Aadhaar Card, PAN Card (constraints 44 for others)

---

#### `src/components/Step1Dashboard.tsx` (120+ lines)
**Dashboard showing analytics, recent visitors, and quick start button**

**Props:**
```typescript
interface Step1DashboardProps {
  stats: AnalyticsStats
  recentVisitors: VisitorRecord[]
  currentRole: UserRole
  onStartVerification: () => void
  onNavigateTab: (tab) => void
}
```

**Displays:**
- Key metrics cards (Total Visitors, Currently Inside, Pending, Rejected, Avg Time)
- Recent visitors list (5 most recent)
- Weekly trends chart (if charts available)
- Hourly traffic chart
- Quick start verification button
- Purpose breakdown

**Styling:** Grid layout, metric cards with gradients

---

#### `src/components/Step2ScanFront.tsx` (120+ lines)
**Front document scan interface with sample data option**

**Props:**
```typescript
interface Step2ScanFrontProps {
  selectedDocType: DocumentType
  setSelectedDocType: (type: DocumentType) => void
  onCaptureCompleted: (imageUrl: string, isSample?: boolean, sampleData?: any) => void
  onCancel: () => void
}
```

**Features:**
- Document type selector (dropdown)
- DocumentScannerCanvas component
- "Use Sample Data" button for testing
- Cancel button
- Instructions overlay

**Supported Doc Types:** All 8 types in DOCUMENT_SCHEMAS

---

#### `src/components/Step3VerifyFront.tsx` (150+ lines)
**OCR field verification & manual editing interface**

**Props:**
```typescript
interface Step3VerifyFrontProps {
  frontImage: string
  extractedData: ExtractedDocData
  setExtractedData: (data: ExtractedDocData) => void
  onProceedToScanBack: () => void
  onRetakeFront: () => void
}
```

**Features:**
- Display front document image
- Editable OCR fields with per-field confidence scores
- Highlight low-confidence fields in red/yellow
- Validation messages
- Overall confidence score progress bar
- Proceed button (only if all required fields valid)
- Retake button

**Editing:**
- Click any field to edit
- Auto-validate on blur against regex
- Show validation errors inline
- Update parent state

**Styling:** Field cards with color-coded confidence

---

#### `src/components/Step4ScanBack.tsx` (100+ lines)
**Back document scan for address extraction (optional)**

**Props:**
```typescript
interface Step4ScanBackProps {
  docType: DocumentType
  onBackCaptureCompleted: (backUrl: string, addressData?: any) => void
  onBackSkipped: () => void
}
```

**Features:**
- DocumentScannerCanvas for back side
- Skip button (optional for some doc types)
- Auto-extract address & PIN from back side OCR

---

#### `src/components/Step5CaptureFace.tsx` (150+ lines)
**Live face capture with liveness verification**

**Props:**
```typescript
interface Step5CaptureFaceProps {
  idImage: string
  onFaceCaptureCompleted: (faceUrl: string, metrics: FaceVerificationData) => void
  onBackToDocs: () => void
}
```

**Key State:**
- `stream`: Front-facing camera
- `faceMetrics`: Real-time quality metrics
- `livenessPassed`: Liveness verification result

**Features:**
- Front-facing camera video
- Real-time face detection (canvas skin tone detection)
- Quality indicators:
  - Brightness (target: 40-90%)
  - Sharpness (Laplacian variance)
  - Framing (face should occupy 30-70% of frame)
  - Liveness (detect blinks, head movement)
- Capture button (only if all metrics pass)
- Instructions overlay

**Real-time Feedback:**
- Green border: All metrics pass, ready to capture
- Red border: Metrics fail, show specific issues
- Status messages: "Brightness too low", "Move closer", "Liveness not detected"

---

#### `src/components/Step6Summary.tsx` (180+ lines)
**Final summary before submission with resident selection**

**Props:**
```typescript
interface Step6SummaryProps {
  frontDocUrl, backDocUrl, liveFaceUrl: string
  extractedData: ExtractedDocData
  faceMetrics: FaceVerificationData
  residents: Resident[]
  selectedResidentId: string
  setSelectedResidentId: (id: string) => void
  purpose: string
  setPurpose: (purpose: string) => void
  vehicleNumber: string
  setVehicleNumber: (number: string) => void
  numAccompanying: number
  setNumAccompanying: (num: number) => void
  visitorPhone: string
  setVisitorPhone: (phone: string) => void
  onSendRequest: () => void
  onBackToFace: () => void
}
```

**Features:**
- Display all 3 captured images (front, back, face)
- Resident selector dropdown
- Visit purpose dropdown
- Vehicle number input (optional)
- Number of accompanying persons input
- Visitor phone number input
- Face metrics display (quality scores)
- Send request button
- Back button

**Styling:** Image gallery with cards, form inputs below

---

#### `src/components/Step7WaitingApproval.tsx` (120+ lines)
**Real-time waiting screen for resident approval via Telegram**

**Props:**
```typescript
interface Step7WaitingApprovalProps {
  currentVisitor: VisitorRecord
  onApprove: () => void
  onReject: (reason: string) => void
  onCancelRequest: () => void
}
```

**Features:**
- Display visitor details
- Real-time status polling (SSE)
- Approve/Reject buttons (for testing/manual approval)
- Cancel request button
- Animated waiting indicator
- Telegram notification status badge

**Real-time Sync:**
- SSE listener for visitor_updated events
- Auto-transition to Step 8 when approved/rejected

---

#### `src/components/Step8ApprovalResult.tsx` (140+ lines)
**Approval result screen with visitor pass & QR code**

**Props:**
```typescript
interface Step8ApprovalResultProps {
  visitor: VisitorRecord
  onCheckIn: () => void
  onCheckOut: () => void
  onNewVerification: () => void
}
```

**Features:**
- Status badge (APPROVED ✅ / REJECTED ❌)
- Visitor details display
- QR code (generated from qrCodeValue)
- Check-in button (for gate entry)
- Check-out button (to mark departure)
- New verification button (start workflow again)
- Pass details print-friendly layout

**QR Code:** Use qrcode.react library to render QR

---

#### `src/components/VisitorHistory.tsx` (120+ lines)
**Historical visitor records with filtering & status updates**

**Props:**
```typescript
interface VisitorHistoryProps {
  visitors: VisitorRecord[]
  onSelectVisitor: (visitor: VisitorRecord) => void
  onUpdateStatus: (id: string, status: VisitorStatus) => void
}
```

**Features:**
- Visitor records table/list
- Filters:
  - By date range
  - By resident name
  - By status (all, pending, approved, rejected, checked-in, checked-out)
  - By purpose
- Status update buttons (approve, reject, check-in, check-out)
- Click row to view details
- Search by visitor name
- Export to CSV (optional)

**Styling:** Table with hover effects, status badges

---

#### `src/components/ResidentsDirectory.tsx` (100+ lines)
**Resident lookup & quick visitor invitation**

**Props:**
```typescript
interface ResidentsDirectoryProps {
  residents: Resident[]
  onSelectResidentToInvite: (resident: Resident) => void
}
```

**Features:**
- Resident cards with photo, name, building, flat
- Department & contact info
- Auto-approve status badge
- Search by resident name or building
- Filter by building
- Quick invite button (auto-populate Step 6 resident field)

---

#### `src/components/ReportsAnalytics.tsx` (150+ lines)
**Analytics dashboard with charts**

**Props:**
```typescript
interface ReportsAnalyticsProps {
  stats: AnalyticsStats
}
```

**Features:**
- Weekly trends chart (LineChart or BarChart)
  - X-axis: Days of week
  - Y-axis: Visitor count
  - Legend: Total, Approved, Rejected
- Hourly traffic chart (BarChart)
  - X-axis: Hours (08:00 - 17:00)
  - Y-axis: Visitor count
- Purpose breakdown (PieChart or DonutChart)
  - Delivery, Personal, Maintenance, Business
  - Show percentages
- Summary metrics
  - Peak hour
  - Average verification time

**Charts Library:** Recharts (if available), else fallback to plain tables

---

#### `src/components/AdminSettings.tsx` (180+ lines)
**Admin panel with Telegram configuration & audit logs**

**Props:**
```typescript
interface AdminSettingsProps {
  buildings: SystemBuilding[]
  auditLogs: AuditLogItem[]
}
```

**Features:**
- **Telegram Bot Configuration:**
  - Bot token input (masked)
  - Chat ID input
  - Test connection button (calls /api/telegram/test)
  - Connection status indicator
  - Last message time display
- **Audit Logs:**
  - Table of all actions
  - Columns: Timestamp, Action, Performed By, Role, Details, IP
  - Filter by action type, user role, date range
  - Search by keywords
- **Building Management:**
  - List of buildings
  - Occupancy rates
  - Manager names
  - Unit counts

**API Calls:**
- GET /api/telegram/config
- POST /api/telegram/config
- POST /api/telegram/test

---

#### `src/components/TelegramGuardChatModal.tsx` (120+ lines)
**Chat interface for security guard to communicate with residents via Telegram**

**Props:**
```typescript
interface TelegramGuardChatModalProps {
  isOpen: boolean
  onClose: () => void
}
```

**Features:**
- Modal window with chat history
- Fetch messages from /api/telegram/messages
- Display messages with sender name & timestamp
- Message input field
- Send button
- Real-time SSE listener for new messages
- Auto-scroll to latest message

**Message Format:**
- Sender: 'resident' | 'guard' | 'system'
- Display sender name & timestamp
- Different styling for incoming vs outgoing
- System messages (notifications)

**API Calls:**
- GET /api/telegram/messages
- POST /api/telegram/messages/send

---

## Architecture & Configuration Files

### `vite.config.ts`
**Vite bundler configuration**
- Tailwind CSS v4 plugin (@tailwindcss/vite)
- React plugin (@vitejs/plugin-react)
- Path alias: @/ → project root
- HMR configuration (disabled in AI Studio)
- File watching disabled during agent edits

### `tsconfig.json`
**TypeScript compiler options**
- Target: ES2022
- Module: ESNext
- JSX: react-jsx
- Lib: ES2022, DOM, DOM.Iterable
- Strict null checks enabled
- No emit (type checking only, Vite handles transpilation)

### `index.html`
**HTML entry point**
- Meta tags (viewport, charset)
- Font preloads (Plus Jakarta Sans, Space Grotesk)
- OpenCV.js async loader (4.10.0)
- Root div for React mounting
- Module script for src/main.tsx

---

## Summary Statistics

| Category | Count | Details |
|---|---|---|
| **Total Files** | 25+ | Source code, config, data |
| **React Components** | 17 | Step workflows, UI screens |
| **TypeScript Files** | 23 | .ts, .tsx with full types |
| **Lines of Code** | 4000+ | Entire frontend + backend |
| **Backend Routes** | 15+ | API endpoints |
| **Data Types** | 20+ | Interfaces & type definitions |
| **Utility Functions** | 40+ | cv, doc parsing, validation |
| **UI Screens** | 12 | Dashboard through results |
| **External APIs** | 3 | Gemini, Telegram, OpenCV.js |
| **Build Outputs** | 2 | React SPA + Node server |

---

## Key File Dependencies

### App.tsx depends on:
- types.ts (all types)
- mockData.ts (initial state)
- All Step*.tsx components
- Navigation, Header, MobileFrame
- Utility functions indirectly

### cvEngine.ts used by:
- DocumentScannerCanvas.tsx
- Step2ScanFront, Step4ScanBack, Step5CaptureFace

### documentParsers.ts used by:
- server.ts (/api/ocr endpoint)
- Step3VerifyFront.tsx (field validation)
- Step6Summary.tsx (confidence display)

### server.ts depends on:
- types.ts (data structures)
- mockData.ts (initial state)
- Google Gemini API client
- Express, fetch for HTTP

### Types.ts has NO dependencies (pure definitions)

### mockData.ts depends on:
- types.ts (type imports)

---

## Entry Points

### Frontend
- **Dev Mode:** `npm run dev` → Vite dev server (port 5173) + Express backend (port 3000)
- **Build Mode:** `npm run build` → dist/index.html + dist/server.cjs
- **Root Component:** App.tsx

### Backend
- **Dev Mode:** `tsx server.ts` → Express listening on port 3000
- **Production:** `node dist/server.cjs` → Express serving static files + API routes
- **Main File:** server.ts

---

## Database Schema (In-Memory for Now)

### visitorsStore: VisitorRecord[]
```
[
  {
    id, passNumber, visitorName, phone,
    documentType, documentNumber,
    frontDocUrl, backDocUrl, liveFaceUrl,
    extractedData, faceMetrics,
    residentId, residentName, buildingUnit,
    purpose, vehicleNumber, numAccompanying,
    status, rejectionReason, createdAt, approvedAt, checkInAt, checkOutAt,
    gateName, guardName, qrCodeValue
  }
]
```

### residentsStore: Resident[]
```
[
  { id, name, building, flatNumber, department, phone, email, avatarUrl, autoApproveGuests }
]
```

### auditLogsStore: AuditLogItem[]
```
[
  { id, timestamp, action, performedBy, role, details, ipAddress }
]
```

### telegramConfig
```
{
  botToken: string,
  defaultChatId: string,
  botEnabled: boolean,
  lastMessageTime: string | null
}
```

### telegramChatMessages: TelegramChatMessage[]
```
[
  { id, chatId, sender, senderName, text, timestamp, visitorId }
]
```

---

## Code Quality & Patterns

### Type Safety
- 100% TypeScript coverage
- No `any` types (minimal exceptions)
- Strict null checks enabled
- All props typed in React components

### Styling Approach
- Tailwind CSS utility classes (no CSS modules)
- Consistent color palette (slate, cyan, emerald)
- Responsive design (mobile-first)
- Glassmorphism effects for modernity

### Component Patterns
- Functional components with React hooks
- Props destructuring for clarity
- Callback props for state updates
- Proper cleanup in useEffect

### API Communication
- Fetch API (no axios)
- JSON serialization
- Error handling with fallbacks
- SSE for real-time updates

### State Management
- React hooks (useState, useEffect, useRef, useCallback)
- Props drilling (acceptable for this complexity)
- No Redux/Context API overhead
- Colocated state where possible

---

## Conclusion

This file index provides a complete map of the PraveshKavach™ codebase structure. Every file is documented with its purpose, key exports, and role within the larger system. The project is well-organized, modular, and ready for development, testing, and production deployment.

For detailed implementation guidance on specific files, refer to the Architecture Report (ARCHITECTURE_REPORT.md).

---

*End of File Index*
