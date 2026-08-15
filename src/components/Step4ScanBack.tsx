import React, { useState } from 'react';
import { 
  Camera, 
  CheckCircle2, 
  QrCode, 
  RotateCcw, 
  ArrowRight,
  ShieldCheck,
  Scan,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  FileText,
  Check,
  MapPin,
  Eye,
  Edit3
} from 'lucide-react';
import { DocumentType, AddressExtractionEvidence } from '../types';
import { DocumentScannerCanvas } from './DocumentScannerCanvas';
import { AdobeScanEditor, ScannedPageItem } from './AdobeScanEditor';
import { safeFetch } from '../utils/safeApi';
import { optimizeImageForMobileOCR } from '../utils/mobileImageOptimizer';
import { logOCRInputDetails } from '../utils/debugLogger';

interface Step4ScanBackProps {
  docType: DocumentType;
  onBackCaptureCompleted: (
    backImageUrl: string, 
    addressData?: { address: string; pinCode?: string; district?: string; state?: string },
    addressEvidence?: AddressExtractionEvidence,
    rawOcrText?: string
  ) => void;
  onBackSkipped: () => void;
}

export const Step4ScanBack: React.FC<Step4ScanBackProps> = ({
  docType,
  onBackCaptureCompleted,
  onBackSkipped,
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [qrScannedData, setQrScannedData] = useState<string | null>(null);
  const [scannedPages, setScannedPages] = useState<ScannedPageItem[]>([]);
  const [isEditingInAdobeScan, setIsEditingInAdobeScan] = useState<boolean>(false);

  // OCR Processing State
  const [isOCRProcessing, setIsOCRProcessing] = useState<boolean>(false);
  const [rawOcrText, setRawOcrText] = useState<string>('');
  const [extractedAddress, setExtractedAddress] = useState<string>('');
  const [extractedPinCode, setExtractedPinCode] = useState<string>('');
  const [extractedDistrict, setExtractedDistrict] = useState<string>('');
  const [extractedState, setExtractedState] = useState<string>('');
  const [addressEvidence, setAddressEvidence] = useState<AddressExtractionEvidence | null>(null);
  const [isManuallyEdited, setIsManuallyEdited] = useState<boolean>(false);
  const [showRawBackOcr, setShowRawBackOcr] = useState<boolean>(false);
  const [ocrStatusNotice, setOcrStatusNotice] = useState<string | null>(null);
  const [ocrMetrics, setOcrMetrics] = useState<{ width: number; height: number; size: string; type: string } | null>(null);

  const processBackImageOCR = async (imgUrl: string) => {
    setIsOCRProcessing(true);
    setOcrStatusNotice('Optimizing & scanning back side address with multi-pass OCR...');
    try {
      // Contrast and sharpening optimization for mobile Samsung A12 back side text
      const { optimizedBase64 } = await optimizeImageForMobileOCR(imgUrl, { 
        side: 'back', 
        enhanceContrast: true, 
        sharpen: true 
      });
      const readyImg = optimizedBase64 || imgUrl;

      const metrics = await logOCRInputDetails(readyImg, docType);
      setOcrMetrics(metrics);

      const response = await safeFetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: readyImg,
          docType: docType,
          side: 'back',
        }),
      });

      console.log('[BACK OCR RESPONSE]:', { received: true, status: response.status, data: response.data });

      if (response.ok && response.data) {
        const rawText = response.data.rawText || response.data.extractedData?.rawText || '';
        const fields = response.data.fields || response.data.extractedData || {};
        const evidence: AddressExtractionEvidence = response.data.addressEvidence || response.data.extractedData?.addressEvidence || {
          value: fields.address || null,
          source: fields.address ? 'OCR' : 'OCR_UNCERTAIN',
          evidenceLines: fields.address ? fields.address.split('\n') : [],
          pinCode: fields.pinCode || '',
          district: fields.district || '',
          state: fields.state || '',
          confidence: fields.address ? 88 : 0,
        };

        setRawOcrText(rawText);
        setAddressEvidence(evidence);

        if (!isManuallyEdited) {
          const addr = fields.address || '';
          const pin = fields.pinCode || (addr.match(/\b\d{6}\b/)?.[0] || '');
          const dist = fields.district || '';
          const st = fields.state || '';

          setExtractedAddress(addr);
          setExtractedPinCode(pin);
          setExtractedDistrict(dist);
          setExtractedState(st);
        }

        if (fields.address) {
          setOcrStatusNotice('✓ Multi-line address successfully extracted from document back side.');
        } else {
          setOcrStatusNotice('⚠ Text detected but address was incomplete. Please review or enter manually below.');
        }
      } else {
        setOcrStatusNotice('⚠ Automatic OCR reading unavailable. You can enter the address manually below.');
      }
    } catch (err: any) {
      console.error('[BACK OCR ERROR]:', err);
      setOcrStatusNotice('⚠ Back side OCR error. You can verify and enter address manually below.');
    } finally {
      setIsOCRProcessing(false);
    }
  };

  const handleCanvasCaptured = async (croppedDataUrl: string, qrData?: string | null) => {
    setCapturedImage(croppedDataUrl);
    if (qrData) {
      setQrScannedData(qrData);
      const pin = qrData.match(/\b\d{6}\b/)?.[0] || '';
      setExtractedAddress(qrData);
      setExtractedPinCode(pin);
    }
    await processBackImageOCR(croppedDataUrl);
  };

  const handleAddressChange = (val: string) => {
    setExtractedAddress(val);
    setIsManuallyEdited(true);
    const pin = val.match(/\b\d{6}\b/)?.[0];
    if (pin) setExtractedPinCode(pin);
    if (addressEvidence) {
      setAddressEvidence({
        ...addressEvidence,
        value: val,
        manuallyEdited: true,
        source: 'MANUAL',
      });
    }
  };

  const handleConfirmBack = () => {
    const finalImg = scannedPages[0]?.processedImage || capturedImage;
    if (finalImg) {
      const finalEvidence: AddressExtractionEvidence = addressEvidence || {
        value: extractedAddress || null,
        source: isManuallyEdited ? 'MANUAL' : (extractedAddress ? 'OCR' : 'OCR_UNCERTAIN'),
        evidenceLines: extractedAddress ? extractedAddress.split('\n') : [],
        pinCode: extractedPinCode,
        district: extractedDistrict,
        state: extractedState,
        confidence: isManuallyEdited ? 100 : (extractedAddress ? 85 : 0),
        manuallyEdited: isManuallyEdited,
      };

      onBackCaptureCompleted(
        finalImg, 
        {
          address: extractedAddress,
          pinCode: extractedPinCode,
          district: extractedDistrict,
          state: extractedState,
        },
        finalEvidence,
        rawOcrText
      );
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center">
              2
            </span>
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">
              Step 2 of 2 (Back Document & Address)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 tracking-tight flex items-center gap-2">
            <Scan className="w-6 h-6 text-cyan-400" />
            <span>SCAN DOCUMENT - BACK SIDE & ADDRESS</span>
          </h2>
          <p className="text-xs text-slate-400">
            Scan back side of {docType.replace(/_/g, ' ')} for layout-aware multi-line address extraction and QR barcode decoding.
          </p>
        </div>

        <button
          onClick={onBackSkipped}
          className="text-xs font-semibold text-slate-400 hover:text-white px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 cursor-pointer"
          id="btn-skip-back-doc"
        >
          Skip Back Side
        </button>
      </div>

      {/* Mode Bar */}
      <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">Aadhaar / ID Back Side Scanner</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-extrabold uppercase">
            Samsung A12 Contrast Boost
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
            Multi-Line Parser
          </span>
        </div>
      </div>

      {/* Scanner or Adobe Scan Editor */}
      {isEditingInAdobeScan && scannedPages.length > 0 ? (
        <AdobeScanEditor
          pages={scannedPages}
          onUpdatePages={(updated) => setScannedPages(updated)}
          onAddPage={() => {
            setIsEditingInAdobeScan(false);
            setCapturedImage(null);
          }}
          onRetakeAll={() => {
            setIsEditingInAdobeScan(false);
            setScannedPages([]);
            setCapturedImage(null);
            setExtractedAddress('');
          }}
          onConfirmScans={async (finalPages) => {
            const finalImg = finalPages[0]?.processedImage || capturedImage;
            if (finalImg) {
              setCapturedImage(finalImg);
              setIsEditingInAdobeScan(false);
              await processBackImageOCR(finalImg);
            }
          }}
        />
      ) : !capturedImage ? (
        <DocumentScannerCanvas
          selectedDocType={docType}
          onCaptured={handleCanvasCaptured}
          onOpenEditor={(imgUrl) => {
            const newPage: ScannedPageItem = {
              id: `page-back-${Date.now()}`,
              rawImage: imgUrl,
              processedImage: imgUrl,
              corners: {
                topLeft: { x: 50, y: 50 },
                topRight: { x: 1150, y: 50 },
                bottomRight: { x: 1150, y: 700 },
                bottomLeft: { x: 50, y: 700 },
              },
              rotation: 0,
              filter: 'AUTO',
              docType: docType,
            };
            setScannedPages([newPage]);
            setIsEditingInAdobeScan(true);
          }}
        />
      ) : (
        /* Captured Preview & Real-time Verification Box */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-2xl">
          
          {/* Left Column: Image Preview & Actions */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Scan className="w-3.5 h-3.5 text-cyan-400" />
                <span>Captured Back Side</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {ocrMetrics ? `${ocrMetrics.width}×${ocrMetrics.height} px` : 'High-Res'}
              </span>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 aspect-[16/10] flex items-center justify-center group shadow-inner">
              <img
                src={capturedImage}
                alt="Captured Back Side"
                className="w-full h-full object-contain"
              />
              {isOCRProcessing && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-2">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-xs font-bold text-white">Extracting Multi-Line Address...</p>
                  <p className="text-[10px] text-slate-400">Preserving road, locality, district & pin code</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setCapturedImage(null);
                  setScannedPages([]);
                  setExtractedAddress('');
                  setAddressEvidence(null);
                }}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                id="btn-retake-back-image"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Retake</span>
              </button>

              <button
                type="button"
                disabled={isOCRProcessing}
                onClick={() => processBackImageOCR(capturedImage)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                id="btn-re-ocr-back-image"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isOCRProcessing ? 'animate-spin' : ''}`} />
                <span>Re-read OCR</span>
              </button>
            </div>

            {/* OCR Notice */}
            {ocrStatusNotice && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-300">
                {ocrStatusNotice}
              </div>
            )}
          </div>

          {/* Right Column: Address Form & Raw OCR Evidence */}
          <div className="md:col-span-7 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Extracted Address Details
                  </h3>
                  <p className="text-[10px] text-slate-400">Review or edit the multi-line address below</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRawBackOcr(!showRawBackOcr)}
                className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 flex items-center gap-1 cursor-pointer"
                id="btn-view-raw-back-ocr"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{showRawBackOcr ? 'Hide Raw OCR' : 'VIEW RAW BACK OCR'}</span>
              </button>
            </div>

            {/* Raw Back OCR Modal / Accordion */}
            {showRawBackOcr && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300 font-mono text-[11px] space-y-2.5 shadow-inner animate-fade-in">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-sans font-bold border-b border-slate-800 pb-1">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Raw Back-Side OCR Stream</span>
                  </span>
                  <span className="text-emerald-400 font-sans">EVIDENCE TRACE</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans uppercase font-bold">RAW TEXT BUFFER:</span>
                  <pre className="whitespace-pre-wrap break-words leading-relaxed max-h-32 overflow-y-auto p-2 bg-black rounded border border-amber-500/20 text-amber-200 text-[10px]">
                    {rawOcrText || '(No text extracted from back image yet. Click "Re-read OCR")'}
                  </pre>
                </div>

                {addressEvidence && (
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 text-[10px] space-y-1 font-sans">
                    <div className="text-cyan-400 font-bold uppercase">Address Evidence Breakdown:</div>
                    <div className="text-slate-300">
                      <span className="text-slate-500">Source:</span> {addressEvidence.source} | <span className="text-slate-500">Confidence:</span> {addressEvidence.confidence}%
                    </div>
                    {addressEvidence.pinCode && (
                      <div className="text-slate-300">
                        <span className="text-slate-500">Detected PIN:</span> <span className="text-emerald-300 font-mono font-bold">{addressEvidence.pinCode}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Address Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1">
                  <span>Complete Multi-Line Address</span>
                  <span className="text-cyan-400 font-normal text-[10px]">(Road, Locality, Area)</span>
                </label>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                  isManuallyEdited
                    ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                    : extractedAddress
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  {isManuallyEdited ? (
                    <>
                      <Check className="w-3 h-3 text-cyan-400" />
                      <span>MANUALLY VERIFIED</span>
                    </>
                  ) : extractedAddress ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>OCR READ</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>ENTER MANUALLY</span>
                    </>
                  )}
                </span>
              </div>

              <textarea
                value={extractedAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder="Flat / House No, Street, Locality, Landmark, City, District, State, PIN Code"
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium text-xs focus:outline-hidden focus:border-cyan-500 transition-colors leading-relaxed shadow-inner"
                id="input-back-doc-address"
              />
            </div>

            {/* Secondary Address Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase">PIN Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={extractedPinCode}
                  onChange={(e) => {
                    setExtractedPinCode(e.target.value);
                    setIsManuallyEdited(true);
                  }}
                  placeholder="6-digit PIN"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                  id="input-back-doc-pincode"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase">District</label>
                <input
                  type="text"
                  value={extractedDistrict}
                  onChange={(e) => {
                    setExtractedDistrict(e.target.value);
                    setIsManuallyEdited(true);
                  }}
                  placeholder="District / City"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-cyan-500"
                  id="input-back-doc-district"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase">State</label>
                <input
                  type="text"
                  value={extractedState}
                  onChange={(e) => {
                    setExtractedState(e.target.value);
                    setIsManuallyEdited(true);
                  }}
                  placeholder="State"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-cyan-500"
                  id="input-back-doc-state"
                />
              </div>
            </div>

            {/* Confirm & Next Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleConfirmBack}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
                id="btn-confirm-back-address"
              >
                <span>Confirm Address & Proceed</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* QR Code Scanned Info Box */}
      {qrScannedData && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white">QR Barcode Data Verified</p>
              <p className="text-slate-400 text-[11px] truncate max-w-lg">{qrScannedData}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
            QR Extracted
          </span>
        </div>
      )}

      {/* Action Bar when not editing or captured */}
      {!isEditingInAdobeScan && !capturedImage && (
        <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400">
            Back side capture extracts full multi-line address and verifies QR barcodes.
          </p>
          <button
            onClick={onBackSkipped}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 cursor-pointer"
            id="btn-skip-back-footer"
          >
            <span>Skip & Proceed</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
};
