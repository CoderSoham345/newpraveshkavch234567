import { ExtractedDocData, FaceVerificationData, Resident } from '../types';

export interface FinalRegistrationValidationInput {
  frontDocImage: string;
  backDocImage?: string;
  liveFaceImage: string;
  extractedData: ExtractedDocData;
  faceMetrics: FaceVerificationData;
  selectedResidentId: string;
  residents: Resident[];
  visitorPhone: string;
  purpose: string;
  isProcessingOCR?: boolean;
  isProcessingFace?: boolean;
}

export interface FinalRegistrationValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: {
    resident: boolean;
    fullName: boolean;
    documentNumber: boolean;
    frontDoc: boolean;
    liveFace: boolean;
    phone: boolean;
  };
  targetResident?: Resident;
}

/**
 * Hard Gate Final Registration Evaluator
 * Verifies that all mandatory OCR fields, document photos, face checks, and resident selection
 * are completely valid before allowing registration or saving documents.
 */
export function validateFinalRegistration(
  input: FinalRegistrationValidationInput
): FinalRegistrationValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields = {
    resident: false,
    fullName: false,
    documentNumber: false,
    frontDoc: false,
    liveFace: false,
    phone: false,
  };

  // 1. Target Resident / Apartment Host Check
  const resident = (input.residents || []).find((r: any) => r.id === input.selectedResidentId);
  if (!input.selectedResidentId || !resident) {
    missingFields.resident = true;
    errors.push('Target Resident / Apartment Unit is missing. Please select a resident host.');
  }

  // 2. Scanned Document Check
  if (!input.frontDocImage || input.frontDocImage.trim() === '') {
    missingFields.frontDoc = true;
    errors.push('Front Identity Document image is missing. Please scan or upload an ID card.');
  }

  // 3. OCR Full Name Check
  const fullName = (input.extractedData?.fullName || '').trim();
  const isManualName = Boolean(input.extractedData?.manualOverrides?.fullName);
  
  let isNameInvalid = !fullName || fullName === 'Not Detected' || fullName === 'Unknown';
  if (!isManualName) {
    if (fullName.length < 2 || /GOVT|AADHAAR|INDIA|CARD|UNIQUE|GOVERNMENT|AUTHORITY/i.test(fullName)) {
      isNameInvalid = true;
    }
  } else if (fullName.length < 2) {
    isNameInvalid = true;
  }

  if (isNameInvalid) {
    missingFields.fullName = true;
    errors.push('Visitor Name is missing. Please enter the visitor full name.');
  }

  // 4. OCR Document Number Check
  const docNum = (input.extractedData?.documentNumber || '').trim();
  const isManualDocNum = Boolean(input.extractedData?.manualOverrides?.documentNumber);
  const isMaskedDoc = Boolean(input.extractedData?.isMaskedAadhaar) || Boolean(input.extractedData?.maskedDocumentNumber) || /X{4}/i.test(docNum);

  let isDocNumInvalid = false;
  if (!docNum || docNum === 'Not Detected' || /NOT DETECTED/i.test(docNum)) {
    isDocNumInvalid = true;
  } else if (!isManualDocNum) {
    if (docNum.length < 3) {
      isDocNumInvalid = true;
    } else if (isMaskedDoc) {
      const cleaned = docNum.replace(/[\s-]/g, '');
      const hasEndingDigits = /\d{4}$/.test(cleaned);
      const isAllX = /^X+$/i.test(cleaned);
      if (isAllX || (!hasEndingDigits && cleaned.length < 8)) {
        isDocNumInvalid = true;
      }
    } else if (/^0{5,}$/.test(docNum.replace(/[\s-]/g, '')) || docNum === '0000-0000') {
      isDocNumInvalid = true;
    }
  } else if (docNum.length < 2) {
    isDocNumInvalid = true;
  }

  if (isDocNumInvalid) {
    missingFields.documentNumber = true;
    errors.push('Document Identification Number is missing. Please enter the document number.');
  }

  // 5. Live Face Capture Check
  if (!input.liveFaceImage || input.liveFaceImage.trim() === '') {
    missingFields.liveFace = true;
    errors.push('Biometric live face photo is missing. Please capture a live photo.');
  }

  // 6. Face Quality Verification Check
  if (input.faceMetrics) {
    if (!input.faceMetrics.faceDetected) {
      errors.push('Face verification failed: No human face detected in captured photo.');
    } else if (input.faceMetrics.qualityScore < 40) {
      warnings.push('Face image quality score is low. Consider retaking photo for best security accuracy.');
    }
  }

  // 7. Visitor Phone Check
  const cleanedPhone = (input.visitorPhone || '').replace(/\D/g, '');
  if (input.visitorPhone && cleanedPhone.length > 0 && cleanedPhone.length < 10) {
    missingFields.phone = true;
    errors.push('Visitor mobile phone number must be at least 10 digits.');
  }

  // 8. Processing State Check
  if (input.isProcessingOCR) {
    errors.push('Document OCR scanning is still processing. Please wait...');
  }
  if (input.isProcessingFace) {
    errors.push('Face verification processing is still in progress. Please wait...');
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    missingFields,
    targetResident: resident,
  };
}
