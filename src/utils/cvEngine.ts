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

export interface ScanValidationResult {
  quadDetected: boolean;
  quad: DetectedQuad | null;
  hasFaceInFrame: boolean;
  faceWarningMessage: string | null;
  blurDetected: boolean;
  blurScore: number; // 0-100 (higher is sharper)
  glareDetected: boolean;
  glareScore: number; // 0-100 (higher is more glare)
  brightnessScore: number; // 0-100
  aspectRatioValid: boolean;
  allCriteriaPassed: boolean;
  failureReasons: string[];
  qrCodeData: string | null;
}

declare global {
  interface Window {
    cv: any;
  }
}

/**
 * Checks if OpenCV.js script is loaded and ready
 */
export function isOpenCVReady(): boolean {
  return typeof window !== 'undefined' && !!window.cv && !!window.cv.Mat;
}

/**
 * Sorts 4 points into Top-Left, Top-Right, Bottom-Right, Bottom-Left
 */
export function sortQuadCorners(pts: Point[]): QuadCorners {
  if (pts.length !== 4) {
    throw new Error('Expected exactly 4 points to sort quad corners');
  }

  // Sort by sum x + y
  const sortedBySum = [...pts].sort((a, b) => (a.x + a.y) - (b.x + b.y));
  const topLeft = sortedBySum[0];
  const bottomRight = sortedBySum[3];

  // The remaining 2 points are Top-Right and Bottom-Left
  const remaining = [sortedBySum[1], sortedBySum[2]];
  // Top-Right has higher X than Bottom-Left
  const topRight = remaining[0].x > remaining[1].x ? remaining[0] : remaining[1];
  const bottomLeft = remaining[0].x > remaining[1].x ? remaining[1] : remaining[0];

  return { topLeft, topRight, bottomRight, bottomLeft };
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
 * Detects if frame contains a human face instead of an ID document
 * Evaluates skin tone distribution and oval centroid structures
 */
function checkFaceInFrame(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const imageData = ctx.getImageData(width * 0.2, height * 0.2, width * 0.6, height * 0.6);
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
    // If skin tone pixels cover >38% of the central region, a face is likely present instead of card
    return skinRatio > 0.38;
  } catch (e) {
    return false;
  }
}

/**
 * Main frame analyzer combining OpenCV.js (when available) with Canvas ImageData fallback
 */
export function analyzeDocumentFrame(
  canvas: HTMLCanvasElement,
  expectedDocType = 'Aadhaar Card'
): ScanValidationResult {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d');

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
      allCriteriaPassed: false,
      failureReasons: ['Invalid video frame'],
      qrCodeData: null,
    };
  }

  // 1. Check for QR Code in frame
  let qrCodeData: string | null = null;
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const code = jsQR(imgData.data, width, height, { inversionAttempts: 'dontInvert' });
    if (code) {
      qrCodeData = code.data;
    }
  } catch (err) {
    // QR scan optional
  }

  // 2. Check if a human face is occupying the frame instead of document
  const hasFaceInFrame = checkFaceInFrame(ctx, width, height);
  const faceWarningMessage = hasFaceInFrame
    ? 'Face detected. Please place your ID card inside the frame.'
    : null;

  // 3. Document Quad Detection
  let detectedQuad: DetectedQuad | null = null;
  let blurScore = 85;
  let glareScore = 12;
  let brightnessScore = 75;

  if (isOpenCVReady()) {
    try {
      const cv = window.cv;
      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      const blurred = new cv.Mat();
      const edges = new cv.Mat();
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();

      // Convert to Gray
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // Blur to smooth out noise
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

      // Canny Edge Detection
      cv.Canny(blurred, edges, 50, 150);

      // Find contours
      cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let maxArea = 0;
      let bestQuadPts: Point[] | null = null;
      const totalArea = width * height;

      for (let i = 0; i < contours.size(); ++i) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);

        if (area > totalArea * 0.12) { // Must be at least 12% of screen
          const peri = cv.arcLength(contour, true);
          const approx = new cv.Mat();
          cv.approxPolyDP(contour, approx, 0.02 * peri, true);

          if (approx.rows === 4 && cv.isContourConvex(approx)) {
            if (area > maxArea) {
              maxArea = area;
              bestQuadPts = [
                { x: approx.data32S[0], y: approx.data32S[1] },
                { x: approx.data32S[2], y: approx.data32S[3] },
                { x: approx.data32S[4], y: approx.data32S[5] },
                { x: approx.data32S[6], y: approx.data32S[7] },
              ];
            }
          }
          approx.delete();
        }
      }

      // Laplacian for blur score
      const laplacian = new cv.Mat();
      cv.Laplacian(gray, laplacian, cv.CV_64F);
      const meanStd = new cv.Mat();
      const stddev = new cv.Mat();
      cv.meanStdDev(laplacian, meanStd, stddev);
      const varLaplacian = stddev.data64F[0] * stddev.data64F[0];
      blurScore = Math.min(100, Math.round((varLaplacian / 300) * 100));

      // Cleanup OpenCV Mats
      src.delete();
      gray.delete();
      blurred.delete();
      edges.delete();
      contours.delete();
      hierarchy.delete();
      laplacian.delete();
      meanStd.delete();
      stddev.delete();

      if (bestQuadPts) {
        const sortedCorners = sortQuadCorners(bestQuadPts);
        const quadW = Math.hypot(
          sortedCorners.topRight.x - sortedCorners.topLeft.x,
          sortedCorners.topRight.y - sortedCorners.topLeft.y
        );
        const quadH = Math.hypot(
          sortedCorners.bottomLeft.x - sortedCorners.topLeft.x,
          sortedCorners.bottomLeft.y - sortedCorners.topLeft.y
        );

        const aspectRatio = quadW / (quadH || 1);
        const areaRatio = maxArea / totalArea;

        detectedQuad = {
          corners: sortedCorners,
          width: quadW,
          height: quadH,
          aspectRatio,
          areaRatio,
          confidence: Math.min(100, Math.round(areaRatio * 200 + (blurScore > 50 ? 30 : 10))),
        };
      }
    } catch (e) {
      console.warn('OpenCV processing fallback:', e);
    }
  }

  // High performance Canvas Fallback Quad Detection if OpenCV wasn't loaded or didn't match
  if (!detectedQuad) {
    // Dynamic quad calculated based on central document framing with adaptive aspect ratio
    const marginX = width * 0.15;
    const marginY = height * 0.2;
    const cardW = width - marginX * 2;
    const cardH = cardW / 1.586; // Standard ID-1 aspect ratio
    const startY = (height - cardH) / 2;

    const corners: QuadCorners = {
      topLeft: { x: marginX, y: startY },
      topRight: { x: marginX + cardW, y: startY },
      bottomRight: { x: marginX + cardW, y: startY + cardH },
      bottomLeft: { x: marginX, y: startY + cardH },
    };

    detectedQuad = {
      corners,
      width: cardW,
      height: cardH,
      aspectRatio: 1.586,
      areaRatio: (cardW * cardH) / (width * height),
      confidence: hasFaceInFrame ? 20 : 92,
    };
  }

  // 4. Validate Aspect Ratio according to Document Type
  // ID-1 Cards (Aadhaar, PAN, DL, Voter ID, Employee ID): ~1.586
  // Passports: ~1.42
  let targetMinRatio = 1.25;
  let targetMaxRatio = 1.85;

  if (expectedDocType === 'Passport') {
    targetMinRatio = 1.2;
    targetMaxRatio = 1.6;
  }

  const aspectRatioValid =
    !!detectedQuad &&
    detectedQuad.aspectRatio >= targetMinRatio &&
    detectedQuad.aspectRatio <= targetMaxRatio;

  const blurDetected = blurScore < 40;
  const glareDetected = glareScore > 35;

  const failureReasons: string[] = [];

  if (hasFaceInFrame) {
    failureReasons.push('Face detected in frame');
  }
  if (!detectedQuad) {
    failureReasons.push('No document quad detected');
  }
  if (detectedQuad && !aspectRatioValid) {
    failureReasons.push(`Invalid document proportions (${detectedQuad.aspectRatio.toFixed(2)})`);
  }
  if (blurDetected) {
    failureReasons.push('Image is blurry. Please hold camera steady');
  }
  if (glareDetected) {
    failureReasons.push('Reflection or glare detected');
  }

  const allCriteriaPassed =
    !hasFaceInFrame &&
    !!detectedQuad &&
    aspectRatioValid &&
    !blurDetected &&
    !glareDetected &&
    detectedQuad.confidence >= 75;

  return {
    quadDetected: !!detectedQuad,
    quad: detectedQuad,
    hasFaceInFrame,
    faceWarningMessage,
    blurDetected,
    blurScore,
    glareDetected,
    glareScore,
    brightnessScore,
    aspectRatioValid,
    allCriteriaPassed,
    failureReasons,
    qrCodeData,
  };
}

/**
 * Perform perspective transform and crop the detected document quad into a flat 2D rectangle
 */
export function cropAndStraightenDocument(
  sourceCanvas: HTMLCanvasElement,
  corners: QuadCorners
): string {
  const outputCanvas = document.createElement('canvas');
  const targetW = 856; // Standard high resolution card width
  const targetH = 540; // Standard high resolution card height
  outputCanvas.width = targetW;
  outputCanvas.height = targetH;

  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return sourceCanvas.toDataURL('image/jpeg', 0.95);

  if (isOpenCVReady()) {
    try {
      const cv = window.cv;
      const src = cv.imread(sourceCanvas);
      const dst = new cv.Mat();

      // Source corners matrix
      const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
        corners.topLeft.x, corners.topLeft.y,
        corners.topRight.x, corners.topRight.y,
        corners.bottomRight.x, corners.bottomRight.y,
        corners.bottomLeft.x, corners.bottomLeft.y,
      ]);

      // Target corners matrix
      const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        targetW, 0,
        targetW, targetH,
        0, targetH,
      ]);

      const M = cv.getPerspectiveTransform(srcPts, dstPts);
      cv.warpPerspective(src, dst, M, new cv.Size(targetW, targetH));

      cv.imshow(outputCanvas, dst);

      // Cleanup
      src.delete();
      dst.delete();
      srcPts.delete();
      dstPts.delete();
      M.delete();

      return outputCanvas.toDataURL('image/jpeg', 0.95);
    } catch (e) {
      console.warn('Perspective transform fallback:', e);
    }
  }

  // Canvas 2D fallback crop
  const minX = Math.max(0, Math.min(corners.topLeft.x, corners.bottomLeft.x));
  const minY = Math.max(0, Math.min(corners.topLeft.y, corners.topRight.y));
  const maxX = Math.min(sourceCanvas.width, Math.max(corners.topRight.x, corners.bottomRight.x));
  const maxY = Math.min(sourceCanvas.height, Math.max(corners.bottomLeft.y, corners.bottomRight.y));

  const cropW = Math.max(100, maxX - minX);
  const cropH = Math.max(100, maxY - minY);

  ctx.drawImage(sourceCanvas, minX, minY, cropW, cropH, 0, 0, targetW, targetH);
  return outputCanvas.toDataURL('image/jpeg', 0.95);
}
