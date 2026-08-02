/**
 * Document Type Classifier
 * Automatically detects document type from OCR text
 * No user selection required
 */

export type DocumentTypeCode =
  | 'AADHAAR_FRONT'
  | 'AADHAAR_BACK'
  | 'PAN_CARD'
  | 'PASSPORT'
  | 'DRIVING_LICENCE'
  | 'VOTER_ID'
  | 'EMPLOYEE_ID'
  | 'STUDENT_ID'
  | 'RC_BOOK'
  | 'UNKNOWN';

export interface DocumentClassification {
  documentType: DocumentTypeCode;
  side?: 'front' | 'back';
  confidence: number; // 0-100
  indicators: string[];
}

/**
 * Classify document based on OCR text
 */
export function classifyDocument(ocrText: string, side?: 'front' | 'back'): DocumentClassification {
  const text = ocrText.toUpperCase();
  const lines = text.split('\n');
  const indicators: string[] = [];

  let bestMatch: DocumentTypeCode = 'UNKNOWN';
  let bestScore = 0;

  // AADHAAR DETECTION
  if (/\baadhaar\b|\buidai\b|\bu\.i\.d\.a\.i\b/i.test(text)) {
    indicators.push('Found "Aadhaar" or "UIDAI" keyword');

    // Check for 12-digit Aadhaar number
    if (/\b\d{4}\s\d{4}\s\d{4}\b/.test(text)) {
      indicators.push('Found 12-digit Aadhaar number');
      bestScore = Math.max(bestScore, 95);

      // Determine front vs back
      if (side === 'back' || /\baddress\b|\bpincode\b|\bdistrict\b/.test(text)) {
        bestMatch = 'AADHAAR_BACK';
        indicators.push('Detected as Aadhaar Back (address fields present)');
      } else {
        bestMatch = 'AADHAAR_FRONT';
        indicators.push('Detected as Aadhaar Front (name/DOB present)');
      }
    } else {
      bestScore = Math.max(bestScore, 60);
      bestMatch = side === 'back' ? 'AADHAAR_BACK' : 'AADHAAR_FRONT';
    }
  }

  // PAN CARD DETECTION
  if (/\bpan\b|\bincome\s+tax|\bitin\b/i.test(text)) {
    indicators.push('Found "PAN" or "Income Tax" keyword');

    // Check PAN format: ABCDE1234F
    if (/[A-Z]{5}[0-9]{4}[A-Z]/.test(text)) {
      indicators.push('Found valid PAN format');
      bestScore = Math.max(bestScore, 95);
      bestMatch = 'PAN_CARD';
    } else {
      bestScore = Math.max(bestScore, 70);
      bestMatch = 'PAN_CARD';
    }
  }

  // PASSPORT DETECTION
  if (/\bpassport\b|\bindia\s+passport|\bgovernment\s+of\s+india/i.test(text)) {
    indicators.push('Found "Passport" or "Government of India" keyword');

    // Check for MRZ (Machine Readable Zone)
    if (/^P[A-Z]{1}[A-Z]{3}[A-Z0-9]{6,9}/.test(text)) {
      indicators.push('Found MRZ (Machine Readable Zone)');
      bestScore = Math.max(bestScore, 95);
    } else {
      bestScore = Math.max(bestScore, 80);
    }
    bestMatch = 'PASSPORT';
  }

  // DRIVING LICENCE DETECTION
  if (/\bdriving\s+license|\bdriving\s+licence|\bdriving\s+licence|\bstate\s+rto|\brto/i.test(text)) {
    indicators.push('Found "Driving Licence" or "RTO" keyword');

    // Check for DL number format
    if (/\b[A-Z]{2}[-\s]?\d{2}[-\s]?\d{7,11}\b/i.test(text)) {
      indicators.push('Found valid DL number format');
      bestScore = Math.max(bestScore, 95);
    } else {
      bestScore = Math.max(bestScore, 75);
    }
    bestMatch = 'DRIVING_LICENCE';
  }

  // VOTER ID (EPIC) DETECTION
  if (/\bvoter\s+id|\bepic\b|\belection\s+commission|constituency/i.test(text)) {
    indicators.push('Found "Voter ID" or "Election Commission" keyword');

    // Check for EPIC number (10 digits)
    if (/\b\d{10}\b/.test(text)) {
      indicators.push('Found EPIC number');
      bestScore = Math.max(bestScore, 90);
    } else {
      bestScore = Math.max(bestScore, 70);
    }
    bestMatch = 'VOTER_ID';
  }

  // EMPLOYEE ID DETECTION
  if (/\bemployee\s+id|\bemployee\s+card|\bcompany\s+id|\borganization/i.test(text)) {
    indicators.push('Found "Employee ID" keyword');
    bestScore = Math.max(bestScore, 80);
    bestMatch = 'EMPLOYEE_ID';
  }

  // STUDENT ID DETECTION
  if (/\bstudent\s+id|\bcollege\s+id|\buniversity\s+id|\benrollment|roll\s+number/i.test(text)) {
    indicators.push('Found "Student ID" keyword');
    bestScore = Math.max(bestScore, 80);
    bestMatch = 'STUDENT_ID';
  }

  // RC BOOK (Vehicle Registration) DETECTION
  if (/\bvehicle\s+registration|\bregistration\s+certificate|\brc\s+book|\bchassim\s+number|engine\s+number/i.test(text)) {
    indicators.push('Found vehicle registration keywords');
    bestScore = Math.max(bestScore, 85);
    bestMatch = 'RC_BOOK';
  }

  return {
    documentType: bestMatch,
    side: side || (bestMatch.includes('BACK') ? 'back' : 'front'),
    confidence: bestScore,
    indicators,
  };
}

/**
 * Validate document type consistency
 */
export function validateDocumentTypeConsistency(
  frontClassification: DocumentClassification,
  backClassification: DocumentClassification
): boolean {
  // Extract base document type (without FRONT/BACK)
  const frontBase = frontClassification.documentType.replace(/_FRONT|_BACK/, '');
  const backBase = backClassification.documentType.replace(/_FRONT|_BACK/, '');

  return frontBase === backBase;
}
