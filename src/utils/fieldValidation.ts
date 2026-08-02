/**
 * Field Validation System for all Indian ID document types
 * Ensures data accuracy, prevents hallucinations, and provides confidence scoring
 */

export interface ValidationResult {
  isValid: boolean;
  confidence: number; // 0-100
  errorMessage?: string;
}

/**
 * Validates Aadhaar Number - Checksum validation for 12 digits
 * Format: XXXX XXXX XXXX
 */
export function validateAadhaar(aadhaarNumber: string): ValidationResult {
  if (!aadhaarNumber || typeof aadhaarNumber !== 'string') {
    return { isValid: false, confidence: 0, errorMessage: 'Aadhaar number is required' };
  }

  const cleaned = aadhaarNumber.replace(/\s/g, '');

  // Check if it's 12 digits
  if (!/^\d{12}$/.test(cleaned)) {
    return { isValid: false, confidence: 0, errorMessage: 'Aadhaar must be 12 digits' };
  }

  // Verhoeff checksum algorithm for Aadhaar
  const d = [
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

  const p = [
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
  const digits = cleaned.split('').reverse();

  for (let i = 0; i < digits.length; i++) {
    c = d[c][p[(i % 8)][parseInt(digits[i], 10)]];
  }

  const checkDigit = inv[c];
  const isChecksumValid = parseInt(cleaned.charAt(11), 10) === checkDigit;

  return {
    isValid: isChecksumValid,
    confidence: isChecksumValid ? 99 : 0,
    errorMessage: isChecksumValid ? undefined : 'Invalid Aadhaar checksum',
  };
}

/**
 * Validates PIN Code - Must be 6 digits and valid Indian PIN
 */
export function validatePINCode(pinCode: string): ValidationResult {
  if (!pinCode || typeof pinCode !== 'string') {
    return { isValid: false, confidence: 0, errorMessage: 'PIN code is required' };
  }

  const cleaned = pinCode.replace(/\s/g, '');

  if (!/^\d{6}$/.test(cleaned)) {
    return { isValid: false, confidence: 0, errorMessage: 'PIN code must be exactly 6 digits' };
  }

  // Check if first digit is not 0 (valid PIN codes don't start with 0)
  if (cleaned.charAt(0) === '0') {
    return { isValid: false, confidence: 50, errorMessage: 'PIN code cannot start with 0' };
  }

  return { isValid: true, confidence: 95 };
}

/**
 * Validates Date of Birth - Format DD/MM/YYYY or YYYY-MM-DD
 * Ensures date is reasonable (not in future, not too old)
 */
export function validateDOB(dob: string): ValidationResult {
  if (!dob || typeof dob !== 'string') {
    return { isValid: false, confidence: 0, errorMessage: 'Date of birth is required' };
  }

  const trimmed = dob.trim();
  let day: number, month: number, year: number;

  // Try DD/MM/YYYY format
  let parts = trimmed.split('/');
  if (parts.length === 3) {
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  } else {
    // Try YYYY-MM-DD format
    parts = trimmed.split('-');
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      return { isValid: false, confidence: 0, errorMessage: 'Invalid date format (use DD/MM/YYYY or YYYY-MM-DD)' };
    }
  }

  // Validate ranges
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return { isValid: false, confidence: 0, errorMessage: 'Invalid date values' };
  }

  if (month < 1 || month > 12) {
    return { isValid: false, confidence: 0, errorMessage: 'Month must be between 1-12' };
  }

  if (day < 1 || day > 31) {
    return { isValid: false, confidence: 0, errorMessage: 'Day must be between 1-31' };
  }

  // Validate leap year and days in month
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
    daysInMonth[1] = 29;
  }

  if (day > daysInMonth[month - 1]) {
    return { isValid: false, confidence: 0, errorMessage: `Invalid day for month ${month}` };
  }

  // Check if year is reasonable
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) {
    return { isValid: false, confidence: 0, errorMessage: 'Year must be between 1900 and current year' };
  }

  // Check if DOB is in future
  const dobDate = new Date(year, month - 1, day);
  if (dobDate > new Date()) {
    return { isValid: false, confidence: 0, errorMessage: 'Date of birth cannot be in the future' };
  }

  // Check if person is too old (> 150 years)
  const ageInYears = currentYear - year;
  if (ageInYears > 150) {
    return { isValid: false, confidence: 30, errorMessage: 'Age seems unreasonable (> 150 years)' };
  }

  // Check if person is a baby (< 6 months)
  if (ageInYears === 0) {
    const currentMonth = new Date().getMonth() + 1;
    if (month >= currentMonth) {
      return { isValid: true, confidence: 85, errorMessage: 'Person is very young (< 6 months)' };
    }
  }

  return { isValid: true, confidence: 95 };
}

/**
 * Validates Gender - Must be Male, Female, or Other (M/F/O)
 */
export function validateGender(gender: string): ValidationResult {
  if (!gender || typeof gender !== 'string') {
    return { isValid: false, confidence: 0, errorMessage: 'Gender is required' };
  }

  const trimmed = gender.trim().toUpperCase();
  const validGenders = ['MALE', 'FEMALE', 'OTHER', 'M', 'F', 'O'];

  if (!validGenders.includes(trimmed)) {
    return { isValid: false, confidence: 0, errorMessage: 'Gender must be Male, Female, or Other' };
  }

  return { isValid: true, confidence: 98 };
}

/**
 * Validates Name - Non-empty, reasonable length, no pure numbers
 */
export function validateName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { isValid: false, confidence: 0, errorMessage: 'Name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { isValid: false, confidence: 0, errorMessage: 'Name cannot be empty' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, confidence: 0, errorMessage: 'Name is too short' };
  }

  if (trimmed.length > 100) {
    return { isValid: false, confidence: 0, errorMessage: 'Name is too long' };
  }

  // Check if name is only numbers
  if (/^\d+$/.test(trimmed)) {
    return { isValid: false, confidence: 0, errorMessage: 'Name cannot be only numbers' };
  }

  // Check if name has at least one letter
  if (!/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, confidence: 20, errorMessage: 'Name should contain at least one letter' };
  }

  return { isValid: true, confidence: 95 };
}

/**
 * Validates PAN Number - Format: ABCDE1234F
 * 5 letters + 4 digits + 1 letter
 */
export function validatePAN(pan: string): ValidationResult {
  if (!pan || typeof pan !== 'string') {
    return { isValid: false, confidence: 0, errorMessage: 'PAN is required' };
  }

  const cleaned = pan.replace(/\s/g, '').toUpperCase();

  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleaned)) {
    return { isValid: false, confidence: 0, errorMessage: 'PAN format must be ABCDE1234F' };
  }

  return { isValid: true, confidence: 98 };
}

/**
 * Validates Passport Number - Format: Z9821034 (1 letter + 7 digits)
 */
export function validatePassport(passportNumber: string): ValidationResult {
  if (!passportNumber || typeof passportNumber !== 'string') {
    return { isValid: false, confidence: 0, errorMessage: 'Passport number is required' };
  }

  const cleaned = passportNumber.replace(/\s/g, '').toUpperCase();

  if (!/^[A-Z][0-9]{7}$/.test(cleaned)) {
    return { isValid: false, confidence: 0, errorMessage: 'Passport format must be Z9821034 (1 letter + 7 digits)' };
  }

  return { isValid: true, confidence: 98 };
}

/**
 * Validates Driving License Number - Format: DL-0420110012345
 */
export function validateDrivingLicense(dlNumber: string): ValidationResult {
  if (!dlNumber || typeof dlNumber !== 'string') {
    return { isValid: false, confidence: 0, errorMessage: 'Driving License number is required' };
  }

  const cleaned = dlNumber.replace(/\s/g, '').toUpperCase();

  if (!/^[A-Z]{2}[-]?[0-9]{2,13}$/.test(cleaned)) {
    return {
      isValid: false,
      confidence: 0,
      errorMessage: 'Invalid Driving License format (e.g. DL-0420110012345)',
    };
  }

  return { isValid: true, confidence: 95 };
}

/**
 * Validates Voter ID (EPIC) Number - Format: ABC1234567
 */
export function validateVoterID(epicNumber: string): ValidationResult {
  if (!epicNumber || typeof epicNumber !== 'string') {
    return { isValid: false, confidence: 0, errorMessage: 'EPIC number is required' };
  }

  const cleaned = epicNumber.replace(/\s/g, '').toUpperCase();

  if (!/^[A-Z]{3}[0-9]{7}$/.test(cleaned)) {
    return { isValid: false, confidence: 0, errorMessage: 'EPIC format must be ABC1234567' };
  }

  return { isValid: true, confidence: 97 };
}

/**
 * Calculates age in years from Date of Birth
 * NEVER read age directly from OCR - always calculate it
 */
export function calculateAge(dob: string): number | null {
  const dobValidation = validateDOB(dob);
  if (!dobValidation.isValid) {
    return null;
  }

  const trimmed = dob.trim();
  let day: number, month: number, year: number;

  // Parse DD/MM/YYYY format
  let parts = trimmed.split('/');
  if (parts.length === 3) {
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  } else {
    // Parse YYYY-MM-DD format
    parts = trimmed.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  }

  const today = new Date();
  let age = today.getFullYear() - year;

  const monthDiff = today.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age--;
  }

  return age >= 0 ? age : null;
}

/**
 * Main validation function - validates all fields for confidence scoring
 * Returns confidence percentage (0-100)
 */
export function getFieldConfidence(
  fieldType: 'aadhaar' | 'pin' | 'dob' | 'gender' | 'name' | 'pan' | 'passport' | 'dl' | 'voter',
  value: string
): number {
  let result: ValidationResult = { isValid: false, confidence: 0 };

  switch (fieldType) {
    case 'aadhaar':
      result = validateAadhaar(value);
      break;
    case 'pin':
      result = validatePINCode(value);
      break;
    case 'dob':
      result = validateDOB(value);
      break;
    case 'gender':
      result = validateGender(value);
      break;
    case 'name':
      result = validateName(value);
      break;
    case 'pan':
      result = validatePAN(value);
      break;
    case 'passport':
      result = validatePassport(value);
      break;
    case 'dl':
      result = validateDrivingLicense(value);
      break;
    case 'voter':
      result = validateVoterID(value);
      break;
  }

  return result.confidence;
}
