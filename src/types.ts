export type UserRole = 
  | 'SECURITY_GUARD'
  | 'RESIDENT'
  | 'ADMIN';

/**
 * Resident Profile - Stored in Firebase Firestore
 * CRITICAL: Telegram approvals sent to resident's telegramChatId, NOT security guard
 */
export interface Resident {
  residentId: string;
  name: string;
  building: string;
  wing: string;
  flat: string;
  mobile: string;
  email: string;
  telegramChatId: string; // CRITICAL: Approval messages sent here
  telegramUsername?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export type DocumentType = 
  | 'AUTOMATIC_DETECTION'
  | 'AADHAAR_FRONT'
  | 'AADHAAR_BACK'
  | 'PAN_CARD'
  | 'PASSPORT'
  | 'DRIVING_LICENCE'
  | 'VOTER_ID'
  | 'GOVT_EMPLOYEE_ID'
  | 'PRIVATE_EMPLOYEE_ID'
  | 'STUDENT_ID'
  | 'RC_BOOK'
  | 'OCI_CARD'
  | 'NREGA_JOB_CARD'
  | 'SENIOR_CITIZEN_CARD'
  | 'DISABILITY_ID_CARD'
  | 'HEALTH_INSURANCE_CARD'
  | 'POLICE_ID'
  | 'ARMY_ID'
  | 'OTHER_GOVT_ID'
  | 'OTHER_IDENTITY_DOC';

export type WorkflowStep = 
  | 1 // Dashboard
  | 2 // Scan Front ID
  | 3 // Verify Front OCR
  | 4 // Scan Back ID
  | 5 // Capture Face & Verification
  | 6 // Summary & Resident Selection
  | 7 // Real-time Waiting for Approval
  | 8; // Approval Result & Visitor Pass

export type VisitorStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED';

export interface FieldWithConfidence {
  value: string;
  confidence: number; // 0 - 100
  isValid: boolean;
  errorMessage?: string;
}

export interface ExtractedDocData {
  fullName: string;
  dob: string;
  gender: string;
  fatherName?: string;
  address?: string;
  pinCode?: string;
  documentNumber: string;
  issueDate?: string;
  expiryDate?: string;
  nationality?: string;
  documentType: DocumentType;
  confidenceScore: number; // 0 - 100
  lowConfidenceFields: string[];
  
  // Specific parsed fields for each document type
  age?: string;
  state?: string;
  qrCodeData?: string;
  aadhaarVersion?: string;
  uidaiInfo?: string;

  panType?: string;

  placeOfBirth?: string;
  issuingAuthority?: string;
  mrzCode?: string;

  bloodGroup?: string;
  vehicleCategories?: string;

  epicNumber?: string;
  constituency?: string;

  employeeId?: string;
  companyName?: string;
  department?: string;
  designation?: string;
  validTill?: string;

  studentId?: string;
  collegeName?: string;
  course?: string;
  academicYear?: string;

  // Detailed per-field confidence map
  fieldConfidences?: Record<string, FieldWithConfidence>;
}

export interface FaceVerificationData {
  faceDetected: boolean;
  qualityScore: number; // 0 - 100
  brightness: number; // 0 - 100
  sharpness: number; // 0 - 100
  framingPass: boolean;
  livenessPassed: boolean;
  maskDetected: boolean;
  faceMatchScore: number; // 0 - 100
  capturedFaceUrl?: string;
}

export interface Resident {
  id: string;
  name: string;
  building: string;
  flatNumber: string;
  department?: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  autoApproveGuests?: boolean;
}

export interface VisitorRecord {
  id: string;
  passNumber: string;
  visitorName: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
  frontDocUrl: string;
  backDocUrl?: string;
  liveFaceUrl: string;
  extractedData: ExtractedDocData;
  faceMetrics: FaceVerificationData;
  residentId: string;
  residentName: string;
  buildingUnit: string;
  purpose: string;
  vehicleNumber?: string;
  numAccompanying?: number;
  status: VisitorStatus;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  checkInAt?: string;
  checkOutAt?: string;
  gateName: string;
  guardName: string;
  qrCodeValue: string;
  dob?: string;
  age?: string;
  gender?: string;
  address?: string;
}

export interface SystemBuilding {
  id: string;
  name: string;
  code: string;
  totalUnits: number;
  occupancyRate: number;
  managerName: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  role: UserRole;
  details: string;
  ipAddress: string;
}

export interface AnalyticsStats {
  totalVisitorsToday: number;
  currentlyInside: number;
  pendingApprovals: number;
  rejectedVisitorsToday: number;
  avgVerificationTimeSec: number;
  peakHour: string;
  weeklyTrends: { day: string; count: number; approved: number; rejected: number }[];
  hourlyTraffic: { hour: string; count: number }[];
  purposeBreakdown: { purpose: string; count: number; percentage: number }[];
}
