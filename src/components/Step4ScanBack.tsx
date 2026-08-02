import React, { useState } from 'react';
import { 
  Camera, 
  CheckCircle2, 
  QrCode, 
  RotateCcw, 
  ArrowRight,
  ShieldCheck,
  Scan
} from 'lucide-react';
import { DocumentType } from '../types';
import { DocumentScannerCanvas } from './DocumentScannerCanvas';

interface Step4ScanBackProps {
  docType: DocumentType;
  onBackCaptureCompleted: (backImageUrl: string, addressData?: { address: string; pinCode: string }) => void;
  onBackSkipped: () => void;
}

export const Step4ScanBack: React.FC<Step4ScanBackProps> = ({
  docType,
  onBackCaptureCompleted,
  onBackSkipped,
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [qrScannedData, setQrScannedData] = useState<string | null>(null);

  const handleCanvasCaptured = (croppedDataUrl: string, qrData?: string | null) => {
    setCapturedImage(croppedDataUrl);
    if (qrData) {
      setQrScannedData(qrData);
    }
  };

  const handleConfirmBack = () => {
    if (capturedImage) {
      // Send extracted address if QR code contained address or allow user manual entry on verify screen
      const addressFromQr = qrScannedData ? qrScannedData : '';
      onBackCaptureCompleted(capturedImage, {
        address: addressFromQr,
        pinCode: addressFromQr ? (addressFromQr.match(/\b\d{6}\b/)?.[0] || '') : '',
      });
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
              Step 2 of 2 (Back Document)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 tracking-tight flex items-center gap-2">
            <Scan className="w-6 h-6 text-cyan-400" />
            <span>SCAN DOCUMENT - BACK SIDE & ADDRESS</span>
          </h2>
          <p className="text-xs text-slate-400">
            Scan back side of {docType} for address extraction and UIDAI / Barcode QR decoding.
          </p>
        </div>

        <button
          onClick={onBackSkipped}
          className="text-xs font-semibold text-slate-400 hover:text-white px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900"
          id="btn-skip-back-doc"
        >
          Skip Back Side
        </button>
      </div>

      {/* Mode Bar */}
      <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">Back Side Document Scanner</span>
        </div>
        <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-extrabold uppercase">
          Manual Capture Only
        </span>
      </div>

      {/* Real-time OpenCV Canvas or Captured Back Image */}
      {capturedImage ? (
        <div className="relative rounded-2xl bg-black border border-emerald-500/40 overflow-hidden shadow-2xl aspect-[16/10] sm:aspect-[16/9] flex flex-col items-center justify-center p-4">
          <img
            src={capturedImage}
            alt="Cropped Back Document"
            className="w-full h-full object-contain rounded-lg"
          />
          <div className="absolute top-4 left-4 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Back Document Captured</span>
          </div>

          {qrScannedData && (
            <div className="absolute bottom-4 left-4 bg-cyan-950/80 border border-cyan-500 text-cyan-300 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 backdrop-blur-md">
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span>QR Code Decoded</span>
            </div>
          )}
        </div>
      ) : (
        <DocumentScannerCanvas
          selectedDocType={docType}
          onCaptured={handleCanvasCaptured}
        />
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

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        {capturedImage ? (
          <>
            <button
              onClick={() => {
                setCapturedImage(null);
                setQrScannedData(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700"
              id="btn-retake-back-doc"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Back Side</span>
            </button>

            <button
              onClick={handleConfirmBack}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
              id="btn-confirm-back-side"
            >
              <span>CONTINUE TO FACE VERIFICATION</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={onBackSkipped}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2"
          >
            <span>Skip & Proceed to Face Check</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  );
};
