import { QuadCorners } from './cvEngine';

export interface ScanFieldValidation {
  value: string;
  confidence: number;
  passed: boolean;
  message?: string;
}

export interface ScanQualityValidation {
  status: 'PASS' | 'FAIL';
  score: number; // 0 - 100
  documentDetected: boolean;
  documentType: string;
  documentComplete: boolean;
  brightness: {
    passed: boolean;
    score: number;
    message?: string;
  };
  sharpness: {
    passed: boolean;
    score: number;
    message?: string;
  };
  glare: {
    passed: boolean;
    score: number;
    message?: string;
  };
  documentSize: {
    passed: boolean;
    coveragePercent: number;
    message?: string;
  };
  ocr: {
    passed: boolean;
    confidence: number;
    rawTextLength: number;
    message?: string;
  };
  fields: {
    fullName: ScanFieldValidation;
    dateOfBirth: ScanFieldValidation;
    gender: ScanFieldValidation;
    address: ScanFieldValidation;
    pincode: ScanFieldValidation;
    documentNumber?: ScanFieldValidation;
  };
  portraitDetected: boolean;
  errors: string[];
}

/**
 * Evaluates image brightness & lighting metrics on canvas
 */
export function evaluateImageLighting(canvas: HTMLCanvasElement): {
  brightnessScore: number;
  brightnessPassed: boolean;
  glareScore: number;
  glarePassed: boolean;
  message?: string;
} {
  const ctx = canvas.getContext('2d');
  if (!ctx || canvas.width === 0 || canvas.height === 0) {
    return { brightnessScore: 0, brightnessPassed: false, glareScore: 100, glarePassed: false, message: 'Invalid image buffer' };
  }
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const len = data.length;
  let totalLuma = 0;
  let darkPixelCount = 0;
  let brightPixelCount = 0;

  const step = Math.max(4, Math.floor(len / 8000) * 4);
  let samples = 0;

  for (let i = 0; i < len; i += step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuma += luma;
    if (luma < 35) darkPixelCount++;
    if (luma > 240) brightPixelCount++;
    samples++;
  }

  const avgLuma = totalLuma / (samples || 1);
  const darkRatio = darkPixelCount / (samples || 1);
  const glareRatio = brightPixelCount / (samples || 1);

  const brightnessScore = Math.min(100, Math.max(0, Math.round((avgLuma / 255) * 100)));
  const brightnessPassed = avgLuma >= 45 && avgLuma <= 230 && darkRatio < 0.42;
  
  const glareScore = Math.min(100, Math.max(0, Math.round(glareRatio * 100)));
  const glarePassed = glareRatio < 0.20;

  let message: string | undefined = undefined;
  if (avgLuma < 45 || darkRatio >= 0.42) {
    message = 'Image is too dark. Move to better lighting and scan again.';
  } else if (avgLuma > 230) {
    message = 'Image is overexposed. Adjust lighting and scan again.';
  } else if (!glarePassed) {
    message = 'Too much glare on the document. Move the phone slightly and scan again.';
  }

  return { brightnessScore, brightnessPassed, glareScore, glarePassed, message };
}

/**
 * Evaluates image sharpness / blur metrics on canvas
 */
export function evaluateImageSharpness(canvas: HTMLCanvasElement): {
  sharpnessScore: number;
  sharpnessPassed: boolean;
  message?: string;
} {
  const ctx = canvas.getContext('2d');
  if (!ctx || canvas.width === 0 || canvas.height === 0) {
    return { sharpnessScore: 0, sharpnessPassed: false, message: 'Invalid image buffer' };
  }
  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  let sumG = 0;
  let sumG2 = 0;
  let samples = 0;
  const step = Math.max(2, Math.floor(w / 180));

  for (let y = step; y < h - step; y += step) {
    for (let x = step; x < w - step; x += step) {
      const idx = (y * w + x) * 4;
      const rightIdx = (y * w + (x + step)) * 4;
      const downIdx = ((y + step) * w + x) * 4;

      const gCurr = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const gRight = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
      const gDown = 0.299 * data[downIdx] + 0.587 * data[downIdx + 1] + 0.114 * data[downIdx + 2];

      const dx = gRight - gCurr;
      const dy = gDown - gCurr;
      const mag = Math.abs(dx) + Math.abs(dy);

      sumG += mag;
      sumG2 += mag * mag;
      samples++;
    }
  }

  const meanG = sumG / (samples || 1);
  const variance = (sumG2 / (samples || 1)) - (meanG * meanG);
  const sharpnessScore = Math.min(100, Math.max(0, Math.round(Math.sqrt(Math.max(0, variance)) * 3.8)));
  const sharpnessPassed = sharpnessScore >= 32;

  return {
    sharpnessScore,
    sharpnessPassed,
    message: sharpnessPassed ? undefined : 'Document is blurry. Hold the phone steady and capture again.',
  };
}

/**
 * Validates complete document quality & OCR field extraction
 */
export function validateDocumentScanQuality(
  canvas: HTMLCanvasElement,
  corners: QuadCorners | null,
  ocrExtractedData: any,
  docTypeRequested = 'AADHAAR'
): ScanQualityValidation {
  const errors: string[] = [];

  // 1. Document Detection & Boundary Completeness
  const documentDetected = Boolean(corners);
  let documentComplete = true;

  if (!documentDetected) {
    errors.push('Aadhaar card not detected. Please place the complete card inside the frame.');
    documentComplete = false;
  } else if (corners) {
    const pad = 6;
    const w = canvas.width;
    const h = canvas.height;
    const isEdgeCut = (
      corners.topLeft.x < pad || corners.topLeft.y < pad ||
      corners.topRight.x > w - pad || corners.topRight.y < pad ||
      corners.bottomRight.x > w - pad || corners.bottomRight.y > h - pad ||
      corners.bottomLeft.x < pad || corners.bottomLeft.y > h - pad
    );
    if (isEdgeCut) {
      documentComplete = false;
      errors.push('Unable to detect all four document edges. Place the complete card inside the frame.');
    }
  }

  // 2. Lighting / Brightness / Glare
  const lighting = evaluateImageLighting(canvas);
  if (!lighting.brightnessPassed) {
    errors.push(lighting.message || 'Image is too dark. Move to better lighting and scan again.');
  }
  if (!lighting.glarePassed) {
    errors.push(lighting.message || 'Too much glare on the document.');
  }

  // 3. Sharpness / Blur
  const sharpness = evaluateImageSharpness(canvas);
  if (!sharpness.sharpnessPassed) {
    errors.push(sharpness.message || 'Document is blurry. Hold phone steady and scan again.');
  }

  // 4. Document Coverage / Size Check
  let coveragePercent = 70;
  let documentSizePassed = true;
  if (corners) {
    const topW = Math.hypot(corners.topRight.x - corners.topLeft.x, corners.topRight.y - corners.topLeft.y);
    const leftH = Math.hypot(corners.bottomLeft.y - corners.topLeft.y, corners.bottomLeft.x - corners.topLeft.x);
    const quadArea = topW * leftH;
    const totalArea = canvas.width * canvas.height;
    coveragePercent = Math.min(100, Math.round((quadArea / (totalArea || 1)) * 100));

    if (coveragePercent < 30 && coveragePercent > 0) {
      documentSizePassed = false;
      errors.push('Move closer to the document. Card occupies too small area in frame.');
    }
  }

  // 5. OCR Raw Text & Fields Validation
  const rawText = (ocrExtractedData?.rawText || '').trim();
  const rawTextLength = rawText.length;
  const ocrPassed = rawTextLength >= 15;

  if (!ocrPassed) {
    errors.push('Unable to read document text. Make sure card is well lit, focused, and completely visible.');
  }

  // Full Name Validation
  const fullName = (ocrExtractedData?.fullName || '').trim();
  const upperName = fullName.toUpperCase();
  const isGovtHeader = upperName.includes('GOVT') || upperName.includes('INDIA') || upperName.includes('AADHAAR') || upperName.includes('AUTHORITY') || upperName.includes('ENROLMENT');
  const fullNamePassed = fullName.length >= 3 && !isGovtHeader && upperName !== 'UNKNOWN';

  if (!fullNamePassed) {
    errors.push('Name could not be detected clearly or was confused with header text.');
  }

  // Address Validation
  const address = (ocrExtractedData?.address || '').trim();
  const addressPassed = address.length >= 8 && !address.toUpperCase().includes('UNIQUE IDENTIFICATION');

  if (!addressPassed) {
    errors.push('Address could not be detected clearly.');
  }

  // Date of Birth / Year Validation
  const dob = (ocrExtractedData?.dob || ocrExtractedData?.yearOfBirth || '').trim();
  const dobPassed = dob.length >= 4;

  if (!dobPassed) {
    errors.push('Date of birth or Year of birth was not detected.');
  }

  // Pin Code Validation
  const pinCode = (ocrExtractedData?.pinCode || '').trim();
  const pincodePassed = /^\d{6}$/.test(pinCode) || addressPassed;

  // Portrait Detection
  const portraitDetected = Boolean(ocrExtractedData?.portraitDetected ?? true);

  // Overall Score Calculation (0 - 100)
  let score = 0;
  if (documentDetected) score += 15;
  if (documentComplete) score += 10;
  if (lighting.brightnessPassed) score += 15;
  if (sharpness.sharpnessPassed) score += 15;
  if (lighting.glarePassed) score += 10;
  if (ocrPassed) score += 15;
  if (fullNamePassed) score += 10;
  if (addressPassed) score += 10;

  // HARD GATE DETERMINATION
  const isPass = (
    documentDetected &&
    lighting.brightnessPassed &&
    sharpness.sharpnessPassed &&
    ocrPassed &&
    fullNamePassed &&
    addressPassed
  );

  return {
    status: isPass ? 'PASS' : 'FAIL',
    score,
    documentDetected,
    documentType: ocrExtractedData?.documentType || 'AADHAAR_CARD',
    documentComplete,
    brightness: {
      passed: lighting.brightnessPassed,
      score: lighting.brightnessScore,
      message: lighting.brightnessPassed ? undefined : 'Too dark or overexposed',
    },
    sharpness: {
      passed: sharpness.sharpnessPassed,
      score: sharpness.sharpnessScore,
      message: sharpness.sharpnessPassed ? undefined : 'Blurry image',
    },
    glare: {
      passed: lighting.glarePassed,
      score: lighting.glareScore,
      message: lighting.glarePassed ? undefined : 'Glare detected',
    },
    documentSize: {
      passed: documentSizePassed,
      coveragePercent,
      message: documentSizePassed ? undefined : 'Move closer',
    },
    ocr: {
      passed: ocrPassed,
      confidence: ocrExtractedData?.confidenceScore || 85,
      rawTextLength,
      message: ocrPassed ? undefined : 'Text unreadable',
    },
    fields: {
      fullName: {
        value: fullName || 'Not Detected',
        confidence: fullNamePassed ? 92 : 30,
        passed: fullNamePassed,
        message: fullNamePassed ? undefined : 'Name detection failed',
      },
      dateOfBirth: {
        value: dob || 'Not Detected',
        confidence: dobPassed ? 90 : 30,
        passed: dobPassed,
        message: dobPassed ? undefined : 'DOB detection failed',
      },
      gender: {
        value: ocrExtractedData?.gender || 'Not Detected',
        confidence: ocrExtractedData?.gender ? 90 : 40,
        passed: Boolean(ocrExtractedData?.gender),
      },
      address: {
        value: address || 'Not Detected',
        confidence: addressPassed ? 88 : 30,
        passed: addressPassed,
        message: addressPassed ? undefined : 'Address detection failed',
      },
      pincode: {
        value: pinCode || 'Not Detected',
        confidence: pincodePassed ? 95 : 40,
        passed: pincodePassed,
      },
      documentNumber: {
        value: ocrExtractedData?.documentNumber || 'Not Detected',
        confidence: ocrExtractedData?.documentNumber ? 90 : 30,
        passed: Boolean(ocrExtractedData?.documentNumber),
      },
    },
    portraitDetected,
    errors,
  };
}
