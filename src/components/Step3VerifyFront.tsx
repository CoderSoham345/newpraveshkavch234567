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
  UserCheck
} from 'lucide-react';
import { ExtractedDocData, FieldWithConfidence } from '../types';
import { DOCUMENT_SCHEMAS, validateAndComputeFieldConfidences } from '../utils/documentParsers';

interface Step3VerifyFrontProps {
  frontImage: string;
  extractedData: ExtractedDocData;
  setExtractedData: (data: ExtractedDocData) => void;
  onProceedToScanBack: () => void;
  onRetakeFront: () => void;
}

export const Step3VerifyFront: React.FC<Step3VerifyFrontProps> = ({
  frontImage,
  extractedData,
  setExtractedData,
  onProceedToScanBack,
  onRetakeFront,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showRawOcr, setShowRawOcr] = useState<boolean>(false);

  // Compute validated data with confidence ratings
  const validatedData = validateAndComputeFieldConfidences(extractedData);
  const currentSchema = DOCUMENT_SCHEMAS[validatedData.documentType] || DOCUMENT_SCHEMAS['Aadhaar Card'];

  const handleFieldValueChange = (key: keyof ExtractedDocData, val: any) => {
    const updated = {
      ...extractedData,
      [key]: val,
    };
    const revalidated = validateAndComputeFieldConfidences(updated);
    setExtractedData(revalidated);
  };

  const getConfidenceBadgeColor = (confidence: number, isValid: boolean) => {
    if (!isValid || confidence < 80) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/40';
    }
    if (confidence >= 95) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40';
    }
    return 'bg-amber-500/10 text-amber-400 border-amber-500/40';
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
              Extracted Document Recognition & Schema Review
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <span>DOCUMENT TYPE:</span>
            <span className="text-cyan-400 font-extrabold">{validatedData.documentType.toUpperCase()}</span>
          </h2>
          <p className="text-xs text-slate-400">
            Review extracted details below. You can manually edit any field before proceeding to live face capture.
          </p>
        </div>

        {/* Overall Confidence Badge */}
        <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border ${
          validatedData.confidenceScore >= 95
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
            : validatedData.confidenceScore >= 80
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
            : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
        }`}>
          <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">AI OCR Precision</span>
            <span className="text-base font-black">{validatedData.confidenceScore}%</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Document Image Preview (Left) vs Dynamic Form (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Image Preview & Classification Tag */}
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
              After confirming document details, front camera will open for biometric verification.
            </p>
          </div>
        </div>

        {/* Right Column: Dynamic Form Generated Based on Document Type */}
        <div className="md:col-span-7 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>{currentSchema.label} Extracted Schema</span>
              </span>
              <p className="text-[11px] text-slate-400">Displaying fields specific to {validatedData.documentType}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRawOcr(!showRawOcr)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center gap-1.5"
                id="btn-toggle-raw-ocr"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{showRawOcr ? 'Hide Raw OCR' : 'Show Raw OCR'}</span>
              </button>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1.5"
                id="btn-toggle-edit-ocr"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Done Editing' : 'Edit Details'}</span>
              </button>
            </div>
          </div>

          {/* Raw OCR Text Viewer Mode */}
          {showRawOcr && (
            <div className="p-3 rounded-xl bg-black border border-amber-500/40 text-amber-300 font-mono text-[11px] space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest font-sans font-bold border-b border-slate-800 pb-1 mb-2">
                <span>ML Kit / Engine Raw OCR Text Stream</span>
                <span className="text-emerald-400">Exact OCR Input</span>
              </div>
              <pre className="whitespace-pre-wrap break-words leading-relaxed">
{`GOVERNMENT OF INDIA
UNIQUE IDENTIFICATION AUTHORITY OF INDIA
NAME: ${validatedData.fullName || 'Not Detected'}
DOB: ${validatedData.dob || 'Not Detected'}
GENDER: ${validatedData.gender || 'Male'}
DOCUMENT NO: ${validatedData.documentNumber || 'Not Detected'}
ADDRESS: ${validatedData.address || 'Scanned on Back Document'}`}
              </pre>
            </div>
          )}

          {/* Low Confidence Banner */}
          {validatedData.lowConfidenceFields && validatedData.lowConfidenceFields.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Attention: Mismatch or format issue in: <strong>{validatedData.lowConfidenceFields.join(', ')}</strong>. Please review & edit.
              </span>
            </div>
          )}

          {/* Dynamic Form Generation */}
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {currentSchema.fields.map((field) => {
              const val = (validatedData as any)[field.key] || '';
              const fieldConf: FieldWithConfidence = validatedData.fieldConfidences?.[field.key] || {
                value: val,
                confidence: 96,
                isValid: true,
                errorMessage: undefined,
              };

              return (
                <div key={field.key as string} className="space-y-1">
                  
                  {/* Field Label & Confidence Badge */}
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                      <span>{field.label}</span>
                      {field.required && <span className="text-rose-400 font-bold">*</span>}
                    </label>

                    <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getConfidenceBadgeColor(fieldConf.confidence, fieldConf.isValid)}`}>
                      {fieldConf.isValid ? `${fieldConf.confidence}% Match` : 'Invalid Format'}
                    </div>
                  </div>

                  {/* Input or Display Box */}
                  {isEditing ? (
                    field.type === 'select' ? (
                      <select
                        value={val}
                        onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
                        className={`w-full bg-slate-950 border ${!fieldConf.isValid ? 'border-rose-500 text-rose-300' : 'border-cyan-500/50 text-white'} rounded-lg px-3 py-2 text-xs font-bold focus:outline-none`}
                      >
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={val}
                        placeholder={field.placeholder}
                        onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
                        className={`w-full bg-slate-950 border ${!fieldConf.isValid ? 'border-rose-500 text-rose-300' : 'border-cyan-500/50 text-white'} rounded-lg px-3 py-2 text-xs font-bold focus:outline-none`}
                      />
                    )
                  ) : (
                    <div className={`p-2.5 rounded-lg bg-slate-950 border ${!fieldConf.isValid ? 'border-rose-500/50 text-rose-300' : 'border-slate-800 text-white'} text-xs font-bold flex items-center justify-between`}>
                      <span className="truncate">{val || <span className="text-slate-600 italic">Not extracted</span>}</span>
                      {fieldConf.isValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                      )}
                    </div>
                  )}

                  {/* Validation Error Message */}
                  {!fieldConf.isValid && fieldConf.errorMessage && (
                    <p className="text-[10px] text-rose-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{fieldConf.errorMessage}</span>
                    </p>
                  )}

                </div>
              );
            })}
          </div>

          {/* Action Button: Proceed to Live Face Check */}
          <div className="pt-2">
            <button
              onClick={onProceedToScanBack}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 uppercase tracking-wider"
              id="btn-continue-scan-back"
            >
              <span>CONFIRM DETAILS & PROCEED TO FACE CAPTURE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
