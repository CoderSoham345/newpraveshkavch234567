import { DocumentType, ExtractedDocData, FieldWithConfidence } from '../types';

export interface DocTypeSchema {
  type: DocumentType;
  label: string;
  iconName: string;
  fields: {
    key: keyof ExtractedDocData;
    label: string;
    type: 'text' | 'date' | 'select' | 'number';
    options?: string[];
    placeholder?: string;
    validationRegex?: RegExp;
    validationMessage?: string;
    required?: boolean;
  }[];
}

/**
 * Registry of Supported Document Types and their Specific Extraction Schemas
 */
export const DOCUMENT_SCHEMAS: Record<DocumentType, DocTypeSchema> = {
  'AADHAAR_FRONT': {
    type: 'AADHAAR_FRONT',
    label: 'Aadhaar Card (Front - UIDAI)',
    iconName: 'ShieldCheck',
    fields: [
      {
        key: 'documentNumber',
        label: 'Aadhaar Number',
        type: 'text',
        placeholder: '5482 1111 2222',
        validationRegex: /^\d{4}\s?\d{4}\s?\d{4}$/,
        validationMessage: 'Aadhaar Number must be 12 digits (e.g., 5482 1111 2222)',
        required: true,
      },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'dob', label: 'Date of Birth', type: 'text', required: true },
      { key: 'age', label: 'Age', type: 'text' },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
      { key: 'fatherName', label: "Father's / Guardian Name", type: 'text' },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'pinCode', label: 'PIN Code', type: 'text', validationRegex: /^\d{6}$/, validationMessage: 'PIN code must be 6 digits' },
      { key: 'state', label: 'State', type: 'text' },
      { key: 'aadhaarVersion', label: 'Aadhaar Version', type: 'text' },
      { key: 'uidaiInfo', label: 'UIDAI Security Stamp', type: 'text' },
    ],
  },
  'PAN_CARD': {
    type: 'PAN_CARD',
    label: 'PAN Card (Income Tax Dept)',
    iconName: 'CreditCard',
    fields: [
      {
        key: 'documentNumber',
        label: 'PAN Number',
        type: 'text',
        placeholder: 'ABCDE1234F',
        validationRegex: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        validationMessage: 'PAN must be 10 characters in ABCDE1234F format',
        required: true,
      },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'fatherName', label: "Father's Name", type: 'text', required: true },
      { key: 'dob', label: 'Date of Birth', type: 'text', required: true },
      { key: 'panType', label: 'PAN Type', type: 'select', options: ['Individual', 'Company', 'Firm', 'HUF', 'Trust'], required: true },
    ],
  },
  'PASSPORT': {
    type: 'PASSPORT',
    label: 'Indian Passport (Republic of India)',
    iconName: 'Globe',
    fields: [
      {
        key: 'documentNumber',
        label: 'Passport Number',
        type: 'text',
        placeholder: 'Z9821034',
        validationRegex: /^[A-Z][0-9]{7}$/,
        validationMessage: 'Passport Number must be 1 letter followed by 7 digits (e.g., Z9821034)',
        required: true,
      },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'nationality', label: 'Nationality', type: 'text', required: true },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
      { key: 'dob', label: 'Date of Birth', type: 'text', required: true },
      { key: 'placeOfBirth', label: 'Place of Birth', type: 'text' },
      { key: 'issueDate', label: 'Date of Issue', type: 'text' },
      { key: 'expiryDate', label: 'Date of Expiry', type: 'text', required: true },
      { key: 'issuingAuthority', label: 'Issuing Authority', type: 'text' },
      { key: 'mrzCode', label: 'MRZ (Machine Readable Zone)', type: 'text' },
    ],
  },
  'DRIVING_LICENCE': {
    type: 'DRIVING_LICENCE',
    label: 'Driving Licence (RTO)',
    iconName: 'Car',
    fields: [
      {
        key: 'documentNumber',
        label: 'Licence Number',
        type: 'text',
        placeholder: 'DL-0420110012345',
        validationRegex: /^[A-Z]{2}[-\s]?[0-9]{2,13}$/,
        validationMessage: 'Invalid Driving Licence format (e.g. DL-0420110012345)',
        required: true,
      },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'dob', label: 'Date of Birth', type: 'text', required: true },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'bloodGroup', label: 'Blood Group', type: 'select', options: ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'] },
      { key: 'vehicleCategories', label: 'Vehicle Categories', type: 'text' },
      { key: 'issueDate', label: 'Date of Issue', type: 'text' },
      { key: 'expiryDate', label: 'Valid Till', type: 'text', required: true },
      { key: 'issuingAuthority', label: 'Issuing RTO', type: 'text' },
    ],
  },
  'VOTER_ID': {
    type: 'VOTER_ID',
    label: 'Voter ID (Election Commission)',
    iconName: 'Vote',
    fields: [
      {
        key: 'documentNumber',
        label: 'EPIC Number',
        type: 'text',
        placeholder: 'ABC1234567',
        validationRegex: /^[A-Z]{3}[0-9]{7}$/,
        validationMessage: 'EPIC Number must be 3 letters followed by 7 numbers',
        required: true,
      },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
      { key: 'dob', label: 'Date of Birth / Age', type: 'text' },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'constituency', label: 'Assembly Constituency', type: 'text' },
    ],
  },
  'STUDENT_ID': {
    type: 'STUDENT_ID',
    label: 'University Student ID',
    iconName: 'GraduationCap',
    fields: [
      {
        key: 'documentNumber',
        label: 'Student Roll No / ID',
        type: 'text',
        placeholder: 'STU-2024-889',
        required: true,
      },
      { key: 'fullName', label: 'Student Name', type: 'text', required: true },
      { key: 'collegeName', label: 'University / College Name', type: 'text', required: true },
      { key: 'course', label: 'Course / Major', type: 'text' },
      { key: 'academicYear', label: 'Academic Year', type: 'text' },
      { key: 'validTill', label: 'Valid Till', type: 'text' },
    ],
  },
  // Minimal schemas for new document types - extended fields as per requirements
  'AUTOMATIC_DETECTION': {
    type: 'AUTOMATIC_DETECTION',
    label: 'Automatic Detection',
    iconName: 'Zap',
    fields: [{ key: 'fullName', label: 'Full Name', type: 'text', required: true }],
  },
  'AADHAAR_BACK': {
    type: 'AADHAAR_BACK',
    label: 'Aadhaar Card (Back)',
    iconName: 'MapPin',
    fields: [
      { key: 'address', label: 'Complete Address', type: 'text', required: true },
      { key: 'pinCode', label: 'PIN Code', type: 'text', validationRegex: /^\d{6}$/, required: true },
      { key: 'state', label: 'State', type: 'text', required: true },
    ],
  },
  'GOVT_EMPLOYEE_ID': {
    type: 'GOVT_EMPLOYEE_ID',
    label: 'Government Employee ID',
    iconName: 'Briefcase',
    fields: [
      { key: 'fullName', label: 'Employee Name', type: 'text', required: true },
      { key: 'documentNumber', label: 'Employee ID', type: 'text', required: true },
      { key: 'employeeId', label: 'Employee ID Number', type: 'text' },
      { key: 'companyName', label: 'Department/Ministry', type: 'text' },
    ],
  },
  'PRIVATE_EMPLOYEE_ID': {
    type: 'PRIVATE_EMPLOYEE_ID',
    label: 'Private Employee ID',
    iconName: 'Briefcase',
    fields: [
      { key: 'fullName', label: 'Employee Name', type: 'text', required: true },
      { key: 'documentNumber', label: 'Employee ID', type: 'text', required: true },
      { key: 'companyName', label: 'Company Name', type: 'text' },
      { key: 'designation', label: 'Designation', type: 'text' },
    ],
  },
  'RC_BOOK': {
    type: 'RC_BOOK',
    label: 'Vehicle Registration Certificate',
    iconName: 'Car',
    fields: [
      { key: 'documentNumber', label: 'Registration Number', type: 'text', required: true },
      { key: 'fullName', label: 'Owner Name', type: 'text', required: true },
      { key: 'address', label: 'Owner Address', type: 'text' },
    ],
  },
  'OCI_CARD': {
    type: 'OCI_CARD',
    label: 'OCI Card',
    iconName: 'Globe',
    fields: [
      { key: 'documentNumber', label: 'OCI Number', type: 'text', required: true },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
    ],
  },
  'NREGA_JOB_CARD': {
    type: 'NREGA_JOB_CARD',
    label: 'NREGA Job Card',
    iconName: 'CreditCard',
    fields: [
      { key: 'documentNumber', label: 'Job Card Number', type: 'text', required: true },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
    ],
  },
  'SENIOR_CITIZEN_CARD': {
    type: 'SENIOR_CITIZEN_CARD',
    label: 'Senior Citizen Card',
    iconName: 'Users',
    fields: [
      { key: 'documentNumber', label: 'Card Number', type: 'text', required: true },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'dob', label: 'Date of Birth', type: 'date', required: true },
    ],
  },
  'DISABILITY_ID_CARD': {
    type: 'DISABILITY_ID_CARD',
    label: 'Disability ID Card',
    iconName: 'HeartHandshake',
    fields: [
      { key: 'documentNumber', label: 'Card Number', type: 'text', required: true },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
    ],
  },
  'HEALTH_INSURANCE_CARD': {
    type: 'HEALTH_INSURANCE_CARD',
    label: 'Health Insurance Card',
    iconName: 'Heart',
    fields: [
      { key: 'documentNumber', label: 'Policy Number', type: 'text', required: true },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
    ],
  },
  'POLICE_ID': {
    type: 'POLICE_ID',
    label: 'Police ID',
    iconName: 'Shield',
    fields: [
      { key: 'documentNumber', label: 'Badge Number', type: 'text', required: true },
      { key: 'fullName', label: 'Officer Name', type: 'text', required: true },
    ],
  },
  'ARMY_ID': {
    type: 'ARMY_ID',
    label: 'Army ID',
    iconName: 'Shield',
    fields: [
      { key: 'documentNumber', label: 'Service Number', type: 'text', required: true },
      { key: 'fullName', label: 'Officer/Soldier Name', type: 'text', required: true },
    ],
  },
  'OTHER_GOVT_ID': {
    type: 'OTHER_GOVT_ID',
    label: 'Other Government ID',
    iconName: 'CreditCard',
    fields: [
      { key: 'documentNumber', label: 'ID Number', type: 'text', required: true },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
    ],
  },
  'OTHER_IDENTITY_DOC': {
    type: 'OTHER_IDENTITY_DOC',
    label: 'Other Identity Document',
    iconName: 'FileText',
    fields: [
      { key: 'fullName', label: 'Name', type: 'text', required: true },
      { key: 'documentNumber', label: 'Document Number', type: 'text' },
    ],
  },
};

/**
 * Automatically Classifies Document Type based on text keywords & tokens
 */
export function classifyDocumentType(ocrText: string): DocumentType {
  const upper = ocrText.toUpperCase();

  if (upper.includes('GOVERNMENT OF INDIA') || upper.includes('AADHAAR') || upper.includes('UIDAI') || /\d{4}\s\d{4}\s\d{4}/.test(upper)) {
    return 'AADHAAR_FRONT';
  }
  if (upper.includes('INCOME TAX DEPARTMENT') || upper.includes('PERMANENT ACCOUNT NUMBER') || /[A-Z]{5}[0-9]{4}[A-Z]/.test(upper)) {
    return 'PAN_CARD';
  }
  if (upper.includes('PASSPORT') || upper.includes('REPUBLIC OF INDIA') || upper.includes('P<IND')) {
    return 'PASSPORT';
  }
  if (upper.includes('DRIVING') || upper.includes('LICENCE') || upper.includes('MOTOR VEHICLES') || /DL[- ]?\d+/.test(upper)) {
    return 'DRIVING_LICENCE';
  }
  if (upper.includes('ELECTION') || upper.includes('COMMISSION') || upper.includes('VOTER') || /[A-Z]{3}[0-9]{7}/.test(upper)) {
    return 'VOTER_ID';
  }
  if (upper.includes('EMPLOYEE') || upper.includes('CORPORATE') || upper.includes('STAFF')) {
    return 'PRIVATE_EMPLOYEE_ID';
  }
  if (upper.includes('STUDENT') || upper.includes('UNIVERSITY') || upper.includes('COLLEGE')) {
    return 'STUDENT_ID';
  }

  // Default fallback
  return 'AADHAAR_FRONT';
}

/**
 * Calculate exact age dynamically based on Date of Birth (DD/MM/YYYY or YYYY) and current system date
 */
export function calculateAgeFromDOB(dob: string): string {
  if (!dob || dob.includes('Not Detected')) return '';
  const trimmed = dob.trim();
  const parts = trimmed.split(/[\/\-\.]/);

  let day: number, month: number, year: number;

  if (parts.length === 1 && /^\d{4}$/.test(parts[0])) {
    year = parseInt(parts[0], 10);
    const currentYear = new Date().getFullYear();
    const ageYears = currentYear - year;
    return ageYears > 0 ? `${ageYears} Years` : '';
  }

  if (parts.length === 3) {
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      year = parseInt(parts[2], 10);
    }

    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900 && year <= new Date().getFullYear()) {
      const today = new Date();
      let age = today.getFullYear() - year;
      const m = today.getMonth() - month;
      if (m < 0 || (m === 0 && today.getDate() < day)) {
        age--;
      }
      return age >= 0 ? `${age} Years` : '';
    }
  }

  return '';
}

/**
 * Calculate per-field confidence & format validation
 */
export function validateAndComputeFieldConfidences(
  docData: ExtractedDocData
): ExtractedDocData {
  // Auto-compute dynamic age from DOB if DOB is present
  if (docData.dob) {
    const computedAge = calculateAgeFromDOB(docData.dob);
    if (computedAge) {
      docData.age = computedAge;
    }
  }

  const schema = DOCUMENT_SCHEMAS[docData.documentType] || DOCUMENT_SCHEMAS['Aadhaar Card'];
  const fieldConfidences: Record<string, FieldWithConfidence> = {};
  const lowConfidenceFields: string[] = [];

  schema.fields.forEach((field) => {
    const val = (docData as any)[field.key] || '';
    let confidence = 98; // Base accuracy for extracted text
    let isValid = true;
    let errorMessage: string | undefined = undefined;

    if (!val || val === 'Not Detected – Please Verify Manually') {
      if (field.required) {
        isValid = false;
        confidence = 40;
        errorMessage = 'Not Detected – Please Verify Manually';
      } else {
        confidence = 90; // Optional field empty is acceptable
      }
    } else if (field.validationRegex) {
      const match = field.validationRegex.test(val);
      if (!match) {
        isValid = false;
        confidence = 55;
        errorMessage = field.validationMessage || `Invalid format for ${field.label}`;
      } else {
        confidence = 99;
      }
    }

    if (confidence < 80 || !isValid) {
      lowConfidenceFields.push(field.label);
    }

    fieldConfidences[field.key] = {
      value: val,
      confidence,
      isValid,
      errorMessage,
    };
  });

  // Calculate overall average confidence score
  const total = Object.values(fieldConfidences).reduce((acc, f) => acc + f.confidence, 0);
  const count = Object.keys(fieldConfidences).length || 1;
  const overallScore = Math.round(total / count);

  return {
    ...docData,
    confidenceScore: overallScore,
    lowConfidenceFields,
    fieldConfidences,
  };
}

/**
 * Returns empty extraction data structure for selected document type
 * REMOVED: getSampleExtractionDataForDoc() - No longer generates fake data
 * All data extraction now comes from real OCR processing via Gemini or ML Kit
 */
