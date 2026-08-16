import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Camera, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  FileText, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle,
  Crop,
  Eye,
  CreditCard,
  Check,
  ChevronDown
} from 'lucide-react';
import { DocumentType, DocumentPageItem, ExtractedDocData, AddressExtractionEvidence } from '../types';
import { getDocumentConfig } from '../utils/documentConfigs';
import { DocumentScannerCanvas } from './DocumentScannerCanvas';
import { AdobeScanEditor, ScannedPageItem } from './AdobeScanEditor';
import { safeFetch } from '../utils/safeApi';
import { optimizeImageForMobileOCR } from '../utils/mobileImageOptimizer';
import { logOCRInputDetails } from '../utils/debugLogger';

interface TwoSidedDocumentScannerProps {
  selectedDocType: DocumentType;
  setSelectedDocType: (type: DocumentType) => void;
  frontImage?: string;
  backImage?: string;
  extractedData: ExtractedDocData;
  onComplete: (pagesData: {
    frontUrl: string;
    backUrl?: string;
    extractedData: ExtractedDocData;
    pages: DocumentPageItem[];
    rawFrontOcr?: string;
    rawBackOcr?: string;
  }) => void;
  onCancel?: () => void;
}

export const TwoSidedDocumentScanner: React.FC<TwoSidedDocumentScannerProps> = ({
  selectedDocType,
  setSelectedDocType,
  frontImage: initialFrontImage,
  backImage: initialBackImage,
  extractedData: initialExtractedData,
  onComplete,
  onCancel,
}) => {
  const docConfig = getDocumentConfig(selectedDocType);
  const supportsBack = docConfig.supportsBack;

  // Independent Front & Back States
  const [frontImage, setFrontImage] = useState<string>(initialFrontImage || '');
  const [backImage, setBackImage] = useState<string>(initialBackImage || '');
  
  const [frontOriginalImage, setFrontOriginalImage] = useState<string>(initialFrontImage || '');
  const [backOriginalImage, setBackOriginalImage] = useState<string>(initialBackImage || '');

  const [frontRawOcr, setFrontRawOcr] = useState<string>('');
  const [backRawOcr, setBackRawOcr] = useState<string>('');

  const [frontOcrMetrics, setFrontOcrMetrics] = useState<{ width: number; height: number; type: string; sizeKb: number } | null>(null);
  const [backOcrMetrics, setBackOcrMetrics] = useState<{ width: number; height: number; type: string; sizeKb: number } | null>(null);

  const [frontOcrStatus, setFrontOcrStatus] = useState<string | null>(null);
  const [backOcrStatus, setBackOcrStatus] = useState<string | null>(null);

  const [isFrontProcessing, setIsFrontProcessing] = useState<boolean>(false);
  const [isBackProcessing, setIsBackProcessing] = useState<boolean>(false);

  // Active camera mode: null | 'front' | 'back'
  const [activeScanningSide, setActiveScanningSide] = useState<'front' | 'back' | null>(null);

  // Adobe Crop Editor Mode
  const [editingSide, setEditingSide] = useState<'front' | 'back' | null>(null);
  const [scannedPagesForEditor, setScannedPagesForEditor] = useState<ScannedPageItem[]>([]);

  // Debug Panel
  const [showRawOcrDebug, setShowRawOcrDebug] = useState<boolean>(false);
  const [debugTab, setDebugTab] = useState<'front' | 'back' | 'addressEvidence' | 'combined'>('back');

  // Merged Extracted Data
  const [mergedData, setMergedData] = useState<ExtractedDocData>(initialExtractedData);

  // Supported Selectable Primary Types
  const primaryDocTypes: DocumentType[] = [
    'AADHAAR_CARD',
    'PAN_CARD',
    'DRIVING_LICENCE',
    'VOTER_ID',
    'PASSPORT',
    'COLLEGE_ID',
    'EMPLOYEE_ID',
    'OTHER',
  ];

  // OCR Processing Function for a given side
  const processSideOCR = async (imgUrl: string, side: 'front' | 'back') => {
    if (!imgUrl) return;

    if (side === 'front') {
      setIsFrontProcessing(true);
      setFrontOcrStatus('Scanning front document details...');
    } else {
      setIsBackProcessing(true);
      setBackOcrStatus('Scanning back side address details...');
    }

    try {
      // 1. Mobile-First Image Optimization (Samsung A12 memory & contrast boost)
      const { optimizedBase64, originalWidth, originalHeight, mimeType } = await optimizeImageForMobileOCR(imgUrl, {
        side,
        enhanceContrast: side === 'back',
        sharpen: true,
      });

      const readyImage = optimizedBase64 || imgUrl;
      const approxSizeKb = Math.round((readyImage.length * 0.75) / 1024);
      const metrics = {
        width: originalWidth || 1920,
        height: originalHeight || 1080,
        type: mimeType || 'image/jpeg',
        sizeKb: approxSizeKb,
      };

      if (side === 'front') {
        setFrontOcrMetrics(metrics);
      } else {
        setBackOcrMetrics(metrics);
      }

      await logOCRInputDetails(readyImage, selectedDocType);

      // 2. Real Backend OCR Request
      const response = await safeFetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: readyImage,
          docType: selectedDocType,
          side,
        }),
      });

      console.log(`[OCR RESPONSE ${side.toUpperCase()}]:`, {
        received: true,
        status: response.status,
        data: response.data,
      });

      if (response.ok && response.data) {
        const rawText = response.data.rawText || response.data.extractedData?.rawText || '';
        const fields = response.data.fields || response.data.extractedData || {};

        if (side === 'front') {
          setFrontRawOcr(rawText);
          setFrontOcrStatus(fields.fullName || fields.documentNumber ? '✓ Front fields recognized.' : '⚠ Low text detection on front side.');
          
          setMergedData((prev) => ({
            ...prev,
            ...fields,
            rawText: rawText || prev.rawText,
            frontOcrText: rawText,
            frontOriginalImage: frontOriginalImage || imgUrl,
            frontProcessedImage: readyImage,
            documentType: selectedDocType,
            side: 'front',
          }));
        } else {
          setBackRawOcr(rawText);
          const evidence: AddressExtractionEvidence = response.data.addressEvidence || response.data.extractedData?.addressEvidence || {
            value: fields.address || null,
            source: fields.address ? 'OCR' : 'OCR_UNCERTAIN',
            evidenceLines: fields.address ? fields.address.split('\n') : [],
            district: fields.district || '',
            state: fields.state || '',
            pinCode: fields.pinCode || '',
            confidence: fields.address ? 88 : 0,
          };

          setBackOcrStatus(fields.address ? '✓ Address and PIN Code successfully extracted.' : '⚠ No residential address found on back image.');

          setMergedData((prev) => ({
            ...prev,
            address: fields.address || prev.address,
            pinCode: fields.pinCode || prev.pinCode,
            district: fields.district || prev.district,
            state: fields.state || prev.state,
            addressEvidence: evidence,
            backOcrText: rawText,
            backOriginalImage: backOriginalImage || imgUrl,
            backProcessedImage: readyImage,
          }));
        }
      } else {
        if (side === 'front') setFrontOcrStatus('⚠ OCR unavailable. Manual entry available.');
        else setBackOcrStatus('⚠ Back side OCR unavailable. Manual entry available.');
      }
    } catch (err) {
      console.error(`[OCR Error ${side}]:`, err);
      if (side === 'front') setFrontOcrStatus('⚠ Front OCR error. You can verify and edit manually.');
      else setBackOcrStatus('⚠ Back OCR error. You can verify and edit manually.');
    } finally {
      if (side === 'front') setIsFrontProcessing(false);
      else setIsBackProcessing(false);
    }
  };

  // Canvas Capture Handler
  const handleCanvasCaptured = async (croppedDataUrl: string, qrData?: string | null) => {
    const side = activeScanningSide || 'front';
    setActiveScanningSide(null);

    if (side === 'front') {
      const currentFrontImage = croppedDataUrl;
      setFrontImage(currentFrontImage);
      setFrontOriginalImage(currentFrontImage);
      if (qrData) {
        setMergedData((prev) => ({ ...prev, qrCodeData: qrData }));
      }
      await processSideOCR(currentFrontImage, 'front');
    } else {
      const currentBackImage = croppedDataUrl;
      setBackImage(currentBackImage);
      setBackOriginalImage(currentBackImage);
      if (qrData) {
        setMergedData((prev) => ({
          ...prev,
          address: qrData,
          pinCode: qrData.match(/\b\d{6}\b/)?.[0] || prev.pinCode,
        }));
      }
      await processSideOCR(currentBackImage, 'back');
    }
  };

  // Launch Adobe Scan Editor for manual crop/filter
  const handleOpenEditor = (side: 'front' | 'back') => {
    const targetImg = side === 'front' ? frontImage : backImage;
    if (!targetImg) return;

    setEditingSide(side);
    setScannedPagesForEditor([
      {
        id: `page-${side}-${Date.now()}`,
        rawImage: targetImg,
        processedImage: targetImg,
        corners: {
          topLeft: { x: 20, y: 20 },
          topRight: { x: 900, y: 20 },
          bottomRight: { x: 900, y: 560 },
          bottomLeft: { x: 20, y: 560 },
        },
        rotation: 0,
        filter: 'AUTO',
        docType: selectedDocType,
      },
    ]);
  };

  // Independent Retake
  const handleRetakeSide = (side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontImage('');
      setFrontRawOcr('');
      setFrontOcrStatus(null);
      setFrontOcrMetrics(null);
      setActiveScanningSide('front');
    } else {
      setBackImage('');
      setBackRawOcr('');
      setBackOcrStatus(null);
      setBackOcrMetrics(null);
      setActiveScanningSide('back');
    }
  };

  // Proceed to Verification Step
  const handleProceedToVerification = () => {
    const pages: DocumentPageItem[] = [];

    if (frontImage) {
      pages.push({
        id: `doc-page-front-${Date.now()}`,
        side: 'front',
        image: frontImage,
        croppedImage: frontImage,
        rawOcrText: frontRawOcr,
        fields: {
          fullName: mergedData.fullName,
          documentNumber: mergedData.documentNumber,
          dob: mergedData.dob,
          gender: mergedData.gender,
          fatherName: mergedData.fatherName,
        },
        cropStatus: 'CROPPED',
        ocrStatus: frontRawOcr ? 'SUCCESS' : 'PENDING',
        fileSizeKb: frontOcrMetrics?.sizeKb,
        mimeType: frontOcrMetrics?.type,
        dimensions: frontOcrMetrics ? { width: frontOcrMetrics.width, height: frontOcrMetrics.height } : undefined,
      });
    }

    if (backImage) {
      pages.push({
        id: `doc-page-back-${Date.now()}`,
        side: 'back',
        image: backImage,
        croppedImage: backImage,
        rawOcrText: backRawOcr,
        fields: {
          address: mergedData.address,
          pinCode: mergedData.pinCode,
          district: mergedData.district,
          state: mergedData.state,
        },
        cropStatus: 'CROPPED',
        ocrStatus: backRawOcr ? 'SUCCESS' : 'PENDING',
        fileSizeKb: backOcrMetrics?.sizeKb,
        mimeType: backOcrMetrics?.type,
        dimensions: backOcrMetrics ? { width: backOcrMetrics.width, height: backOcrMetrics.height } : undefined,
      });
    }

    const combinedOcrText = [
      frontRawOcr ? `=== FRONT SIDE OCR ===\n${frontRawOcr}` : '',
      backRawOcr ? `=== BACK SIDE OCR ===\n${backRawOcr}` : '',
    ].filter(Boolean).join('\n\n');

    onComplete({
      frontUrl: frontImage,
      backUrl: backImage || undefined,
      extractedData: {
        ...mergedData,
        documentType: selectedDocType,
        documentPages: pages,
        frontOcrText: frontRawOcr,
        backOcrText: backRawOcr,
        combinedOcrText,
        rawText: combinedOcrText || frontRawOcr || backRawOcr || mergedData.rawText,
        frontOriginalImage,
        frontProcessedImage: frontImage,
        backOriginalImage,
        backProcessedImage: backImage,
      },
      pages,
      rawFrontOcr: frontRawOcr,
      rawBackOcr: backRawOcr,
    });
  };

  const isFrontReady = Boolean(frontImage);
  const isBackReady = Boolean(backImage);
  const canProceed = isFrontReady;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 px-3 sm:px-4 py-2">
      
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center">
              2
            </span>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
              Step 2 of 6 — Document Scanner
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1 tracking-tight flex items-center gap-2">
            <span>{docConfig.label}</span>
          </h2>
          <p className="text-xs text-slate-400">
            {supportsBack 
              ? 'Capture both Front and Back sides for complete OCR validation and address extraction.'
              : 'Capture clear document photo for AI text and biometric validation.'}
          </p>
        </div>

        {/* Document Type Selector Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value as DocumentType)}
              className="bg-slate-900 text-cyan-300 border border-slate-700 text-xs font-bold rounded-xl px-3 py-2 pr-8 appearance-none focus:outline-hidden focus:border-cyan-500 cursor-pointer"
              id="select-doc-type-scanner"
            >
              {primaryDocTypes.map((type) => (
                <option key={type} value={type}>
                  {getDocumentConfig(type).shortLabel}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => setShowRawOcrDebug(!showRawOcrDebug)}
            className="text-xs font-bold px-2.5 py-2 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
            id="btn-toggle-raw-ocr-debug"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">RAW OCR</span>
          </button>
        </div>
      </div>

      {/* Raw OCR Debug Drawer (Mandatory debugging) */}
      {showRawOcrDebug && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 text-amber-300 font-mono text-xs space-y-3 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 font-sans font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>LIVE OCR PIPELINE TRACE & DIAGNOSTICS</span>
            </div>
            
            {/* Tabs for Front / Back / Evidence / Combined debug */}
            <div className="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-800 flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setDebugTab('front')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold ${debugTab === 'front' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'}`}
              >
                PAN / DOC FRONT
              </button>
              {supportsBack && (
                <button
                  type="button"
                  onClick={() => setDebugTab('back')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold ${debugTab === 'back' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'}`}
                >
                  BACK / ADDRESS SIDE
                </button>
              )}
              <button
                type="button"
                onClick={() => setDebugTab('addressEvidence')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold ${debugTab === 'addressEvidence' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'}`}
              >
                ADDRESS EVIDENCE
              </button>
              <button
                type="button"
                onClick={() => setDebugTab('combined')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold ${debugTab === 'combined' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'}`}
              >
                COMBINED OCR
              </button>
            </div>
          </div>

          {debugTab === 'front' ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-sans">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">FRONT IMAGE DIMENSIONS</span>
                  <span className="text-white font-mono">{frontOcrMetrics ? `${frontOcrMetrics.width}×${frontOcrMetrics.height}` : 'Not captured'}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">FILE SIZE / MIME</span>
                  <span className="text-white font-mono">{frontOcrMetrics ? `${frontOcrMetrics.sizeKb} KB (${frontOcrMetrics.type})` : 'N/A'}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">OCR INPUT</span>
                  <span className="text-cyan-300 font-bold">FRONT IMAGE</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">OCR STATUS</span>
                  <span className="text-amber-300 font-bold">{isFrontProcessing ? 'PROCESSING' : frontRawOcr ? 'SUCCESS' : 'PENDING'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-sans text-[10px] uppercase font-bold mb-1">RAW FRONT OCR STREAM:</span>
                <pre className="p-3 bg-black rounded-lg border border-amber-500/20 text-amber-200 text-[11px] leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
                  {frontRawOcr || '(No front OCR stream received yet. Capture front side above.)'}
                </pre>
              </div>
            </div>
          ) : debugTab === 'back' ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-sans">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">BACK IMAGE DIMENSIONS</span>
                  <span className="text-white font-mono">{backOcrMetrics ? `${backOcrMetrics.width}×${backOcrMetrics.height}` : 'Not captured'}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">FILE SIZE / MIME</span>
                  <span className="text-white font-mono">{backOcrMetrics ? `${backOcrMetrics.sizeKb} KB (${backOcrMetrics.type})` : 'N/A'}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">OCR INPUT</span>
                  <span className="text-cyan-300 font-bold">BACK IMAGE</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">OCR STATUS</span>
                  <span className="text-amber-300 font-bold">{isBackProcessing ? 'PROCESSING' : backRawOcr ? 'SUCCESS' : 'PENDING'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-sans text-[10px] uppercase font-bold mb-1">RAW BACK OCR STREAM:</span>
                <pre className="p-3 bg-black rounded-lg border border-amber-500/20 text-amber-200 text-[11px] leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
                  {backRawOcr || '(No back OCR stream received yet. Capture back side above.)'}
                </pre>
              </div>
            </div>
          ) : debugTab === 'addressEvidence' ? (
            <div className="space-y-2">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase">Address Evidence Source:</span>
                  <span className="text-cyan-300 font-mono text-[10px] font-bold">{mergedData.addressEvidence?.source || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">ACTUAL OCR LINES USED:</span>
                  {mergedData.addressEvidence?.evidenceLines && mergedData.addressEvidence.evidenceLines.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-200">
                      {mergedData.addressEvidence.evidenceLines.map((line, idx) => (
                        <li key={idx}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-slate-500 text-[11px] italic">No evidence lines matched. Manual entry available.</span>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">FINAL EXTRACTED ADDRESS:</span>
                  <span className="text-white font-sans text-xs font-semibold">{mergedData.address || 'Address could not be read automatically.'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-slate-400 block font-sans text-[10px] uppercase font-bold mb-1">COMBINED OCR TEXT:</span>
              <pre className="p-3 bg-black rounded-lg border border-amber-500/20 text-amber-200 text-[11px] leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap break-words">
                {[
                  frontRawOcr ? `=== FRONT SIDE OCR ===\n${frontRawOcr}` : '',
                  backRawOcr ? `=== BACK SIDE OCR ===\n${backRawOcr}` : '',
                ].filter(Boolean).join('\n\n') || '(No OCR text collected yet.)'}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Active Camera View if open */}
      {activeScanningSide ? (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Scanning {activeScanningSide === 'front' ? docConfig.frontLabel : docConfig.backLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveScanningSide(null)}
              className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer"
            >
              Cancel Camera
            </button>
          </div>

          <DocumentScannerCanvas
            selectedDocType={selectedDocType}
            onCaptured={handleCanvasCaptured}
            onOpenEditor={() => {
              // Open editor with current capture
            }}
          />
        </div>
      ) : editingSide && scannedPagesForEditor.length > 0 ? (
        /* Adobe Scan Editor View */
        <AdobeScanEditor
          pages={scannedPagesForEditor}
          onUpdatePages={(updated) => setScannedPagesForEditor(updated)}
          onAddPage={() => {}}
          onRetakeAll={() => {
            const side = editingSide;
            setEditingSide(null);
            handleRetakeSide(side);
          }}
          onConfirmScans={async (finalPages) => {
            const side = editingSide;
            const finalImg = finalPages[0]?.processedImage;
            setEditingSide(null);
            if (finalImg && side) {
              if (side === 'front') {
                setFrontImage(finalImg);
                await processSideOCR(finalImg, 'front');
              } else {
                setBackImage(finalImg);
                await processSideOCR(finalImg, 'back');
              }
            }
          }}
        />
      ) : (
        /* Unified Document Container: Single Column Mobile Friendly */
        <div className="space-y-4">
          
          {/* Section 1: FRONT SIDE */}
          <div className={`p-4 rounded-2xl border transition-all ${
            frontImage 
              ? 'bg-slate-900/90 border-slate-700' 
              : 'bg-slate-900/50 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-400 font-extrabold text-[11px] flex items-center justify-center border border-cyan-500/30">
                  1
                </span>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    {docConfig.frontLabel}
                  </h3>
                  <p className="text-[11px] text-slate-400">{docConfig.frontDescription}</p>
                </div>
              </div>

              {frontImage && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Front Captured</span>
                </span>
              )}
            </div>

            {frontImage ? (
              /* Front Captured Card */
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4 relative rounded-xl overflow-hidden border border-slate-700 bg-black aspect-[1.586/1]">
                  <img
                    src={frontImage}
                    alt="Front Document"
                    className="w-full h-full object-cover"
                  />
                  {isFrontProcessing && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center">
                      <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mb-1" />
                      <span className="text-[10px] font-bold text-white">Reading OCR...</span>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-8 space-y-2">
                  {frontOcrStatus && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-300">
                      {frontOcrStatus}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditor('front')}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      id="btn-edit-front-crop"
                    >
                      <Crop className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Edit & Crop</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRetakeSide('front')}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      id="btn-retake-front-doc"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Retake Front</span>
                    </button>

                    <button
                      type="button"
                      disabled={isFrontProcessing}
                      onClick={() => processSideOCR(frontImage, 'front')}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      id="btn-re-ocr-front"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isFrontProcessing ? 'animate-spin' : ''}`} />
                      <span>Re-read OCR</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Front Capture CTA */
              <div className="py-4 text-center">
                <button
                  type="button"
                  onClick={() => setActiveScanningSide('front')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer mx-auto transition-transform active:scale-98"
                  id="btn-start-front-scan"
                >
                  <Camera className="w-4 h-4" />
                  <span>CAPTURE FRONT SIDE</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 2: BACK SIDE (If Supported) */}
          {supportsBack && (
            <div className={`p-4 rounded-2xl border transition-all ${
              backImage 
                ? 'bg-slate-900/90 border-slate-700' 
                : 'bg-slate-900/50 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 font-extrabold text-[11px] flex items-center justify-center border border-blue-500/30">
                    2
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      {docConfig.backLabel || 'Back Side & Address'}
                    </h3>
                    <p className="text-[11px] text-slate-400">{docConfig.backDescription}</p>
                  </div>
                </div>

                {backImage ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Back Captured</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold uppercase">
                    {selectedDocType === 'AADHAAR_CARD' ? 'Required for Address' : 'Optional'}
                  </span>
                )}
              </div>

              {backImage ? (
                /* Back Captured Card */
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-4 relative rounded-xl overflow-hidden border border-slate-700 bg-black aspect-[1.586/1]">
                    <img
                      src={backImage}
                      alt="Back Document"
                      className="w-full h-full object-cover"
                    />
                    {isBackProcessing && (
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center">
                        <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mb-1" />
                        <span className="text-[10px] font-bold text-white">Extracting Address...</span>
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-8 space-y-2">
                    {backOcrStatus && (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-300">
                        {backOcrStatus}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditor('back')}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        id="btn-edit-back-crop"
                      >
                        <Crop className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Edit & Crop</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRetakeSide('back')}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        id="btn-retake-back-doc"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                        <span>Retake Back</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBackProcessing}
                        onClick={() => processSideOCR(backImage, 'back')}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        id="btn-re-ocr-back"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isBackProcessing ? 'animate-spin' : ''}`} />
                        <span>Re-read OCR</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Back Capture CTA */
                <div className="py-4 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveScanningSide('back')}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mx-auto transition-transform active:scale-98"
                    id="btn-start-back-scan"
                  >
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span>CAPTURE BACK SIDE</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bottom Confirmation Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
            <div className="text-xs text-slate-400 text-center sm:text-left">
              {isFrontReady ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Document images captured & ready for verification.</span>
                </span>
              ) : (
                <span>Please capture at least the front side of {docConfig.shortLabel} to proceed.</span>
              )}
            </div>

            <div className="w-full sm:w-auto flex items-center gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-1/2 sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="button"
                disabled={!canProceed || isFrontProcessing || isBackProcessing}
                onClick={handleProceedToVerification}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                id="btn-proceed-to-verify-docs"
              >
                <span>Review & Verify Document</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
