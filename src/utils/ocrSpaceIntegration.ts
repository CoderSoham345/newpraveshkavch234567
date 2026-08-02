/**
 * OCR.Space API Integration
 * Handles document image preprocessing and OCR processing
 * Backend-only, API key never exposed to frontend
 */

import sharp from 'sharp';

export interface OCRSpaceResponse {
  isErroredOnProcessing: boolean;
  errorMessage?: string;
  parsedText: string;
  ocrEngineTime: number;
}

export interface PreprocessedImage {
  base64: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Image Preprocessing Pipeline
 * Optimizes image before sending to OCR.Space
 */
export async function preprocessImage(imageBase64: string): Promise<PreprocessedImage> {
  try {
    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Apply preprocessing pipeline
    const processedBuffer = await sharp(imageBuffer)
      .rotate() // Auto-rotate based on EXIF
      .grayscale() // Convert to grayscale for better OCR
      .normalise() // Normalize levels
      .sharpen() // Sharpen text
      .modulate({
        brightness: 1.1, // Increase brightness
        saturation: 1.2, // Increase saturation
      })
      .toBuffer({ resolveWithObject: true });

    // Get image metadata
    const metadata = await sharp(processedBuffer.data).metadata();

    return {
      base64: processedBuffer.data.toString('base64'),
      width: metadata.width || 1280,
      height: metadata.height || 1024,
      format: metadata.format || 'jpeg',
    };
  } catch (error) {
    console.error('[v0] Image preprocessing error:', error);
    // Return original image if preprocessing fails
    return {
      base64: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
      width: 1280,
      height: 1024,
      format: 'jpeg',
    };
  }
}

/**
 * Call OCR.Space API
 * Sends preprocessed image for OCR processing
 */
export async function callOCRSpace(
  imageBase64: string,
  apiKey: string,
  language: string = 'eng'
): Promise<OCRSpaceResponse> {
  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const formData = new FormData();
    formData.append('apikey', apiKey);
    formData.append('base64Image', `data:image/jpeg;base64,${cleanBase64}`);
    formData.append('language', language);
    formData.append('ocrEngine', '2'); // Engine 2 is best for documents
    formData.append('isOverlayRequired', 'true');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OCR.Space API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as any;

    console.log('[v0] ===== OCR.Space API COMPLETE RAW RESPONSE =====');
    console.log(JSON.stringify(data, null, 2));

    if (data.isErroredOnProcessing || data.IsErroredOnProcessing) {
      throw new Error(`OCR.Space error: ${data.errorMessage || data.ErrorMessage || 'Processing error'}`);
    }

    const parsedResults = data.ParsedResults || data.parsedResults || [];
    const firstResult = parsedResults[0] || {};
    const parsedText = firstResult.ParsedText || data.parsedText || '';

    return {
      isErroredOnProcessing: false,
      parsedText,
      ocrEngineTime: Number(data.ProcessingTimeInMilliseconds || data.ocrEngineTime || 0),
    };
  } catch (error) {
    console.error('[v0] OCR.Space API error:', error);
    throw error;
  }
}

/**
 * Process image through complete OCR pipeline
 */
export async function processImageThroughOCR(
  imageBase64: string,
  apiKey: string
): Promise<{ rawText: string; preprocessingTime: number; ocrTime: number }> {
  const startTime = Date.now();

  // Step 1: Preprocess image
  console.log('[v0] Starting image preprocessing...');
  const preprocessStart = Date.now();
  const preprocessed = await preprocessImage(imageBase64);
  const preprocessingTime = Date.now() - preprocessStart;
  console.log('[v0] Image preprocessing completed:', preprocessingTime, 'ms');

  // Step 2: Call OCR.Space
  console.log('[v0] Sending to OCR.Space API...');
  const ocrStart = Date.now();
  const ocrResult = await callOCRSpace(preprocessed.base64, apiKey);
  const ocrTime = Date.now() - ocrStart;
  console.log('[v0] OCR.Space processing completed:', ocrTime, 'ms');

  return {
    rawText: ocrResult.parsedText,
    preprocessingTime,
    ocrTime,
  };
}
