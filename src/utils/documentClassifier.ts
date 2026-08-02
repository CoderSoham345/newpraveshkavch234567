/**
 * Document Type Classifier
 * Automatically detects document type from OCR text using weighted keywords & regex patterns.
 * Never returns UNKNOWN unless no keywords match.
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

export interface DocumentDetectionResult {
  detectedDocumentType: DocumentTypeCode;
  confidence: number;
  reason: string;
  matchedKeywords: string[];
  side?: 'front' | 'back';
}

export interface DocumentClassification {
  documentType: DocumentTypeCode;
  side?: 'front' | 'back';
  confidence: number;
  indicators: string[];
}

/**
 * Core function to detect document type with keyword matching & confidence scoring
 */
export function detectDocumentType(rawText: string, hintSide?: 'front' | 'back'): DocumentDetectionResult {
  const text = (rawText || '').toUpperCase();
  const candidates: Array<{
    type: DocumentTypeCode;
    score: number;
    matchedKeywords: string[];
    reason: string;
    side?: 'front' | 'back';
  }> = [];

  // 1. PAN CARD
  // Keywords: INCOME TAX DEPARTMENT, Permanent Account Number, GOVT OF INDIA, INCOME TAX, ABCDE1234F pattern
  {
    let panScore = 0;
    const panKeywords: string[] = [];

    if (/INCOME\s*TAX\s*DEPARTMENT|INCOMETAX/i.test(text)) {
      panScore += 40;
      panKeywords.push('INCOME TAX DEPARTMENT');
    }
    if (/PERMANENT\s*ACCOUNT\s*NUMBER|P\.A\.N\.|PERMANENT\s*ACCOUNT/i.test(text)) {
      panScore += 35;
      panKeywords.push('Permanent Account Number');
    }
    if (/GOVT\s*OF\s*INDIA|GOVT\.\s*OF\s*INDIA|GOVERNMENT\s*OF\s*INDIA/i.test(text)) {
      panScore += 20;
      panKeywords.push('GOVT OF INDIA');
    }
    if (/INCOME\s*TAX/i.test(text) && !panKeywords.includes('INCOME TAX DEPARTMENT')) {
      panScore += 25;
      panKeywords.push('INCOME TAX');
    }
    const panRegex = text.match(/[A-Z]{5}[0-9]{4}[A-Z]/);
    if (panRegex) {
      panScore += 50;
      panKeywords.push(`PAN Regex Pattern (${panRegex[0]})`);
    }
    if (/FATHER|FATHER'S\s*NAME|SIGNATURE/i.test(text)) {
      panScore += 10;
      panKeywords.push('Father Name / Signature');
    }

    if (panScore > 0) {
      candidates.push({
        type: 'PAN_CARD',
        score: panScore,
        matchedKeywords: panKeywords,
        reason: `Matched PAN Card keywords (${panKeywords.join(', ')})`,
        side: 'front',
      });
    }
  }

  // 2. AADHAAR CARD
  // Keywords: Government of India, Unique Identification Authority of India, DOB, Male, Female, 12-digit Aadhaar number
  {
    let aadhaarScore = 0;
    const aadhaarKeywords: string[] = [];

    if (/UNIQUE\s*IDENTIFICATION\s*AUTHORITY|UIDAI|U\.I\.D\.A\.I/i.test(text)) {
      aadhaarScore += 40;
      aadhaarKeywords.push('Unique Identification Authority of India');
    }
    if (/AADHAAR|ADHAAR|AADHAA|BHARAT\s*SARKAR/i.test(text)) {
      aadhaarScore += 30;
      aadhaarKeywords.push('Aadhaar / Bharat Sarkar');
    }
    if (/GOVERNMENT\s*OF\s*INDIA|GOVT\s*OF\s*INDIA/i.test(text)) {
      aadhaarScore += 20;
      aadhaarKeywords.push('Government of India');
    }
    const aadhaarNumMatch = text.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);
    if (aadhaarNumMatch) {
      aadhaarScore += 45;
      aadhaarKeywords.push(`12-digit Aadhaar Number (${aadhaarNumMatch[0]})`);
    }
    if (/DOB|DATE\s*OF\s*BIRTH|YEAR\s*OF\s*BIRTH/i.test(text)) {
      aadhaarScore += 15;
      aadhaarKeywords.push('DOB');
    }
    if (/\bMALE\b|\bFEMALE\b/i.test(text)) {
      aadhaarScore += 15;
      aadhaarKeywords.push('Male/Female');
    }

    const isBack = hintSide === 'back' || /ADDRESS|PINCODE|HELP@UIDAI/i.test(text);

    if (aadhaarScore > 0) {
      candidates.push({
        type: isBack ? 'AADHAAR_BACK' : 'AADHAAR_FRONT',
        score: aadhaarScore,
        matchedKeywords: aadhaarKeywords,
        reason: `Matched Aadhaar keywords (${aadhaarKeywords.join(', ')})`,
        side: isBack ? 'back' : 'front',
      });
    }
  }

  // 3. PASSPORT
  // Keywords: Passport, Republic of India, Nationality, Passport No, MRZ
  {
    let passportScore = 0;
    const passportKeywords: string[] = [];

    if (/\bPASSPORT\b/i.test(text)) {
      passportScore += 40;
      passportKeywords.push('Passport');
    }
    if (/REPUBLIC\s*OF\s*INDIA|MINISTRY\s*OF\s*EXTERNAL\s*AFFAIRS/i.test(text)) {
      passportScore += 30;
      passportKeywords.push('Republic of India');
    }
    if (/NATIONALITY/i.test(text)) {
      passportScore += 20;
      passportKeywords.push('Nationality');
    }
    if (/PASSPORT\s*NO|PASSPORT\s*NUMBER/i.test(text)) {
      passportScore += 30;
      passportKeywords.push('Passport No');
    }
    const mrzMatch = text.match(/P<[A-Z0-9<]+/) || text.match(/P[A-Z0-9]{8,}/);
    if (mrzMatch) {
      passportScore += 50;
      passportKeywords.push('MRZ Zone');
    }

    if (passportScore > 0) {
      candidates.push({
        type: 'PASSPORT',
        score: passportScore,
        matchedKeywords: passportKeywords,
        reason: `Matched Passport keywords (${passportKeywords.join(', ')})`,
        side: 'front',
      });
    }
  }

  // 4. DRIVING LICENSE
  // Keywords: Driving Licence, DL No, Transport, RTO, Vehicle Class
  {
    let dlScore = 0;
    const dlKeywords: string[] = [];

    if (/DRIVING\s*LICEN[CS]E|FORM\s*7/i.test(text)) {
      dlScore += 45;
      dlKeywords.push('Driving Licence');
    }
    if (/DL\s*NO|DL\s*NUMBER|LICEN[CS]E\s*NO/i.test(text)) {
      dlScore += 35;
      dlKeywords.push('DL No');
    }
    if (/TRANSPORT|MOTOR\s*VEHICLE|UNION\s*OF\s*INDIA/i.test(text)) {
      dlScore += 20;
      dlKeywords.push('Transport');
    }
    if (/\bRTO\b|STATE\s*RTO/i.test(text)) {
      dlScore += 20;
      dlKeywords.push('RTO');
    }
    if (/VEHICLE\s*CLASS|COV|MCWG|LMV/i.test(text)) {
      dlScore += 25;
      dlKeywords.push('Vehicle Class');
    }
    const dlMatch = text.match(/\b[A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{7,11}\b/i);
    if (dlMatch) {
      dlScore += 35;
      dlKeywords.push(`DL Number Pattern (${dlMatch[0]})`);
    }

    if (dlScore > 0) {
      candidates.push({
        type: 'DRIVING_LICENCE',
        score: dlScore,
        matchedKeywords: dlKeywords,
        reason: `Matched Driving License keywords (${dlKeywords.join(', ')})`,
        side: 'front',
      });
    }
  }

  // 5. VOTER ID
  {
    let voterScore = 0;
    const voterKeywords: string[] = [];

    if (/ELECTION\s*COMMISSION|ELECTOR\s*PHOTO/i.test(text)) {
      voterScore += 40;
      voterKeywords.push('Election Commission');
    }
    if (/VOTER\s*ID|EPIC/i.test(text)) {
      voterScore += 35;
      voterKeywords.push('Voter ID');
    }
    const epicMatch = text.match(/\b[A-Z]{3}[0-9]{7}\b/);
    if (epicMatch) {
      voterScore += 40;
      voterKeywords.push(`EPIC Pattern (${epicMatch[0]})`);
    }

    if (voterScore > 0) {
      candidates.push({
        type: 'VOTER_ID',
        score: voterScore,
        matchedKeywords: voterKeywords,
        reason: `Matched Voter ID keywords (${voterKeywords.join(', ')})`,
        side: 'front',
      });
    }
  }

  // 6. RC BOOK
  {
    let rcScore = 0;
    const rcKeywords: string[] = [];

    if (/REGISTRATION\s*CERTIFICATE|RC\s*BOOK/i.test(text)) {
      rcScore += 45;
      rcKeywords.push('Registration Certificate');
    }
    if (/CHASSIS\s*NO|ENGINE\s*NO/i.test(text)) {
      rcScore += 35;
      rcKeywords.push('Chassis / Engine No');
    }

    if (rcScore > 0) {
      candidates.push({
        type: 'RC_BOOK',
        score: rcScore,
        matchedKeywords: rcKeywords,
        reason: `Matched RC Book keywords (${rcKeywords.join(', ')})`,
        side: 'front',
      });
    }
  }

  // 7. EMPLOYEE ID
  {
    let empScore = 0;
    const empKeywords: string[] = [];
    if (/EMPLOYEE\s*ID|STAFF\s*CARD|CORPORATE\s*ID|EMPLOYEE\s*CARD/i.test(text)) {
      empScore += 35;
      empKeywords.push('Employee ID');
    }
    if (empScore > 0) {
      candidates.push({
        type: 'EMPLOYEE_ID',
        score: empScore,
        matchedKeywords: empKeywords,
        reason: `Matched Employee ID keywords (${empKeywords.join(', ')})`,
        side: 'front',
      });
    }
  }

  // 8. STUDENT ID
  {
    let studentScore = 0;
    const studentKeywords: string[] = [];
    if (/STUDENT\s*ID|COLLEGE\s*ID|UNIVERSITY|ROLL\s*NO|ENROLLMENT/i.test(text)) {
      studentScore += 35;
      studentKeywords.push('Student ID');
    }
    if (studentScore > 0) {
      candidates.push({
        type: 'STUDENT_ID',
        score: studentScore,
        matchedKeywords: studentKeywords,
        reason: `Matched Student ID keywords (${studentKeywords.join(', ')})`,
        side: 'front',
      });
    }
  }

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length > 0 && candidates[0].score > 0) {
    const winner = candidates[0];
    const confidence = Math.min(99, Math.max(65, winner.score));

    // Print detection report before parsing
    console.log('[v0] ===== BEFORE PARSING: DETECTED DOCUMENT REPORT =====');
    console.log('[v0] Detected Document Type:', winner.type);
    console.log('[v0] Reason:', winner.reason);
    console.log('[v0] Matched Keywords:', winner.matchedKeywords);
    console.log('[v0] Confidence:', confidence);

    return {
      detectedDocumentType: winner.type,
      confidence,
      reason: winner.reason,
      matchedKeywords: winner.matchedKeywords,
      side: winner.side || hintSide || 'front',
    };
  }

  // Return UNKNOWN only if zero keywords match
  console.log('[v0] ===== BEFORE PARSING: DETECTED DOCUMENT REPORT =====');
  console.log('[v0] Detected Document Type: UNKNOWN');
  console.log('[v0] Reason: Zero recognized keywords or patterns matched');
  console.log('[v0] Matched Keywords: []');
  console.log('[v0] Confidence: 0');

  return {
    detectedDocumentType: 'UNKNOWN',
    confidence: 0,
    reason: 'Zero recognized keywords matched in raw OCR text',
    matchedKeywords: [],
    side: hintSide || 'front',
  };
}

/**
 * Backward compatibility wrapper
 */
export function classifyDocument(ocrText: string, side?: 'front' | 'back'): DocumentClassification {
  const result = detectDocumentType(ocrText, side);
  return {
    documentType: result.detectedDocumentType,
    side: result.side,
    confidence: result.confidence,
    indicators: result.matchedKeywords,
  };
}

/**
 * Validate document type consistency
 */
export function validateDocumentTypeConsistency(
  frontClassification: DocumentClassification,
  backClassification: DocumentClassification
): boolean {
  const frontBase = frontClassification.documentType.replace(/_FRONT|_BACK/, '');
  const backBase = backClassification.documentType.replace(/_FRONT|_BACK/, '');
  return frontBase === backBase;
}

