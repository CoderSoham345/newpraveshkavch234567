/**
 * Developer OCR Debug Panel - Shows raw OCR output for debugging
 * Only visible when VITE_DEV_MODE=true
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, RotateCcw } from 'lucide-react';

export interface DevOCRPanelProps {
  rawOCRText: string | null;
  parsedData: Record<string, any>;
  qualityMetrics?: {
    overallConfidence: number;
    fieldLevelConfidence: Record<string, number>;
    warningFields: string[];
    missingFields: string[];
  };
  imageBase64?: string;
}

export function DevOCRPanel(props: DevOCRPanelProps) {
  const isDev = import.meta.env.DEV && localStorage.getItem('DEV_OCR_PANEL') === 'true';
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isDev) {
    return null;
  }

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-slate-900 border-2 border-amber-400 rounded-lg shadow-lg">
        {/* Header */}
        <div
          className="bg-amber-400 text-slate-900 p-3 cursor-pointer flex items-center justify-between font-bold"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>⚙️ DEV OCR PANEL</span>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="bg-slate-950 text-amber-300 p-4 max-h-96 overflow-y-auto text-xs font-mono space-y-3">
            {/* Quality Metrics */}
            {props.qualityMetrics && (
              <div className="border-b border-amber-400/30 pb-2">
                <div className="font-bold text-amber-400 mb-2">Quality Metrics:</div>
                <div>Overall: {props.qualityMetrics.overallConfidence}%</div>
                {props.qualityMetrics.warningFields.length > 0 && (
                  <div className="text-yellow-400">
                    ⚠️ Warnings: {props.qualityMetrics.warningFields.join(', ')}
                  </div>
                )}
                {props.qualityMetrics.missingFields.length > 0 && (
                  <div className="text-red-400">
                    ❌ Missing: {props.qualityMetrics.missingFields.join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Field Confidence Scores */}
            {props.qualityMetrics?.fieldLevelConfidence && (
              <div className="border-b border-amber-400/30 pb-2">
                <div className="font-bold text-amber-400 mb-2">Field Confidence:</div>
                <div className="space-y-1">
                  {Object.entries(props.qualityMetrics.fieldLevelConfidence).map(([field, confidence]) => (
                    <div key={field} className={confidence < 50 ? 'text-red-400' : 'text-green-400'}>
                      {field}: {confidence}%
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parsed Data */}
            <div className="border-b border-amber-400/30 pb-2">
              <div className="font-bold text-amber-400 mb-2">Parsed Data:</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {Object.entries(props.parsedData).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start gap-2 group">
                    <span className="text-cyan-300 flex-shrink-0">{key}:</span>
                    <span
                      className="text-amber-300 break-all flex-1 cursor-pointer hover:bg-amber-400/20 px-1 rounded"
                      onClick={() => handleCopy(String(value), key)}
                      title="Click to copy"
                    >
                      {String(value).substring(0, 50)}
                      {String(value).length > 50 ? '...' : ''}
                    </span>
                    {copiedField === key && <span className="text-green-400 flex-shrink-0 text-xs">✓ Copied</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Raw OCR Text */}
            {props.rawOCRText && (
              <div className="border-b border-amber-400/30 pb-2">
                <div className="font-bold text-amber-400 mb-2">Raw OCR Text:</div>
                <div className="bg-slate-900 p-2 rounded border border-amber-400/20 max-h-32 overflow-y-auto text-xs whitespace-pre-wrap break-words">
                  {props.rawOCRText}
                </div>
              </div>
            )}

            {/* Image Preview */}
            {props.imageBase64 && (
              <div className="border-b border-amber-400/30 pb-2">
                <div className="font-bold text-amber-400 mb-2">Image Preview:</div>
                <img
                  src={props.imageBase64}
                  alt="OCR Input"
                  className="w-full border border-amber-400/50 rounded max-h-48 object-cover"
                />
              </div>
            )}

            {/* Clear Button */}
            <button
              onClick={() => {
                localStorage.removeItem('DEV_OCR_PANEL');
                window.location.reload();
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} /> Clear & Hide
            </button>
          </div>
        )}
      </div>

      {/* Toggle Button (when collapsed) */}
      {!isExpanded && (
        <div className="mt-2 text-xs text-center">
          <button
            onClick={() => setIsExpanded(true)}
            className="text-amber-400 underline hover:text-amber-300"
          >
            Show OCR Debug
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Function to toggle dev panel visibility
 * Call from browser console: enableDevOCRPanel()
 */
export function enableDevOCRPanel() {
  localStorage.setItem('DEV_OCR_PANEL', 'true');
  console.log('Dev OCR Panel enabled. Refresh page to see it.');
}

export function disableDevOCRPanel() {
  localStorage.removeItem('DEV_OCR_PANEL');
  console.log('Dev OCR Panel disabled.');
}
