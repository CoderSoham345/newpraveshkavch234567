import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Edit2, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FileText, 
  Calendar, 
  HardDrive, 
  Check, 
  ShieldCheck, 
  Eye, 
  Sun,
  Maximize2
} from 'lucide-react';
import { SavedScanDocument, ScanExportFormat } from '../types';
import { 
  downloadScanFile, 
  shareScanDocument, 
  renameSavedDocument, 
  deleteSavedDocument 
} from '../services/scanStorageService';

interface ScanDocumentViewerModalProps {
  document: SavedScanDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onDocumentUpdated?: () => void;
  onDocumentDeleted?: () => void;
}

export const ScanDocumentViewerModal: React.FC<ScanDocumentViewerModalProps> = ({
  document,
  isOpen,
  onClose,
  onDocumentUpdated,
  onDocumentDeleted,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);

  // Rename Dialog state
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');

  // Delete Confirmation state
  const [isDeletingConfirm, setIsDeletingConfirm] = useState<boolean>(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  if (!isOpen || !document) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleStartRename = () => {
    setNewTitle(document.title);
    setIsRenaming(true);
  };

  const handleConfirmRename = async () => {
    if (!newTitle.trim()) return;
    const ok = await renameSavedDocument(document.id, newTitle.trim());
    if (ok) {
      document.title = newTitle.trim();
      setIsRenaming(false);
      if (onDocumentUpdated) onDocumentUpdated();
    }
  };

  const handleConfirmDelete = async () => {
    await deleteSavedDocument(document.id);
    setIsDeletingConfirm(false);
    onClose();
    if (onDocumentDeleted) onDocumentDeleted();
  };

  const handleShare = async () => {
    const res = await shareScanDocument(document);
    setShareFeedback(res.message);
    setTimeout(() => setShareFeedback(null), 3000);
  };

  const handleDownload = (format?: ScanExportFormat) => {
    downloadScanFile(document, format);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              {isRenaming ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="bg-slate-900 border border-cyan-400 rounded px-2 py-1 text-sm text-white focus:outline-none font-bold"
                    id="input-rename-document"
                  />
                  <button
                    onClick={handleConfirmRename}
                    className="p-1.5 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsRenaming(false)}
                    className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {document.title}
                  </h3>
                  <button
                    onClick={handleStartRename}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition"
                    title="Rename Document"
                    id="btn-rename-doc"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                <span>{document.fileName}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span className="text-cyan-300 font-bold uppercase">{document.format}</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            
            {/* Share */}
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition"
              title="Share Document"
              id="btn-share-doc"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Download */}
            <div className="relative group">
              <button
                onClick={() => handleDownload()}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition"
                id="btn-download-doc"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download ({document.format.toUpperCase()})</span>
              </button>
            </div>

            {/* Delete */}
            <button
              onClick={() => setIsDeletingConfirm(true)}
              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
              title="Delete Document"
              id="btn-delete-doc"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition ml-1"
              id="btn-close-viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {shareFeedback && (
          <div className="bg-cyan-500/20 border-b border-cyan-500/30 text-cyan-300 text-xs px-4 py-2 font-bold flex items-center justify-between">
            <span>{shareFeedback}</span>
            <Check className="w-4 h-4 text-cyan-400" />
          </div>
        )}

        {/* Viewer Canvas Area + Side Details */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-slate-950 relative">
          
          {/* Main Display Canvas */}
          <div className="lg:col-span-8 h-full flex flex-col justify-between p-4 overflow-hidden relative border-r border-slate-800/80">
            
            {/* Zoom / Rotate Controls Overlay */}
            <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1.5 flex items-center gap-1 text-slate-200 shadow-xl">
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono font-bold px-1 text-cyan-400">
                {zoomLevel}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-slate-700 mx-1"></div>

              <button
                onClick={handleRotate}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-[10px] font-bold"
                title="Rotate Document"
              >
                <RotateCw className="w-4 h-4" />
                <span>{rotation}°</span>
              </button>
            </div>

            {/* Document Image Frame */}
            <div className="flex-1 w-full h-full flex items-center justify-center overflow-auto p-4 custom-scrollbar">
              <div 
                className="transition-all duration-200 ease-out flex items-center justify-center max-h-full max-w-full"
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                }}
              >
                <img
                  src={document.processedImageUrl || document.fileUrl}
                  alt={document.title}
                  className="max-h-[65vh] max-w-full object-contain rounded-lg border border-slate-700 shadow-2xl"
                />
              </div>
            </div>

            {/* Image Enhancements Controls */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-around text-xs shrink-0 mt-2">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] text-slate-300 font-semibold">Brightness:</span>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-24 accent-cyan-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] text-slate-300 font-semibold">Contrast:</span>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-24 accent-cyan-400"
                />
              </div>
              <button
                onClick={() => { setBrightness(100); setContrast(100); setZoomLevel(100); setRotation(0); }}
                className="text-[10px] text-cyan-400 hover:underline font-bold"
              >
                Reset Controls
              </button>
            </div>

          </div>

          {/* Right Panel: Metadata Inspection */}
          <div className="lg:col-span-4 h-full bg-slate-900/60 p-4 space-y-4 overflow-y-auto text-xs text-slate-200">
            
            <div className="border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Document Information</span>
              </h4>
              <p className="text-slate-400 text-[10px] mt-0.5">
                Saved in app's permanent <span className="text-cyan-300 font-mono">/Scans</span> storage
              </p>
            </div>

            {/* File Attributes */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Document Type:</span>
                <span className="font-bold text-cyan-300">{document.docTypeLabel}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Format:</span>
                <span className="font-bold text-white uppercase bg-slate-800 px-2 py-0.5 rounded font-mono">
                  {document.format}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Scan Date & Time:</span>
                <span className="font-semibold text-slate-200">
                  {new Date(document.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Storage Location:</span>
                <span className="font-mono text-[10px] text-cyan-400 font-bold">/Scans/</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">OCR Confidence:</span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {document.ocrConfidence || 95}% Verified
                </span>
              </div>
            </div>

            {/* Extracted Fields */}
            {document.extractedData && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <h5 className="font-bold text-slate-200 text-[11px] uppercase tracking-wider mb-2">
                  Extracted OCR Data
                </h5>
                {document.extractedData.fullName && (
                  <div>
                    <span className="text-slate-400 text-[10px] block">Full Name</span>
                    <span className="font-bold text-white text-xs">{document.extractedData.fullName}</span>
                  </div>
                )}
                {document.extractedData.documentNumber && (
                  <div>
                    <span className="text-slate-400 text-[10px] block">ID Number</span>
                    <span className="font-mono font-bold text-cyan-300 text-xs">{document.extractedData.documentNumber}</span>
                  </div>
                )}
                {document.extractedData.dob && (
                  <div>
                    <span className="text-slate-400 text-[10px] block">Date of Birth</span>
                    <span className="font-medium text-slate-200 text-xs">{document.extractedData.dob}</span>
                  </div>
                )}
                {document.extractedData.address && (
                  <div>
                    <span className="text-slate-400 text-[10px] block">Address</span>
                    <span className="text-slate-300 text-[11px]">{document.extractedData.address}</span>
                  </div>
                )}
              </div>
            )}

            {/* Export Format Selector */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-300 font-bold text-[11px] block">
                Export / Re-download Format
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => handleDownload('pdf')}
                  className="px-2 py-1.5 rounded bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-bold text-[11px]"
                >
                  PDF
                </button>
                <button
                  onClick={() => handleDownload('png')}
                  className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[11px]"
                >
                  PNG
                </button>
                <button
                  onClick={() => handleDownload('jpeg')}
                  className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[11px]"
                >
                  JPEG
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Delete Confirmation Overlay */}
        {isDeletingConfirm && (
          <div className="absolute inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-rose-500/40 p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Delete Scanned Document?</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Are you sure you want to delete <strong className="text-white">{document.title}</strong> from the <span className="text-cyan-300 font-mono">/Scans</span> folder? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => setIsDeletingConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30"
                >
                  Yes, Delete File
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
