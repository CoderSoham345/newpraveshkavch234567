/**
 * STRICT AADHAAR OCR EXTRACTION ENGINE
 * ====================================
 * 
 * This engine follows the official PraveshKavach™ OCR Pipeline:
 * - NO AI hallucination
 * - NO value generation
 * - NO inferencing
 * - Only deterministic regex parsing and validation
 * - Strict confidence scoring
 * - Clear "Not Detected" messages for missing fields
 */

/**
 * FRONT SIDE EXTRACTION
 * Extract only from the visibly printed fields on Aadhaar front
 */

/**
 * Extract and validate Aadhaar number (12 digits)
 * Accepts: XXXX XXXX XXXX or XXXXXXXXXXXX
 * Returns: Clean number or empty string if not found
 */
export function extractAadhaarNumber(rawText: string): {
  value: string;
  confidence: number;
  valid: boolean;
} {
  if (!rawText || rawText.length === 0) {
    return { value: '', confidence: 0, valid: false };
  }

  // Pattern: 4 digits, optional spaces, 4 digits, optional spaces, 4 digits
  // This captures the Aadhaar number format
  const aadhaarPattern = /(?:^|\s)(\d{4})\s*(\d{4})\s*(\d{4})(?:\s|$)/m;
  const match = rawText.match(aadhaarPattern);

  if (!match) {
    return { value: '', confidence: 0, valid: false };
  }

  // Combine the three groups into a single 12-digit number
  const aadhaarNumber = match[1] + match[2] + match[3];

  // Validate: Must be exactly 12 digits
  if (!/^\d{12}$/.test(aadhaarNumber)) {
    return { value: '', confidence: 0, valid: false };
  }

  // Return with high confidence if found
  // This is OCR confidence, not validation - we found it printed
  return {
    value: aadhaarNumber,
    confidence: 92, // High confidence if regex matched
    valid: true,
  };
}

/**
 * Extract Full Name
 * Must be exactly as printed - NO modifications
 * NO capitalization changes
 * NO reordering
 */
export function extractFullName(rawText: string): {
  value: string;
  confidence: number;
} {
  if (!rawText || rawText.length === 0) {
    return { value: '', confidence: 0 };
  }

  // Look for name sections in typical Aadhaar layout
  // Usually appears after "Name" label or at top of card
  // Pattern: One or more lines that are NOT numbers-only or known labels
  const lines = rawText.split('\n');
  let nameCandidate = '';
  let foundNameLabel = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (trimmed.length === 0) continue;

    // If we see "Name" label, next non-empty line is the name
    if (trimmed.match(/^name\s*[:]\s*/i)) {
      foundNameLabel = true;
      continue;
    }

    // If we found the Name label, capture the next line
    if (foundNameLabel && trimmed.length > 2) {
      nameCandidate = trimmed;
      break;
    }

    // Alternative: Look for typical name pattern (words separated by spaces)
    // Names usually: 1-4 words, each word starts with letter
    if (!foundNameLabel && /^[A-Za-z\s]{3,}$/.test(trimmed) && trimmed.length < 50) {
      // Could be a name - but only if it's not a label
      if (!trimmed.match(/^(male|female|date|year|address|village|district)/i)) {
        nameCandidate = trimmed;
        break;
      }
    }
  }

  // If no candidate found, return empty
  if (nameCandidate.length === 0) {
    return { value: '', confidence: 0 };
  }

  // Validate name: Should not contain numbers (except roman numerals)
  if (/\d+/.test(nameCandidate)) {
    // Contains digits - likely not a name
    return { value: '', confidence: 30 };
  }

  // Accept the name exactly as it appears - NO modification
  return {
    value: nameCandidate.trim(),
    confidence: 85, // Good confidence if OCR detected it cleanly
  };
}

/**
 * Extract Father's Name / Guardian Name
 * Look for S/O, D/O, C/O, W/O prefixes
 */
export function extractFatherName(rawText: string): {
  value: string;
  confidence: number;
} {
  if (!rawText || rawText.length === 0) {
    return { value: '', confidence: 0 };
  }

  // Look for patterns: S/O, D/O, C/O, W/O
  const fatherNamePattern = /(?:S\/O|D\/O|C\/O|W\/O)\s+([A-Za-z\s]+?)(?:\n|$)/i;
  const match = rawText.match(fatherNamePattern);

  if (!match || !match[1]) {
    return { value: '', confidence: 0 };
  }

  const fatherName = match[1].trim();

  // Validate: Should be at least 2 characters, no leading digits
  if (fatherName.length < 2 || /^\d/.test(fatherName)) {
    return { value: '', confidence: 0 };
  }

  // Validate: Should not be mostly numbers
  const digitCount = (fatherName.match(/\d/g) || []).length;
  if (digitCount / fatherName.length > 0.5) {
    // More than 50% digits - not a valid name
    return { value: '', confidence: 30 };
  }

  return {
    value: fatherName,
    confidence: 88, // Good confidence if S/O pattern found
  };
}

/**
 * Extract Date of Birth
 * Accepts: DD/MM/YYYY or DD-MM-YYYY
 * NEVER convert - return exactly as printed
 */
export function extractDOB(rawText: string): {
  value: string;
  confidence: number;
  valid: boolean;
} {
  if (!rawText || rawText.length === 0) {
    return { value: '', confidence: 0, valid: false };
  }

  // Pattern: DD/MM/YYYY or DD-MM-YYYY or YYYY
  const dobPatterns = [
    /(\d{2})[-\/](\d{2})[-\/](\d{4})/, // DD/MM/YYYY or DD-MM-YYYY
    /(\d{4})[-\/](\d{2})[-\/](\d{2})/, // YYYY/MM/DD
    /(\d{4})/, // Just YYYY
  ];

  for (const pattern of dobPatterns) {
    const match = rawText.match(pattern);
    if (match) {
      const fullMatch = match[0];

      // Validate date ranges
      if (pattern === dobPatterns[0]) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);

        if (day < 1 || day > 31 || month < 1 || month > 12) {
          continue;
        }
        if (year < 1900 || year > new Date().getFullYear()) {
          continue;
        }

        return { value: fullMatch, confidence: 95, valid: true };
      } else if (pattern === dobPatterns[1]) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const day = parseInt(match[3], 10);

        if (day < 1 || day > 31 || month < 1 || month > 12) {
          continue;
        }
        if (year < 1900 || year > new Date().getFullYear()) {
          continue;
        }

        return { value: fullMatch, confidence: 95, valid: true };
      } else if (pattern === dobPatterns[2]) {
        const year = parseInt(fullMatch, 10);
        if (year >= 1900 && year <= new Date().getFullYear()) {
          return { value: fullMatch, confidence: 70, valid: true };
        }
      }
    }
  }

  return { value: '', confidence: 0, valid: false };
}

/**
 * Extract Gender
 * ONLY accept if clearly printed: Male, Female, Other
 * Otherwise return empty
 */
export function extractGender(rawText: string): {
  value: string;
  confidence: number;
} {
  if (!rawText || rawText.length === 0) {
    return { value: '', confidence: 0 };
  }

  // Look for gender patterns
  const genderPatterns = [
    { pattern: /\bmale\b/i, value: 'Male' },
    { pattern: /\bfemale\b/i, value: 'Female' },
    { pattern: /\bother\b/i, value: 'Other' },
    { pattern: /\bm\b/i, value: 'Male' }, // Single letter abbreviation
    { pattern: /\bf\b/i, value: 'Female' },
  ];

  for (const { pattern, value } of genderPatterns) {
    if (pattern.test(rawText)) {
      return { value, confidence: 90 };
    }
  }

  // Not clearly detected
  return { value: '', confidence: 0 };
}

/**
 * Calculate Age from DOB
 * Input: DOB in DD/MM/YYYY format
 * Output: Age in years (auto-updates annually)
 */
export function calculateAge(dob: string): {
  age: number;
  displayText: string;
} | null {
  // Parse DOB
  const dobMatch = dob.match(/(\d{2})[-\/](\d{2})[-\/](\d{4})/);
  if (!dobMatch) {
    return null;
  }

  const day = parseInt(dobMatch[1], 10);
  const month = parseInt(dobMatch[2], 10);
  const year = parseInt(dobMatch[3], 10);

  const dobDate = new Date(year, month - 1, day);
  const today = new Date();

  let age = today.getFullYear() - dobDate.getFullYear();
  const monthDiff = today.getMonth() - dobDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dobDate.getDate())
  ) {
    age--;
  }

  return {
    age,
    displayText: `${age} Years`,
  };
}

/**
 * BACK SIDE EXTRACTION
 * Extract address and PIN code from back side
 */

/**
 * Extract Address - EXACTLY as printed
 * NO rewriting, NO reformatting, NO merging
 */
export function extractAddress(rawText: string): {
  value: string;
  confidence: number;
} {
  if (!rawText || rawText.length === 0) {
    return { value: '', confidence: 0 };
  }

  // Address appears after "Address:" label usually
  // Collect all lines after address label
  const lines = rawText.split('\n');
  let collectingAddress = false;
  let addressLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.match(/^address\s*[:]/i)) {
      collectingAddress = true;
      continue;
    }

    if (collectingAddress) {
      if (trimmed.length > 0) {
        addressLines.push(trimmed);
      } else if (addressLines.length > 0) {
        // Empty line after collecting - address section ends
        break;
      }
    }
  }

  if (addressLines.length === 0) {
    return { value: '', confidence: 0 };
  }

  // Return address EXACTLY as OCR detected it - joined by newlines
  const address = addressLines.join('\n');

  return {
    value: address,
    confidence: 80,
  };
}

/**
 * Extract PIN Code (6 digits)
 */
export function extractPINCode(rawText: string): {
  value: string;
  confidence: number;
  valid: boolean;
} {
  if (!rawText || rawText.length === 0) {
    return { value: '', confidence: 0, valid: false };
  }

  // PIN codes in India are 6 digits
  const pinPattern = /(?:^|\D)(\d{6})(?:\D|$)/m;
  const match = rawText.match(pinPattern);

  if (!match) {
    return { value: '', confidence: 0, valid: false };
  }

  const pinCode = match[1];

  // Validate: Must be exactly 6 digits
  if (!/^\d{6}$/.test(pinCode)) {
    return { value: '', confidence: 0, valid: false };
  }

  return {
    value: pinCode,
    confidence: 95,
    valid: true,
  };
}

/**
 * Extract State from address
 * Validate against list of Indian states
 */
export function extractState(rawText: string, address: string): {
  value: string;
  confidence: number;
} {
  const allText = (rawText + ' ' + address).toUpperCase();

  const indianStates = [
    'ANDHRA PRADESH',
    'ARUNACHAL PRADESH',
    'ASSAM',
    'BIHAR',
    'CHHATTISGARH',
    'GOA',
    'GUJARAT',
    'HARYANA',
    'HIMACHAL PRADESH',
    'JHARKHAND',
    'KARNATAKA',
    'KERALA',
    'MADHYA PRADESH',
    'MAHARASHTRA',
    'MANIPUR',
    'MEGHALAYA',
    'MIZORAM',
    'NAGALAND',
    'ODISHA',
    'PUNJAB',
    'RAJASTHAN',
    'SIKKIM',
    'TAMIL NADU',
    'TELANGANA',
    'TRIPURA',
    'UTTAR PRADESH',
    'UTTARAKHAND',
    'WEST BENGAL',
    'DELHI',
    'CHANDIGARH',
    'PUDUCHERRY',
    'LADAKH',
    'JAMMU AND KASHMIR',
    'ANDAMAN AND NICOBAR',
    'DAMAN AND DIU',
    'DADRA AND NAGAR HAVELI',
    'LAKSHADWEEP',
  ];

  for (const state of indianStates) {
    if (allText.includes(state)) {
      return { value: state, confidence: 90 };
    }
  }

  return { value: '', confidence: 0 };
}

/**
 * Extract City/District
 * Look for common city/district names or patterns
 */
export function extractCity(address: string): {
  value: string;
  confidence: number;
} {
  if (!address || address.length === 0) {
    return { value: '', confidence: 0 };
  }

  // Common major cities/districts (this is simplified - expand as needed)
  const commonCitiesPattern = /(Mumbai|Delhi|Bangalore|Hyderabad|Chennai|Kolkata|Pune|Ahmedabad|Jaipur|Lucknow|Kanpur|Nagpur|Indore|Thane|Bhopal|Visakhapatnam|Pimpri|Patna|Vadodara|Ghaziabad|Ludhiana|Agra|Nashik|Faridabad|Meerut|Rajkot|Kalyan|Srinagar|Aurangabad|Dhanbad|Amritsar|Varanasi|Surat|Jamshedpur|Madurai|Ranchi|Bhubaneswar|Salem|Vijayawada)/i;

  const match = address.match(commonCitiesPattern);
  if (match) {
    return { value: match[1], confidence: 85 };
  }

  // If no common city found, try to extract from address words
  // Usually a line in the address contains city name
  const lines = address.split('\n');
  if (lines.length > 0) {
    // Last or second-to-last line often has city
    const lastLine = lines[lines.length - 1].trim();
    if (lastLine.length > 2 && lastLine.length < 30) {
      return { value: lastLine, confidence: 60 };
    }
  }

  return { value: '', confidence: 0 };
}

/**
 * Calculate overall confidence score
 * Based on how many required fields were detected
 */
export function calculateOverallConfidence(
  fieldConfidences: Record<string, number>,
  requiredFields: string[]
): number {
  const detectedRequired = requiredFields.filter(
    (field) => fieldConfidences[field] && fieldConfidences[field] > 50
  ).length;

  const score = Math.round(
    (detectedRequired / requiredFields.length) * 100
  );

  return Math.min(100, Math.max(0, score));
}
