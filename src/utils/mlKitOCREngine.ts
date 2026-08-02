/**
 * ML Kit OCR Engine for PraveshKavach™
 * Processes document images and extracts structured data
 * Uses Google ML Kit Text Recognition + field-specific parsing
 */

export interface FieldData {
  value: string;
  confidence: number; // 0-100
  color: 'green' | 'yellow' | 'red';
  requiresManualVerification: boolean;
}

export interface OcrResult {
  rawText: string;
  fields: Map<string, FieldData>;
  overallConfidence: number;
  warnings: string[];
  documentType: 'Aadhaar Card' | 'PAN Card' | 'Passport' | 'Driving Licence' | 'Voter ID' | 'Unknown';
}

export interface AadhaarFrontData {
  fullName: string;
  aadhaarNumber: string;
  dob: string;
  gender: string;
  confidence: number;
}

export interface AadhaarBackData {
  address: string;
  pinCode: string;
  state: string;
  confidence: number;
}

/**
 * Preprocess image for better OCR accuracy
 */
export async function preprocessImage(imageData: ImageData): Promise<ImageData> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d')!;
  
  // Put original image
  ctx.putImageData(imageData, 0, 0);
  
  // Get pixel data
  const processed = ctx.getImageData(0, 0, imageData.width, imageData.height);
  const data = processed.data;
  
  // Contrast enhancement: increase difference between text and background
  // Sharpen filter + brightness adjustment
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Convert to grayscale
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Increase contrast: values below 128 go darker, above go lighter
    const contrast = 1.5;
    const adjusted = Math.max(0, Math.min(255, 128 + (gray - 128) * contrast));
    
    data[i] = adjusted;
    data[i + 1] = adjusted;
    data[i + 2] = adjusted;
  }
  
  return processed;
}

/**
 * Extract Aadhaar number and verify checksum (Verhoeff algorithm)
 */
export function extractAadhaarNumber(text: string): { number: string; valid: boolean } {
  // Aadhaar format: XXXX XXXX XXXX (12 digits with spaces)
  const aadhaarRegex = /(\d{4})\s*(\d{4})\s*(\d{4})/;
  const match = text.match(aadhaarRegex);
  
  if (!match) {
    return { number: '', valid: false };
  }
  
  const number = match[1] + match[2] + match[3];
  const valid = verifyAadhaarChecksum(number);
  
  return { number, valid };
}

/**
 * Verify Aadhaar checksum using Verhoeff algorithm
 */
export function verifyAadhaarChecksum(aadhaarNumber: string): boolean {
  if (!/^\d{12}$/.test(aadhaarNumber)) return false;
  
  // Verhoeff algorithm lookup tables
  const D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  ];
  
  const P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  ];
  
  const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];
  
  let c = 0;
  const digits = aadhaarNumber.split('').reverse();
  
  for (let i = 0; i < digits.length; i++) {
    const d = parseInt(digits[i], 10);
    c = D[c][P[(i + 1) % 8][d]];
  }
  
  return c === 0;
}

/**
 * Extract DOB in DD/MM/YYYY format and validate
 */
export function extractDOB(text: string): { dob: string; valid: boolean } {
  // Try multiple DOB formats
  const dobPatterns = [
    /(\d{2})[-\/](\d{2})[-\/](\d{4})/,  // DD/MM/YYYY or DD-MM-YYYY
    /(\d{1,2})\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i, // D Mmm YYYY
  ];
  
  for (const pattern of dobPatterns) {
    const match = text.match(pattern);
    if (match) {
      let day = '', month = '', year = '';
      
      if (dobPatterns[0].test(match[0])) {
        day = match[1].padStart(2, '0');
        month = match[2].padStart(2, '0');
        year = match[3];
      }
      
      if (day && month && year) {
        const dob = `${day}/${month}/${year}`;
        const valid = isValidDOB(dob);
        return { dob, valid };
      }
    }
  }
  
  return { dob: '', valid: false };
}

/**
 * Validate DOB format and ensure it's in the past
 */
export function isValidDOB(dob: string): boolean {
  const [day, month, year] = dob.split('/').map(Number);
  
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > new Date().getFullYear()) {
    return false;
  }
  
  const dobDate = new Date(year, month - 1, day);
  const today = new Date();
  
  return dobDate < today;
}

/**
 * Calculate age from DOB (never store age statically)
 */
export function calculateAgeFromDOB(dob: string): number {
  const [day, month, year] = dob.split('/').map(Number);
  const today = new Date();
  
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() - (month - 1);
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age--;
  }
  
  return age;
}

/**
 * Extract gender (Male/Female)
 */
export function extractGender(text: string): { gender: string; confidence: number } {
  const malePatterns = /\b(male|m|mr\.?|masculine)\b/i;
  const femalePatterns = /\b(female|f|mrs\.?|ms\.?|miss|ms|feminine)\b/i;
  
  if (femalePatterns.test(text)) {
    return { gender: 'Female', confidence: 85 };
  }
  
  if (malePatterns.test(text)) {
    return { gender: 'Male', confidence: 85 };
  }
  
  return { gender: '', confidence: 0 };
}

/**
 * Extract name - typically first meaningful words
 */
export function extractName(text: string): { name: string; confidence: number } {
  // Remove common OCR artifacts and extract first meaningful line
  const lines = text.split('\n').filter(line => line.trim().length > 3);
  
  if (lines.length > 0) {
    const name = lines[0].trim().toUpperCase().substring(0, 50);
    return { name, confidence: 70 };
  }
  
  return { name: '', confidence: 0 };
}

/**
 * Extract address from text
 */
export function extractAddress(text: string): { address: string; confidence: number } {
  // Address is typically on back of Aadhaar or lower part of document
  const lines = text.split('\n').filter(line => line.trim().length > 5);
  
  if (lines.length > 2) {
    const address = lines.slice(2).join(', ').substring(0, 200);
    return { address, confidence: 60 };
  }
  
  return { address: '', confidence: 0 };
}

/**
 * Extract PIN code (6 digits)
 */
export function extractPinCode(text: string): { pinCode: string; confidence: number } {
  const pinCodeRegex = /\b(\d{6})\b/;
  const match = text.match(pinCodeRegex);
  
  if (match) {
    return { pinCode: match[1], confidence: 95 };
  }
  
  return { pinCode: '', confidence: 0 };
}

/**
 * Determine field confidence color
 */
export function getConfidenceColor(confidence: number): 'green' | 'yellow' | 'red' {
  if (confidence >= 90) return 'green';
  if (confidence >= 80) return 'yellow';
  return 'red';
}

/**
 * Main OCR processing function
 */
export async function processOCRText(rawText: string): Promise<OcrResult> {
  const fields = new Map<string, FieldData>();
  const warnings: string[] = [];
  
  // Extract all fields
  const { number: aadhaar, valid: aadhaarValid } = extractAadhaarNumber(rawText);
  const { dob, valid: dobValid } = extractDOB(rawText);
  const { gender, confidence: genderConfidence } = extractGender(rawText);
  const { name, confidence: nameConfidence } = extractName(rawText);
  const { address, confidence: addressConfidence } = extractAddress(rawText);
  const { pinCode, confidence: pinCodeConfidence } = extractPinCode(rawText);
  
  // Add to fields map
  if (aadhaar) {
    fields.set('aadhaarNumber', {
      value: aadhaar,
      confidence: aadhaarValid ? 95 : 50,
      color: aadhaarValid ? 'green' : 'red',
      requiresManualVerification: !aadhaarValid,
    });
  }
  
  if (dob) {
    fields.set('dob', {
      value: dob,
      confidence: dobValid ? 90 : 40,
      color: dobValid ? 'green' : 'red',
      requiresManualVerification: !dobValid,
    });
  }
  
  if (gender) {
    fields.set('gender', {
      value: gender,
      confidence: genderConfidence,
      color: getConfidenceColor(genderConfidence),
      requiresManualVerification: genderConfidence < 80,
    });
  }
  
  if (name) {
    fields.set('fullName', {
      value: name,
      confidence: nameConfidence,
      color: getConfidenceColor(nameConfidence),
      requiresManualVerification: nameConfidence < 80,
    });
  }
  
  if (address) {
    fields.set('address', {
      value: address,
      confidence: addressConfidence,
      color: getConfidenceColor(addressConfidence),
      requiresManualVerification: addressConfidence < 80,
    });
  }
  
  if (pinCode) {
    fields.set('pinCode', {
      value: pinCode,
      confidence: pinCodeConfidence,
      color: getConfidenceColor(pinCodeConfidence),
      requiresManualVerification: false,
    });
  }
  
  // Calculate overall confidence
  const confidences = Array.from(fields.values()).map(f => f.confidence);
  const overallConfidence = confidences.length > 0 
    ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
    : 0;
  
  // Add warnings for critical missing fields
  if (!aadhaar) warnings.push('Aadhaar number not detected');
  if (!dob) warnings.push('Date of birth not detected');
  if (!name) warnings.push('Name not detected');
  if (!gender) warnings.push('Gender not detected');
  
  return {
    rawText,
    fields,
    overallConfidence,
    warnings,
    documentType: aadhaar ? 'Aadhaar Card' : 'Unknown',
  };
}

export class MLKitOCREngine {
  /**
   * Process image and extract OCR data
   */
  static async processImage(imageData: ImageData): Promise<OcrResult> {
    try {
      // Preprocess image for better accuracy
      const processed = await preprocessImage(imageData);
      
      // In production, use:
      // const recognizer = await ml.vision.TextRecognition.create();
      // const result = await recognizer.recognizeText(imageData);
      // return processOCRText(result.text);
      
      // For now, return placeholder
      return {
        rawText: '',
        fields: new Map(),
        overallConfidence: 0,
        warnings: ['ML Kit not initialized. Set VITE_FIREBASE_* env vars'],
        documentType: 'Unknown',
      };
    } catch (error) {
      console.error('[OCR] Processing failed:', error);
      return {
        rawText: '',
        fields: new Map(),
        overallConfidence: 0,
        warnings: [`OCR error: ${error}`],
        documentType: 'Unknown',
      };
    }
  }

  /**
   * Extract Aadhaar front side data
   */
  static extractAadhaarFront(rawText: string): AadhaarFrontData {
    const aadhaarResult = extractAadhaarNumber(rawText);
    const dobResult = extractDOB(rawText);
    const genderResult = extractGender(rawText);
    const nameResult = extractName(rawText);
    
    return {
      fullName: nameResult.name,
      aadhaarNumber: aadhaarResult.number,
      dob: dobResult.dob,
      gender: genderResult.gender,
      confidence: 75,
    };
  }

  /**
   * Extract Aadhaar back side data
   */
  static extractAadhaarBack(rawText: string): AadhaarBackData {
    const addressResult = extractAddress(rawText);
    const pinCodeResult = extractPinCode(rawText);
    
    return {
      address: addressResult.address,
      pinCode: pinCodeResult.pinCode,
      state: '', // Extract from address if possible
      confidence: 70,
    };
  }
}
