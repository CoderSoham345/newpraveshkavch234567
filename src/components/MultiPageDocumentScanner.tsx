import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Scissors, 
  RotateCw, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  ArrowRight,
  Scan,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { ScannedPageItem, AdobeScanEditor } from './AdobeScanEditor';
import { generateDocumentPDF, GeneratePDFResult } from '../utils/pdfGenerator';
import { DocumentType } from '../types';

interface MultiPageDocumentScannerProps {
  documentType: DocumentType;
  pages: ScannedPageItem[];
  onUpdatePages: (pages: ScannedPageItem[]) => void;
  onAddMorePages: () => void;
  onProceedToReview: (pdfResult?: GeneratePDFResult) => void;
  onRetakeAll: () => void;
}

export const MultiPageDocumentScanner: React.FC<MultiPageDocumentScannerProps> = ({
  documentType,
  pages,
  onUpdatePages,
  onAddMorePages,
  onProceedToReview,
  onRetakeAll,
}) => {
  const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfResult, setPdfResult] = useState<GeneratePDFResult | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(false);

  // Rotate single page
  const handleRotatePage = (index: number) => {
    const updated = [...pages];
    const page = { ...updated[index] };
    const nextRotation = (page.rotation + 90) % 360;
    page.rotation = nextRotation;
    
    // Rotate processed image on a temporary canvas
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (nextRotation === 90 || nextRotation === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((nextRotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        page.processedImage = canvas.toDataURL('image/jpeg', 0.92);
        updated[index] = page;
        onUpdatePages(updated);
      }
    };
    img.src = page.processedImage || page.rawImage;
  };

  // Delete page
  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) {
      onRetakeAll();
      return;
    }
    const updated = pages.filter((_, i) => i !== index);
    onUpdatePages(updated);
  };

  // Create PDF
  const handleCreatePDF = async () => {
    if (pages.length === 0) return;
    setIsGeneratingPdf(true);
    try {
      const pdfInput = pages.map((p, idx) => ({
        title: idx === 0 ? 'Front Side' : idx === 1 ? 'Back Side' : `Page ${idx + 1}`,
        processedImage: p.processedImage || p.rawImage,
      }));
      const res = await generateDocumentPDF(pdfInput, documentType);
      setPdfResult(res);
      setShowPdfPreview(true);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (editingPageIndex !== null && pages.length > 0) {
    return (
      <AdobeScanEditor
        pages={pages}
        onUpdatePages={(updated) => {
          onUpdatePages(updated);
          setEditingPageIndex(null);
        }}
        onAddPage={() => {
          setEditingPageIndex(null);
          onAddMorePages();
        }}
        onConfirmScans={(finalPages) => {
          onUpdatePages(finalPages);
          setEditingPageIndex(null);
        }}
        onRetakeAll={() => {
          setEditingPageIndex(null);
          onRetakeAll();
        }}
      />
    );
  }

  return (
    <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 shadow-2xl animate-fade-in">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Scan className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>DOCUMENT PAGE MANAGER</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500 text-slate-950 uppercase">
                {pages.length} PAGE{pages.length > 1 ? 'S' : ''} CAPTURED
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Review, crop, reorder, or generate a PDF pass for this document.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRetakeAll}
          className="text-xs font-semibold text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-950/40 cursor-pointer"
        >
          Retake All
        </button>
      </div>

      {/* Pages Thumbnail Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {pages.map((page, idx) => (
          <div 
            key={page.id || `page-${idx}`} 
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between space-y-3 relative group"
          >
            {/* Thumbnail Label & Badge */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Page {idx + 1}: {idx === 0 ? 'Front Side' : idx === 1 ? 'Back Side' : 'Extra Side'}</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {page.filter || 'AUTO'}
              </span>
            </div>

            {/* Image Box */}
            <div className="relative aspect-[1.58/1] bg-black rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
              <img 
                src={page.processedImage || page.rawImage} 
                alt={`Page ${idx + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Page Actions Toolbar */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setEditingPageIndex(idx)}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                title="Crop and edit page"
              >
                <Scissors className="w-3 h-3 text-cyan-400" />
                <span>Crop</span>
              </button>

              <button
                type="button"
                onClick={() => handleRotatePage(idx)}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                title="Rotate page 90 degrees"
              >
                <RotateCw className="w-3 h-3 text-amber-400" />
                <span>Rotate</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeletePage(idx)}
                className="py-1.5 px-2 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                title="Delete this page"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}

        {/* Add Page Card */}
        <button
          type="button"
          onClick={onAddMorePages}
          className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-900/40 hover:bg-slate-900 rounded-xl p-6 flex flex-col items-center justify-center space-y-2 text-slate-400 hover:text-cyan-400 transition-all cursor-pointer group min-h-[160px]"
        >
          <div className="p-3 rounded-full bg-slate-800 group-hover:bg-cyan-500/20 text-slate-400 group-hover:text-cyan-400 border border-slate-700 transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">
            + Add Another Page / Back Side
          </span>
          <span className="text-[10px] text-slate-500">
            Capture back side or supplementary page
          </span>
        </button>
      </div>

      {/* PDF Generation Status & Actions */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-xs font-bold text-white block">
                Multi-Page Document Ready
              </span>
              <span className="text-[10px] text-slate-400">
                You can generate a unified multi-page PDF document or proceed directly to review extracted text.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreatePDF}
              disabled={isGeneratingPdf}
              className="py-2 px-4 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'CREATE PDF PASS'}</span>
            </button>
          </div>
        </div>

        {pdfResult && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg flex items-center justify-between text-xs text-emerald-300 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>{pdfResult.fileName}</strong> created successfully ({pdfResult.pageCount} Pages).
              </span>
            </div>
            <a
              href={pdfResult.blobUrl}
              download={pdfResult.fileName}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-[10px] rounded uppercase hover:bg-emerald-400 transition-colors"
            >
              Download PDF
            </a>
          </div>
        )}
      </div>

      {/* Continue Action Button */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={() => onProceedToReview(pdfResult || undefined)}
          className="py-3.5 px-7 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-emerald-500/20 border border-emerald-400 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          id="btn-proceed-multi-page-review"
        >
          <span>CONTINUE TO VERIFY & REVIEW DETAILS</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
