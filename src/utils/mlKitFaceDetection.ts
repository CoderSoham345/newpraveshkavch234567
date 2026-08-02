/**
 * ML Kit Face Detection for PraveshKavach™
 * Detects faces, evaluates quality, and extracts face metrics
 */

export interface FaceMetrics {
  brightness: number; // 0-100 (50-150 is good)
  sharpness: number; // 0-100
  landmarks: number; // count of detected facial landmarks
  headTilt: number; // degrees
  yaw: number; // left-right rotation
  pitch: number; // up-down rotation
}

export interface FaceResult {
  faceDetected: boolean;
  faceCount: number;
  quality: FaceMetrics;
  bounds: { x: number; y: number; width: number; height: number };
  recommendations: string[];
  isQualityOk: boolean; // brightness >= 50 && sharpness >= 70
}

/**
 * Calculate image brightness
 */
export function calculateBrightness(imageData: ImageData): number {
  const data = imageData.data;
  let sum = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    sum += gray;
  }
  
  return Math.round((sum / (data.length / 4)) * 100) / 255;
}

/**
 * Calculate image sharpness using Laplacian edge detection
 */
export function calculateSharpness(imageData: ImageData): number {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  let edgeSum = 0;
  let count = 0;
  
  // Simplified Laplacian edge detection
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Get surrounding pixels
      const center = data[idx];
      const top = data[((y - 1) * width + x) * 4];
      const bottom = data[((y + 1) * width + x) * 4];
      const left = data[(y * width + (x - 1)) * 4];
      const right = data[(y * width + (x + 1)) * 4];
      
      // Laplacian: 4*center - (top + bottom + left + right)
      const laplacian = Math.abs(4 * center - (top + bottom + left + right));
      edgeSum += laplacian;
      count++;
    }
  }
  
  const sharpness = (edgeSum / count) * 100 / 255;
  return Math.min(100, sharpness);
}

/**
 * Detect faces in image using canvas-based approach
 * In production, use: ml.vision.FaceDetection.create()
 */
export function detectFacesInImage(imageData: ImageData): FaceResult {
  try {
    // Placeholder: In production, use ML Kit Face Detection API
    // For now, return detection-ready structure
    
    const brightness = calculateBrightness(imageData);
    const sharpness = calculateSharpness(imageData);
    const isQualityOk = brightness >= 50 && sharpness >= 70;
    
    const recommendations: string[] = [];
    if (brightness < 50) recommendations.push('Image too dark - increase lighting');
    if (brightness > 150) recommendations.push('Image too bright - reduce glare');
    if (sharpness < 70) recommendations.push('Image blurry - keep camera steady');
    
    return {
      faceDetected: false, // Will be true when ML Kit is integrated
      faceCount: 0,
      quality: {
        brightness,
        sharpness,
        landmarks: 0,
        headTilt: 0,
        yaw: 0,
        pitch: 0,
      },
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      recommendations,
      isQualityOk,
    };
  } catch (error) {
    console.error('[Face Detection] Error:', error);
    return {
      faceDetected: false,
      faceCount: 0,
      quality: {
        brightness: 0,
        sharpness: 0,
        landmarks: 0,
        headTilt: 0,
        yaw: 0,
        pitch: 0,
      },
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      recommendations: ['Face detection unavailable'],
      isQualityOk: false,
    };
  }
}

export class MLKitFaceDetector {
  /**
   * Detect faces and return quality metrics
   */
  static async detectFace(imageData: ImageData): Promise<FaceResult> {
    return detectFacesInImage(imageData);
  }

  /**
   * Check if face quality is acceptable for identification
   */
  static isFaceQualityOk(result: FaceResult): boolean {
    return result.isQualityOk && result.faceDetected && result.faceCount === 1;
  }

  /**
   * Validate face position (frontal, not tilted)
   */
  static isValidFacePosition(result: FaceResult): boolean {
    const maxTilt = 15; // degrees
    return (
      Math.abs(result.quality.headTilt) < maxTilt &&
      Math.abs(result.quality.yaw) < maxTilt &&
      Math.abs(result.quality.pitch) < maxTilt
    );
  }
}
