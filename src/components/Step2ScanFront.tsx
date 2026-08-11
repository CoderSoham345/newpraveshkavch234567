import React, { useState } from 'react';
import { 
  Camera, 
  CheckCircle2, 
  RotateCcw,
  ShieldCheck,
  QrCode,
  Scan,
  ShieldAlert,
  Lock,
  SlidersHorizontal
} from 'lucide-react';
import { DocumentType, AadhaarPrivacySettings } from '../types';
import { DocumentScannerCanvas } from './DocumentScannerCanvas';
import { AadhaarPrivacyModal } from './AadhaarPrivacyModal';
import { getDocumentPrivacyConfig } from '../utils/documentPrivacyConfig';
import { AdobeScanEditor, ScannedPageItem } from './AdobeScanEditor';

interface Step2ScanFrontProps {
  selectedDocType: DocumentType;
  setSelectedDocType: (type: DocumentType) => void;
  aadhaarSettings?: AadhaarPrivacySettings;
  onUpdateAadhaarSettings?: (settings: AadhaarPrivacySettings) => void;
  onCaptureCompleted: (imageUrl: string, isSample?: boolean, sampleData?: any) => void;
  onCancel: () => void;
}

export const Step2ScanFront: React.FC<Step2ScanFrontProps> = ({
  selectedDocType,
  setSelectedDocType,
  aadhaarSettings = { useMaskedAadhaar: true },
  onUpdateAadhaarSettings,
  onCaptureCompleted,
  onCancel,
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedQrCode, setDetectedQrCode] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [scannedPages, setScannedPages] = useState<ScannedPageItem[]>([]);
  const [isEditingInAdobeScan, setIsEditingInAdobeScan] = useState<boolean>(false);

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
    'VISITOR_PASS',
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
      'VISITOR_PASS': 'Visitor Pass',
      'UNKNOWN': 'Other / Unrecognized Identity Document',
    };
    return labels[type] || type;
  };

  const handleCanvasCaptured = (
    croppedDataUrl: string, 
    qrCodeData?: string | null,
    validation?: any,
    ocrData?: any
  ) => {
    setCapturedImage(croppedDataUrl);
    if (qrCodeData) {
      setDetectedQrCode(qrCodeData);
    }
    // Automatically proceed directly with the validated cropped image and extracted OCR data
    onCaptureCompleted(croppedDataUrl, false, ocrData);
  };

  const handleConfirmCapturedImage = () => {
    const finalImg = scannedPages[0]?.processedImage || capturedImage;
    if (finalImg) {
      onCaptureCompleted(finalImg);
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
            Scan any government-issued ID document. 20+ document types supported with automatic edge detection and Adobe Scan editor.
          </p>
        </div>

        <button
          onClick={onCancel}
          className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900"
        >
          Cancel
        </button>
      </div>

      {/* Controls Bar: ID Type Selector & Aadhaar Privacy Toggle */}
      {!isEditingInAdobeScan && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
          
          {/* Document Type Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              SUPPORTED DOCUMENT TYPE
            </label>
            <select
              value={selectedDocType}
              onChange={(e) => {
                const newType = e.target.value as DocumentType;
                setSelectedDocType(newType);
                setShowPrivacyModal(true);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-semibold focus:border-cyan-400 focus:outline-none"
              id="select-doc-type-front"
            >
              {supportedDocTypes.map((type) => (
                <option key={type} value={type}>
                  {getDocumentLabel(type)}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy Setting Indicator & Trigger */}
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-xs font-bold text-white block">
                  {aadhaarSettings.useMaskedAadhaar
                    ? `Masked ${getDocumentPrivacyConfig(selectedDocType).displayName} Active`
                    : `Full ${getDocumentPrivacyConfig(selectedDocType).displayName} Mode`}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {aadhaarSettings.useMaskedAadhaar
                    ? getDocumentPrivacyConfig(selectedDocType).maskedPreviewExample
                    : getDocumentPrivacyConfig(selectedDocType).fullPreviewExample}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-extrabold uppercase transition-colors cursor-pointer"
            >
              Edit Privacy
            </button>
          </div>

        </div>
      )}

      {/* Live Automatic Document Edge Detection & Capture Canvas OR Adobe Scan Editor */}
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
          }}
          onConfirmScans={(finalPages) => {
            const finalImg = finalPages[0]?.processedImage || capturedImage;
            if (finalImg) {
              onCaptureCompleted(finalImg);
            }
          }}
        />
      ) : (
        <DocumentScannerCanvas
          selectedDocType={selectedDocType}
          onCaptured={handleCanvasCaptured}
          onOpenEditor={(imgUrl) => {
            const newPage: ScannedPageItem = {
              id: `page-front-${Date.now()}`,
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
              docType: selectedDocType,
            };
            setScannedPages([newPage]);
            setIsEditingInAdobeScan(true);
          }}
        />
      )}

      {/* Document Privacy Selection Modal */}
      <AadhaarPrivacyModal
        isOpen={showPrivacyModal}
        documentType={selectedDocType}
        settings={aadhaarSettings}
        onSelectOption={(useMasked) => {
          if (onUpdateAadhaarSettings) {
            onUpdateAadhaarSettings({ useMaskedAadhaar: useMasked });
          }
        }}
        onConfirm={() => setShowPrivacyModal(false)}
        onCancel={() => setShowPrivacyModal(false)}
      />

    </div>
  );
};
