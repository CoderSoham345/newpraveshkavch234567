/**
 * PraveshKavach™ Enterprise OCR Extraction Engine
 * Multi-Pass Architecture: Optical Confusion Repair -> Keyword/Regex/Context Extract -> AI Post-Processing & Validation
 * Supports: Aadhaar, Masked Aadhaar, PAN, Passport, Driving Licence, Voter ID, Employee ID, Student ID, OCI, NREGA, Pension, Ration, etc.
 */

import { DocumentType, ExtractedDocData, FieldWithConfidence } from '../types';

export interface DeveloperOCRLogs {
  rawOCRText: string;
  opticalCorrections: string[];
  geminiCorrections: string[];
  detectedDocumentType: string;
  fieldConfidences: Record<string, FieldWithConfidence>;
  validationResults: {
    hasErrors: boolean;
    errors: string[];
    warnings: string[];
  };
  regexMatches: Record<string, string>;
}

export interface AdvancedOCRResult {
  extractedData: ExtractedDocData;
  developerLogs: DeveloperOCRLogs;
  overallConfidence: number;
}

/**
 * Step 1: Optical Character Confusion Repair Engine
 * Corrects common OCR confusion errors based on field context:
 * 0 <-> O, 8 <-> B, 1 <-> I / l / |, 5 <-> S, Z <-> 2, G <-> 6
 */
export function fixOpticalConfusion(text: string, context: 'ALPHA' | 'NUMERIC' | 'ALPHANUMERIC' | 'PAN' | 'AADHAAR' | 'DATE'): string {
  if (!text) return '';
  let str = text.trim();

  if (context === 'NUMERIC' || context === 'AADHAAR') {
    return str
      .replace(/[OQ]/gi, '0')
      .replace(/[Il\|!]/g, '1')
      .replace(/Z/gi, '2')
      .replace(/S/gi, '5')
      .replace(/G/gi, '6')
      .replace(/B/gi, '8');
  }

  if (context === 'ALPHA') {
    return str
      .replace(/0/g, 'O')
      .replace(/1/g, 'I')
      .replace(/2/g, 'Z')
      .replace(/5/g, 'S')
      .replace(/6/g, 'G')
      .replace(/8/g, 'B');
  }

  if (context === 'PAN') {
    // PAN format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
    const raw = str.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (raw.length === 10) {
      const alphaPart1 = raw.slice(0, 5)
        .replace(/0/g, 'O')
        .replace(/1/g, 'I')
        .replace(/2/g, 'Z')
        .replace(/5/g, 'S')
        .replace(/6/g, 'G')
        .replace(/8/g, 'B');

      const numPart = raw.slice(5, 9)
        .replace(/[OQ]/g, '0')
        .replace(/[Il\|!]/g, '1')
        .replace(/Z/g, '2')
        .replace(/S/g, '5')
        .replace(/G/g, '6')
        .replace(/B/g, '8');

      const alphaPart2 = raw.slice(9, 10)
        .replace(/0/g, 'O')
        .replace(/1/g, 'I')
        .replace(/2/g, 'Z')
        .replace(/5/g, 'S')
        .replace(/6/g, 'G')
        .replace(/8/g, 'B');

      return `${alphaPart1}${numPart}${alphaPart2}`;
    }
  }

  if (context === 'DATE') {
    return str
      .replace(/[OQ]/gi, '0')
      .replace(/[Il\|!]/g, '1')
      .replace(/S/gi, '5')
      .replace(/B/gi, '8');
  }

  return str;
}

/**
 * Step 2: Standardized Date Parser & Normalizer
 * Converts DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, DD Month YYYY, YYYY -> DD/MM/YYYY
 */
export function normalizeDate(rawDateStr?: string): { formattedDate: string; confidence: number } {
  if (!rawDateStr) return { formattedDate: '', confidence: 0 };

  const cleaned = fixOpticalConfusion(rawDateStr, 'DATE');

  // Month names map
  const monthsMap: Record<string, string> = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', september: '09', sept: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12',
  };

  // Check DD Month YYYY (e.g. 15 Aug 1992 or 15-August-1992)
  const monthWordMatch = cleaned.match(/(\d{1,2})[\s\/\.-]+([a-zA-Z]{3,9})[\s\/\.-]+(\d{4})/i);
  if (monthWordMatch) {
    const day = monthWordMatch[1].padStart(2, '0');
    const monthKey = monthWordMatch[2].toLowerCase();
    const month = monthsMap[monthKey] || '01';
    const year = monthWordMatch[3];
    return { formattedDate: `${day}/${month}/${year}`, confidence: 95 };
  }

  // Check standard numeric formats (DD/MM/YYYY or YYYY/MM/DD or DD-MM-YYYY)
  const numMatch = cleaned.match(/(\d{1,4})[\/\.-](\d{1,2})[\/\.-](\d{1,4})/);
  if (numMatch) {
    let p1 = parseInt(numMatch[1], 10);
    let p2 = parseInt(numMatch[2], 10);
    let p3 = parseInt(numMatch[3], 10);

    if (numMatch[1].length === 4) {
      // YYYY/MM/DD
      const year = p1;
      const month = String(p2).padStart(2, '0');
      const day = String(p3).padStart(2, '0');
      return { formattedDate: `${day}/${month}/${year}`, confidence: 92 };
    } else {
      // DD/MM/YYYY
      const day = String(p1).padStart(2, '0');
      const month = String(p2).padStart(2, '0');
      const year = p3;
      if (p1 <= 31 && p2 <= 12 && p3 > 1900 && p3 <= new Date().getFullYear()) {
        return { formattedDate: `${day}/${month}/${year}`, confidence: 98 };
      }
    }
  }

  // Year of birth only (e.g. 1992)
  const yearMatch = cleaned.match(/\b(19\d{2}|20[0-2]\d)\b/);
  if (yearMatch) {
    return { formattedDate: yearMatch[1], confidence: 80 };
  }

  return { formattedDate: rawDateStr, confidence: 50 };
}

/**
 * Step 3: PAN Card Type Classification based on 4th Character
 */
export function determinePANType(panNumber: string): { panType: string; description: string } {
  if (!panNumber || panNumber.length < 5) {
    return { panType: 'Individual', description: 'Individual' };
  }

  const char4 = panNumber.charAt(3).toUpperCase();
  switch (char4) {
    case 'P': return { panType: 'Individual', description: 'Individual Person' };
    case 'C': return { panType: 'Company', description: 'Company / Corporation' };
    case 'F': return { panType: 'Firm', description: 'Partnership Firm' };
    case 'H': return { panType: 'HUF', description: 'Hindu Undivided Family' };
    case 'T': return { panType: 'Trust', description: 'Trust' };
    case 'B': return { panType: 'BOI', description: 'Body of Individuals' };
    case 'A': return { panType: 'AOP', description: 'Association of Persons' };
    case 'J': return { panType: 'AJP', description: 'Artificial Juridical Person' };
    case 'G': return { panType: 'Government', description: 'Government Agency' };
    default: return { panType: 'Individual', description: 'Individual' };
  }
}

export interface MultiLineAddressResult {
  address: string;
  evidenceLines: string[];
  pinCode?: string;
  district?: string;
  state?: string;
  confidence: number;
  source: 'OCR' | 'OCR_PARTIAL' | 'MANUAL_ENTRY' | 'OCR_UNCERTAIN';
}

/**
 * Robust Layout-Aware Multi-Line Address Extraction Engine
 * =========================================================
 * Preserves ALL consecutive address lines from Aadhaar Back, Driving Licence, Voter ID, etc.
 * Never truncates at arbitrary length or single keywords.
 * Collects evidence lines and excludes non-address header/footer disclaimers.
 */
export function extractMultiLineAddressWithEvidence(rawText: string): MultiLineAddressResult {
  if (!rawText || !rawText.trim()) {
    return {
      address: '',
      evidenceLines: [],
      confidence: 0,
      source: 'OCR_UNCERTAIN',
    };
  }

  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const collectedEvidence: string[] = [];

  // Footer / UIDAI / System noise keywords to stop or exclude
  const isStopToken = (line: string): boolean => {
    const u = line.toUpperCase();
    return (
      u.includes('1947') ||
      u.includes('HELP@UIDAI') ||
      u.includes('WWW.UIDAI.GOV.IN') ||
      u.includes('UNIQUE IDENTIFICATION AUTHORITY') ||
      u.includes('भारतीय विशिष्ट पहचान प्राधिकरण') ||
      u.includes('AADHAAR IS A PROOF OF IDENTITY') ||
      u.includes('मेरा आधार मेरी पहचान') ||
      u.includes('SIGNATURE NOT VERIFIED') ||
      u.includes('ELECTRONICALLY GENERATED')
    );
  };

  // Header tokens that indicate the start of an address block
  const isAddressStart = (line: string): boolean => {
    const u = line.toUpperCase();
    return (
      /^ADDRESS\s*[:\.-]?/i.test(line) ||
      /^पता\s*[:\.-]?/i.test(line) ||
      /^ADDR\s*[:\.-]?/i.test(line) ||
      /^RESIDENCE\s*[:\.-]?/i.test(line) ||
      /^PERMANENT ADDRESS\s*[:\.-]?/i.test(line) ||
      /^PRESENT ADDRESS\s*[:\.-]?/i.test(line) ||
      /^C\/O\s*[:\.-]?/i.test(line) ||
      /^S\/O\s*[:\.-]?/i.test(line) ||
      /^W\/O\s*[:\.-]?/i.test(line) ||
      /^D\/O\s*[:\.-]?/i.test(line) ||
      /^CARE OF\s*[:\.-]?/i.test(line) ||
      u.startsWith('ADDRESS:') ||
      u.startsWith('पता:') ||
      u.startsWith('ADDRESS') ||
      u.startsWith('पता')
    );
  };

  let isCollecting = false;
  let pinCode: string | undefined = undefined;

  // Extract 6-digit Indian PIN Code anywhere in raw text
  const pinMatch = rawText.match(/\b([1-9]\d{5})\b/);
  if (pinMatch) {
    pinCode = pinMatch[1];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!isCollecting) {
      if (isAddressStart(line)) {
        isCollecting = true;
        // Clean line header
        const cleaned = line
          .replace(/^(?:ADDRESS|ADDR|पता|RESIDENCE|PERMANENT ADDRESS|PRESENT ADDRESS)\s*[:\.-]?\s*/i, '')
          .trim();
        if (cleaned.length > 0) {
          collectedEvidence.push(cleaned);
        }
      }
    } else {
      // Check stop condition
      if (isStopToken(line)) {
        break;
      }

      // Check if line looks like an unrelated header
      const u = line.toUpperCase();
      if (
        (u.startsWith('DOB:') || u.startsWith('DATE OF BIRTH:') || u.startsWith('GENDER:') || u.startsWith('MALE') || u.startsWith('FEMALE')) &&
        collectedEvidence.length > 1
      ) {
        break;
      }

      // Valid address line
      if (line.length > 1) {
        collectedEvidence.push(line);
      }
    }
  }

  // Fallback: If no explicit 'Address:' label was detected, search for consecutive lines leading up to PIN code
  if (collectedEvidence.length === 0 && pinMatch) {
    const pinIndex = lines.findIndex((l) => l.includes(pinMatch[1]));
    if (pinIndex >= 0) {
      // Collect up to 4 lines preceding the PIN code line and the PIN code line itself
      const startIdx = Math.max(0, pinIndex - 3);
      for (let j = startIdx; j <= pinIndex; j++) {
        const cand = lines[j];
        if (!isStopToken(cand) && cand.length > 2) {
          collectedEvidence.push(cand);
        }
      }
    }
  }

  // Detect State and District from evidence lines
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 
    'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir'
  ];

  let detectedState: string | undefined = undefined;
  let detectedDistrict: string | undefined = undefined;

  const combinedEvidenceText = collectedEvidence.join(' ');

  for (const st of indianStates) {
    if (new RegExp(`\\b${st}\\b`, 'i').test(combinedEvidenceText)) {
      detectedState = st;
      break;
    }
  }

  const districtMatch = combinedEvidenceText.match(/(?:Dist|District|Dist\.)\s*[:\.-]?\s*([A-Za-z\s]+?)(?:,|\.|\s+[A-Z]|\d{6}|$)/i);
  if (districtMatch && districtMatch[1].trim().length > 2) {
    detectedDistrict = districtMatch[1].trim();
  }

  if (collectedEvidence.length === 0) {
    return {
      address: '',
      evidenceLines: [],
      confidence: 0,
      source: 'OCR_UNCERTAIN',
    };
  }

  // Build formatted multi-line address string
  let finalAddress = collectedEvidence.join(', ').replace(/\s{2,}/g, ' ').trim();

  // If PIN code was found in the text but not at the end of the address, append it cleanly
  if (pinCode && !finalAddress.includes(pinCode)) {
    finalAddress = `${finalAddress} - ${pinCode}`;
  }

  const confidence = collectedEvidence.length >= 2 ? 92 : 75;
  const source = confidence >= 85 ? 'OCR' : 'OCR_PARTIAL';

  return {
    address: finalAddress,
    evidenceLines: collectedEvidence,
    pinCode,
    district: detectedDistrict,
    state: detectedState,
    confidence,
    source,
  };
}

/**
 * Step 4: Multi-Pass OCR Field Extraction Engine
 */
export function extractFieldsFromRawText(rawText: string, targetDocType: DocumentType): AdvancedOCRResult {
  const logs: DeveloperOCRLogs = {
    rawOCRText: rawText,
    opticalCorrections: [],
    geminiCorrections: [],
    detectedDocumentType: targetDocType,
    fieldConfidences: {},
    validationResults: { hasErrors: false, errors: [], warnings: [] },
    regexMatches: {},
  };

  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const upperText = rawText.toUpperCase();

  const data: ExtractedDocData = {
    fullName: '',
    documentNumber: '',
    documentType: targetDocType,
    confidenceScore: 0,
    lowConfidenceFields: [],
  };

  // Common Date Extraction (DOB / Date of Birth / जन्म तिथि)
  const dobMatch = rawText.match(/(?:DOB|Date of Birth|Birth Date|Birth|D\.O\.B|जन्म तिथि|जन्म तारीख)\s*[:\.-]?\s*(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{1,2}\s+[a-zA-Z]{3,9}\s+\d{4})/i) ||
                   rawText.match(/\b(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})\b/);
  
  if (dobMatch) {
    const norm = normalizeDate(dobMatch[1]);
    data.dob = norm.formattedDate;
    logs.regexMatches['dob'] = dobMatch[0];
  } else {
    const yobMatch = rawText.match(/(?:Year of Birth|YOB|Birth Year)\s*[:\.-]?\s*(\d{4})/i);
    if (yobMatch) {
      data.dob = yobMatch[1];
      logs.regexMatches['yob'] = yobMatch[0];
    }
  }

  // 1. PAN CARD EXTRACTION
  if (targetDocType === 'PAN_CARD' || upperText.includes('INCOME TAX') || /[A-Z]{5}[0-9]{4}[A-Z]/.test(upperText)) {
    data.documentType = 'PAN_CARD';

    // Regex for PAN Number
    let panMatch = upperText.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);
    if (!panMatch) {
      // Try optical repair match
      const looseMatch = upperText.match(/\b([A-Z0-9]{10})\b/g);
      if (looseMatch) {
        for (const candidate of looseMatch) {
          const repaired = fixOpticalConfusion(candidate, 'PAN');
          if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(repaired)) {
            data.documentNumber = repaired;
            logs.opticalCorrections.push(`Repaired raw candidate '${candidate}' to PAN '${repaired}'`);
            logs.regexMatches['documentNumber'] = candidate;
            break;
          }
        }
      }
    } else {
      data.documentNumber = panMatch[1];
      logs.regexMatches['documentNumber'] = panMatch[0];
    }

    if (data.documentNumber) {
      const panInfo = determinePANType(data.documentNumber);
      data.panType = panInfo.panType;
    } else {
      data.panType = 'Individual';
    }

    // Comprehensive Blacklist for PAN Header Strings & Field Labels & Watermark Noise
    const isPanBlacklisted = (lineStr: string): boolean => {
      const u = lineStr.trim().toUpperCase();
      if (u.length < 2) return true;
      if (/\d/.test(u)) return true; // Person names on PAN card do not contain digits
      const blacklistedTokens = [
        'INCOME TAX DEPARTMENT',
        'INCOME TAX',
        'GOVT. OF INDIA',
        'GOVT OF INDIA',
        'GOVERNMENT OF INDIA',
        'GOVT',
        'GOVERNMENT',
        'BHARAT SARKAR',
        'AAYAKAR VIBHAG',
        'AAYAKAR VIBHAC',
        'AAYAKAR',
        'VIBHAG',
        'ARA AVOR',
        'AAR AVOR',
        'ARA',
        'AVOR',
        'PERMANENT ACCOUNT NUMBER CARD',
        'PERMANENT ACCOUNT NUMBER',
        'PERMANENT',
        'ACCOUNT',
        'NUMBER',
        'DEPARTMENT',
        'SIGNATURE',
        'CARD HOLDER\'S SIGNATURE',
        'CARD HOLDERS SIGNATURE',
        'CARDHOLDER',
        'INDIA',
        'INDIAN',
        'UNION OF INDIA',
        'REPUBLIC OF INDIA',
        'CARD',
        'NAME',
        'FATHER\'S NAME',
        'FATHER NAME',
        'FATHERS NAME',
        'DATE OF BIRTH',
        'DOB',
        'BIRTH',
        'PHOTO',
        'HOLDER',
      ];
      return blacklistedTokens.some((token) => u === token || u.includes(token));
    };

    // 1. Label-relative line extraction (NAME & FATHER'S NAME)
    for (let i = 0; i < lines.length; i++) {
      const lineUpper = lines[i].toUpperCase().trim();
      
      // Explicit Name Label
      if ((lineUpper === 'NAME' || lineUpper.startsWith('NAME/') || lineUpper.startsWith('NAME /') || lineUpper.includes('नाम')) && i + 1 < lines.length) {
        // Check next line or line after
        for (let k = 1; k <= 2; k++) {
          if (i + k < lines.length) {
            const candidate = lines[i + k].trim();
            if (!isPanBlacklisted(candidate) && /^[A-Z\s\.\'-]{3,50}$/i.test(candidate)) {
              data.fullName = candidate;
              logs.regexMatches['fullName'] = candidate;
              break;
            }
          }
        }
      }

      // Explicit Father's Name Label
      if ((lineUpper.includes('FATHER') || lineUpper.includes('PARENT') || lineUpper.includes('पिता')) && i + 1 < lines.length) {
        for (let k = 1; k <= 2; k++) {
          if (i + k < lines.length) {
            const candidate = lines[i + k].trim();
            if (!isPanBlacklisted(candidate) && /^[A-Z\s\.\'-]{3,50}$/i.test(candidate)) {
              data.fatherName = candidate;
              logs.regexMatches['fatherName'] = candidate;
              break;
            }
          }
        }
      }
    }

    // 2. Relative Layout Rule: On PAN cards, Cardholder Name is ALWAYS on the line directly ABOVE Father's Name
    if (data.fatherName && !data.fullName) {
      const fatherIdx = lines.findIndex(l => l.trim().toUpperCase() === data.fatherName?.toUpperCase());
      if (fatherIdx > 0) {
        // Scan upwards from father's name line
        for (let j = fatherIdx - 1; j >= 0; j--) {
          const lineUpper = lines[j].toUpperCase().trim();
          if (lineUpper.includes('FATHER') || lineUpper.includes('NAME') || lineUpper.includes('PAN')) {
            continue; // Skip label lines
          }
          if (!isPanBlacklisted(lines[j]) && /^[A-Z\s\.\'-]{3,50}$/i.test(lines[j])) {
            data.fullName = lines[j].trim();
            logs.regexMatches['fullName'] = lines[j].trim();
            break;
          }
        }
      }
    }

    // 3. Fallback candidate lines filtering if not found by explicit label or layout position
    if (!data.fullName || !data.fatherName) {
      const candidateLines = lines.filter((line) => {
        return !isPanBlacklisted(line) && /^[A-Z\s\.\'-]{3,50}$/i.test(line);
      });

      if (!data.fullName && candidateLines.length > 0) {
        // Ensure candidate is not equal to father's name
        const validCand = candidateLines.find(c => c.trim().toUpperCase() !== data.fatherName?.toUpperCase());
        if (validCand) {
          data.fullName = validCand.trim();
          logs.regexMatches['fullName'] = validCand.trim();
        }
      }

      if (!data.fatherName && candidateLines.length > 1) {
        const validFatherCand = candidateLines.find(c => c.trim().toUpperCase() !== data.fullName?.toUpperCase());
        if (validFatherCand) {
          data.fatherName = validFatherCand.trim();
          logs.regexMatches['fatherName'] = validFatherCand.trim();
        }
      }
    }
  }

  // 2. AADHAAR CARD EXTRACTION
  else if (targetDocType.includes('AADHAAR') || upperText.includes('UIDAI') || upperText.includes('UNIQUE IDENTIFICATION')) {
    data.documentType = targetDocType === 'AADHAAR_BACK' ? 'AADHAAR_BACK' : 'AADHAAR_FRONT';

    // Masked or Unmasked Aadhaar Regex
    const maskedMatch = upperText.match(/\b(X{4}\s*X{4}\s*\d{4}|[X\*\.]{8}\s*\d{4})\b/i);
    const unmaskedMatch = upperText.match(/\b(\d{4})\s*(\d{4})\s*(\d{4})\b/);

    if (maskedMatch) {
      data.isMaskedAadhaar = true;
      data.maskedDocumentNumber = maskedMatch[0].replace(/[\s-]/g, ' ');
      data.documentNumber = data.maskedDocumentNumber;
      logs.regexMatches['maskedAadhaar'] = maskedMatch[0];
    } else if (unmaskedMatch) {
      data.isMaskedAadhaar = false;
      const fullNum = `${unmaskedMatch[1]} ${unmaskedMatch[2]} ${unmaskedMatch[3]}`;
      data.documentNumber = fullNum;
      data.maskedDocumentNumber = `XXXX XXXX ${unmaskedMatch[3]}`;
      logs.regexMatches['aadhaarNumber'] = unmaskedMatch[0];
    }

    // Gender
    if (/\bMALE\b/i.test(rawText) && !/\bFEMALE\b/i.test(rawText)) data.gender = 'Male';
    else if (/\bFEMALE\b/i.test(rawText)) data.gender = 'Female';

    // Address, PIN, District, State & Evidence Extraction
    const addrResult = extractMultiLineAddressWithEvidence(rawText);
    if (addrResult.address) {
      data.address = addrResult.address;
      data.pinCode = addrResult.pinCode || data.pinCode;
      data.district = addrResult.district;
      data.state = addrResult.state;
      data.addressEvidence = {
        value: addrResult.address,
        source: addrResult.source,
        evidenceLines: addrResult.evidenceLines,
        district: addrResult.district,
        state: addrResult.state,
        pinCode: addrResult.pinCode,
        confidence: addrResult.confidence,
      };
      logs.regexMatches['address'] = addrResult.address;
    } else {
      const pinMatch = rawText.match(/\b([1-9]\d{5})\b/);
      if (pinMatch) {
        data.pinCode = pinMatch[1];
      }
    }

    // Father/Husband Name
    const relativeMatch = rawText.match(/(?:S\/O|W\/O|D\/O|Son of|Wife of|Daughter of|Care of|C\/O)[:\s]+([^\n,]+)/i);
    if (relativeMatch) {
      data.fatherName = relativeMatch[1].trim();
    }

    // Full Name - Filter out Aadhaar header keywords
    const isAadhaarBlacklisted = (lineStr: string): boolean => {
      const u = lineStr.trim().toUpperCase();
      return u.includes('GOVT') ||
        u.includes('INDIA') ||
        u.includes('UIDAI') ||
        u.includes('AADHAAR') ||
        u.includes('AUTHORITY') ||
        u.includes('UNIQUE') ||
        u.includes('IDENTIFICATION') ||
        u.includes('ENROLMENT') ||
        u.includes('MALE') ||
        u.includes('FEMALE') ||
        u.includes('DOB') ||
        u.includes('BIRTH');
    };

    const nameCandidate = lines.find((line) => {
      return !isAadhaarBlacklisted(line) && /^[A-Z\s]{3,40}$/i.test(line);
    });
    if (nameCandidate) {
      data.fullName = nameCandidate.trim();
    }
  }

  // 3. VOTER ID EXTRACTION
  else if (targetDocType === 'VOTER_ID' || upperText.includes('ELECTION COMMISSION') || upperText.includes('EPIC')) {
    data.documentType = 'VOTER_ID';

    const epicMatch = upperText.match(/\b([A-Z]{3}[0-9]{7})\b/);
    if (epicMatch) {
      data.documentNumber = epicMatch[1];
      data.epicNumber = epicMatch[1];
      logs.regexMatches['epicNumber'] = epicMatch[0];
    }

    const constMatch = rawText.match(/(?:Constituency|Assembly)[:\s]+([^\n,]+)/i);
    if (constMatch) {
      data.constituency = constMatch[1].trim();
    }
  }

  // 4. DRIVING LICENCE EXTRACTION
  else if (targetDocType === 'DRIVING_LICENCE' || upperText.includes('DRIVING') || upperText.includes('LICENCE') || upperText.includes('RTO')) {
    data.documentType = 'DRIVING_LICENCE';

    const dlMatch = upperText.match(/\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{7,11})\b/i);
    if (dlMatch) {
      data.documentNumber = dlMatch[1];
      logs.regexMatches['dlNumber'] = dlMatch[0];
    }

    const bloodMatch = rawText.match(/\b(A|B|AB|O)[+-]\b/i);
    if (bloodMatch) {
      data.bloodGroup = bloodMatch[0].toUpperCase();
    }

    if (/MCWG|LMV|MCWOG|TRANS/i.test(rawText)) {
      data.vehicleCategories = 'MCWG, LMV';
    }
  }

  // 5. PASSPORT EXTRACTION
  else if (targetDocType === 'PASSPORT' || upperText.includes('PASSPORT') || upperText.includes('REPUBLIC OF INDIA')) {
    data.documentType = 'PASSPORT';
    data.nationality = 'INDIAN';

    const passportMatch = upperText.match(/\b([A-Z][0-9]{7,8})\b/);
    if (passportMatch) {
      data.documentNumber = passportMatch[1];
      logs.regexMatches['passportNumber'] = passportMatch[0];
    }

    const mrzMatch = rawText.match(/P<IND[A-Z<]+/);
    if (mrzMatch) {
      data.mrzCode = mrzMatch[0];
      logs.regexMatches['mrz'] = mrzMatch[0];
    }
  }

  // Calculate per-field confidences
  const fields = ['fullName', 'documentNumber', 'dob', 'fatherName', 'gender', 'pinCode', 'address'];
  fields.forEach(field => {
    const val = (data as any)[field];
    let confidence = 95;
    let isValid = true;
    let errorMessage: string | undefined = undefined;

    if (!val) {
      confidence = 40;
      isValid = false;
      data.lowConfidenceFields.push(field);
    } else {
      if (field === 'documentNumber' && targetDocType === 'PAN_CARD' && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val)) {
        confidence = 75; // Needs review rather than rejection
        isValid = false;
        errorMessage = 'Please verify PAN Card format';
        logs.validationResults.warnings.push('PAN format confidence 75% - Needs Review');
      }
    }

    logs.fieldConfidences[field] = {
      value: val || '',
      confidence,
      isValid,
      errorMessage,
    };
  });

  return {
    extractedData: data,
    developerLogs: logs,
    overallConfidence: calculateAverageConfidence(logs.fieldConfidences),
  };
}

function calculateAverageConfidence(fieldConfidences: Record<string, FieldWithConfidence>): number {
  const vals = Object.values(fieldConfidences);
  if (vals.length === 0) return 0;
  const sum = vals.reduce((acc, curr) => acc + curr.confidence, 0);
  return Math.round(sum / vals.length);
}
