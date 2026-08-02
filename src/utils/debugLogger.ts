/**
 * Debug Logger - Provides consistent logging for troubleshooting
 * All logs prefixed with [v0] for easy filtering in browser console
 */

export const debugLog = {
  // OCR Debug Logs
  ocrStart: (docType: string) => {
    console.log(`[v0] ===== OCR STARTED =====`);
    console.log(`[v0] Document Type: ${docType}`);
    console.log(`[v0] Timestamp: ${new Date().toISOString()}`);
  },

  ocrImageReady: (sizeBytes: number) => {
    console.log(`[v0] Image ready for OCR: ${sizeBytes} bytes (${(sizeBytes / 1024).toFixed(2)} KB)`);
  },

  ocrSending: () => {
    console.log(`[v0] Sending to /api/ocr endpoint...`);
  },

  ocrResponseReceived: (statusCode: number) => {
    console.log(`[v0] OCR Response: HTTP ${statusCode}`);
  },

  ocrSuccess: (fields: string[], confidence: number) => {
    console.log(`[v0] ✅ OCR SUCCESS - Extracted fields: ${fields.join(', ')}`);
    console.log(`[v0] Overall Confidence: ${confidence}%`);
    console.log(`[v0] ===== OCR COMPLETE =====`);
  },

  ocrFailed: (error: string) => {
    console.error(`[v0] ❌ OCR FAILED: ${error}`);
    console.log(`[v0] ===== OCR FAILED =====`);
  },

  ocrFieldValue: (fieldName: string, value: string, confidence: number) => {
    console.log(`[v0] ${fieldName}: "${value}" (${confidence}% confidence)`);
  },

  // Telegram Debug Logs
  telegramTestStart: () => {
    console.log(`[v0] ===== TELEGRAM TEST STARTED =====`);
    console.log(`[v0] Timestamp: ${new Date().toISOString()}`);
  },

  telegramSending: (token: string, chatId: string) => {
    console.log(`[v0] Telegram Bot Token: ${token.substring(0, 8)}...${token.slice(-4)}`);
    console.log(`[v0] Telegram Chat ID: ${chatId}`);
    console.log(`[v0] Sending to /api/telegram/test...`);
  },

  telegramResponseReceived: (statusCode: number, contentType: string) => {
    console.log(`[v0] Response: HTTP ${statusCode}`);
    console.log(`[v0] Content-Type: ${contentType}`);
  },

  telegramSuccess: (botName: string) => {
    console.log(`[v0] ✅ TELEGRAM SUCCESS - Connected to @${botName}`);
    console.log(`[v0] ===== TELEGRAM TEST COMPLETE =====`);
  },

  telegramFailed: (error: string) => {
    console.error(`[v0] ❌ TELEGRAM FAILED: ${error}`);
    console.log(`[v0] ===== TELEGRAM TEST FAILED =====`);
  },

  // API Debug Logs
  apiCall: (method: string, endpoint: string) => {
    console.log(`[v0] API Call: ${method} ${endpoint}`);
  },

  apiError: (endpoint: string, error: string, responseText?: string) => {
    console.error(`[v0] API Error on ${endpoint}: ${error}`);
    if (responseText) {
      console.error(`[v0] Response (first 200 chars): ${responseText.substring(0, 200)}`);
    }
  },

  // Visitor Flow Debug Logs
  visitorFlowStep: (step: number, description: string) => {
    console.log(`[v0] 🔵 VISITOR FLOW STEP ${step}: ${description}`);
  },

  visitorDataExtracted: (name: string, docNumber: string) => {
    console.log(`[v0] Visitor Data Extracted:`);
    console.log(`[v0]   Name: ${name}`);
    console.log(`[v0]   Document: ${docNumber}`);
  },

  visitorRequestSent: (visitorId: string) => {
    console.log(`[v0] ✅ Visitor Request Sent - ID: ${visitorId}`);
  },

  // General Debug Logs
  info: (message: string) => {
    console.log(`[v0] ℹ️ ${message}`);
  },

  warning: (message: string) => {
    console.warn(`[v0] ⚠️ ${message}`);
  },

  error: (message: string) => {
    console.error(`[v0] ❌ ${message}`);
  },

  // Response Debug
  logResponse: (endpoint: string, data: any) => {
    console.log(`[v0] Response from ${endpoint}:`, JSON.stringify(data, null, 2));
  },

  // Network Debug
  networkError: (error: any) => {
    console.error(`[v0] Network Error:`, error);
    if (error.response?.status) {
      console.error(`[v0] Status: ${error.response.status}`);
    }
    if (error.message) {
      console.error(`[v0] Message: ${error.message}`);
    }
  },

  // Confidence Indicator
  confidenceIndicator: (confidence: number): string => {
    if (confidence >= 90) return '🟢 High';
    if (confidence >= 80) return '🟡 Medium';
    if (confidence >= 70) return '🟠 Low';
    return '🔴 Very Low';
  },

  // Field Status
  fieldStatus: (fieldName: string, detected: boolean, confidence?: number) => {
    const status = detected ? '✅' : '❌';
    const confStr = confidence !== undefined ? ` (${confidence}%)` : '';
    console.log(`[v0] ${status} ${fieldName}${confStr}`);
  },
};

/**
 * Helper to check if we should log (can be controlled by dev flag)
 */
export function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('V0_DEBUG_LOGS') === 'true' || import.meta.env.DEV;
}

/**
 * Enable debug logs in console
 */
export function enableDebugLogs() {
  localStorage.setItem('V0_DEBUG_LOGS', 'true');
  console.log('[v0] 🔧 DEBUG LOGS ENABLED - Run in console: localStorage.getItem("V0_DEBUG_LOGS")');
}

/**
 * Disable debug logs
 */
export function disableDebugLogs() {
  localStorage.removeItem('V0_DEBUG_LOGS');
  console.log('[v0] 🔧 DEBUG LOGS DISABLED');
}
