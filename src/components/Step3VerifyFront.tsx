import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  ArrowRight, 
  RotateCcw, 
  Sparkles, 
  FileText,
  BadgeCheck,
  AlertCircle,
  QrCode,
  UserCheck,
  FolderDown,
  Shield,
  Lock,
  Scissors,
  RefreshCw,
  Check
} from 'lucide-react';
import { ExtractedDocData, FieldWithConfidence, VisitorPrivacyPreferences, VisibilityMode, AadhaarPrivacySettings } from '../types';
import { DOCUMENT_SCHEMAS, getDocumentSchema, validateAndComputeFieldConfidences } from '../utils/documentParsers';
import { SaveDocumentModal } from './SaveDocumentModal';
import { PrivacyControlModal } from './PrivacyControlModal';
import { AadhaarPrivacyModal } from './AadhaarPrivacyModal';
import { AdobeScanEditor, ScannedPageItem } from './AdobeScanEditor';
import { DEFAULT_VISITOR_PRIVACY_PREFERENCES, maskIdentityNumber } from '../utils/privacyUtils';
import { getDocumentPrivacyConfig } from '../utils/documentPrivacyConfig';
import { safeFetch } from '../utils/safeApi';
import { logOCRInputDetails } from '../utils/debugLogger';

interface Step3VerifyFrontProps {
  frontImage: string;
  extractedData: ExtractedDocData;
  setExtractedData: (data: ExtractedDocData) => void;
  onProceedToScanBack: () => void;
  onRetakeFront: () => void;
  onNavigateToHistory?: () => void;
  onUpdateFrontImage?: (newImgUrl: string) => void;
}

export const Step3VerifyFront: React.FC<Step3VerifyFrontProps> = ({
  frontImage,
  extractedData,
  setExtractedData,
  onProceedToScanBack,
  onRetakeFront,
  onNavigateToHistory,
  onUpdateFrontImage,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(true); // Default to editing mode for direct input!
  const [showRawOcr, setShowRawOcr] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [isAadhaarModalOpen, setIsAadhaarModalOpen] = useState<boolean>(false);
  
  const [isReOCRProcessing, setIsReOCRProcessing] = useState<boolean>(false);
  const [reOCRNotice, setReOCRNotice] = useState<string | null>(null);
  const [ocrMetrics, setOcrMetrics] = useState<{ width: number; height: number; size: string; type: string } | null>(null);
  const [isEditingInCropEditor, setIsEditingInCropEditor] = useState<boolean>(false);
  const [cropScannedPages, setCropScannedPages] = useState<ScannedPageItem[]>([]);

  const privacyPrefs: VisitorPrivacyPreferences = extractedData.privacyPreferences || DEFAULT_VISITOR_PRIVACY_PREFERENCES;
  const aadhaarSettings: AadhaarPrivacySettings = extractedData.aadhaarPrivacy || { useMaskedAadhaar: true };

  const handleUpdatePrivacyPreference = (field: keyof VisitorPrivacyPreferences, mode: VisibilityMode) => {
    const updatedPrefs = { ...privacyPrefs, [field]: mode };
    setExtractedData({
      ...extractedData,
      privacyPreferences: updatedPrefs,
    });
  };

  // Compute validated data with confidence ratings
  const validatedData = validateAndComputeFieldConfidences(extractedData);
  const currentSchema = getDocumentSchema(validatedData?.documentType);

  // Field presence checks for assistive warning only (non-blocking)
  const nameVal = (validatedData.fullName || '').trim();
  const docNumVal = (validatedData.documentNumber || '').trim();
  const isNamePresent = nameVal.length >= 2 && !/GOVT|AADHAAR|INDIA|CARD|UNIQUE/i.test(nameVal);
  const isDocNumPresent = docNumVal.length >= 4 && !/XXXX/i.test(docNumVal);
  const isComplete = isNamePresent && isDocNumPresent;

  const handleFieldValueChange = (key: keyof ExtractedDocData, val: any) => {
    const updated = {
      ...extractedData,
      [key]: val,
      manualOverrides: {
        ...(extractedData.manualOverrides || {}),
        [key]: true,
      },
      ocrStatus: 'MANUAL' as const,
    };
    const revalidated = validateAndComputeFieldConfidences(updated);
    setExtractedData(revalidated);
  };

  const handleRunReOCR = async (targetImg = frontImage) => {
    setIsReOCRProcessing(true);
    setReOCRNotice(null);
    try {
      const metrics = await logOCRInputDetails(targetImg, extractedData.documentType);
      setOcrMetrics(metrics);

      const response = await safeFetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: targetImg,
          docType: extractedData.documentType,
        }),
      });

      console.log('OCR RESPONSE:', { received: true, status: response.status, data: response.data });

      if (response.ok && response.data?.extractedData) {
        const ocrResult = response.data.extractedData;
        const manualMap = extractedData.manualOverrides || {};
        
        // Preserve manually overridden fields!
        const merged: ExtractedDocData = { ...extractedData };
        Object.keys(ocrResult).forEach((k) => {
          const key = k as keyof ExtractedDocData;
          if (!manualMap[key] && ocrResult[key] !== undefined && ocrResult[key] !== '') {
            (merged as any)[key] = ocrResult[key];
          }
        });

        if (ocrResult.rawText) {
          merged.rawText = ocrResult.rawText;
        }
        
        merged.confidenceScore = ocrResult.confidenceScore || 0;
        merged.ocrStatus = 'SUCCESS';
        
        const revalidated = validateAndComputeFieldConfidences(merged);
        setExtractedData(revalidated);
        setReOCRNotice('✓ Document re-read successfully. Un-edited fields updated.');
      } else if (response.data?.reason === 'NO_TEXT_DETECTED' || response.data?.error) {
        setReOCRNotice(`⚠ ${response.data.message || 'No readable text detected in image.'}`);
      } else {
        setReOCRNotice('⚠ Could not automatically read the document image. You can enter details manually.');
      }
    } catch (err) {
      console.error('Re-OCR error:', err);
      setReOCRNotice('⚠ Automatic reading unavailable. You can enter details manually.');
    } finally {
      setIsReOCRProcessing(false);
    }
  };

  const handleOpenCropModal = () => {
    const pageItem: ScannedPageItem = {
      id: `crop-page-${Date.now()}`,
      rawImage: frontImage,
      processedImage: frontImage,
      corners: undefined as any, // Let AdobeScanEditor calculate exact natural dimensions
      rotation: 0,
      filter: 'AUTO',
      docType: validatedData.documentType,
    };
    setCropScannedPages([pageItem]);
    setIsEditingInCropEditor(true);
  };

  const getConfidenceBadgeColor = (confidence: number, isValid: boolean, isManual: boolean) => {
    if (isManual) {
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40';
    }
    if (!isValid || confidence < 80) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/40';
    }
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40';
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center">
              ✓
            </span>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              Extracted Document Recognition & Manual Review
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs font-semibold text-slate-300">DOCUMENT TYPE:</span>
            <select
              value={validatedData.documentType || 'OTHER'}
              onChange={(e) => {
                const newType = e.target.value as DocumentType;
                setExtractedData({
                  ...extractedData,
                  documentType: newType,
                });
              }}
              className="bg-slate-950 border border-slate-700 text-cyan-300 font-extrabold text-xs sm:text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
              id="select-verify-doc-type"
            >
              <option value="AADHAAR_CARD">Aadhaar Card (Unified Multi-Side)</option>
              <option value="PAN_CARD">PAN Card</option>
              <option value="DRIVING_LICENCE">Driving Licence</option>
              <option value="COLLEGE_ID">College / Student ID</option>
              <option value="EMPLOYEE_ID">Employee ID (Govt / Corporate)</option>
              <option value="OTHER">Other / Custom Identity Document</option>
              <option value="PASSPORT">Passport</option>
              <option value="VOTER_ID">Voter ID (EPIC)</option>
              <option value="GOVT_EMPLOYEE_ID">Govt Employee ID</option>
              <option value="PRIVATE_EMPLOYEE_ID">Corporate Employee ID</option>
              <option value="STUDENT_ID">Student ID</option>
              <option value="AUTOMATIC_DETECTION">Auto Detect / Select</option>
            </select>
          </div>
          <p className="text-xs text-slate-400">
            Review and edit details below. Manual entry is fully supported and enabled.
          </p>
        </div>

        {/* OCR Status Badge */}
        <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border ${
          Object.keys(extractedData.manualOverrides || {}).length > 0
            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
            : isComplete
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
        }`}>
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">OCR Mode</span>
            <span className="text-xs font-black">
              {Object.keys(extractedData.manualOverrides || {}).length > 0
                ? '✓ MANUALLY VERIFIED'
                : isComplete
                ? '✓ READ AUTOMATICALLY'
                : '⚠ MANUAL EDIT ASSIST'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Document Image Preview (Left) vs Dynamic Form (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Image Preview & Crop / Re-OCR Buttons */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-cyan-400" />
                <span>Captured ID Document</span>
              </span>
              <button
                onClick={onRetakeFront}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                id="btn-retake-from-verify"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black aspect-[1.586/1]">
              <img
                src={frontImage}
                alt="Front ID Crop"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-slate-950/90 text-xs font-black text-cyan-300 border border-cyan-500/40 shadow-lg backdrop-blur-md">
                {validatedData.documentType}
              </div>

              {validatedData.qrCodeData && (
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-emerald-950/90 text-[10px] font-bold text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <QrCode className="w-3 h-3 text-emerald-400" />
                  <span>QR Data Embedded</span>
                </div>
              )}
            </div>

            {/* Crop & Re-OCR Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenCropModal}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                id="btn-open-crop-editor"
              >
                <Scissors className="w-3.5 h-3.5 text-cyan-400" />
                <span>Edit / Crop</span>
              </button>

              <button
                type="button"
                disabled={isReOCRProcessing}
                onClick={() => handleRunReOCR(frontImage)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                id="btn-re-ocr-document"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isReOCRProcessing ? 'animate-spin' : ''}`} />
                <span>{isReOCRProcessing ? 'Reading...' : 'Re-read OCR'}</span>
              </button>
            </div>

            {/* Re-OCR Status Notice */}
            {reOCRNotice && (
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-300 animate-fade-in">
                {reOCRNotice}
              </div>
            )}
          </div>

          {/* Next Step Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border border-blue-500/30 text-center space-y-2 shadow-xl relative overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 mx-auto flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-extrabold text-white tracking-wide uppercase">
              NEXT: LIVE FACE PHOTO CAPTURE
            </h3>
            <p className="text-[11px] text-slate-300">
              After confirming details, proceed to live face capture and resident selection.
            </p>
          </div>
        </div>

        {/* Right Column: Editable Dynamic Form */}
        <div className="md:col-span-7 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>{currentSchema?.label || 'Visitor Identity'} Fields</span>
              </span>
              <p className="text-[11px] text-slate-400">Directly edit or fill in any missing information</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsPrivacyModalOpen(true)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/50 flex items-center gap-1.5 shadow-sm"
                id="btn-toggle-privacy-modal"
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Privacy</span>
              </button>

              <button
                onClick={() => setShowRawOcr(!showRawOcr)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center gap-1.5"
                id="btn-toggle-raw-ocr"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{showRawOcr ? 'Hide Raw OCR' : 'Raw OCR'}</span>
              </button>
            </div>
          </div>

          {/* Raw OCR Text Viewer Mode */}
          {showRawOcr && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300 font-mono text-[11px] space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest font-sans font-bold border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>OCR Pipeline Debug & Trace</span>
                </span>
                <span className="text-emerald-400 font-sans font-bold">STATUS: {extractedData.ocrStatus || 'READY'}</span>
              </div>

              {/* Input Image Metrics */}
              {ocrMetrics ? (
                <div className="grid grid-cols-2 gap-2 p-2 rounded bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300">
                  <div><span className="text-slate-500 font-sans uppercase">Width x Height:</span> {ocrMetrics.width} × {ocrMetrics.height} px</div>
                  <div><span className="text-slate-500 font-sans uppercase">File Size:</span> {ocrMetrics.size}</div>
                  <div><span className="text-slate-500 font-sans uppercase">MIME Type:</span> {ocrMetrics.type}</div>
                  <div><span className="text-slate-500 font-sans uppercase">Target Doc:</span> {extractedData.documentType}</div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 italic">Click "Re-read OCR" to inspect live OCR image metrics.</div>
              )}

              {/* Request / Response Status */}
              <div className="flex items-center justify-between text-[10px] text-slate-300 px-1 font-sans font-semibold">
                <span className="text-emerald-400">OCR REQUEST: sent = true</span>
                <span className="text-cyan-400">OCR RESPONSE: received = true</span>
              </div>

              {/* Raw Text Stream */}
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-bold flex items-center justify-between">
                  <span>RAW OCR TEXT:</span>
                  <span className="text-cyan-400 font-mono text-[9px]">RAW OCR STREAM</span>
                </div>
                <pre className="whitespace-pre-wrap break-words leading-relaxed max-h-32 overflow-y-auto p-2.5 bg-black rounded border border-amber-500/20 text-amber-200 text-[11px]">
                  {extractedData.rawText || validatedData.rawText || 'No raw OCR stream detected yet. Click "Re-read OCR" or crop image to extract.'}
                </pre>
              </div>

              {/* Field Evidence Mapping Trace */}
              <div className="space-y-1.5 pt-1 border-t border-slate-800">
                <div className="text-[10px] text-amber-400 uppercase tracking-wider font-sans font-bold flex items-center gap-1">
                  <span>PAN FIELD EVIDENCE</span>
                  <span className="text-slate-500 text-[9px] font-mono font-normal">(EXACT OCR REASONING)</span>
                </div>
                <div className="space-y-1.5 p-2 bg-slate-900/90 rounded border border-slate-800 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400 block font-sans text-[9px] uppercase font-bold">PAN NUMBER:</span>
                    <span className="text-emerald-300 font-bold">{validatedData.documentNumber || '[ Could not read automatically ]'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans text-[9px] uppercase font-bold">FULL NAME:</span>
                    <span className={extractedData.manualOverrides?.fullName ? 'text-cyan-300 font-bold' : validatedData.fullName ? 'text-emerald-300 font-bold' : 'text-rose-400 italic font-sans'}>
                      {extractedData.manualOverrides?.fullName
                        ? `${validatedData.fullName} (Manual Entry)`
                        : validatedData.fullName || '[ Could not read automatically - Enter manually ]'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans text-[9px] uppercase font-bold">FATHER'S NAME:</span>
                    <span className="text-emerald-300 font-bold">{validatedData.fatherName || '[ Could not read automatically ]'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans text-[9px] uppercase font-bold">DATE OF BIRTH:</span>
                    <span className="text-emerald-300 font-bold">{validatedData.dob || '[ Could not read automatically ]'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Non-blocking Informational Notice if Fields Missing */}
          {!isComplete && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                ⚠ Some details could not be read automatically. Please review and enter them manually below.
              </span>
            </div>
          )}

          {/* Dynamic Form Generation with Direct Editable Inputs */}
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {(currentSchema?.fields || []).map((field) => {
              const val = (validatedData as any)[field.key] || '';
              const isManual = Boolean(extractedData.manualOverrides?.[field.key as string]);
              const fieldConf: FieldWithConfidence = validatedData.fieldConfidences?.[field.key] || {
                value: val,
                confidence: 90,
                isValid: true,
              };

              return (
                <div key={field.key as string} className="space-y-1">
                  
                  {/* Field Label & Badge */}
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                      <span>{field.label}</span>
                      {field.required && <span className="text-rose-400 font-bold">*</span>}
                    </label>

                    <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${getConfidenceBadgeColor(fieldConf.confidence, fieldConf.isValid, isManual)}`}>
                      {isManual ? (
                        <>
                          <Check className="w-3 h-3 text-cyan-400" />
                          <span>MANUALLY VERIFIED</span>
                        </>
                      ) : fieldConf.isValid && val ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>OCR READ</span>
                        </>
                      ) : val ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>OCR UNCERTAIN</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>MANUAL ENTRY</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Input Field */}
                  {field.type === 'select' ? (
                    <select
                      value={val}
                      onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 text-white rounded-lg px-3 py-2 text-xs font-bold focus:outline-none transition-colors"
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={val}
                      placeholder={`Enter ${field.label}`}
                      onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 text-white rounded-lg px-3 py-2 text-xs font-bold focus:outline-none transition-colors"
                    />
                  )}

                </div>
              );
            })}
          </div>

          {/* Action Buttons: Save Document & Proceed - ALWAYS ENABLED */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setIsSaveModalOpen(true)}
              className="px-4 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 font-extrabold text-xs border border-cyan-500/40 flex items-center justify-center gap-2 uppercase tracking-wider shadow-lg"
              id="btn-open-save-doc-modal"
            >
              <FolderDown className="w-4 h-4 text-cyan-400" />
              <span>Save Document (PDF/PNG)</span>
            </button>

            <button
              type="button"
              onClick={onProceedToScanBack}
              className="flex-1 py-3.5 px-6 rounded-xl font-extrabold text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2.5 uppercase tracking-wider transition-all bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-500/20 cursor-pointer active:scale-98 touch-manipulation min-h-[52px]"
              id="btn-continue-scan-back"
            >
              <span>CONFIRM DETAILS & PROCEED TO FACE CAPTURE</span>
              <ArrowRight className="w-5 h-5 text-white shrink-0" />
            </button>
          </div>

        </div>

      </div>

      {/* Modal for Full-Screen Mobile Adobe Scan Editor */}
      {isEditingInCropEditor && cropScannedPages.length > 0 && (
        <AdobeScanEditor
          pages={cropScannedPages}
          onUpdatePages={(updated) => setCropScannedPages(updated)}
          onAddPage={() => setIsEditingInCropEditor(false)}
          onRetakeAll={() => {
            setIsEditingInCropEditor(false);
            onRetakeFront();
          }}
          onConfirmScans={(finalPages) => {
            const croppedImg = finalPages[0]?.processedImage || frontImage;
            if (onUpdateFrontImage) {
              onUpdateFrontImage(croppedImg);
            }
            setIsEditingInCropEditor(false);
            // Run Re-OCR automatically on newly cropped image!
            handleRunReOCR(croppedImg);
          }}
        />
      )}

      {/* Save Document Modal */}
      <SaveDocumentModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        processedImageUrl={frontImage}
        docType={validatedData.documentType}
        extractedData={extractedData}
        qrCodeData={validatedData.qrCodeData}
        visitorName={extractedData.fullName}
        onNavigateToHistory={onNavigateToHistory}
      />

      {/* Privacy Visibility Control Modal */}
      <PrivacyControlModal
        isOpen={isPrivacyModalOpen}
        preferences={privacyPrefs}
        docType={validatedData.documentType}
        sampleName={validatedData.fullName}
        sampleDocNumber={validatedData.documentNumber}
        isMaskedAadhaar={aadhaarSettings.useMaskedAadhaar}
        onChangePreference={handleUpdatePrivacyPreference}
        onSave={() => setIsPrivacyModalOpen(false)}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* Document Privacy Selection Modal */}
      <AadhaarPrivacyModal
        isOpen={isAadhaarModalOpen}
        documentType={validatedData.documentType}
        settings={aadhaarSettings}
        privacyMode={extractedData.privacyMode}
        identityValue={validatedData.documentNumber}
        onSelectOption={(useMasked) => {
          const isMaskedBool = typeof useMasked === 'boolean' ? useMasked : useMasked === 'masked';
          setExtractedData({
            ...extractedData,
            privacyMode: isMaskedBool ? 'masked' : 'unmasked',
            aadhaarPrivacy: { useMaskedAadhaar: isMaskedBool },
            isMaskedAadhaar: isMaskedBool,
          });
        }}
        onConfirm={() => setIsAadhaarModalOpen(false)}
        onCancel={() => setIsAadhaarModalOpen(false)}
      />

    </div>
  );
};
