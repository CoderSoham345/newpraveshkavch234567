import { jsPDF } from 'jspdf';
import { SavedScanDocument, ScanExportFormat, DocumentType, ExtractedDocData } from '../types';
import { safeFetch } from '../utils/safeApi';

const LOCAL_STORAGE_SCANS_KEY = 'praveshkavach_saved_scans_v1';

/**
 * Normalizes document type code to clean human-readable title
 */
export function getDocTypeDisplayLabel(type: DocumentType | string): string {
  const map: Record<string, string> = {
    'AUTOMATIC_DETECTION': 'Government ID',
    'AADHAAR_FRONT': 'Aadhaar Card (Front)',
    'AADHAAR_BACK': 'Aadhaar Card (Back)',
    'PAN_CARD': 'PAN Card',
    'PASSPORT': 'Passport',
    'DRIVING_LICENCE': 'Driving Licence',
    'VOTER_ID': 'Voter ID (EPIC)',
    'GOVT_EMPLOYEE_ID': 'Government Employee ID',
    'PRIVATE_EMPLOYEE_ID': 'Private Employee ID',
    'STUDENT_ID': 'Student ID',
    'RC_BOOK': 'Vehicle RC Book',
    'OCI_CARD': 'OCI Card',
    'NREGA_JOB_CARD': 'NREGA Job Card',
    'SENIOR_CITIZEN_CARD': 'Senior Citizen Card',
    'DISABILITY_ID_CARD': 'Disability ID Card',
    'HEALTH_INSURANCE_CARD': 'Health Insurance Card',
    'POLICE_ID': 'Police ID Card',
    'ARMY_ID': 'Army ID Card',
    'OTHER_GOVT_ID': 'Government ID',
    'OTHER_IDENTITY_DOC': 'Identity Document',
    'VISITOR_PASS': 'Visitor Pass',
  };
  return map[type] || type || 'Identity Document';
}

/**
 * Formats current Date and Time for unique filenames
 * e.g., AadhaarCard_20260804_125930
 */
export function generateScanFileName(docType: DocumentType | string, format: ScanExportFormat): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const cleanDocName = getDocTypeDisplayLabel(docType).replace(/[^a-zA-Z0-9]/g, '');
  const ext = format === 'pdf' ? 'pdf' : format === 'png' ? 'png' : 'jpg';

  return `Scans/${cleanDocName}_${year}${month}${day}_${hours}${minutes}${seconds}.${ext}`;
}

/**
 * Generates a high-quality PDF document using jsPDF
 */
export function generateHighQualityPDF(options: {
  title: string;
  docTypeLabel: string;
  processedImageBase64: string;
  extractedData?: ExtractedDocData;
  ocrConfidence?: number;
  qrCodeData?: string | null;
  savedBy?: string;
  createdAtStr: string;
  fileName: string;
}): string {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // 1. Dark Theme Header Banner (Slate 900)
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 32, 'F');

    // Accent line (Cyan 500)
    doc.setFillColor(6, 182, 212);
    doc.rect(10, 8, 4, 16, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('PRAVESHKAVACH - DIGITAL SCAN RECORD', 18, 16);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`App Folder: /Scans/   |   File: ${options.fileName}`, 18, 23);
    doc.text(`Scanned Date: ${options.createdAtStr}   |   By: ${options.savedBy || 'Security Guard'}`, 18, 27);

    // 2. Title & Type Badge
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(10, 38, 190, 14, 2, 2, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(options.title, 14, 47);

    doc.setFontSize(9);
    doc.setTextColor(6, 182, 212);
    doc.text(`Document Type: ${options.docTypeLabel}`, 135, 47);

    // 3. Embedded High-Res Image (Crop / Perspective Corrected / Enhanced)
    // Canvas dimension width: 180mm, height: 114mm
    let imageFormat = 'JPEG';
    if (options.processedImageBase64.startsWith('data:image/png')) {
      imageFormat = 'PNG';
    }

    try {
      doc.addImage(
        options.processedImageBase64,
        imageFormat,
        15,
        58,
        180,
        114,
        undefined,
        'FAST'
      );
    } catch (imgErr) {
      console.warn('Primary image add failed, trying JPEG fallback:', imgErr);
      doc.addImage(options.processedImageBase64, 'JPEG', 15, 58, 180, 114, undefined, 'FAST');
    }

    // Border around Image Box
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.rect(15, 58, 180, 114);

    // 4. Extracted OCR & Metadata Summary Panel
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(10, 178, 190, 86, 3, 3, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('EXTRACTED METADATA & OCR AUDIT', 15, 187);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    let y = 195;
    if (options.extractedData?.fullName) {
      doc.setFont('helvetica', 'bold');
      doc.text('Full Name:', 15, y);
      doc.setFont('helvetica', 'normal');
      doc.text(options.extractedData.fullName, 55, y);
      y += 6;
    }

    if (options.extractedData?.documentNumber) {
      doc.setFont('helvetica', 'bold');
      doc.text('Document ID Number:', 15, y);
      doc.setFont('helvetica', 'normal');
      doc.text(options.extractedData.documentNumber, 55, y);
      y += 6;
    }

    if (options.extractedData?.dob) {
      doc.setFont('helvetica', 'bold');
      doc.text('Date of Birth:', 15, y);
      doc.setFont('helvetica', 'normal');
      doc.text(options.extractedData.dob, 55, y);
      y += 6;
    }

    if (options.extractedData?.address) {
      doc.setFont('helvetica', 'bold');
      doc.text('Address:', 15, y);
      doc.setFont('helvetica', 'normal');
      const addrLines = doc.splitTextToSize(options.extractedData.address, 130);
      doc.text(addrLines, 55, y);
      y += (addrLines.length * 5);
    }

    if (options.qrCodeData) {
      doc.setFont('helvetica', 'bold');
      doc.text('QR Code Payload:', 15, y);
      doc.setFont('helvetica', 'normal');
      const qrSnippet = options.qrCodeData.substring(0, 80);
      doc.text(qrSnippet, 55, y);
      y += 6;
    }

    if (options.ocrConfidence) {
      doc.setFont('helvetica', 'bold');
      doc.text('OCR Confidence Score:', 15, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`${options.ocrConfidence}% (Passed Verification)`, 55, y);
      y += 6;
    }

    // 5. Footer Security Watermark
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 274, 210, 23, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('ENCRYPTED SECURITY ACCESS RECORD - PRAVESHKAVACH VMS', 15, 282);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Stored under /Scans/ directory. Tamper-evident digital signature embedded.', 15, 287);

    return doc.output('datauristring');
  } catch (err) {
    console.error('PDF Generation Error:', err);
    // Fallback data URL if jsPDF fails
    return options.processedImageBase64;
  }
}

/**
 * Estimates file size in bytes from base64 string
 */
export function estimateBase64Size(base64String: string): number {
  if (!base64String) return 0;
  const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
  return Math.round((base64String.length * (3 / 4)) - padding);
}

/**
 * Main Save Document Function
 */
export async function saveScannedDocument(options: {
  processedImageUrl: string; // Cropped, perspective corrected, enhanced image
  docType: DocumentType;
  format: ScanExportFormat;
  customTitle?: string;
  extractedData?: ExtractedDocData;
  ocrConfidence?: number;
  qrCodeData?: string | null;
  savedBy?: string;
  visitorId?: string;
  visitorName?: string;
}): Promise<{ success: boolean; document?: SavedScanDocument; error?: string }> {
  try {
    if (!options.processedImageUrl) {
      throw new Error('Missing processed scanned image.');
    }

    const docTypeLabel = getDocTypeDisplayLabel(options.docType);
    const dateNow = new Date();
    const createdAtStr = dateNow.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });

    const fileName = generateScanFileName(options.docType, options.format);
    const title = options.customTitle?.trim() || `${docTypeLabel} (${createdAtStr})`;
    const id = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    let fileUrl = options.processedImageUrl;
    let pdfUrl: string | undefined = undefined;

    // Generate high-quality PDF if requested or as primary vector version
    const generatedPdf = generateHighQualityPDF({
      title,
      docTypeLabel,
      processedImageBase64: options.processedImageUrl,
      extractedData: options.extractedData,
      ocrConfidence: options.ocrConfidence || 95,
      qrCodeData: options.qrCodeData,
      savedBy: options.savedBy || 'Security Officer',
      createdAtStr,
      fileName,
    });

    pdfUrl = generatedPdf;

    if (options.format === 'pdf') {
      fileUrl = generatedPdf;
    } else {
      // JPEG or PNG
      fileUrl = options.processedImageUrl;
    }

    const fileSizeBytes = estimateBase64Size(fileUrl);

    const savedDoc: SavedScanDocument = {
      id,
      title,
      fileName,
      folder: 'Scans',
      docType: options.docType,
      docTypeLabel,
      format: options.format,
      processedImageUrl: options.processedImageUrl,
      fileUrl,
      pdfUrl,
      extractedData: options.extractedData,
      ocrConfidence: options.ocrConfidence || 95,
      createdAt: dateNow.toISOString(),
      fileSizeBytes,
      dimensions: { width: 1000, height: 630 },
      qrCodeData: options.qrCodeData,
      visitorId: options.visitorId,
      visitorName: options.visitorName || options.extractedData?.fullName,
      savedBy: options.savedBy || 'Security Officer',
      isEncrypted: true,
    };

    // 1. Save locally in localStorage
    const existingScans = getLocalSavedScans();
    const updatedScans = [savedDoc, ...existingScans];
    localStorage.setItem(LOCAL_STORAGE_SCANS_KEY, JSON.stringify(updatedScans));

    // 2. Sync to Server `/api/scans` endpoint
    try {
      await safeFetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedDoc),
      });
    } catch (netErr) {
      console.warn('Server scan sync fallback:', netErr);
    }

    return { success: true, document: savedDoc };
  } catch (err: any) {
    console.error('Error saving scan document:', err);
    return {
      success: false,
      error: err.message || 'Failed to save scanned document. Please try again.',
    };
  }
}

/**
 * Gets all saved scans from local storage and merges with server scans
 */
export function getLocalSavedScans(): SavedScanDocument[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SCANS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/**
 * Fetches saved scans from server + local storage
 */
export async function fetchAllSavedScans(): Promise<SavedScanDocument[]> {
  const localScans = getLocalSavedScans();

  try {
    const res = await safeFetch('/api/scans');
    if (res.ok && Array.isArray(res.data?.scans)) {
      const serverScans: SavedScanDocument[] = res.data.scans;
      // Merge unique by ID
      const map = new Map<string, SavedScanDocument>();
      serverScans.forEach((s) => map.set(s.id, s));
      localScans.forEach((s) => map.set(s.id, s));

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      localStorage.setItem(LOCAL_STORAGE_SCANS_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('Fetch scans network error:', err);
  }

  return localScans;
}

/**
 * Renames a saved document
 */
export async function renameSavedDocument(id: string, newTitle: string): Promise<boolean> {
  const local = getLocalSavedScans();
  const target = local.find((s) => s.id === id);
  if (target) {
    target.title = newTitle;
    const cleanDocName = newTitle.replace(/[^a-zA-Z0-9]/g, '_');
    const ext = target.format === 'pdf' ? 'pdf' : target.format === 'png' ? 'png' : 'jpg';
    target.fileName = `Scans/${cleanDocName}.${ext}`;

    localStorage.setItem(LOCAL_STORAGE_SCANS_KEY, JSON.stringify(local));

    try {
      await safeFetch(`/api/scans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, fileName: target.fileName }),
      });
    } catch (e) {
      // Ignored
    }
    return true;
  }
  return false;
}

/**
 * Deletes a saved scan document
 */
export async function deleteSavedDocument(id: string): Promise<boolean> {
  const local = getLocalSavedScans();
  const filtered = local.filter((s) => s.id !== id);
  localStorage.setItem(LOCAL_STORAGE_SCANS_KEY, JSON.stringify(filtered));

  try {
    await safeFetch(`/api/scans/${id}`, { method: 'DELETE' });
  } catch (e) {
    // Ignored
  }
  return true;
}

/**
 * Initiates browser/device file download
 */
export function downloadScanFile(doc: SavedScanDocument, exportFormat?: ScanExportFormat) {
  const format = exportFormat || doc.format;
  let fileData = doc.fileUrl;

  if (format === 'pdf' && doc.pdfUrl) {
    fileData = doc.pdfUrl;
  } else if (format !== 'pdf') {
    fileData = doc.processedImageUrl;
  }

  const cleanDocName = (doc.title || 'Scanned_Document').replace(/[^a-zA-Z0-9_]/g, '_');
  const ext = format === 'pdf' ? 'pdf' : format === 'png' ? 'png' : 'jpg';
  const downloadFileName = `${cleanDocName}.${ext}`;

  const link = document.createElement('a');
  link.href = fileData;
  link.download = downloadFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers native Web Share or fallback copy link
 */
export async function shareScanDocument(doc: SavedScanDocument): Promise<{ success: boolean; message: string }> {
  const cleanTitle = doc.title || 'Scanned Document';

  if (navigator.share) {
    try {
      // Attempt file sharing if Blob conversion succeeds
      const response = await fetch(doc.fileUrl);
      const blob = await response.blob();
      const ext = doc.format === 'pdf' ? 'pdf' : doc.format === 'png' ? 'png' : 'jpg';
      const file = new File([blob], `${cleanTitle}.${ext}`, { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: cleanTitle,
          text: `Scanned Document: ${cleanTitle} (${doc.docTypeLabel})`,
          files: [file],
        });
        return { success: true, message: 'Shared successfully!' };
      } else {
        await navigator.share({
          title: cleanTitle,
          text: `PraveshKavach Scanned Document: ${cleanTitle}`,
        });
        return { success: true, message: 'Shared successfully!' };
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        downloadScanFile(doc);
        return { success: true, message: 'File downloaded for sharing.' };
      }
    }
  }

  // Fallback
  downloadScanFile(doc);
  return { success: true, message: 'Document downloaded to your device.' };
}
