import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, XCircle, RefreshCw, Activity, AlertTriangle } from 'lucide-react';

export interface DiagnosticStep {
  step: number;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'PASS' | 'FAIL';
  details?: string;
}

export const CameraFixTest: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [steps, setSteps] = useState<DiagnosticStep[]>([
    { step: 1, name: 'navigator.mediaDevices exists', status: 'PENDING' },
    { step: 2, name: 'secure context (window.isSecureContext)', status: 'PENDING' },
    { step: 3, name: 'camera permission state query', status: 'PENDING' },
    { step: 4, name: 'getUserMedia() execution', status: 'PENDING' },
    { step: 5, name: 'MediaStream returned with video tracks', status: 'PENDING' },
    { step: 6, name: 'video.srcObject assigned', status: 'PENDING' },
    { step: 7, name: 'video.play() resolved', status: 'PENDING' },
    { step: 8, name: 'video.videoWidth > 0', status: 'PENDING' },
    { step: 9, name: 'video.videoHeight > 0', status: 'PENDING' },
  ]);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);

  const updateStep = (stepNum: number, status: 'RUNNING' | 'PASS' | 'FAIL', details?: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.step === stepNum ? { ...s, status, details } : s))
    );
  };

  const stopDiagnosticStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const runDiagnostic = async () => {
    stopDiagnosticStream();
    setIsRunning(true);
    setVideoDimensions(null);

    // Reset steps
    setSteps([
      { step: 1, name: 'navigator.mediaDevices exists', status: 'PENDING' },
      { step: 2, name: 'secure context (window.isSecureContext)', status: 'PENDING' },
      { step: 3, name: 'camera permission state query', status: 'PENDING' },
      { step: 4, name: 'getUserMedia() execution', status: 'PENDING' },
      { step: 5, name: 'MediaStream returned with video tracks', status: 'PENDING' },
      { step: 6, name: 'video.srcObject assigned', status: 'PENDING' },
      { step: 7, name: 'video.play() resolved', status: 'PENDING' },
      { step: 8, name: 'video.videoWidth > 0', status: 'PENDING' },
      { step: 9, name: 'video.videoHeight > 0', status: 'PENDING' },
    ]);

    try {
      // STEP 1
      updateStep(1, 'RUNNING');
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        updateStep(1, 'FAIL', 'navigator.mediaDevices is undefined');
        setIsRunning(false);
        return;
      }
      updateStep(1, 'PASS', 'navigator.mediaDevices is available');

      // STEP 2
      updateStep(2, 'RUNNING');
      const isSecure = typeof window !== 'undefined' ? window.isSecureContext : false;
      if (!isSecure) {
        updateStep(2, 'FAIL', 'window.isSecureContext is false (HTTPS/localhost required)');
      } else {
        updateStep(2, 'PASS', 'Secure Context verified');
      }

      // STEP 3
      updateStep(3, 'RUNNING');
      if (navigator.permissions?.query) {
        try {
          const perm = await navigator.permissions.query({ name: 'camera' as any });
          updateStep(3, 'PASS', `Permission state: ${perm.state}`);
        } catch (e: any) {
          updateStep(3, 'PASS', `Permission query not standard, skipped (${e.message})`);
        }
      } else {
        updateStep(3, 'PASS', 'navigator.permissions query not supported on this browser/WebView');
      }

      // STEP 4 & 5
      updateStep(4, 'RUNNING');
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        streamRef.current = stream;
        updateStep(4, 'PASS', 'getUserMedia() resolved');
      } catch (err: any) {
        updateStep(4, 'FAIL', `[${err.name}] ${err.message}`);
        setIsRunning(false);
        return;
      }

      updateStep(5, 'RUNNING');
      const videoTracks = stream.getVideoTracks();
      if (!videoTracks || videoTracks.length === 0) {
        updateStep(5, 'FAIL', 'No video tracks found in MediaStream');
        setIsRunning(false);
        return;
      }
      const trackLabel = videoTracks[0].label || 'Video Track';
      updateStep(5, 'PASS', `MediaStream active with track: ${trackLabel}`);

      // STEP 6
      updateStep(6, 'RUNNING');
      const video = videoRef.current;
      if (!video) {
        updateStep(6, 'FAIL', 'videoRef element is null');
        setIsRunning(false);
        return;
      }
      video.srcObject = stream;
      updateStep(6, 'PASS', 'video.srcObject set to stream');

      // STEP 7
      updateStep(7, 'RUNNING');
      try {
        await video.play();
        updateStep(7, 'PASS', 'video.play() promise resolved');
      } catch (err: any) {
        updateStep(7, 'FAIL', `video.play() failed: [${err.name}] ${err.message}`);
        setIsRunning(false);
        return;
      }

      // STEP 8 & 9 (Wait for video metadata if necessary)
      updateStep(8, 'RUNNING');
      updateStep(9, 'RUNNING');

      let attempts = 0;
      const checkDimensions = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
          updateStep(8, 'PASS', `videoWidth = ${video.videoWidth}px`);
          updateStep(9, 'PASS', `videoHeight = ${video.videoHeight}px`);
          setIsRunning(false);
        } else if (attempts < 20) {
          attempts++;
          setTimeout(checkDimensions, 100);
        } else {
          updateStep(8, 'FAIL', `videoWidth remained 0 after timeout`);
          updateStep(9, 'FAIL', `videoHeight remained 0 after timeout`);
          setIsRunning(false);
        }
      };

      checkDimensions();
    } catch (e: any) {
      console.error('Diagnostic exception:', e);
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runDiagnostic();
    return () => {
      stopDiagnosticStream();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex flex-col p-4 overflow-y-auto font-sans text-slate-100">
      <div className="max-w-2xl w-full mx-auto bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">CameraFixTest Diagnostic</h2>
              <p className="text-xs text-slate-400">9-Step Camera Pipeline Verification</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={() => {
                stopDiagnosticStream();
                onClose();
              }}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition"
            >
              Close
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Live Preview Box */}
          <div className="relative bg-black rounded-lg overflow-hidden border border-slate-700 aspect-video flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {videoDimensions && (
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur px-2.5 py-1 rounded text-xs font-mono text-emerald-400 border border-emerald-500/30">
                LIVE: {videoDimensions.width} x {videoDimensions.height}
              </div>
            )}
          </div>

          {/* Diagnostic Steps List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pipeline Verification Steps
              </span>
              <button
                onClick={runDiagnostic}
                disabled={isRunning}
                className="flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                <span>Rerun Test</span>
              </button>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 divide-y divide-slate-800">
              {steps.map((s) => (
                <div key={s.step} className="py-2.5 flex items-start justify-between text-sm">
                  <div className="flex items-start space-x-3">
                    <span className="font-mono text-xs text-slate-500 mt-0.5">
                      STEP {s.step}
                    </span>
                    <div>
                      <div className="font-medium text-slate-200">{s.name}</div>
                      {s.details && (
                        <div className={`text-xs mt-0.5 font-mono ${
                          s.status === 'FAIL' ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {s.details}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    {s.status === 'PASS' && (
                      <span className="inline-flex items-center space-x-1 text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PASS</span>
                      </span>
                    )}
                    {s.status === 'FAIL' && (
                      <span className="inline-flex items-center space-x-1 text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>FAILED</span>
                      </span>
                    )}
                    {s.status === 'RUNNING' && (
                      <span className="inline-flex items-center space-x-1 text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>TESTING</span>
                      </span>
                    )}
                    {s.status === 'PENDING' && (
                      <span className="text-xs text-slate-600 font-mono">PENDING</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
