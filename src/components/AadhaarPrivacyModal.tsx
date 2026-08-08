import React from 'react';
import { DocumentPrivacyModal } from './DocumentPrivacyModal';
import { AadhaarPrivacySettings, DocumentType, PrivacyMode } from '../types';

interface Props {
  isOpen: boolean;
  documentType?: DocumentType | string;
  settings?: AadhaarPrivacySettings;
  privacyMode?: PrivacyMode;
  identityValue?: string;
  onSelectOption?: (useMaskedOrMode: any) => void;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const AadhaarPrivacyModal: React.FC<Props> = ({
  isOpen,
  documentType = 'AADHAAR_FRONT',
  settings,
  privacyMode,
  identityValue,
  onSelectOption,
  onConfirm,
  onCancel,
}) => {
  const handleSelectOption = (mode: PrivacyMode) => {
    if (onSelectOption) {
      // If the caller expects boolean (useMasked) or PrivacyMode string
      const isMasked = mode === 'masked';
      onSelectOption(isMasked as any);
      onSelectOption(mode as any);
    }
  };

  return (
    <DocumentPrivacyModal
      isOpen={isOpen}
      documentType={documentType}
      privacyMode={privacyMode || (settings ? (settings.useMaskedAadhaar ? 'masked' : 'unmasked') : 'masked')}
      settings={settings}
      identityValue={identityValue}
      onSelectOption={handleSelectOption}
      onUpdateSettings={(useMasked) => {
        if (onSelectOption) {
          onSelectOption(useMasked as any);
        }
      }}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};
