/**
 * Document Field Extractors
 * Extracts structured fields from OCR text for each document type
 * Uses strict validation - never hallucinate values
 */

export interface FieldExtractionResult {
  value: string | null;
  confidence: number; // 0-100
  rawMatches?: string[];
}

// ============= AADHAAR EXTRACTORS =============

export function extractAadhaarNumber(text: string): FieldExtractionResult {
  const matches = text.match(/(\d{4})\s*(\d{4})\s*(\d{4})/);
  if (matches) {
    return {
      value: `${matches[1]}${matches[2]}${matches[3]}`,
      confidence: 99,
      rawMatches: [matches[0]],
    };
  }
  return { value: null, confidence: 0 };
}

export function extractName(text: string): FieldExtractionResult {
  // Look for patterns like "Name: John Doe" or name on its own line
  const patterns = [/name\s*[:=]\s*([^\n]+)/i, /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$/m];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length > 2 && name.length < 100 && /^[a-zA-Z\s]+$/.test(name)) {
        return {
          value: name,
          confidence: 90,
          rawMatches: [match[0]],
        };
      }
    }
  }

  return { value: null, confidence: 0 };
}

export function extractDateOfBirth(text: string): FieldExtractionResult {
  // Patterns: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, etc.
  const patterns = [
    /(\d{2})[-\/](\d{2})[-\/](\d{4})/, // DD/MM/YYYY
    /(\d{4})[-\/](\d{2})[-\/](\d{2})/, // YYYY/MM/DD
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Validate date ranges
      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      const year = parseInt(match[3]);

      // Check if it looks like YYYY/MM/DD vs DD/MM/YYYY
      let dateStr = '';
      if (year > 1900 && year < 2030) {
        dateStr = `${String(match[2]).padStart(2, '0')}/${String(match[3]).padStart(2, '0')}/${match[1]}`;
      } else if (day <= 31 && month <= 12) {
        dateStr = `${String(match[1]).padStart(2, '0')}/${String(match[2]).padStart(2, '0')}/${match[3]}`;
      }

      if (dateStr) {
        return {
          value: dateStr,
          confidence: 95,
          rawMatches: [match[0]],
        };
      }
    }
  }

  return { value: null, confidence: 0 };
}

export function extractGender(text: string): FieldExtractionResult {
  if (/\bmale\b/i.test(text)) {
    return { value: 'Male', confidence: 95 };
  }
  if (/\bfemale\b/i.test(text)) {
    return { value: 'Female', confidence: 95 };
  }
  if (/\bother\b/i.test(text)) {
    return { value: 'Other', confidence: 90 };
  }
  return { value: null, confidence: 0 };
}

export function extractPinCode(text: string): FieldExtractionResult {
  const match = text.match(/\b(\d{6})\b/);
  if (match) {
    return {
      value: match[1],
      confidence: 95,
      rawMatches: [match[0]],
    };
  }
  return { value: null, confidence: 0 };
}

export function extractAddress(text: string): FieldExtractionResult {
  // Look for "Address:" pattern and capture everything after
  const match = text.match(/address[:\s]+([\s\S]+?)(?=\b(?:pin|postal|state|city|district|phone|email)\b|$)/i);
  if (match && match[1]) {
    const address = match[1].trim();
    if (address.length > 5 && address.length < 500) {
      return {
        value: address,
        confidence: 85,
        rawMatches: [match[0]],
      };
    }
  }
  return { value: null, confidence: 0 };
}

export function extractFatherName(text: string): FieldExtractionResult {
  // Look for "Father Name:", "S/O:", "Son of:", etc.
  const patterns = [
    /(?:father|father's|guardian|s\/o|son of|d\/o|daughter of)[:\s]+([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length > 2 && name.length < 100 && /^[a-zA-Z\s]+$/.test(name)) {
        return {
          value: name,
          confidence: 85,
          rawMatches: [match[0]],
        };
      }
    }
  }

  return { value: null, confidence: 0 };
}

// ============= PAN CARD EXTRACTORS =============

export function extractPANNumber(text: string): FieldExtractionResult {
  // PAN format: ABCDE1234F
  const match = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);
  if (match) {
    return {
      value: match[1],
      confidence: 99,
      rawMatches: [match[0]],
    };
  }
  return { value: null, confidence: 0 };
}

// ============= PASSPORT EXTRACTORS =============

export function extractPassportNumber(text: string): FieldExtractionResult {
  // Indian Passport: Letter followed by 7 digits
  const match = text.match(/\b([A-Z]{1}[0-9]{7})\b/);
  if (match) {
    return {
      value: match[1],
      confidence: 95,
      rawMatches: [match[0]],
    };
  }
  return { value: null, confidence: 0 };
}

// ============= DRIVING LICENCE EXTRACTORS =============

export function extractDLNumber(text: string): FieldExtractionResult {
  // DL format: State-RTO-8digits
  const match = text.match(/\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{7,11})\b/i);
  if (match) {
    return {
      value: match[1].replace(/\s/g, ''),
      confidence: 95,
      rawMatches: [match[0]],
    };
  }
  return { value: null, confidence: 0 };
}

// ============= VOTER ID EXTRACTORS =============

export function extractEPICNumber(text: string): FieldExtractionResult {
  // EPIC: 10 digits
  const match = text.match(/\b(\d{10})\b/);
  if (match) {
    return {
      value: match[1],
      confidence: 90,
      rawMatches: [match[0]],
    };
  }
  return { value: null, confidence: 0 };
}

// ============= RC BOOK EXTRACTORS =============

export function extractRegistrationNumber(text: string): FieldExtractionResult {
  // Vehicle registration: UP-01-AB-1234
  const match = text.match(/\b([A-Z]{2}[-]?[0-9]{2}[-]?[A-Z]{1,2}[-]?[0-9]{4})\b/i);
  if (match) {
    return {
      value: match[1],
      confidence: 90,
      rawMatches: [match[0]],
    };
  }
  return { value: null, confidence: 0 };
}

export function extractEngineNumber(text: string): FieldExtractionResult {
  // Engine number usually 10-15 alphanumeric
  const match = text.match(/engine\s*(?:no\.?|number)[:\s]+([A-Z0-9]{8,15})/i);
  if (match) {
    return {
      value: match[1],
      confidence: 85,
      rawMatches: [match[0]],
    };
  }
  return { value: null, confidence: 0 };
}

export function extractChassisNumber(text: string): FieldExtractionResult {
  // Chassis number usually 17 characters (VIN)
  const match = text.match(/chassis\s*(?:no\.?|number|vain)[:\s]+([A-Z0-9]{15,20})/i);
  if (match) {
    return {
      value: match[1],
      confidence: 85,
      rawMatches: [match[0]],
    };
  }
  return { value: null, confidence: 0 };
}

// ============= EMPLOYEE/STUDENT ID EXTRACTORS =============

export function extractEmployeeID(text: string): FieldExtractionResult {
  // Employee ID patterns
  const patterns = [/emp[loyee]*\s*(?:id|no)[:\s]+([A-Z0-9-]{5,20})/i];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        value: match[1],
        confidence: 85,
        rawMatches: [match[0]],
      };
    }
  }
  return { value: null, confidence: 0 };
}

export function extractStudentID(text: string): FieldExtractionResult {
  // Student ID patterns
  const patterns = [/(?:student\s+)?(?:id|roll|enrollment)[:\s]+([A-Z0-9-]{5,20})/i];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        value: match[1],
        confidence: 85,
        rawMatches: [match[0]],
      };
    }
  }
  return { value: null, confidence: 0 };
}

// ============= UTILITY FUNCTIONS =============

/**
 * Calculate age from date of birth
 * Only calculated, never extracted from document
 */
export function calculateAge(dob: string): number | null {
  try {
    const [day, month, year] = dob.split('/').map(Number);
    if (!day || !month || !year) return null;

    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= 0 && age < 150 ? age : null;
  } catch {
    return null;
  }
}

/**
 * Validate extracted field confidence
 */
export function highlightLowConfidence(
  fieldName: string,
  confidence: number,
  threshold: number = 85
): boolean {
  return confidence < threshold;
}
