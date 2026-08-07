import React from 'react';
import { Shield, Eye, EyeOff, Lock, Check, X, ShieldAlert, UserCheck } from 'lucide-react';
import { VisitorPrivacyPreferences, VisibilityMode, DocumentType } from '../types';
import { maskDocumentNumber, maskName } from '../utils/privacyUtils';

interface Props {
  isOpen: boolean;
  preferences: VisitorPrivacyPreferences;
  docType: DocumentType;
  sampleName?: string;
  sampleDocNumber?: string;
  isMaskedAadhaar?: boolean;
  onChangePreference: (field: keyof VisitorPrivacyPreferences, mode: VisibilityMode) => void;
  onSave: () => void;
  onClose: () => void;
}

export const PrivacyControlModal: React.FC<Props> = ({
  isOpen,
  preferences,
  docType,
  sampleName = 'Rahul Sharma',
  sampleDocNumber = '123456789012',
  isMaskedAadhaar = true,
  onChangePreference,
  onSave,
  onClose,
}) => {
  if (!isOpen) return null;

  const fields: { key: keyof VisitorPrivacyPreferences; label: string; description: string; allowMask?: boolean }[] = [
    { key: 'fullName', label: 'Full Name', description: 'Visitor identity name', allowMask: true },
    { key: 'photo', label: 'Live Photo', description: 'Facial verification snapshot', allowMask: false },
    { key: 'documentNumber', label: docType.includes('AADHAAR') ? 'Aadhaar Number' : 'Document ID Number', description: 'Government Identity Number', allowMask: true },
    { key: 'address', label: 'Residential Address', description: 'Address printed on document', allowMask: true },
    { key: 'dob', label: 'Date of Birth / Age', description: 'Birth date and age details', allowMask: true },
    { key: 'gender', label: 'Gender', description: 'Gender information', allowMask: false },
    { key: 'fatherName', label: "Father's / Guardian's Name", description: 'Relative name details', allowMask: true },
    { key: 'qrCode', label: 'QR Code / Barcode Data', description: 'Digital QR signature payload', allowMask: false },
    { key: 'documentImage', label: 'Document Image Scan', description: 'Full image scan of document', allowMask: true },
  ];

  const getGuardPreviewValue = (key: keyof VisitorPrivacyPreferences) => {
    const mode = preferences[key];
    if (mode === 'HIDDEN') return { text: '••• Hidden by Visitor •••', isHidden: true, isMasked: false };
    if (mode === 'MASKED') {
      if (key === 'fullName') return { text: maskName(sampleName), isHidden: false, isMasked: true };
      if (key === 'documentNumber') return { text: maskDocumentNumber(sampleDocNumber, docType, isMaskedAadhaar), isHidden: false, isMasked: true };
      return { text: '••••••••', isHidden: false, isMasked: true };
    }
    if (key === 'fullName') return { text: sampleName, isHidden: false, isMasked: false };
    if (key === 'documentNumber') return { text: sampleDocNumber, isHidden: false, isMasked: false };
    if (key === 'address') return { text: 'Flat 402, Block B, Green Heights', isHidden: false, isMasked: false };
    if (key === 'dob') return { text: '15/08/1992', isHidden: false, isMasked: false };
    if (key === 'fatherName') return { text: 'Suresh Sharma', isHidden: false, isMasked: false };
    return { text: 'Visible', isHidden: false, isMasked: false };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-left flex flex-col space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Visitor Visibility Controls
              </h3>
              <p className="text-xs text-slate-400">
                Choose exactly what details are shared with security officers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Security Guard Screen Preview */}
        <div className="bg-slate-950 border border-cyan-500/30 p-4 rounded-xl space-y-2.5 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Security Guard Live View
              </span>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
              Updates Live
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Name</span>
              <p className={`font-bold ${getGuardPreviewValue('fullName').isHidden ? 'text-slate-400 italic' : 'text-white'}`}>
                {getGuardPreviewValue('fullName').text}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Doc Number</span>
              <p className={`font-bold font-mono ${getGuardPreviewValue('documentNumber').isHidden ? 'text-slate-400 italic' : 'text-cyan-300'}`}>
                {getGuardPreviewValue('documentNumber').text}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Address</span>
              <p className={`text-[11px] ${getGuardPreviewValue('address').isHidden ? 'text-slate-400 italic' : 'text-slate-300'}`}>
                {getGuardPreviewValue('address').text}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">DOB / Age</span>
              <p className={`text-[11px] ${getGuardPreviewValue('dob').isHidden ? 'text-slate-400 italic' : 'text-slate-300'}`}>
                {getGuardPreviewValue('dob').text}
              </p>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="bg-cyan-950/40 border border-cyan-800/60 p-3 rounded-xl flex items-start gap-2.5 text-xs text-cyan-200">
          <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            Fields marked as <strong>Hidden</strong> are completely omitted from the security guard screen and reports.
          </span>
        </div>

        {/* Controls List */}
        <div className="space-y-3 pr-1">
          {fields.map((field) => {
            const current = preferences[field.key];
            return (
              <div
                key={field.key}
                className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{field.label}</h4>
                  <p className="text-[10px] text-slate-400">{field.description}</p>
                </div>

                {/* 3-State Toggle Buttons */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 gap-1 shrink-0">
                  {/* Visible */}
                  <button
                    type="button"
                    onClick={() => onChangePreference(field.key, 'VISIBLE')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                      current === 'VISIBLE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Visible</span>
                  </button>

                  {/* Mask */}
                  {field.allowMask !== false && (
                    <button
                      type="button"
                      onClick={() => onChangePreference(field.key, 'MASKED')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                        current === 'MASKED'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>Mask</span>
                    </button>
                  )}

                  {/* Hidden */}
                  <button
                    type="button"
                    onClick={() => onChangePreference(field.key, 'HIDDEN')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                      current === 'HIDDEN'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <EyeOff className="w-3 h-3" />
                    <span>Hidden</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save & Apply Visibility</span>
          </button>
        </div>

      </div>
    </div>
  );
};
