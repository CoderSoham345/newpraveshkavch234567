import { VisibilityMode, VisitorPrivacyPreferences, DocumentType, ExtractedDocData, AdminPrivacyConfig } from '../types';

export const DEFAULT_VISITOR_PRIVACY_PREFERENCES: VisitorPrivacyPreferences = {
  fullName: 'VISIBLE',
  photo: 'VISIBLE',
  documentNumber: 'MASKED',
  qrCode: 'HIDDEN',
  address: 'HIDDEN',
  dob: 'HIDDEN',
  gender: 'VISIBLE',
  fatherName: 'HIDDEN',
  documentImage: 'MASKED',
};

export const DEFAULT_ADMIN_PRIVACY_CONFIG: AdminPrivacyConfig = {
  requireMaskedAadhaar: true,
  allowFullAadhaar: true,
  deleteScannedDocAfterVerification: false,
  encryptIdentityNumbers: true,
  storeOnlyLast4Digits: true,
  autoDeleteAfter24Hours: false,
  autoDeleteAfterExit: true,
  auditAccessLogs: true,
};

export function maskAadhaarNumber(aadhaarNum: string): string {
  if (!aadhaarNum) return 'XXXX XXXX XXXX';
  const digits = aadhaarNum.replace(/\D/g, '');
  if (digits.length >= 4) {
    const last4 = digits.slice(-4);
    return `XXXX XXXX ${last4}`;
  }
  return 'XXXX XXXX XXXX';
}

export function maskDocumentNumber(docNum: string, docType: DocumentType, isMaskedAadhaar?: boolean): string {
  if (!docNum) return 'XXXXXX';
  const clean = docNum.trim().toUpperCase().replace(/\s+/g, '');

  if (isMaskedAadhaar || docType === 'AADHAAR_FRONT' || docType === 'AADHAAR_BACK') {
    return maskAadhaarNumber(docNum);
  }

  // PAN Card: ABCDE1234F -> ABCDE****F
  if (docType === 'PAN_CARD' || (clean.length === 10 && /^[A-Z]{5}\d{4}[A-Z]$/.test(clean))) {
    if (clean.length === 10) {
      return `${clean.substring(0, 5)}****${clean.substring(9)}`;
    }
  }

  // Passport: N12345678 -> N******78
  if (docType === 'PASSPORT' || (clean.length >= 8 && /^[A-Z]\d{7,8}$/.test(clean))) {
    if (clean.length >= 8) {
      const prefix = clean.substring(0, 1);
      const suffix = clean.substring(clean.length - 2);
      const maskedMiddle = '*'.repeat(clean.length - 3);
      return `${prefix}${maskedMiddle}${suffix}`;
    }
  }

  // Driving Licence: MH0120221234567 -> MH********4567
  if (docType === 'DRIVING_LICENCE' || clean.length >= 12) {
    if (clean.length >= 8) {
      const statePrefix = clean.substring(0, 2);
      const suffix = clean.substring(clean.length - 4);
      const maskedMiddle = '*'.repeat(Math.max(4, clean.length - 6));
      return `${statePrefix}${maskedMiddle}${suffix}`;
    }
  }

  // Voter ID: ABC1234567 -> ABC****567
  if (docType === 'VOTER_ID' || (clean.length === 10 && /^[A-Z]{3}\d{7}$/.test(clean))) {
    if (clean.length === 10) {
      return `${clean.substring(0, 3)}****${clean.substring(7)}`;
    }
  }

  // Employee ID / General: EMP123456789 -> EMP******789
  if (clean.length >= 6) {
    const prefix = clean.substring(0, Math.min(3, Math.floor(clean.length / 3)));
    const suffix = clean.substring(clean.length - Math.min(3, Math.floor(clean.length / 3)));
    const maskedLength = Math.max(3, clean.length - prefix.length - suffix.length);
    return `${prefix}${'*'.repeat(maskedLength)}${suffix}`;
  }

  return '****' + clean.slice(-2);
}

export function maskName(name: string): string {
  if (!name) return '*****';
  return name.split(' ').map(part => {
    if (part.length <= 1) return part;
    return part[0] + '*'.repeat(part.length - 1);
  }).join(' ');
}

export function getFieldDisplayValue(
  value: string | undefined,
  mode: VisibilityMode,
  fieldName: keyof VisitorPrivacyPreferences,
  docType: DocumentType,
  isMaskedAadhaar?: boolean
): { text: string; isMasked: boolean; isHidden: boolean } {
  if (mode === 'HIDDEN' || !value) {
    return { text: '••• Hidden for Privacy •••', isMasked: false, isHidden: true };
  }
  if (mode === 'MASKED') {
    if (fieldName === 'documentNumber') {
      return { text: maskDocumentNumber(value, docType, isMaskedAadhaar), isMasked: true, isHidden: false };
    }
    if (fieldName === 'fullName') {
      return { text: maskName(value), isMasked: true, isHidden: false };
    }
    return { text: '••••••••', isMasked: true, isHidden: false };
  }
  return { text: value, isMasked: false, isHidden: false };
}

/**
 * Sanitizes extracted document data specifically for Security Guard view.
 * If user selected HIDDEN, field is stripped completely.
 * If user selected MASKED, field value is replaced with masked string.
 */
export function sanitizeDataForSecurityGuard(
  data: ExtractedDocData,
  prefs: VisitorPrivacyPreferences = DEFAULT_VISITOR_PRIVACY_PREFERENCES,
  isMaskedAadhaar: boolean = true
): ExtractedDocData {
  const isAadhaar = data.documentType === 'AADHAAR_FRONT' || data.documentType === 'AADHAAR_BACK' || isMaskedAadhaar;
  const docNum = isAadhaar || isMaskedAadhaar
    ? maskAadhaarNumber(data.documentNumber)
    : (prefs.documentNumber === 'MASKED' ? maskDocumentNumber(data.documentNumber, data.documentType, isMaskedAadhaar) : data.documentNumber);

  return {
    ...data,
    fullName: prefs.fullName === 'HIDDEN' ? '••• Visitor •••' : (prefs.fullName === 'MASKED' ? maskName(data.fullName) : data.fullName),
    documentNumber: prefs.documentNumber === 'HIDDEN' ? '••••••••' : docNum,
    dob: prefs.dob === 'HIDDEN' ? undefined : (prefs.dob === 'MASKED' ? '••/••/****' : data.dob),
    gender: prefs.gender === 'HIDDEN' ? undefined : data.gender,
    fatherName: prefs.fatherName === 'HIDDEN' ? undefined : (prefs.fatherName === 'MASKED' ? maskName(data.fatherName || '') : data.fatherName),
    address: prefs.address === 'HIDDEN' ? undefined : (prefs.address === 'MASKED' ? '•••••••• Address Hidden ••••••••' : data.address),
    qrCodeData: prefs.qrCode === 'HIDDEN' ? undefined : data.qrCodeData,
    isMaskedAadhaar: isAadhaar || isMaskedAadhaar,
    maskedDocumentNumber: docNum,
  };
}
