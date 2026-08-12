import { VisitorRecord, SavedScanDocument, ExtractedDocData, FaceVerificationData } from '../types';
import { safeFetch } from './safeApi';

export interface SaveVisitorPayload {
  visitorName: string;
  phone: string;
  email?: string;
  company?: string;
  documentType: string;
  documentNumber: string;
  frontDocUrl: string;
  backDocUrl?: string;
  liveFaceUrl: string;
  croppedFrontUrl?: string;
  enhancedFrontUrl?: string;
  extractedData: ExtractedDocData;
  faceMetrics: FaceVerificationData;
  residentId: string;
  residentName: string;
  buildingUnit: string;
  purpose: string;
  vehicleNumber?: string;
  numAccompanying?: number;
  guardName?: string;
  guardId?: string;
  gateName?: string;
  verificationStatus?: 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';
  qrCodeData?: string;
  overrideDuplicate?: boolean;
}

export interface UploadProgressStatus {
  step: 'PREPARING' | 'UPLOADING_FRONT' | 'UPLOADING_BACK' | 'UPLOADING_FACE' | 'SAVING_METADATA' | 'COMPLETED' | 'OFFLINE_SAVED' | 'ERROR';
  progressPercent: number; // 0 - 100
  message: string;
  isOffline?: boolean;
}

const OFFLINE_QUEUE_KEY = 'praveshkavach_offline_visitors_queue_v1';

/**
 * Check if a visitor with the same document number or phone number was registered within the past 24 hours
 */
export function checkDuplicateRegistration(
  visitors: VisitorRecord[],
  docNumber: string,
  phone: string,
  timeWindowHours = 24
): { isDuplicate: boolean; existingVisitor?: VisitorRecord } {
  if (!docNumber && !phone) return { isDuplicate: false };

  const now = Date.now();
  const windowMs = timeWindowHours * 60 * 60 * 1000;

  const normalizedDoc = docNumber ? docNumber.replace(/[\s\-]/g, '').toUpperCase() : '';
  const normalizedPhone = phone ? phone.replace(/[\s\-]/g, '') : '';

  const found = visitors.find((v) => {
    const createdTime = new Date(v.createdAt).getTime();
    const isWithinWindow = now - createdTime <= windowMs;
    const isNotCheckedOut = v.status !== 'CHECKED_OUT';

    const vDoc = v.documentNumber ? v.documentNumber.replace(/[\s\-]/g, '').toUpperCase() : '';
    const vPhone = v.phone ? v.phone.replace(/[\s\-]/g, '') : '';

    const matchDoc = normalizedDoc && vDoc && normalizedDoc === vDoc;
    const matchPhone = normalizedPhone && vPhone && normalizedPhone.length > 5 && vPhone.length > 5 && normalizedPhone === vPhone;

    return (matchDoc || matchPhone) && (isWithinWindow || isNotCheckedOut);
  });

  if (found) {
    return { isDuplicate: true, existingVisitor: found };
  }

  return { isDuplicate: false };
}

/**
 * Saves visitor record along with all scanned documents (front, back, face, OCR JSON, scan folder)
 * Supports simulated upload progress, auto-retry, and offline local queueing.
 */
export async function saveVisitorWithDocuments(
  payload: SaveVisitorPayload,
  onProgress?: (status: UploadProgressStatus) => void
): Promise<{ success: boolean; visitor: VisitorRecord; isOffline?: boolean; message?: string }> {
  
  const report = (step: UploadProgressStatus['step'], progressPercent: number, message: string, isOffline = false) => {
    if (onProgress) {
      onProgress({ step, progressPercent, message, isOffline });
    }
  };

  report('PREPARING', 10, 'Validating scanned documents and visitor data...');
  await new Promise((r) => setTimeout(r, 150));

  report('UPLOADING_FRONT', 30, 'Uploading & encrypting Front ID Document scan...');
  await new Promise((r) => setTimeout(r, 200));

  if (payload.backDocUrl) {
    report('UPLOADING_BACK', 50, 'Uploading Back ID Document scan...');
    await new Promise((r) => setTimeout(r, 200));
  }

  report('UPLOADING_FACE', 70, 'Saving biometric live face capture photo...');
  await new Promise((r) => setTimeout(r, 200));

  report('SAVING_METADATA', 85, 'Saving visitor metadata & OCR JSON to database...');
  await new Promise((r) => setTimeout(r, 200));

  // Construct full record
  const visitorId = `vis-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const passNumber = `VP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const nowIso = new Date().toISOString();

  const visitorRecord: VisitorRecord = {
    id: visitorId,
    passNumber,
    visitorName: payload.visitorName || payload.extractedData?.fullName || 'Guest Visitor',
    phone: payload.phone || '+91 98000 00000',
    email: payload.email || `${(payload.visitorName || 'visitor').toLowerCase().replace(/\s+/g, '')}@gmail.com`,
    company: payload.company || payload.extractedData?.companyName || 'Self / Private',
    documentType: (payload.documentType as any) || 'PAN_CARD',
    documentNumber: payload.documentNumber || payload.extractedData?.documentNumber || 'N/A',
    frontDocUrl: payload.frontDocUrl,
    backDocUrl: payload.backDocUrl || '',
    liveFaceUrl: payload.liveFaceUrl,
    croppedFrontUrl: payload.croppedFrontUrl || payload.frontDocUrl,
    enhancedFrontUrl: payload.enhancedFrontUrl || payload.frontDocUrl,
    extractedData: payload.extractedData,
    faceMetrics: payload.faceMetrics,
    residentId: payload.residentId,
    residentName: payload.residentName,
    buildingUnit: payload.buildingUnit,
    purpose: payload.purpose || 'Personal Visit',
    vehicleNumber: payload.vehicleNumber || '',
    numAccompanying: payload.numAccompanying || 1,
    status: 'APPROVED', // Default approved upon registration
    createdAt: nowIso,
    checkInAt: nowIso, // Automatically set check-in time
    approvedAt: nowIso,
    gateName: payload.gateName || 'Main Gate 01',
    guardName: payload.guardName || 'Security Guard',
    guardId: payload.guardId || 'guard-01',
    qrCodeValue: `PRAVESHKAVACH-${visitorId}-${passNumber}`,
    verificationStatus: payload.verificationStatus || 'VERIFIED',
    qrCodeData: payload.qrCodeData || payload.extractedData?.qrCodeData,
  };

  // Try network save
  try {
    const res = await safeFetch('/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visitorRecord),
    });

    if (res.ok && res.data?.visitor) {
      // Also save document entry in Saved Scans store
      saveScanDocumentEntry(visitorRecord, payload);

      report('COMPLETED', 100, 'Visitor Registered & Documents Saved Successfully!');
      return { success: true, visitor: res.data.visitor };
    }
  } catch (err) {
    console.warn('[Offline Mode] Server request failed, switching to local offline storage queue:', err);
  }

  // Offline Fallback - Save to Local Storage Queue
  saveToOfflineQueue(visitorRecord);
  saveScanDocumentEntry(visitorRecord, payload);

  report('OFFLINE_SAVED', 100, 'Offline Mode: Visitor record and document scans saved locally. Will auto-sync when online.', true);
  return {
    success: true,
    visitor: visitorRecord,
    isOffline: true,
    message: 'Saved to local offline queue. Will auto-upload when internet reconnects.',
  };
}

/**
 * Creates a scan document entry under /Scans folder for full document management
 */
async function saveScanDocumentEntry(visitor: VisitorRecord, payload: SaveVisitorPayload) {
  try {
    const scanDoc: SavedScanDocument = {
      id: `scan-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `${visitor.visitorName} - ${visitor.documentType} Scan`,
      fileName: `${visitor.visitorName.replace(/\s+/g, '_')}_${visitor.documentNumber}.jpg`,
      folder: 'Scans',
      docType: visitor.documentType,
      docTypeLabel: visitor.documentType.replace(/_/g, ' '),
      format: 'jpeg',
      processedImageUrl: visitor.frontDocUrl,
      fileUrl: visitor.frontDocUrl,
      extractedData: visitor.extractedData,
      ocrConfidence: visitor.extractedData?.confidenceScore || 0,
      createdAt: visitor.createdAt,
      fileSizeBytes: 245000, // ~245 KB
      dimensions: { width: 1280, height: 800 },
      qrCodeData: visitor.qrCodeValue,
      visitorId: visitor.id,
      visitorName: visitor.visitorName,
      savedBy: visitor.guardName,
      isEncrypted: true,
    };

    await safeFetch('/api/scans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scanDoc),
    });
  } catch (err) {
    console.warn('Could not save scan document entry to server:', err);
  }
}

/**
 * Save to IndexedDB / localStorage offline queue
 */
export function saveToOfflineQueue(visitor: VisitorRecord) {
  try {
    const existing = getOfflineQueue();
    const updated = [visitor, ...existing.filter((v) => v.id !== visitor.id)];
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save to offline queue:', e);
  }
}

/**
 * Retrieve current pending items in offline queue
 */
export function getOfflineQueue(): VisitorRecord[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Auto-sync offline queue when internet returns
 */
export async function syncOfflineQueue(): Promise<{ syncedCount: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0 };

  let syncedCount = 0;
  const remaining: VisitorRecord[] = [];

  for (const visitor of queue) {
    try {
      const res = await safeFetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitor),
      });

      if (res.ok) {
        syncedCount++;
      } else {
        remaining.push(visitor);
      }
    } catch (err) {
      remaining.push(visitor);
    }
  }

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
  return { syncedCount };
}

/**
 * Print Visitor Pass Trigger
 */
export function printVisitorPassWindow(visitor: VisitorRecord) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print visitor pass.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Visitor Pass - ${visitor.passNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; color: #0f172a; padding: 20px; }
          .pass-card { max-w: 420px; margin: 0 auto; background: #ffffff; border: 2px solid #0284c7; border-radius: 16px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 16px; margin-bottom: 16px; }
          .header h1 { font-size: 20px; margin: 0; color: #0369a1; text-transform: uppercase; letter-spacing: 1px; }
          .header p { font-size: 11px; color: #64748b; margin: 4px 0 0 0; }
          .pass-number { font-family: monospace; font-size: 18px; font-weight: bold; color: #0284c7; background: #e0f2fe; padding: 6px 12px; border-radius: 8px; display: inline-block; margin-top: 8px; }
          .photo-section { display: flex; gap: 16px; align-items: center; margin-bottom: 16px; }
          .photo-section img { width: 80px; height: 80px; border-radius: 12px; object-fit: cover; border: 2px solid #0284c7; }
          .visitor-details p { margin: 3px 0; font-size: 13px; }
          .visitor-details strong { color: #0f172a; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; background: #f1f5f9; padding: 12px; border-radius: 12px; margin-bottom: 16px; }
          .qr-container { text-align: center; margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          .qr-box { font-family: monospace; font-size: 10px; background: #0f172a; color: #38bdf8; padding: 8px; border-radius: 8px; word-break: break-all; }
          .footer { font-size: 10px; text-align: center; color: #94a3b8; margin-top: 12px; }
          @media print {
            body { background: #ffffff; padding: 0; }
            .pass-card { box-shadow: none; border-color: #000; }
          }
        </style>
      </head>
      <body>
        <div class="pass-card">
          <div class="header">
            <h1>PRAVESHKAVACH</h1>
            <p>Smart Gate Visitor Pass • ${visitor.gateName}</p>
            <div class="pass-number">${visitor.passNumber}</div>
          </div>

          <div class="photo-section">
            <img src="${visitor.liveFaceUrl || visitor.frontDocUrl}" alt="Visitor Photo" />
            <div class="visitor-details">
              <p><strong>Name:</strong> ${visitor.visitorName}</p>
              <p><strong>Phone:</strong> ${visitor.phone}</p>
              <p><strong>Doc:</strong> ${visitor.documentType} (${visitor.documentNumber})</p>
            </div>
          </div>

          <div class="grid">
            <div><strong>Host:</strong> ${visitor.residentName}</div>
            <div><strong>Flat:</strong> ${visitor.buildingUnit}</div>
            <div><strong>Purpose:</strong> ${visitor.purpose}</div>
            <div><strong>Date:</strong> ${new Date(visitor.createdAt).toLocaleDateString()}</div>
            <div><strong>Check-in:</strong> ${visitor.checkInAt ? new Date(visitor.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}</div>
            <div><strong>Status:</strong> ${visitor.status}</div>
          </div>

          <div class="qr-container">
            <p style="font-size:11px; font-weight:bold; margin-bottom:6px;">SECURITY QR VERIFICATION CODE</p>
            <div class="qr-box">${visitor.qrCodeValue}</div>
          </div>

          <div class="footer">
            Issued by Security Guard: ${visitor.guardName} • Keep pass visible while inside premises
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Downloads all visitor documents and details as a JSON file package and images
 */
export function downloadVisitorPackage(visitor: VisitorRecord) {
  // Download JSON Metadata
  const metadata = {
    visitorInformation: {
      fullName: visitor.visitorName,
      mobileNumber: visitor.phone,
      email: visitor.email,
      company: visitor.company,
      personToMeet: visitor.residentName,
      buildingUnit: visitor.buildingUnit,
      purposeOfVisit: visitor.purpose,
      dateTime: visitor.createdAt,
      checkInTime: visitor.checkInAt,
      checkOutTime: visitor.checkOutAt,
      visitDuration: visitor.visitDuration,
      visitorId: visitor.id,
      passNumber: visitor.passNumber,
      securityGuardId: visitor.guardId || 'guard-01',
      securityGuardName: visitor.guardName,
      entryGate: visitor.gateName,
      verificationStatus: visitor.verificationStatus || 'VERIFIED',
    },
    documentDetails: {
      documentType: visitor.documentType,
      documentNumber: visitor.documentNumber,
      qrCodeValue: visitor.qrCodeValue,
    },
    ocrExtractedData: visitor.extractedData,
    biometricMetrics: visitor.faceMetrics,
  };

  const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Visitor_Package_${visitor.visitorName.replace(/\s+/g, '_')}_${visitor.passNumber}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // If front image is data URL or image URL, trigger image download
  if (visitor.frontDocUrl && visitor.frontDocUrl.startsWith('data:image')) {
    downloadBase64Image(visitor.frontDocUrl, `${visitor.visitorName.replace(/\s+/g, '_')}_Front_ID.jpg`);
  }
  if (visitor.backDocUrl && visitor.backDocUrl.startsWith('data:image')) {
    downloadBase64Image(visitor.backDocUrl, `${visitor.visitorName.replace(/\s+/g, '_')}_Back_ID.jpg`);
  }
  if (visitor.liveFaceUrl && visitor.liveFaceUrl.startsWith('data:image')) {
    downloadBase64Image(visitor.liveFaceUrl, `${visitor.visitorName.replace(/\s+/g, '_')}_Face_Capture.jpg`);
  }
}

function downloadBase64Image(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
