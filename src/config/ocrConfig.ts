// OCR.Space Configuration for PraveshKavach™
// Optimized for Indian government ID documents

export const OCRConfig = {
  // API Settings
  apiEndpoint: 'https://api.ocr.space/parse/image',
  language: 'eng', // English for all Indian documents
  ocrEngine: 2, // Engine 2: Tesseract 5.x (best accuracy for documents)
  
  // Processing Options
  detectOrientation: true, // Auto-rotate tilted images
  isOverlayRequired: false, // Faster processing
  filetype: 'PDF', // Treat all as documents
  
  // Timeouts
  requestTimeout: 15000, // 15 seconds max
  retryAttempts: 3,
  retryDelayMs: 1000,
  
  // Quality Settings
  minConfidenceThreshold: 50, // Flag < 50% confidence
  warningConfidenceThreshold: 85, // Warn on < 85% confidence
  
  // Document Detection Patterns
  documentPatterns: {
    aadhaar: {
      keywords: ['AADHAAR', 'UIDAI', 'U.I.D.A.I'],
      numberPattern: /(\d{4})\s*(\d{4})\s*(\d{4})/,
      confidence: 95,
    },
    pan: {
      keywords: ['PAN', 'Income Tax', 'ITIN'],
      numberPattern: /[A-Z]{5}[0-9]{4}[A-Z]/,
      confidence: 90,
    },
    passport: {
      keywords: ['PASSPORT', 'GOVERNMENT OF INDIA'],
      numberPattern: /[A-Z]{1}[0-9]{7}/,
      confidence: 85,
    },
    drivingLicence: {
      keywords: ['DRIVING', 'LICENCE', 'LICENSE', 'RTO'],
      numberPattern: /[A-Z]{2}[0-9]{2}[A-Z0-9]{7,11}/,
      confidence: 85,
    },
    voterID: {
      keywords: ['VOTER', 'EPIC', 'ELECTION COMMISSION'],
      numberPattern: /\d{10}/,
      confidence: 80,
    },
    rcBook: {
      keywords: ['REGISTRATION', 'VEHICLE', 'CHASSIS', 'ENGINE'],
      numberPattern: /[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}/,
      confidence: 85,
    },
  },
  
  // Field Extraction Patterns (Strict - Never Hallucinate)
  fieldPatterns: {
    aadhaarNumber: /(\d{4})\s*(\d{4})\s*(\d{4})/,
    panNumber: /([A-Z]{5}[0-9]{4}[A-Z])/,
    passportNumber: /([A-Z]{1}[0-9]{7})/,
    dateOfBirth: /(\d{2})[-\/](\d{2})[-\/](\d{4})/,
    pinCode: /\b(\d{6})\b/,
    gender: /\b(male|female|other)\b/i,
    registrationNumber: /([A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4})/,
  },
  
  // Response Caching (optional)
  enableCaching: true,
  cacheTTLSeconds: 300, // Cache for 5 minutes
  
  // Logging
  enableDetailedLogging: true,
  logProcessingMetrics: true,
};

// Helper function to get OCR.Space API endpoint
export function getOCREndpoint(): string {
  return OCRConfig.apiEndpoint;
}

// Helper function to get retry configuration
export function getRetryConfig() {
  return {
    attempts: OCRConfig.retryAttempts,
    delayMs: OCRConfig.retryDelayMs,
    backoffMultiplier: 1.5,
  };
}

// Helper function to validate confidence
export function isHighConfidence(confidence: number): boolean {
  return confidence >= OCRConfig.warningConfidenceThreshold;
}

export function isLowConfidence(confidence: number): boolean {
  return confidence < OCRConfig.minConfidenceThreshold;
}

export function requiresManualVerification(confidence: number): boolean {
  return confidence < OCRConfig.warningConfidenceThreshold;
}
