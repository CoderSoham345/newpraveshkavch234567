import React, { useState } from 'react';
import { DocumentType } from '../types';
import { DocumentDetector, DocumentValidator, EXTRACTION_TEMPLATES } from '../services/ocrValidationService';
import { Camera, Upload, Zap, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface ScannedDocument {
  type: DocumentType;
  confidence: number;
  fields: Record<string, { value: string; confidence: number; status: string }>;
  rawOCRText: string;
}

interface Props {
  onDocumentScanned: (doc: ScannedDocument) => void;
  documentType?: DocumentType;
}

export function EnhancedDocumentScanner({ onDocumentScanned, documentType = 'AUTOMATIC_DETECTION' }: Props) {
  const [selectedType, setSelectedType] = useState<DocumentType>(documentType);
  const [scannedDoc, setScannedDoc] = useState<ScannedDocument | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfidenceWarning, setShowConfidenceWarning] = useState(false);

  const DOCUMENT_OPTIONS: { value: DocumentType; label: string }[] = [
    { value: 'AUTOMATIC_DETECTION', label: 'Automatic Detection (Recommended)' },
    { value: 'AADHAAR_FRONT', label: 'Aadhaar Card (Front)' },
    { value: 'AADHAAR_BACK', label: 'Aadhaar Card (Back)' },
    { value: 'PAN_CARD', label: 'PAN Card' },
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'DRIVING_LICENCE', label: 'Driving Licence' },
    { value: 'VOTER_ID', label: 'Voter ID (EPIC)' },
    { value: 'GOVT_EMPLOYEE_ID', label: 'Government Employee ID' },
    { value: 'PRIVATE_EMPLOYEE_ID', label: 'Private Employee ID' },
    { value: 'STUDENT_ID', label: 'Student ID' },
    { value: 'RC_BOOK', label: 'Vehicle Registration Certificate (RC)' },
    { value: 'OCI_CARD', label: 'OCI Card' },
    { value: 'NREGA_JOB_CARD', label: 'NREGA Job Card' },
    { value: 'SENIOR_CITIZEN_CARD', label: 'Senior Citizen Card' },
    { value: 'DISABILITY_ID_CARD', label: 'Disability ID Card' },
    { value: 'HEALTH_INSURANCE_CARD', label: 'Health Insurance Card' },
    { value: 'POLICE_ID', label: 'Police ID' },
    { value: 'ARMY_ID', label: 'Army ID' },
    { value: 'OTHER_GOVT_ID', label: 'Other Government ID' },
    { value: 'OTHER_IDENTITY_DOC', label: 'Other Identity Document' },
  ];

  const mockOCRResponse = (selectedType: DocumentType): ScannedDocument => {
    const mockText = `UNIQUE IDENTIFICATION AUTHORITY OF INDIA
AADHAAR
735653806992
Name: SOHAM SANDIP GONBHARE
Gender: Male
DOB: 15/07/2006
Address: XYZ Road, Mumbai 400706
State: Maharashtra
PIN: 400706`;

    const detectedType = selectedType === 'AUTOMATIC_DETECTION' 
      ? DocumentDetector.detectDocumentType(mockText)
      : selectedType;

    const fields: Record<string, { value: string; confidence: number; status: string }> = {};
    
    // Mock extraction based on document type
    if (detectedType === 'AADHAAR_FRONT') {
      const validations = {
        documentNumber: DocumentValidator.validateAadhaarNumber('735653806992'),
        name: DocumentValidator.validateName('SOHAM SANDIP GONBHARE'),
        gender: { value: 'Male', confidence: 100, isValid: true },
        dob: DocumentValidator.validateDateOfBirth('15/07/2006'),
        age: { value: '18', confidence: 95, isValid: true },
      };

      Object.entries(validations).forEach(([key, val]: any) => {
        fields[key] = {
          value: val.value,
          confidence: val.confidence,
          status: val.validationStatus,
        };
      });
    }

    return {
      type: detectedType,
      confidence: 95,
      fields,
      rawOCRText: mockText,
    };
  };

  const handleScan = async () => {
    setIsProcessing(true);
    setShowConfidenceWarning(false);

    try {
      // Simulate OCR processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = mockOCRResponse(selectedType);
      setScannedDoc(result);

      // Show warning if confidence is below 85%
      if (Object.values(result.fields).some((f: any) => f.confidence < 85)) {
        setShowConfidenceWarning(true);
      }

      onDocumentScanned(result);
    } finally {
      setIsProcessing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-400 bg-green-900/30';
    if (confidence >= 50) return 'text-yellow-400 bg-yellow-900/30';
    return 'text-red-400 bg-red-900/30';
  };

  return (
    <div className="space-y-6">
      {/* Document Type Selection */}
      <div className="bg-slate-800 rounded-lg p-6">
        <label className="block text-sm font-semibold text-slate-300 mb-3">
          Select Document Type
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as DocumentType)}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
        >
          {DOCUMENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-400 mt-2">
          💡 Automatic Detection is recommended - system will identify document type automatically
        </p>
      </div>

      {/* Scanner Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleScan}
          disabled={isProcessing}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:opacity-50 text-white rounded-lg font-semibold transition"
        >
          <Camera className="w-5 h-5" />
          {isProcessing ? 'Scanning...' : 'Scan Document'}
        </button>
        <button
          onClick={handleScan}
          disabled={isProcessing}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg font-semibold transition"
        >
          <Upload className="w-5 h-5" />
          {isProcessing ? 'Processing...' : 'Upload Image'}
        </button>
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-3 p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
          <div className="animate-spin">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-blue-300">Processing with OCR.Space...</span>
        </div>
      )}

      {/* Confidence Warning */}
      {showConfidenceWarning && (
        <div className="flex items-start gap-3 p-4 bg-yellow-900/30 border border-yellow-500 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 font-semibold">Needs Review</p>
            <p className="text-yellow-200 text-sm">Some fields have low confidence. Please verify manually.</p>
          </div>
        </div>
      )}

      {/* Extraction Results */}
      {scannedDoc && (
        <div className="space-y-4">
          {/* Document Type Detection */}
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-300">Detected Document Type</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getConfidenceColor(scannedDoc.confidence)}`}>
                {scannedDoc.confidence}% Confidence
              </span>
            </div>
            <p className="text-lg font-bold text-cyan-400">
              {DOCUMENT_OPTIONS.find(d => d.value === scannedDoc.type)?.label}
            </p>
          </div>

          {/* Extracted Fields */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Extracted Fields</h3>
            <div className="space-y-3">
              {Object.entries(scannedDoc.fields).map(([fieldName, fieldData]: any) => (
                <div key={fieldName} className="bg-slate-700 rounded p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase">{fieldName.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-sm font-semibold text-white mt-1">{fieldData.value}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getConfidenceColor(fieldData.confidence)}`}>
                        {fieldData.confidence}%
                      </span>
                      {fieldData.status === 'VERIFIED' && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                      {fieldData.status === 'NEEDS_REVIEW' && (
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                      )}
                      {fieldData.status === 'INVALID' && (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Raw OCR Text */}
          <details className="bg-slate-800 rounded-lg p-4 cursor-pointer">
            <summary className="text-sm font-semibold text-slate-300 hover:text-slate-200">
              📄 View Raw OCR Text
            </summary>
            <pre className="mt-3 p-3 bg-slate-900 rounded text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap break-words">
              {scannedDoc.rawOCRText}
            </pre>
          </details>

          {/* Manual Review Section */}
          {showConfidenceWarning && (
            <div className="bg-amber-900/20 border border-amber-600 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-amber-300 mb-3">Manual Verification Required</h4>
              <div className="space-y-2">
                {Object.entries(scannedDoc.fields)
                  .filter(([_, f]: any) => f.confidence < 85)
                  .map(([fieldName, _]: any) => (
                    <div key={fieldName} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Enter correct ${fieldName}`}
                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:border-cyan-400"
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
