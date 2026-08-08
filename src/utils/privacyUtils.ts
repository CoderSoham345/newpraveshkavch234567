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

export function maskIdentityNumber(docType: DocumentType | string, value: string): string {
  if (!value) return 'XXXXXX';
  const clean = value.trim();
  const upper = clean.toUpperCase().replace(/\s+/g, '');
  const typeStr = String(docType).toUpperCase();

  if (typeStr.includes('AADHAAR') || (upper.length === 12 && /^\d{12}$/.test(upper))) {
    const digits = upper.replace(/\D/g, '');
    if (digits.length >= 4) {
      return `XXXX XXXX ${digits.slice(-4)}`;
    }
    return 'XXXX XXXX XXXX';
  }

  if (typeStr === 'PAN_CARD' || typeStr === 'PAN' || (upper.length === 10 && /^[A-Z]{5}\d{4}[A-Z]$/.test(upper))) {
    if (upper.length === 10) {
      return `XXXXX${upper.substring(5, 9)}X`;
    }
    if (upper.length >= 5) {
      return `XXXXX${upper.slice(5)}`;
    }
    return 'XXXXX1234X';
  }

  if (typeStr === 'DRIVING_LICENCE' || typeStr === 'DL') {
    if (upper.length >= 8) {
      const statePrefix = upper.substring(0, 2);
      const suffix = upper.substring(upper.length - 4);
      const maskedMiddle = '*'.repeat(Math.max(4, upper.length - 6));
      return `${statePrefix}${maskedMiddle}${suffix}`;
    }
    return 'MH********4567';
  }

  if (typeStr === 'PASSPORT') {
    if (upper.length >= 6) {
      const prefix = upper.substring(0, 1);
      const suffix = upper.substring(upper.length - 2);
      const maskedMiddle = '*'.repeat(Math.max(3, upper.length - 3));
      return `${prefix}${maskedMiddle}${suffix}`;
    }
    return 'N******78';
  }

  if (typeStr === 'VOTER_ID' || typeStr === 'EPIC') {
    if (upper.length >= 7) {
      const prefix = upper.substring(0, 3);
      const suffix = upper.substring(upper.length - 3);
      const maskedMiddle = '*'.repeat(Math.max(3, upper.length - 6));
      return `${prefix}${maskedMiddle}${suffix}`;
    }
    return 'ABC****567';
  }

  if (upper.length >= 6) {
    const prefix = upper.substring(0, Math.min(3, Math.floor(upper.length / 3)));
    const suffix = upper.substring(upper.length - Math.min(3, Math.floor(upper.length / 3)));
    const maskedLength = Math.max(3, upper.length - prefix.length - suffix.length);
    return `${prefix}${'*'.repeat(maskedLength)}${suffix}`;
  }

  return '****' + (upper.slice(-2) || 'XX');
}

export function maskDocumentNumber(docNum: string, docType: DocumentType | string, isMasked: boolean = true): string {
  if (!isMasked) return docNum;
  return maskIdentityNumber(docType, docNum);
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
