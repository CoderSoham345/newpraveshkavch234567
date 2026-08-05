import React, { useState, useEffect } from 'react';
import { AlertTriangle, Camera, ShieldAlert, RefreshCw, Settings } from 'lucide-react';
import { requestCameraPermissions, openAppSettings } from '../utils/nativeCameraPermissions';

interface Props {
  isOpen: boolean;
  onPermissionGranted: () => void;
  onCancel?: () => void;
  errorMessage?: string | null;
}

export const CameraPermissionModal: React.FC<Props> = ({
  isOpen,
  onPermissionGranted,
  onCancel,
  errorMessage,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(errorMessage || null);
  const [isDenied, setIsDenied] = useState(false);

  useEffect(() => {
    if (errorMessage) {
      setError(errorMessage);
    }
  }, [errorMessage]);

  if (!isOpen) return null;

  const handleGrantPermission = async () => {
    setIsRequesting(true);
    setError(null);
    setIsDenied(false);

    try {
      const res = await requestCameraPermissions();
      if (res.granted) {
        onPermissionGranted();
      } else {
        setIsDenied(true);
        setError(res.error || 'Camera permission is required. Please allow camera access in Android system settings.');
      }
    } catch (err: any) {
      setIsDenied(true);
      setError(err?.message || 'Failed to request camera permission.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOpenSettings = async () => {
    await openAppSettings();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center flex flex-col items-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
          <Camera className="w-8 h-8 animate-pulse" />
        </div>

        <h3 className="text-lg font-bold text-white tracking-wide">
          Camera Permission Required
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed">
          PraveshKavach™ requires access to your device camera to scan visitor identity documents and perform face verification.
        </p>

        {error && (
          <div className="w-full p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl flex items-start gap-2.5 text-left text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="w-full pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleGrantPermission}
            disabled={isRequesting}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg border border-cyan-400/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            {isRequesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Requesting...</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Grant Permission</span>
              </>
            )}
          </button>

          {isDenied && (
            <button
              type="button"
              onClick={handleOpenSettings}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Open System Settings</span>
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800/60 hover:bg-slate-800 text-slate-400 transition-all cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
