import { DocumentType } from '../types';

export interface FieldValidation {
  value: string;
  confidence: number;
  isValid: boolean;
  validationStatus: 'VERIFIED' | 'NEEDS_REVIEW' | 'INVALID';
  errorMessage?: string;
}

export interface DocumentExtractionResult {
  detectedDocumentType: DocumentType;
  confidence: number;
  fields: Record<string, FieldValidation>;
  rawOCRText: string;
  needsManualReview: boolean;
}

// Image preprocessing pipeline
export class OCRPreprocessor {
  static async preprocessImage(imageData: string): Promise<string> {
    // 1. Auto Rotate - detect and correct orientation
    const rotated = await this.autoRotate(imageData);
    
    // 2. Perspective Correction - straighten document edges
    const perspectiveFixed = await this.perspectiveCorrection(rotated);
    
    // 3. Deskew - rotate to horizontal
    const deskewed = await this.deskew(perspectiveFixed);
    
    // 4. Remove Shadows - enhance shadow areas
    const shadowRemoved = await this.removeShadows(deskewed);
    
    // 5. Background Cleaning - remove background noise
    const bgCleaned = await this.cleanBackground(shadowRemoved);
    
    // 6. Contrast Enhancement - improve contrast
    const enhanced = await this.enhanceContrast(bgCleaned);
    
    // 7. Adaptive Threshold - convert to binary
    const thresholded = await this.adaptiveThreshold(enhanced);
    
    // 8. Noise Removal - denoise
    const denoised = await this.removeNoise(thresholded);
    
    // 9. Image Sharpening - sharpen details
    const sharpened = await this.sharpenImage(denoised);
    
    // 10. Border Detection - find and normalize document
    const bordered = await this.detectBorders(sharpened);
    
    return bordered;
  }

  private static async autoRotate(imageData: string): Promise<string> {
    // Placeholder - would use OCR angle detection
    return imageData;
  }

  private static async perspectiveCorrection(imageData: string): Promise<string> {
    // Placeholder - would use corner detection
    return imageData;
  }

  private static async deskew(imageData: string): Promise<string> {
    // Placeholder
    return imageData;
  }

  private static async removeShadows(imageData: string): Promise<string> {
    // Placeholder
    return imageData;
  }

  private static async cleanBackground(imageData: string): Promise<string> {
    // Placeholder
    return imageData;
  }

  private static async enhanceContrast(imageData: string): Promise<string> {
    // Placeholder
    return imageData;
  }

  private static async adaptiveThreshold(imageData: string): Promise<string> {
    // Placeholder
    return imageData;
  }

  private static async removeNoise(imageData: string): Promise<string> {
    // Placeholder
    return imageData;
  }

  private static async sharpenImage(imageData: string): Promise<string> {
    // Placeholder
    return imageData;
  }

  private static async detectBorders(imageData: string): Promise<string> {
    // Placeholder
    return imageData;
  }
}

// Document-specific field extraction validators
export class DocumentValidator {
  // Aadhaar validation
  static validateAadhaarNumber(value: string): FieldValidation {
    const cleaned = value.replace(/\D/g, '');
    const isValid = cleaned.length === 12 && /^\d{12}$/.test(cleaned);
    
    return {
      value: cleaned,
      confidence: isValid ? 95 : 50,
      isValid,
      validationStatus: isValid ? 'VERIFIED' : 'NEEDS_REVIEW',
      errorMessage: isValid ? undefined : 'Aadhaar must be 12 digits (XXXX XXXX XXXX)',
    };
  }

  static validatePANNumber(value: string): FieldValidation {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const isValid = panRegex.test(value.toUpperCase());
    
    return {
      value: value.toUpperCase(),
      confidence: isValid ? 98 : 60,
      isValid,
      validationStatus: isValid ? 'VERIFIED' : 'NEEDS_REVIEW',
      errorMessage: isValid ? undefined : 'PAN format: ABCDE1234F',
    };
  }

  static validatePassportNumber(value: string): FieldValidation {
    const passportRegex = /^[A-Z]{1}[0-9]{7}$/;
    const isValid = passportRegex.test(value.toUpperCase());
    
    return {
      value: value.toUpperCase(),
      confidence: isValid ? 90 : 55,
      isValid,
      validationStatus: isValid ? 'VERIFIED' : 'NEEDS_REVIEW',
      errorMessage: isValid ? undefined : 'Passport format: A1234567',
    };
  }

  static validateDrivingLicenceNumber(value: string): FieldValidation {
    const dlRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}[0-9]{7}$/;
    const isValid = dlRegex.test(value.toUpperCase());
    
    return {
      value: value.toUpperCase(),
      confidence: isValid ? 92 : 58,
      isValid,
      validationStatus: isValid ? 'VERIFIED' : 'NEEDS_REVIEW',
      errorMessage: isValid ? undefined : 'Invalid DL format',
    };
  }

  static validateVoterIDNumber(value: string): FieldValidation {
    const epicRegex = /^[A-Z]{3}[0-9]{7}$/;
    const isValid = epicRegex.test(value.toUpperCase());
    
    return {
      value: value.toUpperCase(),
      confidence: isValid ? 88 : 52,
      isValid,
      validationStatus: isValid ? 'VERIFIED' : 'NEEDS_REVIEW',
      errorMessage: isValid ? undefined : 'EPIC format: ABC1234567',
    };
  }

  static validatePINCode(value: string): FieldValidation {
    const cleaned = value.replace(/\D/g, '');
    const isValid = cleaned.length === 6 && /^\d{6}$/.test(cleaned);
    
    return {
      value: cleaned,
      confidence: isValid ? 99 : 70,
      isValid,
      validationStatus: isValid ? 'VERIFIED' : 'INVALID',
      errorMessage: isValid ? undefined : 'PIN must be 6 digits',
    };
  }

  static validateDateOfBirth(value: string): FieldValidation {
    // Handle multiple formats: DD/MM/YYYY, DD-MM-YYYY, DDMMYYYY
    const dateRegex = /(\d{2})[/-]?(\d{2})[/-]?(\d{4})/;
    const match = value.match(dateRegex);
    
    if (!match) {
      return {
        value,
        confidence: 0,
        isValid: false,
        validationStatus: 'INVALID',
        errorMessage: 'Invalid date format (DD/MM/YYYY)',
      };
    }

    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = parseInt(match[3]);

    const isValid = day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= new Date().getFullYear();

    return {
      value: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
      confidence: isValid ? 95 : 40,
      isValid,
      validationStatus: isValid ? 'VERIFIED' : 'NEEDS_REVIEW',
      errorMessage: isValid ? undefined : 'Invalid date',
    };
  }

  static validateName(value: string): FieldValidation {
    const trimmed = value.trim();
    // Name should have at least 2 characters and mostly alphabets
    const isValid = trimmed.length >= 2 && /^[a-zA-Z\s'-]+$/.test(trimmed);

    return {
      value: trimmed,
      confidence: isValid ? 90 : 65,
      isValid,
      validationStatus: isValid ? 'VERIFIED' : 'NEEDS_REVIEW',
      errorMessage: isValid ? undefined : 'Name should contain only letters',
    };
  }

  static validateEmail(value: string): FieldValidation {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);

    return {
      value: value.toLowerCase(),
      confidence: isValid ? 95 : 30,
      isValid,
      validationStatus: isValid ? 'VERIFIED' : isValid ? 'VERIFIED' : 'NEEDS_REVIEW',
      errorMessage: isValid ? undefined : 'Invalid email format',
    };
  }

  static validatePhoneNumber(value: string): FieldValidation {
    const cleaned = value.replace(/\D/g, '');
    const isValid = cleaned.length >= 10 && cleaned.length <= 12;

    return {
      value: cleaned,
      confidence: isValid ? 92 : 50,
      isValid,
      validationStatus: isValid ? 'VERIFIED' : 'NEEDS_REVIEW',
      errorMessage: isValid ? undefined : 'Phone must be 10-12 digits',
    };
  }

  static validateAddress(value: string): FieldValidation {
    const trimmed = value.trim();
    const isValid = trimmed.length >= 5;

    return {
      value: trimmed,
      confidence: isValid ? 80 : 40,
      isValid,
      validationStatus: isValid ? 'VERIFIED' : 'NEEDS_REVIEW',
      errorMessage: isValid ? undefined : 'Address too short',
    };
  }
}

// Document type detection from OCR text
export class DocumentDetector {
  static detectDocumentType(ocrText: string): DocumentType {
    const text = ocrText.toUpperCase();

    if (text.includes('UNIQUE IDENTIFICATION AUTHORITY') || text.includes('AADHAAR')) {
      return text.includes('ADDRESS') ? 'AADHAAR_BACK' : 'AADHAAR_FRONT';
    }

    if (text.includes('PERMANENT ACCOUNT NUMBER') || text.includes('INCOME TAX')) {
      return 'PAN_CARD';
    }

    if (text.includes('PASSPORT') || text.includes('MINISTRY OF EXTERNAL AFFAIRS')) {
      return 'PASSPORT';
    }

    if (text.includes('DRIVING LICENCE') || text.includes('MOTOR VEHICLE')) {
      return 'DRIVING_LICENCE';
    }

    if (text.includes('EPIC') || text.includes('ELECTION') || text.includes('VOTER')) {
      return 'VOTER_ID';
    }

    if (text.includes('REGISTRATION CERTIFICATE') || text.includes('VEHICLE')) {
      return 'RC_BOOK';
    }

    if (text.includes('STUDENT') || text.includes('ROLL NUMBER')) {
      return 'STUDENT_ID';
    }

    if (text.includes('EMPLOYEE') || text.includes('COMPANY')) {
      return text.includes('GOVT') ? 'GOVT_EMPLOYEE_ID' : 'PRIVATE_EMPLOYEE_ID';
    }

    return 'OTHER_IDENTITY_DOC';
  }
}

// Export field extraction templates for each document type
export const EXTRACTION_TEMPLATES = {
  AADHAAR_FRONT: [
    'documentNumber',
    'name',
    'firstName',
    'middleName',
    'lastName',
    'gender',
    'dob',
    'age',
    'yearOfBirth',
    'photoPresent',
    'qrCodePresent',
  ],
  AADHAAR_BACK: [
    'careOf',
    'houseNo',
    'building',
    'street',
    'landmark',
    'village',
    'locality',
    'city',
    'taluka',
    'district',
    'state',
    'pinCode',
    'completeAddress',
  ],
  PAN_CARD: [
    'documentNumber',
    'name',
    'fatherName',
    'dob',
    'signaturePresent',
    'photoPresent',
  ],
  PASSPORT: [
    'documentNumber',
    'passportType',
    'countryCode',
    'nationality',
    'givenName',
    'surname',
    'sex',
    'dob',
    'placeOfBirth',
    'dateOfIssue',
    'dateOfExpiry',
    'issuingAuthority',
    'mrzLine1',
    'mrzLine2',
  ],
  DRIVING_LICENCE: [
    'documentNumber',
    'name',
    'fatherName',
    'motherName',
    'dob',
    'bloodGroup',
    'address',
    'city',
    'district',
    'state',
    'pinCode',
    'issueDate',
    'expiryDate',
    'vehicleClasses',
    'issuingRTO',
  ],
  VOTER_ID: [
    'documentNumber',
    'name',
    'fatherHusbandName',
    'gender',
    'age',
    'address',
  ],
  RC_BOOK: [
    'documentNumber',
    'ownerName',
    'vehicleClass',
    'maker',
    'model',
    'engineNumber',
    'chassisNumber',
    'fuelType',
    'registrationDate',
    'insuranceValidity',
    'fitnessValidity',
  ],
  STUDENT_ID: [
    'studentName',
    'studentId',
    'rollNumber',
    'college',
    'department',
    'course',
    'year',
    'validTill',
  ],
  GOVT_EMPLOYEE_ID: [
    'employeeName',
    'employeeId',
    'companyName',
    'department',
    'designation',
    'validTill',
  ],
  PRIVATE_EMPLOYEE_ID: [
    'employeeName',
    'employeeId',
    'companyName',
    'department',
    'designation',
    'validTill',
  ],
};
