import { DocumentType, PrivacyMode } from '../types';

export interface DocumentPrivacyConfig {
  documentType: DocumentType | string;
  displayName: string;
  headerTitle: string; // e.g. "PAN CARD PRIVACY CONTROL"
  identityFieldLabel: string; // e.g. "PAN Number"
  maskedOptionTitle: string; // e.g. "Use Masked PAN"
  maskedDescription: string; // e.g. "Only the permitted portion of your PAN will be visible."
  maskedPreviewExample: string; // e.g. "XXXXX1234X"
  fullOptionTitle: string; // e.g. "Show Full PAN Number"
  fullDescription: string; // e.g. "The complete PAN will be visible only according to the user's explicit privacy authorization."
  fullPreviewExample: string; // e.g. "ABCDE1234F"
  defaultMode: PrivacyMode;
}

export function getReadableDocumentName(docType?: DocumentType | string): string {
  if (!docType) return 'Identity Document';
  const typeStr = String(docType).toUpperCase();

  if (typeStr.includes('AADHAAR')) return 'Aadhaar';
  if (typeStr === 'PAN_CARD' || typeStr === 'PAN') return 'PAN';
  if (typeStr === 'DRIVING_LICENCE' || typeStr === 'DL') return 'Driving Licence';
  if (typeStr === 'PASSPORT') return 'Passport';
  if (typeStr === 'VOTER_ID' || typeStr === 'EPIC') return 'Voter ID';
  if (typeStr === 'GOVT_EMPLOYEE_ID') return 'Govt Employee ID';
  if (typeStr === 'PRIVATE_EMPLOYEE_ID') return 'Employee ID';
  if (typeStr === 'STUDENT_ID') return 'Student ID';
  if (typeStr === 'RC_BOOK') return 'RC Book';
  if (typeStr === 'OCI_CARD') return 'OCI Card';
  if (typeStr === 'NREGA_JOB_CARD') return 'NREGA Job Card';
  if (typeStr === 'SENIOR_CITIZEN_CARD') return 'Senior Citizen Card';
  if (typeStr === 'DISABILITY_ID_CARD') return 'Disability ID Card';
  if (typeStr === 'HEALTH_INSURANCE_CARD') return 'Health Insurance Card';
  if (typeStr === 'POLICE_ID') return 'Police ID';
  if (typeStr === 'ARMY_ID') return 'Army ID';
  if (typeStr === 'OTHER_GOVT_ID') return 'Govt ID';
  if (typeStr === 'OTHER_IDENTITY_DOC' || typeStr === 'UNKNOWN' || typeStr === 'AUTOMATIC_DETECTION') return 'Identity Document';
  
  return 'Identity Document';
}

export function getDocumentPrivacyConfig(docType?: DocumentType | string): DocumentPrivacyConfig {
  const typeStr = String(docType || 'UNKNOWN').toUpperCase();

  if (typeStr.includes('AADHAAR')) {
    return {
      documentType: docType || 'AADHAAR_FRONT',
      displayName: 'Aadhaar',
      headerTitle: 'AADHAAR PRIVACY CONTROL',
      identityFieldLabel: 'Aadhaar Number',
      maskedOptionTitle: 'Use Masked Aadhaar',
      maskedDescription: 'Only the permitted portion of your Aadhaar will be visible.',
      maskedPreviewExample: 'XXXX XXXX 9123',
      fullOptionTitle: 'Show Full Aadhaar Number',
      fullDescription: 'The complete Aadhaar will be visible only according to the user\'s explicit privacy authorization.',
      fullPreviewExample: '1234 5678 9123',
      defaultMode: 'masked',
    };
  }

  if (typeStr === 'PAN_CARD' || typeStr === 'PAN') {
    return {
      documentType: 'PAN_CARD',
      displayName: 'PAN',
      headerTitle: 'PAN CARD PRIVACY CONTROL',
      identityFieldLabel: 'PAN Number',
      maskedOptionTitle: 'Use Masked PAN',
      maskedDescription: 'Only the permitted portion of your PAN will be visible.',
      maskedPreviewExample: 'XXXXX1234X',
      fullOptionTitle: 'Show Full PAN Number',
      fullDescription: 'The complete PAN will be visible only according to the user\'s explicit privacy authorization.',
      fullPreviewExample: 'ABCDE1234F',
      defaultMode: 'masked',
    };
  }

  if (typeStr === 'DRIVING_LICENCE' || typeStr === 'DL') {
    return {
      documentType: 'DRIVING_LICENCE',
      displayName: 'Driving Licence',
      headerTitle: 'DRIVING LICENCE PRIVACY CONTROL',
      identityFieldLabel: 'Driving Licence Number',
      maskedOptionTitle: 'Use Masked Driving Licence',
      maskedDescription: 'Only a limited portion of the licence number will be visible.',
      maskedPreviewExample: 'MH********4567',
      fullOptionTitle: 'Show Full Driving Licence Number',
      fullDescription: 'The complete driving licence number will only be displayed according to the user\'s explicit privacy choice.',
      fullPreviewExample: 'MH0120221234567',
      defaultMode: 'masked',
    };
  }

  if (typeStr === 'PASSPORT') {
    return {
      documentType: 'PASSPORT',
      displayName: 'Passport',
      headerTitle: 'PASSPORT PRIVACY CONTROL',
      identityFieldLabel: 'Passport Number',
      maskedOptionTitle: 'Use Masked Passport',
      maskedDescription: 'Only the permitted portion of your passport number will be visible.',
      maskedPreviewExample: 'N******78',
      fullOptionTitle: 'Show Full Passport Number',
      fullDescription: 'The complete passport number will only be displayed according to the user\'s explicit privacy choice.',
      fullPreviewExample: 'N12345678',
      defaultMode: 'masked',
    };
  }

  if (typeStr === 'VOTER_ID' || typeStr === 'EPIC') {
    return {
      documentType: 'VOTER_ID',
      displayName: 'Voter ID',
      headerTitle: 'VOTER ID PRIVACY CONTROL',
      identityFieldLabel: 'Voter ID Number',
      maskedOptionTitle: 'Use Masked Voter ID',
      maskedDescription: 'Only the permitted portion of your voter ID number will be visible.',
      maskedPreviewExample: 'ABC****567',
      fullOptionTitle: 'Show Full Voter ID',
      fullDescription: 'The complete voter ID number will only be displayed according to the user\'s explicit privacy choice.',
      fullPreviewExample: 'ABC1234567',
      defaultMode: 'masked',
    };
  }

  if (typeStr === 'STUDENT_ID') {
    return {
      documentType: 'STUDENT_ID',
      displayName: 'Student ID',
      headerTitle: 'STUDENT ID PRIVACY CONTROL',
      identityFieldLabel: 'Student ID Number',
      maskedOptionTitle: 'Use Masked Student ID',
      maskedDescription: 'Only the permitted portion of your student ID number will be visible.',
      maskedPreviewExample: 'STU****890',
      fullOptionTitle: 'Show Full Student ID Number',
      fullDescription: 'The complete student ID number will only be displayed according to the user\'s explicit privacy choice.',
      fullPreviewExample: 'STU202412890',
      defaultMode: 'masked',
    };
  }

  if (typeStr === 'GOVT_EMPLOYEE_ID' || typeStr === 'PRIVATE_EMPLOYEE_ID') {
    return {
      documentType: typeStr,
      displayName: typeStr === 'GOVT_EMPLOYEE_ID' ? 'Govt Employee ID' : 'Employee ID',
      headerTitle: 'EMPLOYEE ID PRIVACY CONTROL',
      identityFieldLabel: 'Employee ID Number',
      maskedOptionTitle: 'Use Masked Employee ID',
      maskedDescription: 'Only the permitted portion of your employee ID number will be visible.',
      maskedPreviewExample: 'EMP******789',
      fullOptionTitle: 'Show Full Employee ID Number',
      fullDescription: 'The complete employee ID number will only be displayed according to the user\'s explicit privacy choice.',
      fullPreviewExample: 'EMP123456789',
      defaultMode: 'masked',
    };
  }

  // Fallback for unknown / generic / other supported documents
  const readableName = getReadableDocumentName(docType);
  const isGeneric = readableName === 'Identity Document';
  const header = isGeneric ? 'IDENTITY DOCUMENT PRIVACY CONTROL' : `${readableName.toUpperCase()} PRIVACY CONTROL`;
  const maskedTitle = isGeneric ? 'Use Masked Identity Number' : `Use Masked ${readableName}`;
  const fullTitle = isGeneric ? 'Show Full Identity Number' : `Show Full ${readableName} Number`;

  return {
    documentType: docType || 'UNKNOWN',
    displayName: readableName,
    headerTitle: header,
    identityFieldLabel: `${readableName} Number`,
    maskedOptionTitle: maskedTitle,
    maskedDescription: 'Only the permitted portion of your document number will be visible.',
    maskedPreviewExample: 'XXXXXX1234',
    fullOptionTitle: fullTitle,
    fullDescription: 'The complete document number will only be displayed according to the user\'s explicit privacy choice.',
    fullPreviewExample: '123456789012',
    defaultMode: 'masked',
  };
}
