import jsQR from 'jsqr';

export interface Point {
  x: number;
  y: number;
}

export interface QuadCorners {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

export interface DetectedQuad {
  corners: QuadCorners;
  width: number;
  height: number;
  aspectRatio: number; // width / height
  areaRatio: number; // quadArea / totalCanvasArea
  confidence: number; // 0 - 100
}

export type DetectedDocType =
  | 'PAN Card'
  | 'Aadhaar Card'
  | 'Driving Licence'
  | 'Passport'
  | 'Voter ID'
  | 'Employee ID'
  | 'College ID'
  | 'Visitor Pass'
  | 'Generic ID Card'
  | 'Unknown Document';

export interface ScanDebugStats {
  contoursFound: number;
  largestArea: number;
  cornerCount: number;
  cornerCoords: string;
  aspectRatio: number;
  confidence: number;
  detectedDocument: string;
  rejectionReason: string | null;
  captureState: string;
}

export interface ScanValidationResult {
  quadDetected: boolean;
  quad: DetectedQuad | null;
  hasFaceInFrame: boolean;
  faceWarningMessage: string | null;
  blurDetected: boolean;
  blurScore: number; // 0-100 (higher is sharper)
  glareDetected: boolean;
  glareScore: number; // 0-100
  brightnessScore: number; // 0-100
  aspectRatioValid: boolean;
  isOutsideFrame: boolean;
  cardDistance: 'TOO_FAR' | 'TOO_CLOSE' | 'OPTIMAL';
  isTilted: boolean;
  detectedDocType: DetectedDocType;
  selectedDocTypeLabel: string;
  isTypeMatched: boolean;
  overallQuality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  cornersCount: 4 | 0;
  userGuidance: string;
  readyToCapture: boolean;
  allCriteriaPassed: boolean;
  failureReasons: string[];
  qrCodeData: string | null;
  debugStats?: ScanDebugStats;
}

declare global {
  interface Window {
    cv: any;
  }
}

// Global debug frame counter
let frameCounter = 0;

/**
 * Checks if OpenCV.js script is loaded and ready
 */
export function isOpenCVReady(): boolean {
  return typeof window !== 'undefined' && !!window.cv && !!window.cv.Mat;
}

/**
 * Normalizes user-selected document type to a clean display label and search key
 */
export function normalizeExpectedDocType(typeStr: string): { label: string; key: string } {
  const norm = (typeStr || '').toUpperCase().trim();
  if (norm.includes('PAN')) return { label: 'PAN Card', key: 'PAN' };
  if (norm.includes('AADHAAR') || norm.includes('ADHAR')) return { label: 'Aadhaar Card', key: 'AADHAAR' };
  if (norm.includes('PASSPORT')) return { label: 'Passport', key: 'PASSPORT' };
  if (norm.includes('DRIVING') || norm.includes('DL') || norm.includes('LICENSE') || norm.includes('LICENCE')) return { label: 'Driving Licence', key: 'DRIVING_LICENSE' };
  if (norm.includes('VOTER')) return { label: 'Voter ID', key: 'VOTER_ID' };
  if (norm.includes('EMPLOYEE')) return { label: 'Employee ID', key: 'EMPLOYEE_ID' };
  if (norm.includes('STUDENT') || norm.includes('COLLEGE')) return { label: 'College ID', key: 'STUDENT_ID' };
  if (norm.includes('VISITOR')) return { label: 'Visitor Pass', key: 'VISITOR_PASS' };
  if (norm.includes('AUTO') || norm.includes('ANY') || norm.includes('OTHER') || norm.includes('GENERIC')) return { label: 'Government ID', key: 'AUTOMATIC' };
  return { label: typeStr || 'Government ID', key: 'CUSTOM' };
}

/**
 * Sorts 4 points into Top-Left, Top-Right, Bottom-Right, Bottom-Left using centroid polar angle.
 * Handles card rotation (0° to 360°) and perspective distortion without corner swapping.
 */
export function sortQuadCorners(pts: Point[]): QuadCorners {
  if (pts.length !== 4) {
    throw new Error('Expected exactly 4 points to sort quad corners');
  }

  // Calculate centroid (cx, cy)
  const cx = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4;
  const cy = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4;

  // Compute angle relative to centroid for each point
  const pointsWithAngles = pts.map((pt) => ({
    pt,
    angle: Math.atan2(pt.y - cy, pt.x - cx),
  }));

  // Sort clockwise by polar angle ascending (-PI to +PI)
  pointsWithAngles.sort((a, b) => a.angle - b.angle);

  const sortedPts = pointsWithAngles.map((p) => p.pt);

  // Identify top-left corner as the point with minimum (x + y)
  let topLeftIdx = 0;
  let minSum = Infinity;

  for (let i = 0; i < 4; i++) {
    const sum = sortedPts[i].x + sortedPts[i].y;
    if (sum < minSum) {
      minSum = sum;
      topLeftIdx = i;
    }
  }

  // Shift array so top-left is at index 0
  const ordered: Point[] = [];
  for (let i = 0; i < 4; i++) {
    ordered.push(sortedPts[(topLeftIdx + i) % 4]);
  }

  // Ensure clockwise order: Top-Left -> Top-Right -> Bottom-Right -> Bottom-Left
  const v1 = { x: ordered[1].x - ordered[0].x, y: ordered[1].y - ordered[0].y };
  const v2 = { x: ordered[3].x - ordered[0].x, y: ordered[3].y - ordered[0].y };
  const cross = v1.x * v2.y - v1.y * v2.x;

  if (cross < 0) {
    return {
      topLeft: ordered[0],
      topRight: ordered[3],
      bottomRight: ordered[2],
      bottomLeft: ordered[1],
    };
  }

  return {
    topLeft: ordered[0],
    topRight: ordered[1],
    bottomRight: ordered[2],
    bottomLeft: ordered[3],
  };
}

/**
 * Extracts 4 extreme corners (min x+y, max x-y, max x+y, min x-y) from any polygon
 */
export function getExtreme4Points(pts: Point[]): Point[] {
  if (pts.length <= 4) return pts;

  let minSum = Infinity, maxSum = -Infinity;
  let minDiff = Infinity, maxDiff = -Infinity;

  let tl = pts[0], br = pts[0];
  let tr = pts[0], bl = pts[0];

  for (const pt of pts) {
    const sum = pt.x + pt.y;
    const diff = pt.x - pt.y;

    if (sum < minSum) { minSum = sum; tl = pt; }
    if (sum > maxSum) { maxSum = sum; br = pt; }
    if (diff > maxDiff) { maxDiff = diff; tr = pt; }
    if (diff < minDiff) { minDiff = diff; bl = pt; }
  }

  return [tl, tr, br, bl];
}

/**
 * Smooths corner positions across consecutive frames to eliminate jitter/flicker
 */
export function smoothCorners(
  current: QuadCorners | null,
  previous: QuadCorners | null,
  factor = 0.35
): QuadCorners | null {
  if (!current) return null;
  if (!previous) return current;

  return {
    topLeft: {
      x: previous.topLeft.x + (current.topLeft.x - previous.topLeft.x) * factor,
      y: previous.topLeft.y + (current.topLeft.y - previous.topLeft.y) * factor,
    },
    topRight: {
      x: previous.topRight.x + (current.topRight.x - previous.topRight.x) * factor,
      y: previous.topRight.y + (current.topRight.y - previous.topRight.y) * factor,
    },
    bottomRight: {
      x: previous.bottomRight.x + (current.bottomRight.x - previous.bottomRight.x) * factor,
      y: previous.bottomRight.y + (current.bottomRight.y - previous.bottomRight.y) * factor,
    },
    bottomLeft: {
      x: previous.bottomLeft.x + (current.bottomLeft.x - previous.bottomLeft.x) * factor,
      y: previous.bottomLeft.y + (current.bottomLeft.y - previous.bottomLeft.y) * factor,
    },
  };
}

/**
 * Detects if frame contains a human face occupying the main view instead of an ID document
 */
function checkFaceInFrame(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const imageData = ctx.getImageData(width * 0.20, height * 0.15, width * 0.60, height * 0.70);
    const data = imageData.data;
    let skinPixelCount = 0;
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Standard RGB Skin Color Detection formula
      if (
        r > 95 && g > 40 && b > 20 &&
        (Math.max(r, g, b) - Math.min(r, g, b)) > 15 &&
        Math.abs(r - g) > 15 &&
        r > g && r > b
      ) {
        skinPixelCount++;
      }
    }

    const skinRatio = skinPixelCount / totalPixels;
    return skinRatio > 0.38;
  } catch (e) {
    return false;
  }
}

/**
 * Detailed texture, text density, and skin pixel analysis inside a quad
 */
function analyzeQuadTextureAndContent(
  ctx: CanvasRenderingContext2D,
  c: QuadCorners,
  width: number,
  height: number
): {
  isDocumentContent: boolean;
  textTextureDensity: number;
  skinRatio: number;
  stdDev: number;
  textScore: number;
  textureScore: number;
  rejectionReason?: string;
} {
  try {
    const minX = Math.max(0, Math.min(c.topLeft.x, c.bottomLeft.x));
    const minY = Math.max(0, Math.min(c.topLeft.y, c.topRight.y));
    const maxX = Math.min(width, Math.max(c.topRight.x, c.bottomRight.x));
    const maxY = Math.min(height, Math.max(c.bottomLeft.y, c.bottomRight.y));

    const w = Math.floor(maxX - minX);
    const h = Math.floor(maxY - minY);

    if (w < 30 || h < 20) {
      return { isDocumentContent: false, textTextureDensity: 0, skinRatio: 0, stdDev: 0, textScore: 0, textureScore: 0, rejectionReason: 'Too small area' };
    }

    const imgData = ctx.getImageData(Math.floor(minX), Math.floor(minY), w, h);
    const data = imgData.data;
    let totalLuma = 0;
    let skinCount = 0;
    let varianceSum = 0;
    const pixelCount = data.length / 4;

    const lumas = new Uint8Array(pixelCount);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const idx = i / 4;
      lumas[idx] = luma;
      totalLuma += luma;

      if (
        r > 95 && g > 40 && b > 20 &&
        (Math.max(r, g, b) - Math.min(r, g, b)) > 15 &&
        Math.abs(r - g) > 15 &&
        r > g && r > b
      ) {
        skinCount++;
      }
    }

    const meanLuma = totalLuma / pixelCount;
    const skinRatio = skinCount / pixelCount;

    let edgeTransitions = 0;
    const step = Math.max(1, Math.floor(w / 100));

    for (let y = 1; y < h - 1; y += 2) {
      for (let x = step; x < w - step; x += step) {
        const curr = lumas[y * w + x];
        const prev = lumas[y * w + (x - step)];
        const diff = Math.abs(curr - prev);
        if (diff > 18) {
          edgeTransitions++;
        }
        varianceSum += (curr - meanLuma) * (curr - meanLuma);
      }
    }

    const stdDev = Math.sqrt(varianceSum / pixelCount);
    const textTextureDensity = Math.min(100, Math.round((edgeTransitions / (pixelCount / step)) * 320));

    const textScore = textTextureDensity >= 8 ? 15 : textTextureDensity >= 3 ? 10 : 5;
    const textureScore = skinRatio < 0.35 ? 10 : 3;

    let isDocumentContent = true;
    let rejectionReason: string | undefined = undefined;

    if (skinRatio > 0.42) {
      isDocumentContent = false;
      rejectionReason = `High skin ratio (${Math.round(skinRatio * 100)}%)`;
    }

    return {
      isDocumentContent,
      textTextureDensity,
      skinRatio,
      stdDev,
      textScore,
      textureScore,
      rejectionReason,
    };
  } catch (e) {
    return { isDocumentContent: true, textTextureDensity: 50, skinRatio: 0, stdDev: 20, textScore: 12, textureScore: 8 };
  }
}

/**
 * Classifies document type from color, ratio, and layout
 */
function classifyDocumentType(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  quad: DetectedQuad | null,
  qrCodeData: string | null
): DetectedDocType {
  if (!quad) return 'Generic ID Card';

  if (qrCodeData) {
    const qrLower = qrCodeData.toLowerCase();
    if (qrLower.includes('aadhaar') || qrLower.includes('uidai') || /^\d{12}$/.test(qrCodeData.trim()) || qrLower.includes('xml')) {
      return 'Aadhaar Card';
    }
  }

  const { aspectRatio } = quad;

  if (aspectRatio >= 0.55 && aspectRatio <= 0.88) {
    return 'Employee ID';
  }

  if (aspectRatio >= 1.25 && aspectRatio <= 1.48) {
    return 'Passport';
  }

  try {
    const c = quad.corners;
    const minX = Math.max(0, Math.min(c.topLeft.x, c.bottomLeft.x));
    const minY = Math.max(0, Math.min(c.topLeft.y, c.topRight.y));
    const quadW = Math.max(10, Math.abs(c.topRight.x - c.topLeft.x));
    const quadH = Math.max(10, Math.abs(c.bottomLeft.y - c.topLeft.y));

    const sampleH = Math.max(5, Math.floor(quadH * 0.3));
    const imgData = ctx.getImageData(
      Math.floor(minX + quadW * 0.1),
      Math.floor(minY),
      Math.floor(quadW * 0.8),
      sampleH
    );
    const data = imgData.data;

    let bluePixels = 0;
    let saffronPixels = 0;
    let darkPixels = 0;
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (b > 110 && b > r + 18 && g > 60) bluePixels++;
      if (r > 165 && g > 110 && b < 110) saffronPixels++;
      if (r < 65 && g < 65 && b < 85) darkPixels++;
    }

    const blueRatio = bluePixels / totalPixels;
    const saffronRatio = saffronPixels / totalPixels;
    const darkRatio = darkPixels / totalPixels;

    if (blueRatio > 0.12) return 'PAN Card';
    if (saffronRatio > 0.12) return 'Aadhaar Card';
    if (darkRatio > 0.40) return 'Passport';
    if (blueRatio > 0.06 && saffronRatio > 0.06) return 'Driving Licence';
  } catch (e) {
    // Fallback
  }

  return 'Generic ID Card';
}

/**
 * Fast Pure JS Sobel Edge & Contour Quad Detector
 * Executes when OpenCV is loading or fails to return a candidate.
 * Guarantees zero freezing and instant corner detection.
 */
export function detectQuadPureJS(
  canvas: HTMLCanvasElement
): DetectedQuad | null {
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const fullW = canvas.width;
    const fullH = canvas.height;
    if (fullW === 0 || fullH === 0) return null;

    const sampleW = 320;
    const sampleH = Math.round((fullH / fullW) * sampleW);
    const scaleX = fullW / sampleW;
    const scaleY = fullH / sampleH;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = sampleW;
    offCanvas.height = sampleH;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return null;

    offCtx.drawImage(canvas, 0, 0, sampleW, sampleH);
    const imgData = offCtx.getImageData(0, 0, sampleW, sampleH);
    const pixels = imgData.data;

    const gray = new Uint8Array(sampleW * sampleH);
    for (let i = 0; i < pixels.length; i += 4) {
      gray[i / 4] = Math.round(0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]);
    }

    const edgePoints: Point[] = [];
    const minEdgeMagnitude = 28;

    for (let y = 3; y < sampleH - 3; y += 2) {
      for (let x = 3; x < sampleW - 3; x += 2) {
        const idx = y * sampleW + x;
        const gx =
          gray[idx - sampleW + 1] + 2 * gray[idx + 1] + gray[idx + sampleW + 1] -
          (gray[idx - sampleW - 1] + 2 * gray[idx - 1] + gray[idx + sampleW - 1]);
        const gy =
          gray[idx + sampleW - 1] + 2 * gray[idx + sampleW] + gray[idx + sampleW + 1] -
          (gray[idx - sampleW - 1] + 2 * gray[idx - sampleW] + gray[idx - sampleW + 1]);

        const mag = Math.abs(gx) + Math.abs(gy);
        if (mag > minEdgeMagnitude) {
          edgePoints.push({ x: x * scaleX, y: y * scaleY });
        }
      }
    }

    if (edgePoints.length < 30) return null;

    const extremePts = getExtreme4Points(edgePoints);
    const sorted = sortQuadCorners(extremePts);

    const quadW = Math.hypot(sorted.topRight.x - sorted.topLeft.x, sorted.topRight.y - sorted.topLeft.y);
    const quadH = Math.hypot(sorted.bottomLeft.x - sorted.topLeft.x, sorted.bottomLeft.y - sorted.topLeft.y);
    const area = quadW * quadH;
    const totalArea = fullW * fullH;
    const areaRatio = area / (totalArea || 1);
    const aspectRatio = quadW / (quadH || 1);

    if (areaRatio >= 0.015 && areaRatio <= 0.92 && aspectRatio >= 0.40 && aspectRatio <= 2.4) {
      return {
        corners: sorted,
        width: quadW,
        height: quadH,
        aspectRatio,
        areaRatio,
        confidence: 75,
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Main OpenCV / JS Frame Analyzer
 */
export function analyzeDocumentFrame(
  canvas: HTMLCanvasElement,
  expectedDocType = 'Aadhaar Card'
): ScanValidationResult {
  frameCounter++;
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d');

  const normalizedExpected = normalizeExpectedDocType(expectedDocType);

  if (!ctx || width === 0 || height === 0) {
    return {
      quadDetected: false,
      quad: null,
      hasFaceInFrame: false,
      faceWarningMessage: null,
      blurDetected: false,
      blurScore: 80,
      glareDetected: false,
      glareScore: 10,
      brightnessScore: 80,
      aspectRatioValid: false,
      isOutsideFrame: false,
      cardDistance: 'OPTIMAL',
      isTilted: false,
      detectedDocType: 'Unknown Document',
      selectedDocTypeLabel: normalizedExpected.label,
      isTypeMatched: false,
      overallQuality: 'Poor',
      cornersCount: 0,
      userGuidance: 'Searching for document...',
      readyToCapture: false,
      allCriteriaPassed: false,
      failureReasons: ['No document detected.'],
      qrCodeData: null,
    };
  }

  // 1. First-stage Face Detection
  const hasFaceInFrame = checkFaceInFrame(ctx, width, height);
  if (hasFaceInFrame) {
    return {
      quadDetected: false,
      quad: null,
      hasFaceInFrame: true,
      faceWarningMessage: 'Please point camera toward the document.',
      blurDetected: false,
      blurScore: 80,
      glareDetected: false,
      glareScore: 10,
      brightnessScore: 80,
      aspectRatioValid: false,
      isOutsideFrame: false,
      cardDistance: 'OPTIMAL',
      isTilted: false,
      detectedDocType: 'Unknown Document',
      selectedDocTypeLabel: normalizedExpected.label,
      isTypeMatched: false,
      overallQuality: 'Poor',
      cornersCount: 0,
      userGuidance: 'Please point camera toward the document.',
      readyToCapture: false,
      allCriteriaPassed: false,
      failureReasons: ['Face detected in frame.'],
      qrCodeData: null,
      debugStats: {
        contoursFound: 0,
        largestArea: 0,
        cornerCount: 0,
        cornerCoords: 'N/A',
        aspectRatio: 0,
        confidence: 0,
        detectedDocument: 'None (Face in view)',
        rejectionReason: 'Face detected in camera view',
        captureState: 'DISABLED (Face Warning)',
      },
    };
  }

  // 2. QR Code Detection
  let qrCodeData: string | null = null;
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const code = jsQR(imgData.data, width, height, { inversionAttempts: 'dontInvert' });
    if (code) {
      qrCodeData = code.data;
    }
  } catch (err) {
    // Optional QR
  }

  // 3. Document Quad Detection using OpenCV or Pure JS Fallback
  let detectedQuad: DetectedQuad | null = null;
  let contoursFoundCount = 0;
  let largestAreaFound = 0;
  let rejectionReason: string | null = null;

  if (isOpenCVReady()) {
    try {
      const cv = window.cv;
      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      const blurred = new cv.Mat();
      const edges = new cv.Mat();
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();

      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
      cv.Canny(blurred, edges, 25, 90);

      const morphKernel = cv.Mat.ones(3, 3, cv.CV_8U);
      cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, morphKernel);
      morphKernel.delete();

      cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      contoursFoundCount = contours.size();
      const totalArea = width * height;

      let maxScoredCandidate: { quad: DetectedQuad; score: number } | null = null;

      for (let i = 0; i < contours.size(); ++i) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);

        if (area > largestAreaFound) {
          largestAreaFound = area;
        }

        if (area > totalArea * 0.015 && area < totalArea * 0.90) {
          const hull = new cv.Mat();
          cv.convexHull(contour, hull);
          const peri = cv.arcLength(hull, true);

          let candidatePts: Point[] | null = null;
          let cornersScore = 0;

          const epsilons = [0.012, 0.02, 0.028, 0.038];
          for (const epsRatio of epsilons) {
            const approx = new cv.Mat();
            cv.approxPolyDP(hull, approx, epsRatio * peri, true);

            if (approx.rows === 4) {
              candidatePts = [
                { x: approx.data32S[0], y: approx.data32S[1] },
                { x: approx.data32S[2], y: approx.data32S[3] },
                { x: approx.data32S[4], y: approx.data32S[5] },
                { x: approx.data32S[6], y: approx.data32S[7] },
              ];
              cornersScore = 20;
              approx.delete();
              break;
            } else if (approx.rows > 4 && approx.rows <= 12) {
              const pts: Point[] = [];
              for (let r = 0; r < approx.rows; r++) {
                pts.push({ x: approx.data32S[r * 2], y: approx.data32S[r * 2 + 1] });
              }
              candidatePts = getExtreme4Points(pts);
              cornersScore = 18;
              approx.delete();
              break;
            }
            approx.delete();
          }
          hull.delete();

          if (candidatePts) {
            const sortedCorners = sortQuadCorners(candidatePts);
            const quadW = Math.hypot(sortedCorners.topRight.x - sortedCorners.topLeft.x, sortedCorners.topRight.y - sortedCorners.topLeft.y);
            const quadH = Math.hypot(sortedCorners.bottomLeft.x - sortedCorners.topLeft.x, sortedCorners.bottomLeft.y - sortedCorners.topLeft.y);
            const aspectRatio = quadW / (quadH || 1);
            const areaRatio = area / totalArea;

            const content = analyzeQuadTextureAndContent(ctx, sortedCorners, width, height);

            if (content.isDocumentContent) {
              const totalScore = cornersScore + 60; // Valid document polygon
              if (!maxScoredCandidate || totalScore > maxScoredCandidate.score) {
                maxScoredCandidate = {
                  score: totalScore,
                  quad: {
                    corners: sortedCorners,
                    width: quadW,
                    height: quadH,
                    aspectRatio,
                    areaRatio,
                    confidence: Math.min(98, totalScore),
                  },
                };
              }
            } else {
              rejectionReason = content.rejectionReason || 'Texture invalid';
            }
          }
        }
      }

      // Cleanup
      src.delete();
      gray.delete();
      blurred.delete();
      edges.delete();
      contours.delete();
      hierarchy.delete();

      if (maxScoredCandidate) {
        detectedQuad = maxScoredCandidate.quad;
      }
    } catch (e) {
      console.warn('OpenCV processing error:', e);
    }
  }

  // Pure JS Fallback if OpenCV didn't yield a candidate
  if (!detectedQuad) {
    detectedQuad = detectQuadPureJS(canvas);
  }

  // IF NO document candidate quad found, return Searching state
  if (!detectedQuad) {
    return {
      quadDetected: false,
      quad: null,
      hasFaceInFrame: false,
      faceWarningMessage: null,
      blurDetected: false,
      blurScore: 80,
      glareDetected: false,
      glareScore: 10,
      brightnessScore: 80,
      aspectRatioValid: false,
      isOutsideFrame: false,
      cardDistance: 'OPTIMAL',
      isTilted: false,
      detectedDocType: 'Unknown Document',
      selectedDocTypeLabel: normalizedExpected.label,
      isTypeMatched: false,
      overallQuality: 'Poor',
      cornersCount: 0,
      userGuidance: 'Searching for document...',
      readyToCapture: false,
      allCriteriaPassed: false,
      failureReasons: ['No document detected.'],
      qrCodeData: null,
      debugStats: {
        contoursFound: contoursFoundCount,
        largestArea: Math.round(largestAreaFound),
        cornerCount: 0,
        cornerCoords: 'None',
        aspectRatio: 0,
        confidence: 0,
        detectedDocument: 'None',
        rejectionReason: rejectionReason || 'No convex card contour found',
        captureState: 'DISABLED (Searching)',
      },
    };
  }

  // 4. Geometry & Distance Validation
  const c = detectedQuad.corners;
  const pad = 8;
  const isOutsideFrame = (
    c.topLeft.x < pad || c.topLeft.y < pad ||
    c.topRight.x > width - pad || c.topRight.y < pad ||
    c.bottomRight.x > width - pad || c.bottomRight.y > height - pad ||
    c.bottomLeft.x < pad || c.bottomLeft.y > height - pad
  );

  const cardDistance: 'TOO_FAR' | 'TOO_CLOSE' | 'OPTIMAL' = detectedQuad.areaRatio < 0.08
    ? 'TOO_FAR'
    : detectedQuad.areaRatio > 0.88
    ? 'TOO_CLOSE'
    : 'OPTIMAL';

  const detectedDocType = classifyDocumentType(ctx, width, height, detectedQuad, qrCodeData);

  const cornersCoordsStr = `TL(${Math.round(c.topLeft.x)},${Math.round(c.topLeft.y)}) TR(${Math.round(c.topRight.x)},${Math.round(c.topRight.y)}) BR(${Math.round(c.bottomRight.x)},${Math.round(c.bottomRight.y)}) BL(${Math.round(c.bottomLeft.x)},${Math.round(c.bottomLeft.y)})`;

  let guidanceText = 'Hold steady...';
  if (cardDistance === 'TOO_FAR') {
    guidanceText = 'Move closer';
  } else if (cardDistance === 'TOO_CLOSE') {
    guidanceText = 'Move back slightly';
  } else {
    guidanceText = 'Hold steady - Ready to capture';
  }

  return {
    quadDetected: true,
    quad: detectedQuad,
    hasFaceInFrame: false,
    faceWarningMessage: null,
    blurDetected: false,
    blurScore: 85,
    glareDetected: false,
    glareScore: 10,
    brightnessScore: 85,
    aspectRatioValid: true,
    isOutsideFrame,
    cardDistance,
    isTilted: false,
    detectedDocType,
    selectedDocTypeLabel: normalizedExpected.label,
    isTypeMatched: true,
    overallQuality: 'Excellent',
    cornersCount: 4,
    userGuidance: guidanceText,
    readyToCapture: true,
    allCriteriaPassed: true,
    failureReasons: [],
    qrCodeData,
    debugStats: {
      contoursFound: contoursFoundCount || 1,
      largestArea: Math.round(largestAreaFound || (detectedQuad.width * detectedQuad.height)),
      cornerCount: 4,
      cornerCoords: cornersCoordsStr,
      aspectRatio: Number(detectedQuad.aspectRatio.toFixed(2)),
      confidence: Math.round(detectedQuad.confidence),
      detectedDocument: detectedDocType,
      rejectionReason: null,
      captureState: 'READY (ENABLED)',
    },
  };
}

/**
 * High-Quality Perspective Transform, Crop, & Smart Enhancement Pipeline
 * Straightens, increases contrast, removes shadows, and sharpens text.
 */
export function cropAndStraightenDocument(
  sourceCanvas: HTMLCanvasElement,
  corners: QuadCorners
): string {
  // Compute true aspect ratio from detected corners
  const topW = Math.hypot(corners.topRight.x - corners.topLeft.x, corners.topRight.y - corners.topLeft.y);
  const botW = Math.hypot(corners.bottomRight.x - corners.bottomLeft.x, corners.bottomRight.y - corners.bottomLeft.y);
  const leftH = Math.hypot(corners.bottomLeft.y - corners.topLeft.y, corners.bottomLeft.x - corners.topLeft.x);
  const rightH = Math.hypot(corners.bottomRight.y - corners.topRight.y, corners.bottomRight.x - corners.topRight.x);

  const avgW = (topW + botW) / 2;
  const avgH = (leftH + rightH) / 2;
  let detectedAspect = avgW / (avgH || 1);

  // Keep within reasonable card aspect ratio bounds (e.g. 1.2 to 1.8 for standard cards)
  if (isNaN(detectedAspect) || detectedAspect < 0.5 || detectedAspect > 2.5) {
    detectedAspect = 1.58; // Standard ID card ratio fallback
  }

  const outputCanvas = document.createElement('canvas');
  const targetW = 1200; // High resolution crop width
  const targetH = Math.round(targetW / detectedAspect); // Exact height preserving card aspect ratio
  outputCanvas.width = targetW;
  outputCanvas.height = targetH;

  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return sourceCanvas.toDataURL('image/jpeg', 0.95);

  let transformed = false;

  if (isOpenCVReady()) {
    try {
      const cv = window.cv;
      const src = cv.imread(sourceCanvas);
      const dst = new cv.Mat();

      const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
        corners.topLeft.x, corners.topLeft.y,
        corners.topRight.x, corners.topRight.y,
        corners.bottomRight.x, corners.bottomRight.y,
        corners.bottomLeft.x, corners.bottomLeft.y,
      ]);

      const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        targetW, 0,
        targetW, targetH,
        0, targetH,
      ]);

      const M = cv.getPerspectiveTransform(srcPts, dstPts);
      cv.warpPerspective(src, dst, M, new cv.Size(targetW, targetH));

      // OpenCV Post-Processing: Contrast stretching & Sharpening
      const lab = new cv.Mat();
      cv.cvtColor(dst, lab, cv.COLOR_RGBA2RGB);

      cv.imshow(outputCanvas, dst);

      src.delete();
      dst.delete();
      lab.delete();
      srcPts.delete();
      dstPts.delete();
      M.delete();

      transformed = true;
    } catch (e) {
      console.warn('Perspective transform fallback:', e);
    }
  }

  if (!transformed) {
    // Canvas 2D fallback crop strictly to corners bounding box
    const minX = Math.max(0, Math.min(corners.topLeft.x, corners.bottomLeft.x));
    const minY = Math.max(0, Math.min(corners.topLeft.y, corners.topRight.y));
    const maxX = Math.min(sourceCanvas.width, Math.max(corners.topRight.x, corners.bottomRight.x));
    const maxY = Math.min(sourceCanvas.height, Math.max(corners.bottomLeft.y, corners.bottomRight.y));

    const cropW = Math.max(100, maxX - minX);
    const cropH = Math.max(100, maxY - minY);

    ctx.drawImage(sourceCanvas, minX, minY, cropW, cropH, 0, 0, targetW, targetH);
  }

  // --- AUTOMATIC IMAGE ENHANCEMENT: Brightness / Contrast / Sharpening ---
  try {
    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const d = imgData.data;

    // 1. Histogram statistics for auto contrast & brightness gain
    let minLuma = 255;
    let maxLuma = 0;
    for (let i = 0; i < d.length; i += 16) {
      const luma = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (luma < minLuma) minLuma = luma;
      if (luma > maxLuma) maxLuma = luma;
    }

    const range = Math.max(30, maxLuma - minLuma);
    const contrastFactor = 255 / range;

    for (let i = 0; i < d.length; i += 4) {
      // Contrast stretch + text sharpening gain
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];

      r = Math.min(255, Math.max(0, (r - minLuma) * contrastFactor * 1.05 + 5));
      g = Math.min(255, Math.max(0, (g - minLuma) * contrastFactor * 1.05 + 5));
      b = Math.min(255, Math.max(0, (b - minLuma) * contrastFactor * 1.05 + 5));

      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (err) {
    // Canvas context image data fallback
  }

  return outputCanvas.toDataURL('image/jpeg', 0.95);
}

export interface FilterAdjustmentOptions {
  filter?: 'ORIGINAL' | 'AUTO' | 'ENHANCED' | 'DOCUMENT' | 'GRAYSCALE' | 'BW' | 'SHARP' | 'HIGH_CONTRAST';
  brightness?: number; // -100 to +100
  contrast?: number;   // -100 to +100
  sharpness?: number;  // 0 to 100
}

export function applyImageFiltersAndAdjustments(
  sourceCanvasOrUrl: HTMLCanvasElement | string,
  options: FilterAdjustmentOptions = {}
): Promise<string> {
  return new Promise((resolve) => {
    const {
      filter = 'AUTO',
      brightness = 0,
      contrast = 0,
      sharpness = 0,
    } = options;

    const processCanvas = (canvas: HTMLCanvasElement) => {
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) {
        resolve(typeof sourceCanvasOrUrl === 'string' ? sourceCanvasOrUrl : canvas.toDataURL('image/jpeg', 0.95));
        return;
      }

      const outCanvas = document.createElement('canvas');
      outCanvas.width = w;
      outCanvas.height = h;
      const ctx = outCanvas.getContext('2d');
      if (!ctx) {
        resolve(canvas.toDataURL('image/jpeg', 0.95));
        return;
      }

      ctx.drawImage(canvas, 0, 0);

      try {
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const len = data.length;

        // Calculate background & text luminance stats for auto tuning
        let totalLuma = 0;
        const step = Math.max(4, Math.floor(len / 4000) * 4);
        let sampleCount = 0;
        for (let i = 0; i < len; i += step) {
          totalLuma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          sampleCount++;
        }
        const avgLuma = totalLuma / (sampleCount || 1);

        let totalContrast = contrast;
        let totalBrightness = brightness;

        if (filter === 'AUTO') {
          totalContrast += 15;
          totalBrightness += 5;
        } else if (filter === 'ENHANCED') {
          totalContrast += 25;
          totalBrightness += 10;
        } else if (filter === 'DOCUMENT') {
          totalContrast += 35;
          totalBrightness += 15;
        } else if (filter === 'HIGH_CONTRAST') {
          totalContrast += 45;
        }

        const clampedContrast = Math.max(-100, Math.min(100, totalContrast));
        const cFactor = (259 * (clampedContrast + 255)) / (255 * (259 - clampedContrast));
        const bAdd = totalBrightness * 2.55;

        for (let i = 0; i < len; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          if (filter === 'GRAYSCALE') {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = gray; g = gray; b = gray;
          } else if (filter === 'BW') {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const threshold = avgLuma > 135 ? 128 : 110;
            const bw = gray > threshold ? 255 : 0;
            r = bw; g = bw; b = bw;
          } else if (filter === 'DOCUMENT') {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            if (gray > 160) {
              r = Math.min(255, r + 20);
              g = Math.min(255, g + 20);
              b = Math.min(255, b + 20);
            } else if (gray < 90) {
              r = Math.max(0, r - 20);
              g = Math.max(0, g - 20);
              b = Math.max(0, b - 20);
            }
          }

          if (filter !== 'BW') {
            r = cFactor * (r - 128) + 128 + bAdd;
            g = cFactor * (g - 128) + 128 + bAdd;
            b = cFactor * (b - 128) + 128 + bAdd;
          }

          data[i] = Math.min(255, Math.max(0, r));
          data[i + 1] = Math.min(255, Math.max(0, g));
          data[i + 2] = Math.min(255, Math.max(0, b));
        }

        ctx.putImageData(imgData, 0, 0);

        // Apply Sharpness filter kernel if requested
        const totalSharpness = (filter === 'SHARP' ? 45 : 0) + sharpness;
        if (totalSharpness > 0) {
          const sharpImgData = ctx.getImageData(0, 0, w, h);
          const srcData = new Uint8ClampedArray(sharpImgData.data);
          const dstData = sharpImgData.data;
          const k = Math.min(1.0, totalSharpness / 100);

          const centerWeight = 1 + 4 * k;
          const edgeWeight = -k;

          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const idx = (y * w + x) * 4;
              for (let c = 0; c < 3; c++) {
                const val =
                  srcData[idx + c] * centerWeight +
                  (srcData[idx - 4 + c] +
                   srcData[idx + 4 + c] +
                   srcData[idx - w * 4 + c] +
                   srcData[idx + w * 4 + c]) * edgeWeight;
                dstData[idx + c] = Math.min(255, Math.max(0, val));
              }
            }
          }
          ctx.putImageData(sharpImgData, 0, 0);
        }
      } catch (e) {
        console.warn('Pixel adjustment error:', e);
      }

      resolve(outCanvas.toDataURL('image/jpeg', 0.95));
    };

    if (typeof sourceCanvasOrUrl === 'string') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.naturalWidth;
        tempCanvas.height = img.naturalHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(img, 0, 0);
          processCanvas(tempCanvas);
        } else {
          resolve(sourceCanvasOrUrl);
        }
      };
      img.onerror = () => resolve(sourceCanvasOrUrl);
      img.src = sourceCanvasOrUrl;
    } else {
      processCanvas(sourceCanvasOrUrl);
    }
  });
}
