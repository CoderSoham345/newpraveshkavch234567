import React, { useState } from 'react';
import { 
  Camera, 
  CheckCircle2, 
  RotateCcw,
  ShieldCheck,
  QrCode,
  Scan,
  ShieldAlert
} from 'lucide-react';
import { DocumentType } from '../types';
import { DocumentScannerCanvas } from './DocumentScannerCanvas';

interface Step2ScanFrontProps {
  selectedDocType: DocumentType;
  setSelectedDocType: (type: DocumentType) => void;
  onCaptureCompleted: (imageUrl: string, isSample?: boolean, sampleData?: any) => void;
  onCancel: () => void;
}

export const Step2ScanFront: React.FC<Step2ScanFrontProps> = ({
  selectedDocType,
  setSelectedDocType,
  onCaptureCompleted,
  onCancel,
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedQrCode, setDetectedQrCode] = useState<string | null>(null);

  // Supported document types - All 20+ types for comprehensive document support
  const supportedDocTypes: DocumentType[] = [
    'AUTOMATIC_DETECTION',
    'AADHAAR_FRONT',
    'AADHAAR_BACK',
    'PAN_CARD',
    'PASSPORT',
    'DRIVING_LICENCE',
    'VOTER_ID',
    'GOVT_EMPLOYEE_ID',
    'PRIVATE_EMPLOYEE_ID',
    'STUDENT_ID',
    'RC_BOOK',
    'OCI_CARD',
    'NREGA_JOB_CARD',
    'SENIOR_CITIZEN_CARD',
    'DISABILITY_ID_CARD',
    'HEALTH_INSURANCE_CARD',
    'POLICE_ID',
    'ARMY_ID',
    'OTHER_GOVT_ID',
    'OTHER_IDENTITY_DOC',
  ];

  const getDocumentLabel = (type: DocumentType): string => {
    const labels: Record<DocumentType, string> = {
      'AUTOMATIC_DETECTION': 'Automatic Detection (Recommended)',
      'AADHAAR_FRONT': 'Aadhaar Card (Front)',
      'AADHAAR_BACK': 'Aadhaar Card (Back)',
      'PAN_CARD': 'PAN Card',
      'PASSPORT': 'Passport',
      'DRIVING_LICENCE': 'Driving Licence',
      'VOTER_ID': 'Voter ID (EPIC)',
      'GOVT_EMPLOYEE_ID': 'Government Employee ID',
      'PRIVATE_EMPLOYEE_ID': 'Private Employee ID',
      'STUDENT_ID': 'Student ID',
      'RC_BOOK': 'Vehicle Registration Certificate (RC)',
      'OCI_CARD': 'OCI Card',
      'NREGA_JOB_CARD': 'NREGA Job Card',
      'SENIOR_CITIZEN_CARD': 'Senior Citizen Card',
      'DISABILITY_ID_CARD': 'Disability ID Card',
      'HEALTH_INSURANCE_CARD': 'Health Insurance Card',
      'POLICE_ID': 'Police ID',
      'ARMY_ID': 'Army ID',
      'OTHER_GOVT_ID': 'Other Government ID',
      'OTHER_IDENTITY_DOC': 'Other Identity Document',
    };
    return labels[type] || type;
  };

  const handleCanvasCaptured = (croppedDataUrl: string, qrCodeData?: string | null) => {
    setCapturedImage(croppedDataUrl);
    if (qrCodeData) {
      setDetectedQrCode(qrCodeData);
    }
  };

  const handleConfirmCapturedImage = () => {
    if (capturedImage) {
      onCaptureCompleted(capturedImage);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      
      {/* Step Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center">
              1
            </span>
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">
              Step 1 of 2 (Front Document)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 tracking-tight flex items-center gap-2">
            <Scan className="w-6 h-6 text-cyan-400" />
            <span>SCAN DOCUMENT - FRONT SIDE</span>
          </h2>
          <p className="text-xs text-slate-400">
            Scan any government-issued ID document. 20+ document types supported with automatic detection. Capture button will activate once document is detected.
          </p>
        </div>

        <button
          onClick={onCancel}
          className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900"
        >
          Cancel
        </button>
      </div>

      {/* Controls Bar: ID Type Selector & Manual Capture Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        
        {/* Document Type Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            SUPPORTED DOCUMENT TYPE
          </label>
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value as DocumentType)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-semibold focus:border-cyan-400 focus:outline-none"
            id="select-doc-type-front"
          >
            {supportedDocTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Manual Capture Requirement Status */}
        <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">Manual Capture Mode</span>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
            Strict Click to Capture
          </span>
        </div>

      </div>

      {/* Live OpenCV Document Scanner Viewport or Captured Preview */}
      {capturedImage ? (
        <div className="relative rounded-2xl bg-black border border-emerald-500/40 overflow-hidden shadow-2xl aspect-[16/10] sm:aspect-[16/9] flex flex-col items-center justify-center p-4">
          <img
            src={capturedImage}
            alt="Cropped Front Document"
            className="w-full h-full object-contain rounded-lg"
          />
          <div className="absolute top-4 left-4 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cropped & Perspective Transformed</span>
          </div>

          {detectedQrCode && (
            <div className="absolute bottom-4 left-4 bg-cyan-950/80 border border-cyan-500 text-cyan-300 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 backdrop-blur-md">
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span>QR Data Merged</span>
            </div>
          )}
        </div>
      ) : (
        <DocumentScannerCanvas
          selectedDocType={selectedDocType}
          onCaptured={handleCanvasCaptured}
        />
      )}

      {/* Action Buttons */}
      {capturedImage && (
        <div className="flex items-center justify-end gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setCapturedImage(null);
              setDetectedQrCode(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700"
            id="btn-retake-front-doc"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Document</span>
          </button>

          <button
            onClick={handleConfirmCapturedImage}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
            id="btn-confirm-front-doc"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Use Document Image</span>
          </button>
        </div>
      )}

      {/* REMOVED: Test Cards Picker - All data now must come from real OCR via Gemini API
           See ROOT_CAUSE_ANALYSIS.md for details on removing sample data injection */}

    </div>
  );
};
