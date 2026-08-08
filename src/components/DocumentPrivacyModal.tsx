import React from 'react';
import { Lock, CheckCircle2 } from 'lucide-react';
import { DocumentType, PrivacyMode, AadhaarPrivacySettings } from '../types';
import { getDocumentPrivacyConfig } from '../utils/documentPrivacyConfig';
import { maskIdentityNumber } from '../utils/privacyUtils';

interface Props {
  isOpen: boolean;
  documentType?: DocumentType | string;
  privacyMode?: PrivacyMode;
  settings?: AadhaarPrivacySettings; // For backward compatibility
  identityValue?: string; // Extracted identity number if available
  onSelectOption?: (mode: PrivacyMode) => void;
  onUpdateSettings?: (useMasked: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const DocumentPrivacyModal: React.FC<Props> = ({
  isOpen,
  documentType = 'UNKNOWN',
  privacyMode = 'masked',
  settings,
  identityValue,
  onSelectOption,
  onUpdateSettings,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const config = getDocumentPrivacyConfig(documentType);

  // Support both privacyMode ('masked' | 'unmasked') and settings ({ useMaskedAadhaar: boolean })
  const isMasked = settings !== undefined
    ? settings.useMaskedAadhaar
    : privacyMode === 'masked';

  const handleModeSelection = (masked: boolean) => {
    const mode: PrivacyMode = masked ? 'masked' : 'unmasked';
    if (onSelectOption) {
      onSelectOption(mode);
    }
    if (onUpdateSettings) {
      onUpdateSettings(masked);
    }
  };

  const maskedPreviewText = identityValue
    ? maskIdentityNumber(documentType, identityValue)
    : config.maskedPreviewExample;

  const fullPreviewText = identityValue || config.fullPreviewExample;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-left flex flex-col space-y-5">
        
        {/* Header Icon & Title */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
              {config.headerTitle}
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
              Privacy Settings
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
          Your identity belongs to you. Choose how your {config.displayName} information will be displayed during visitor verification.
        </p>

        {/* Radio Options */}
        <div className="space-y-3">
          
          {/* Option 1: Masked Document (Recommended) */}
          <label
            onClick={() => handleModeSelection(true)}
            className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
              isMasked
                ? 'bg-cyan-950/40 border-cyan-500/80 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <input
              type="radio"
              name="documentPrivacy"
              checked={isMasked}
              onChange={() => handleModeSelection(true)}
              className="mt-1 w-4 h-4 text-cyan-500 focus:ring-cyan-400 border-slate-700 bg-slate-900 cursor-pointer"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{config.maskedOptionTitle}</span>
                <span className="text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {config.maskedDescription}
              </p>
              <p className="text-[11px] font-mono text-cyan-300 pt-0.5">
                Preview: {maskedPreviewText}
              </p>
            </div>
          </label>

          {/* Option 2: Show Full Document Number */}
          <label
            onClick={() => handleModeSelection(false)}
            className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
              !isMasked
                ? 'bg-cyan-950/40 border-cyan-500/80 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <input
              type="radio"
              name="documentPrivacy"
              checked={!isMasked}
              onChange={() => handleModeSelection(false)}
              className="mt-1 w-4 h-4 text-cyan-500 focus:ring-cyan-400 border-slate-700 bg-slate-900 cursor-pointer"
            />
            <div className="space-y-1">
              <span className="text-sm font-bold text-white">{config.fullOptionTitle}</span>
              <p className="text-xs text-slate-300">
                {config.fullDescription}
              </p>
              <p className="text-[11px] font-mono text-slate-400 pt-0.5">
                Preview: {fullPreviewText}
              </p>
            </div>
          </label>

        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-3 px-5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg border border-cyan-400/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply Privacy Settings & Continue</span>
          </button>
        </div>

      </div>
    </div>
  );
};

// Also export as PrivacySettings component alias to match user prompt requirement
export const PrivacySettings = DocumentPrivacyModal;
