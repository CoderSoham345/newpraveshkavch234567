/**
 * OCR Response Processor
 * Processes raw Gemini OCR text and applies strict extraction rules
 * NO HALLUCINATION - only uses what's actually in the raw text
 */

import {
  extractAadhaarNumber,
  extractFullName,
  extractFatherName,
  extractDOB,
  extractGender,
  calculateAge,
  extractAddress,
  extractPINCode,
  extractState,
  extractCity,
  calculateOverallConfidence,
} from './strictAadhaarOCR';

export interface ProcessedOCRResult {
  // Front side fields
  fullName: {
    value: string;
    confidence: number;
  };
  aadhaarNumber: {
    value: string;
    confidence: number;
    valid: boolean;
  };
  fatherName: {
    value: string;
    confidence: number;
  };
  dob: {
    value: string;
    confidence: number;
    valid: boolean;
  };
  age: {
    value: string;
    confidence: number;
  };
  gender: {
    value: string;
    confidence: number;
  };

  // Back side fields
  address: {
    value: string;
    confidence: number;
  };
  pinCode: {
    value: string;
    confidence: number;
    valid: boolean;
  };
  state: {
    value: string;
    confidence: number;
  };
  city: {
    value: string;
    confidence: number;
  };

  // Metadata
  overallConfidence: number;
  missingFields: string[];
  warningFields: Array<{
    field: string;
    reason: string;
  }>;
  rawOCRText: string;
  processedAt: string;
}

/**
 * Process Gemini OCR response text
 * Extract fields using strict, deterministic rules
 */
export function processGeminiOCRText(
  rawOCRText: string,
  side: 'front' | 'back'
): ProcessedOCRResult {
  const warnings: Array<{ field: string; reason: string }> = [];
  const missingFields: string[] = [];
  const fieldConfidences: Record<string, number> = {};

  // FRONT SIDE EXTRACTION
  if (side === 'front') {
    // Aadhaar Number (required)
    const aadhaarResult = extractAadhaarNumber(rawOCRText);
    if (!aadhaarResult.value) {
      missingFields.push('aadhaarNumber');
    } else if (!aadhaarResult.valid) {
      warnings.push({
        field: 'aadhaarNumber',
        reason: 'Invalid format - must be 12 digits',
      });
    }
    fieldConfidences['aadhaarNumber'] = aadhaarResult.confidence;

    // Full Name (required)
    const nameResult = extractFullName(rawOCRText);
    if (!nameResult.value) {
      missingFields.push('fullName');
    }
    fieldConfidences['fullName'] = nameResult.confidence;

    // Father's Name (optional)
    const fatherResult = extractFatherName(rawOCRText);
    fieldConfidences['fatherName'] = fatherResult.confidence;

    // Date of Birth (required)
    const dobResult = extractDOB(rawOCRText);
    if (!dobResult.value) {
      missingFields.push('dob');
    } else if (!dobResult.valid) {
      warnings.push({
        field: 'dob',
        reason: 'Date format might be invalid',
      });
    }
    fieldConfidences['dob'] = dobResult.confidence;

    // Gender (optional on front)
    const genderResult = extractGender(rawOCRText);
    fieldConfidences['gender'] = genderResult.confidence;

    // Age (calculated from DOB)
    let ageResult = { value: '', confidence: 0 };
    if (dobResult.value) {
      const ageCalc = calculateAge(dobResult.value);
      if (ageCalc) {
        ageResult = {
          value: ageCalc.displayText,
          confidence: 99, // Calculated, very high confidence
        };
        fieldConfidences['age'] = ageResult.confidence;
      }
    }

    // Address on front side? Unlikely, but check anyway
    const addressResult = extractAddress(rawOCRText);
    fieldConfidences['address'] = addressResult.confidence;

    // PIN on front? Usually not present
    const pinResult = extractPINCode(rawOCRText);
    fieldConfidences['pinCode'] = pinResult.confidence || 0;

    const stateResult = extractState(rawOCRText, addressResult.value);
    fieldConfidences['state'] = stateResult.confidence;

    const cityResult = extractCity(addressResult.value);
    fieldConfidences['city'] = cityResult.confidence;

    // Calculate confidence
    const requiredFrontFields = [
      'fullName',
      'aadhaarNumber',
      'dob',
      'gender',
    ];
    const overallConfidence = calculateOverallConfidence(
      fieldConfidences,
      requiredFrontFields
    );

    return {
      fullName: nameResult,
      aadhaarNumber: aadhaarResult,
      fatherName: fatherResult,
      dob: dobResult,
      age: ageResult,
      gender: genderResult,
      address: { value: '', confidence: 0 }, // Empty for front side
      pinCode: { value: '', confidence: 0, valid: false }, // Empty for front side
      state: { value: '', confidence: 0 }, // Empty for front side
      city: { value: '', confidence: 0 }, // Empty for front side
      overallConfidence,
      missingFields,
      warningFields: warnings,
      rawOCRText,
      processedAt: new Date().toISOString(),
    };
  }

  // BACK SIDE EXTRACTION
  else {
    // Address (required on back)
    const addressResult = extractAddress(rawOCRText);
    if (!addressResult.value) {
      missingFields.push('address');
    }
    fieldConfidences['address'] = addressResult.confidence;

    // PIN Code (required on back)
    const pinResult = extractPINCode(rawOCRText);
    if (!pinResult.value) {
      missingFields.push('pinCode');
    } else if (!pinResult.valid) {
      warnings.push({
        field: 'pinCode',
        reason: 'Invalid PIN - must be 6 digits',
      });
    }
    fieldConfidences['pinCode'] = pinResult.confidence;

    // State (optional - validate if present)
    const stateResult = extractState(rawOCRText, addressResult.value);
    fieldConfidences['state'] = stateResult.confidence;

    // City (optional)
    const cityResult = extractCity(addressResult.value);
    fieldConfidences['city'] = cityResult.confidence;

    const requiredBackFields = ['address', 'pinCode'];
    const overallConfidence = calculateOverallConfidence(
      fieldConfidences,
      requiredBackFields
    );

    return {
      fullName: { value: '', confidence: 0 },
      aadhaarNumber: { value: '', confidence: 0, valid: false },
      fatherName: { value: '', confidence: 0 },
      dob: { value: '', confidence: 0, valid: false },
      age: { value: '', confidence: 0 },
      gender: { value: '', confidence: 0 },
      address: addressResult,
      pinCode: pinResult,
      state: stateResult,
      city: cityResult,
      overallConfidence,
      missingFields,
      warningFields: warnings,
      rawOCRText,
      processedAt: new Date().toISOString(),
    };
  }
}

/**
 * Format confidence score with color coding
 * <50% = Not Detected (leave blank)
 * <60% = Orange (low confidence)
 * <80% = Yellow (medium confidence)
 * >=80% = Green (good confidence)
 */
export function getConfidenceColor(
  confidence: number
): 'green' | 'yellow' | 'orange' | 'red' {
  if (confidence >= 80) return 'green';
  if (confidence >= 60) return 'yellow';
  if (confidence >= 50) return 'orange';
  return 'red';
}

/**
 * Build confidence display text
 */
export function getConfidenceDisplay(confidence: number): string {
  if (confidence < 50) return 'Not Detected';
  if (confidence < 60) return `Low (${confidence}%)`;
  if (confidence < 80) return `Medium (${confidence}%)`;
  return `High (${confidence}%)`;
}
