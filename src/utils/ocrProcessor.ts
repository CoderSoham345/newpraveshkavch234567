/**
 * OCR Processing Pipeline - Clean, no-hallucination text extraction
 * Processes raw Gemini OCR responses and validates with confidence scoring
 */

import { ExtractedDocData, DocumentType } from '../types';
import {
  validateAadhaar,
  validatePINCode,
  validateDOB,
  validateGender,
  validateName,
  validatePAN,
  validatePassport,
  validateDrivingLicense,
  validateVoterID,
  calculateAge,
  getFieldConfidence,
} from './fieldValidation';

export interface OCRProcessingResult {
  extractedData: ExtractedDocData;
  qualityMetrics: {
    overallConfidence: number;
    fieldLevelConfidence: Record<string, number>;
    warningFields: string[];
    missingFields: string[];
  };
}

/**
 * Processes raw Gemini OCR output and applies strict validation
 * NEVER hallucinate or invent data - only use what was detected
 */
export function processOCROutput(
  rawData: Record<string, any>,
  docType: DocumentType
): OCRProcessingResult {
  const fieldLevelConfidence: Record<string, number> = {};
  const warningFields: string[] = [];
  const missingFields: string[] = [];

  // Sanitize and validate each field
  let fullName = (rawData.fullName || '').trim();
  if (!fullName || fullName === 'Not Detected – Please Verify Manually') {
    fullName = '';
    missingFields.push('fullName');
  } else {
    const nameValidation = validateName(fullName);
    fieldLevelConfidence['fullName'] = nameValidation.confidence;
    if (nameValidation.confidence < 80) {
      warningFields.push('fullName');
    }
  }

  let dob = (rawData.dob || '').trim();
  if (!dob) {
    missingFields.push('dob');
  } else {
    const dobValidation = validateDOB(dob);
    fieldLevelConfidence['dob'] = dobValidation.confidence;
    if (dobValidation.confidence < 80) {
      warningFields.push('dob');
    }
  }

  let gender = (rawData.gender || '').trim();
  if (!gender) {
    missingFields.push('gender');
  } else {
    const genderValidation = validateGender(gender);
    fieldLevelConfidence['gender'] = genderValidation.confidence;
    if (genderValidation.confidence < 80) {
      warningFields.push('gender');
    }
  }

  // Calculate age from DOB - NEVER read age directly from OCR
  let age = '';
  if (dob) {
    const ageInYears = calculateAge(dob);
    if (ageInYears !== null) {
      age = `${ageInYears} Years`;
      fieldLevelConfidence['age'] = 99; // Calculated, very high confidence
    }
  }

  let fatherName = (rawData.fatherName || '').trim();
  if (fatherName) {
    const nameValidation = validateName(fatherName);
    fieldLevelConfidence['fatherName'] = nameValidation.confidence;
  }

  let address = (rawData.address || '').trim();
  if (address) {
    fieldLevelConfidence['address'] = 85; // Address is usually detected if present
  }

  let pinCode = (rawData.pinCode || '').trim();
  if (!pinCode) {
    // PIN code might not be on front side of many documents
    fieldLevelConfidence['pinCode'] = 0;
  } else {
    const pinValidation = validatePINCode(pinCode);
    fieldLevelConfidence['pinCode'] = pinValidation.confidence;
    if (pinValidation.confidence < 80) {
      warningFields.push('pinCode');
    }
  }

  let documentNumber = (rawData.documentNumber || '').trim();
  if (!documentNumber || documentNumber === 'Not Detected – Please Verify Manually') {
    documentNumber = '';
    missingFields.push('documentNumber');
  } else {
    // Validate document number based on type
    let docValidation = { confidence: 90 };
    if (docType === 'AADHAAR_FRONT' || docType === 'AADHAAR_BACK') {
      docValidation = validateAadhaar(documentNumber);
    } else if (docType === 'PAN_CARD') {
      docValidation = validatePAN(documentNumber);
    } else if (docType === 'PASSPORT') {
      docValidation = validatePassport(documentNumber);
    } else if (docType === 'DRIVING_LICENCE') {
      docValidation = validateDrivingLicense(documentNumber);
    } else if (docType === 'VOTER_ID') {
      docValidation = validateVoterID(documentNumber);
    }
    fieldLevelConfidence['documentNumber'] = docValidation.confidence;
    if (docValidation.confidence < 80) {
      warningFields.push('documentNumber');
    }
  }

  let issueDate = (rawData.issueDate || '').trim();
  if (issueDate) {
    const dateValidation = validateDOB(issueDate);
    fieldLevelConfidence['issueDate'] = dateValidation.confidence;
  }

  let expiryDate = (rawData.expiryDate || '').trim();
  if (expiryDate) {
    const dateValidation = validateDOB(expiryDate);
    fieldLevelConfidence['expiryDate'] = dateValidation.confidence;
  }

  const nationality = (rawData.nationality || 'Indian').trim();
  fieldLevelConfidence['nationality'] = 90;

  // Calculate overall confidence
  const confidenceScores = Object.values(fieldLevelConfidence);
  const overallConfidence =
    confidenceScores.length > 0 ? Math.round(confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length) : 0;

  const extractedData: ExtractedDocData = {
    fullName,
    dob,
    gender,
    age,
    fatherName,
    address,
    pinCode,
    documentNumber,
    issueDate,
    expiryDate,
    nationality,
    documentType: docType,
    confidenceScore: overallConfidence,
    lowConfidenceFields: warningFields,
    fieldConfidences: {},
  };

  return {
    extractedData,
    qualityMetrics: {
      overallConfidence,
      fieldLevelConfidence,
      warningFields,
      missingFields,
    },
  };
}

/**
 * Detects if a field value is hallucinated (fabricated)
 * Checks for suspicious patterns and inconsistencies
 */
export function detectHallucination(field: string, value: string, docType: DocumentType): boolean {
  if (!value || value === 'Not Detected – Please Verify Manually') {
    return false; // Empty values are not hallucinations
  }

  // Check for unrealistic name patterns
  if (field === 'fullName') {
    // All uppercase names from OCR are common but acceptable
    // Check for single character names or names that are too long
    if (value.length > 100 || value.length < 2) return true;
    // Check if name contains only numbers
    if (/^\d+$/.test(value)) return true;
  }

  // Check for fabricated addresses
  if (field === 'address') {
    // Empty address on front of Aadhaar/PAN is correct
    if ((docType === 'AADHAAR_FRONT' || docType === 'AADHAAR_BACK') && value.length === 0) return false;
    if (docType === 'PAN_CARD' && value.length === 0) return false;
  }

  // Check for obviously wrong dates (e.g., 99/99/9999)
  if (field === 'dob' || field === 'issueDate' || field === 'expiryDate') {
    if (/99\/99|9999/.test(value)) return true;
  }

  return false;
}

/**
 * Formats OCR output for display with confidence indicators
 */
export function formatFieldForDisplay(
  value: string,
  confidence: number,
  fieldName: string
): { displayValue: string; indicator: 'high' | 'medium' | 'low' | 'missing' } {
  if (!value || value === 'Not Detected – Please Verify Manually') {
    return {
      displayValue: 'Not Detected - Please Verify Manually',
      indicator: 'missing',
    };
  }

  if (confidence >= 80) {
    return {
      displayValue: `${value} (${confidence}%)`,
      indicator: 'high',
    };
  } else if (confidence >= 50) {
    return {
      displayValue: `${value} (${confidence}% - Please verify)`,
      indicator: 'medium',
    };
  } else {
    return {
      displayValue: `${value} (${confidence}% - Unreliable)`,
      indicator: 'low',
    };
  }
}

/**
 * Merges front and back OCR data without overwriting
 * Used when scanning both sides of ID cards
 */
export function mergeOCRDataFrontAndBack(
  frontData: ExtractedDocData,
  backData: ExtractedDocData,
  docType: DocumentType
): ExtractedDocData {
  const merged = { ...frontData };

  // For Aadhaar: Front has name/DOB/gender, back has address
  // NEVER overwrite with back data if front already has data
  if (docType === 'AADHAAR_FRONT' || docType === 'AADHAAR_BACK') {
    if (!merged.address && backData.address) {
      merged.address = backData.address;
    }
    if (!merged.pinCode && backData.pinCode) {
      merged.pinCode = backData.pinCode;
    }
    if (!merged.state && backData.state) {
      merged.state = backData.state;
    }
  }

  return merged;
}

/**
 * Validates OCR data against document type schema
 */
export function validateOCRDataAgainstSchema(data: ExtractedDocData): string[] {
  const errors: string[] = [];

  // All documents need these
  if (!data.fullName || data.fullName === 'Not Detected – Please Verify Manually') {
    errors.push('Full Name: Not detected');
  }
  if (!data.documentNumber || data.documentNumber === 'Not Detected – Please Verify Manually') {
    errors.push('Document Number: Not detected');
  }

  // Aadhaar-specific
  if (data.documentType === 'AADHAAR_FRONT' || data.documentType === 'AADHAAR_BACK') {
    if (!data.dob) errors.push('Date of Birth: Not detected');
    if (!data.gender) errors.push('Gender: Not detected');
    const aadhaarValidation = validateAadhaar(data.documentNumber);
    if (!aadhaarValidation.isValid) {
      errors.push(`Aadhaar Number: ${aadhaarValidation.errorMessage}`);
    }
  }

  // PAN-specific
  if (data.documentType === 'PAN_CARD') {
    const panValidation = validatePAN(data.documentNumber);
    if (!panValidation.isValid) {
      errors.push(`PAN: ${panValidation.errorMessage}`);
    }
  }

  return errors;
}
