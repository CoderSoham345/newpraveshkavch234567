import React, { useState } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  FolderDown, 
  ShieldCheck, 
  Download, 
  Share2, 
  X, 
  RefreshCw, 
  HardDrive, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { DocumentType, ScanExportFormat, ExtractedDocData, SavedScanDocument } from '../types';
import { saveScannedDocument, getDocTypeDisplayLabel } from '../services/scanStorageService';

interface SaveDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  processedImageUrl: string;
  docType: DocumentType;
  extractedData?: ExtractedDocData;
  qrCodeData?: string | null;
  visitorName?: string;
  onSavedSuccess?: (savedDoc: SavedScanDocument) => void;
  onNavigateToHistory?: () => void;
}

export const SaveDocumentModal: React.FC<SaveDocumentModalProps> = ({
  isOpen,
  onClose,
  processedImageUrl,
  docType,
  extractedData,
  qrCodeData,
  visitorName,
  onSavedSuccess,
  onNavigateToHistory,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ScanExportFormat>('pdf');
  const [customTitle, setCustomTitle] = useState<string>(() => {
    const label = getDocTypeDisplayLabel(docType);
    const d = new Date();
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toTimeString().split(' ')[0].replace(/:/g, '-');
    return `${label}_${dateStr}_${timeStr}`;
  });

  const [permissionGranted, setPermissionGranted] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [savedDocument, setSavedDocument] = useState<SavedScanDocument | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      // Simulate permission check or delay for smooth UX
      await new Promise((res) => setTimeout(res, 600));

      const result = await saveScannedDocument({
        processedImageUrl,
        docType,
        format: selectedFormat,
        customTitle,
        extractedData,
        qrCodeData,
        visitorName: visitorName || extractedData?.fullName,
        savedBy: 'Security Officer',
      });

      if (result.success && result.document) {
        setSavedDocument(result.document);
        setSaveSuccess(true);
        if (onSavedSuccess) {
          onSavedSuccess(result.document);
        }
      } else {
        throw new Error(result.error || 'Failed to save scanned document.');
      }
    } catch (err: any) {
      console.error('Save scan error:', err);
      setErrorMessage(err.message || 'Storage write permission denied or disk full. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Save Scanned Document
              </h3>
              <p className="text-xs text-slate-400">
                Store enhanced document to app <span className="text-cyan-400 font-mono font-bold">/Scans</span> folder
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            id="btn-close-save-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-200">

          {/* Processed Document Thumbnail Preview */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative w-full sm:w-36 h-28 rounded-lg overflow-hidden border border-cyan-500/30 bg-slate-900 shrink-0 shadow-inner">
              <img
                src={processedImageUrl}
                alt="Cropped Perspective Document"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-1 left-1 bg-emerald-500/90 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow">
                CROPPED & ENHANCED
              </div>
            </div>

            <div className="space-y-1 w-full">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-100 text-sm">
                  {getDocTypeDisplayLabel(docType)}
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Target Location: <span className="text-cyan-300 font-mono">App/Scans/</span>
              </p>
              {extractedData?.fullName && (
                <p className="text-slate-300 text-[11px]">
                  Name: <strong className="text-white">{extractedData.fullName}</strong>
                </p>
              )}
              {extractedData?.documentNumber && (
                <p className="text-slate-300 text-[11px]">
                  ID #: <span className="font-mono text-cyan-300">{extractedData.documentNumber}</span>
                </p>
              )}
            </div>
          </div>

          {/* Save Success View */}
          {saveSuccess && savedDocument ? (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 text-center space-y-3 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-300">
                  Document Saved Successfully!
                </h4>
                <p className="text-slate-300 text-xs mt-1">
                  Saved in <span className="text-emerald-400 font-mono font-bold">{savedDocument.fileName}</span>
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 justify-center">
                {onNavigateToHistory && (
                  <button
                    onClick={onNavigateToHistory}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
                  >
                    <FolderDown className="w-4 h-4" />
                    <span>View in Scan History</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700"
                >
                  Close & Continue
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Error Alert */}
              {errorMessage && (
                <div className="bg-rose-950/40 border border-rose-500/40 p-3.5 rounded-xl flex items-start gap-3 text-rose-300">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-xs">Save Failed</p>
                    <p className="text-[11px] text-rose-200/90">{errorMessage}</p>
                    <button
                      onClick={handleSave}
                      className="mt-2 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded border border-rose-500/40 font-bold text-[11px] flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry Saving</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Document Title / Filename Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Document Name / Title
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Aadhaar_Card_John_Doe"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium focus:border-cyan-400 focus:outline-none"
                  id="input-scan-custom-title"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Stored as: <span className="font-mono text-cyan-300">Scans/{customTitle || 'Scan'}.{selectedFormat}</span>
                </p>
              </div>

              {/* Format Selection (PDF default, PNG, JPEG) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Format (High-Quality Vector PDF Recommended)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('pdf')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                      selectedFormat === 'pdf'
                        ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 font-bold shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                    id="btn-format-pdf"
                  >
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <span className="text-xs">PDF</span>
                    <span className="text-[9px] text-cyan-400/80 font-semibold">High Quality</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedFormat('png')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                      selectedFormat === 'png'
                        ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 font-bold shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                    id="btn-format-png"
                  >
                    <ImageIcon className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs">PNG</span>
                    <span className="text-[9px] text-slate-400">Lossless</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedFormat('jpeg')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                      selectedFormat === 'jpeg'
                        ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 font-bold shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                    id="btn-format-jpeg"
                  >
                    <ImageIcon className="w-5 h-5 text-amber-400" />
                    <span className="text-xs">JPEG</span>
                    <span className="text-[9px] text-slate-400">Compressed</span>
                  </button>
                </div>
              </div>

              {/* Storage Permission Status */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300">App Storage Permission:</span>
                </div>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Granted (/Scans)
                </span>
              </div>
            </>
          )}

        </div>

        {/* Modal Footer */}
        {!saveSuccess && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              id="btn-confirm-save-scan"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Saving to Scans Folder...</span>
                </>
              ) : (
                <>
                  <FolderDown className="w-4 h-4" />
                  <span>Confirm & Save {selectedFormat.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
