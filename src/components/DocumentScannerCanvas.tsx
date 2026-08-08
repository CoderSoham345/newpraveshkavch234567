import React, { useEffect, useRef, useState } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Camera, 
  ShieldCheck,
  QrCode,
  Scan,
  XCircle,
  RefreshCw,
  Smartphone,
  Info,
  Maximize2,
  FileCheck2,
  Sliders,
  Check,
  Ban,
  Terminal,
  Zap,
  ZapOff,
  Sparkle,
  Layers,
  Activity
} from 'lucide-react';
import { DocumentType } from '../types';
import { 
  analyzeDocumentFrame, 
  smoothCorners, 
  cropAndStraightenDocument, 
  QuadCorners, 
  ScanValidationResult,
  DetectedQuad
} from '../utils/cvEngine';
import { 
  initializeDocumentCamera, 
  stopCameraStream, 
  registerAppResumeListener, 
  logCamera, 
  takeNativePhoto 
} from '../services/cameraService';
import { CameraPermissionModal } from './CameraPermissionModal';

interface DocumentScannerCanvasProps {
  selectedDocType: DocumentType;
  onCaptured: (croppedImageUrl: string, qrCodeData?: string | null) => void;
}

export const DocumentScannerCanvas: React.FC<DocumentScannerCanvasProps> = ({
  selectedDocType,
  onCaptured,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenFrameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Scanner Modes & Settings
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isAutoScanMode, setIsAutoScanMode] = useState<boolean>(true); // Auto-capture default
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(true);

  // Detection and Validation States
  const [scanResult, setScanResult] = useState<ScanValidationResult | null>(null);
  const prevCornersRef = useRef<QuadCorners | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Auto Scan Steady Frame Counter
  const steadyFrameCountRef = useRef<number>(0);
  const [autoCaptureProgress, setAutoCaptureProgress] = useState<number>(0); // 0 to 100%

  // Stability & Hysteresis Tracking Refs across consecutive frames
  const lossFrameCountRef = useRef<number>(0);
  const lastValidQuadRef = useRef<DetectedQuad | null>(null);

  // Initialize camera stream
  const initCamera = async () => {
    try {
      if (stream) {
        stopCameraStream(stream);
        setStream(null);
      }

      setErrorMessage(null);
      
      const initResult = await initializeDocumentCamera({ facingMode });

      if (!initResult.permissionState.granted) {
        setCameraPermission('denied');
        setErrorMessage(initResult.error || 'Camera permission denied. Please allow camera access.');
        return;
      }

      setCameraPermission('granted');

      if (initResult.stream) {
        setStream(initResult.stream);
        if (videoRef.current) {
          videoRef.current.srcObject = initResult.stream;
        }
      } else {
        setErrorMessage(initResult.error || 'Failed to initialize live camera.');
      }
    } catch (err: any) {
      logCamera(`Camera stream error:`, err);
      setErrorMessage(err?.message || 'Camera stream is unavailable.');
    }
  };

  const handleNativeCameraCapture = async () => {
    const photoUrl = await takeNativePhoto();
    if (photoUrl) {
      onCaptured(photoUrl, null);
    }
  };

  useEffect(() => {
    initCamera();

    const unregisterResume = registerAppResumeListener(() => {
      initCamera();
    });

    return () => {
      unregisterResume();
      if (stream) {
        stopCameraStream(stream);
      }
    };
  }, [facingMode]);

  // Flashlight / Torch Toggle
  const toggleTorch = async () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const capabilities = videoTrack.getCapabilities ? (videoTrack.getCapabilities() as any) : {};
      if (capabilities.torch) {
        const nextTorch = !isTorchOn;
        await videoTrack.applyConstraints({
          advanced: [{ torch: nextTorch }] as any
        });
        setIsTorchOn(nextTorch);
      } else {
        setIsTorchOn(!isTorchOn);
      }
    } catch (e) {
      setIsTorchOn(!isTorchOn);
    }
  };

  const toggleCameraFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Execute Manual or Auto Capture
  const triggerCaptureAction = (resultToCapture: ScanValidationResult | null) => {
    if (!videoRef.current || isCapturing) return;
    logCamera('Capture started');
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    const activeResult = resultToCapture || scanResult;

    if (ctx && activeResult) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      let croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const qrData: string | null = activeResult.qrCodeData;

      if (activeResult.quad) {
        // Perspective Transformation: warped & cropped & enhanced to exact card geometry
        croppedDataUrl = cropAndStraightenDocument(canvas, activeResult.quad.corners);
      }

      logCamera('Capture successful');
      onCaptured(croppedDataUrl, qrData);
    }
    setIsCapturing(false);
  };

  // Real-Time Computer Vision Continuous Corner Tracking & Overlay Animation
  useEffect(() => {
    let animFrameId: number;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (canvas) {
        const width = video?.videoWidth || canvas.clientWidth || 1280;
        const height = video?.videoHeight || canvas.clientHeight || 720;

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        let currentResult: ScanValidationResult | null = null;

        if (video && video.readyState === video.HAVE_ENOUGH_DATA && !isCapturing) {
          if (!hiddenFrameCanvasRef.current) {
            hiddenFrameCanvasRef.current = document.createElement('canvas');
          }
          const frameCanvas = hiddenFrameCanvasRef.current;
          frameCanvas.width = width;
          frameCanvas.height = height;
          const frameCtx = frameCanvas.getContext('2d');

          if (frameCtx) {
            frameCtx.drawImage(video, 0, 0, width, height);

            // Run Computer Vision Frame Analysis
            const result = analyzeDocumentFrame(frameCanvas, selectedDocType);

            // --- FACE CHECK OVERRIDE ---
            if (result.hasFaceInFrame) {
              lossFrameCountRef.current = 0;
              lastValidQuadRef.current = null;
              prevCornersRef.current = null;
              steadyFrameCountRef.current = 0;
              setAutoCaptureProgress(0);

              result.readyToCapture = false;
              result.userGuidance = 'Please point camera toward the document.';
            } else {
              // --- STABILITY & HYSTERESIS SYSTEM ---
              const currentQuad = result.quad;

              if (currentQuad) {
                lossFrameCountRef.current = 0;
                lastValidQuadRef.current = currentQuad;

                // Smooth corners to eliminate camera shake/jitter
                const smoothed = smoothCorners(currentQuad.corners, prevCornersRef.current, 0.35);
                if (smoothed) {
                  currentQuad.corners = smoothed;
                  prevCornersRef.current = smoothed;
                }
              } else if (lastValidQuadRef.current && lossFrameCountRef.current < 25) {
                // Hysteresis Grace Period: hold detection while moving/shaking (< 1 second)
                lossFrameCountRef.current += 1;
                result.quad = lastValidQuadRef.current;
                result.quadDetected = true;

                const smoothed = smoothCorners(lastValidQuadRef.current.corners, prevCornersRef.current, 0.20);
                if (smoothed) {
                  result.quad.corners = smoothed;
                  prevCornersRef.current = smoothed;
                }
              } else {
                lossFrameCountRef.current = 0;
                lastValidQuadRef.current = null;
                prevCornersRef.current = null;

                result.quad = null;
                result.quadDetected = false;
              }

              // Ready-to-Capture logic
              const isCardDetected = Boolean(result.quad);
              result.readyToCapture = isCardDetected && result.cardDistance !== 'TOO_FAR';

              if (isCardDetected) {
                if (result.cardDistance === 'TOO_FAR') {
                  result.userGuidance = 'Move closer';
                  steadyFrameCountRef.current = 0;
                  setAutoCaptureProgress(0);
                } else {
                  result.userGuidance = 'Hold steady...';
                  // Auto-scan trigger progress tracking
                  steadyFrameCountRef.current += 1;
                  const progress = Math.min(100, Math.round((steadyFrameCountRef.current / 16) * 100));
                  setAutoCaptureProgress(progress);

                  if (isAutoScanMode && steadyFrameCountRef.current >= 16 && !isCapturing) {
                    steadyFrameCountRef.current = 0;
                    triggerCaptureAction(result);
                  }
                }
              } else {
                steadyFrameCountRef.current = 0;
                setAutoCaptureProgress(0);
                result.userGuidance = 'Searching for document...';
              }
            }

            currentResult = result;
            setScanResult(result);
          }
        }

        // Draw dynamic overlay quadrilateral canvas (ALWAYS ACTIVE EVERY FRAME)
        const overlayCtx = canvas.getContext('2d');
        if (overlayCtx) {
          overlayCtx.clearRect(0, 0, width, height);

          // Default guide box when searching
          const guideW = width * 0.78;
          const guideH = guideW / 1.58;
          const guideX = (width - guideW) / 2;
          const guideY = (height - guideH) / 2;

          const defaultGuideCorners: QuadCorners = {
            topLeft: { x: guideX, y: guideY },
            topRight: { x: guideX + guideW, y: guideY },
            bottomRight: { x: guideX + guideW, y: guideY + guideH },
            bottomLeft: { x: guideX, y: guideY + guideH },
          };

          const activeResult = currentResult || scanResult;
          const activeCorners = activeResult?.quad ? activeResult.quad.corners : defaultGuideCorners;
          const c = activeCorners;

          const hasFace = Boolean(activeResult?.hasFaceInFrame);
          const isConfirmedGreen = Boolean(activeResult?.readyToCapture);

          // 1. Darkened Outer Mask with cutout around activeCorners
          overlayCtx.fillStyle = 'rgba(2, 6, 23, 0.65)';
          overlayCtx.beginPath();
          overlayCtx.rect(0, 0, width, height);
          overlayCtx.moveTo(c.topLeft.x, c.topLeft.y);
          overlayCtx.lineTo(c.bottomLeft.x, c.bottomLeft.y);
          overlayCtx.lineTo(c.bottomRight.x, c.bottomRight.y);
          overlayCtx.lineTo(c.topRight.x, c.topRight.y);
          overlayCtx.closePath();
          overlayCtx.fill('evenodd');

          // 2. Dynamic Yellow Polygon Border (Google Drive Scanner style)
          overlayCtx.save();

          const strokeColor = hasFace
            ? '#f43f5e' // Red for face warning
            : isConfirmedGreen
            ? '#10b981' // Green when ready to capture
            : '#facc15'; // Bright Yellow polygon stroke

          const fillColor = hasFace
            ? 'rgba(244, 63, 94, 0.15)'
            : isConfirmedGreen
            ? 'rgba(16, 185, 129, 0.22)'
            : 'rgba(250, 204, 21, 0.16)';

          overlayCtx.fillStyle = fillColor;
          overlayCtx.beginPath();
          overlayCtx.moveTo(c.topLeft.x, c.topLeft.y);
          overlayCtx.lineTo(c.topRight.x, c.topRight.y);
          overlayCtx.lineTo(c.bottomRight.x, c.bottomRight.y);
          overlayCtx.lineTo(c.bottomLeft.x, c.bottomLeft.y);
          overlayCtx.closePath();
          overlayCtx.fill();

          // Smooth Yellow/Green Border Stroke
          overlayCtx.strokeStyle = strokeColor;
          overlayCtx.lineWidth = isConfirmedGreen ? 5 : 4;
          overlayCtx.shadowColor = strokeColor;
          overlayCtx.shadowBlur = isConfirmedGreen ? 25 : 18;

          overlayCtx.beginPath();
          overlayCtx.moveTo(c.topLeft.x, c.topLeft.y);
          overlayCtx.lineTo(c.topRight.x, c.topRight.y);
          overlayCtx.lineTo(c.bottomRight.x, c.bottomRight.y);
          overlayCtx.lineTo(c.bottomLeft.x, c.bottomLeft.y);
          overlayCtx.closePath();
          overlayCtx.stroke();

          // 3. Google Drive Scanner Corner Brackets on all 4 detected corners
          const cornersArr = [
            { pt: c.topLeft, angle: 0 },
            { pt: c.topRight, angle: 90 },
            { pt: c.bottomRight, angle: 180 },
            { pt: c.bottomLeft, angle: 270 }
          ];

          cornersArr.forEach(({ pt }) => {
            // Corner vertex circle
            overlayCtx.fillStyle = '#ffffff';
            overlayCtx.beginPath();
            overlayCtx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
            overlayCtx.fill();

            // Outer reticle ring
            overlayCtx.strokeStyle = strokeColor;
            overlayCtx.lineWidth = 3;
            overlayCtx.beginPath();
            overlayCtx.arc(pt.x, pt.y, 14, 0, Math.PI * 2);
            overlayCtx.stroke();
          });

          // 4. Animated Scanning Laser Line
          const time = Date.now() / 1000;
          const progress = (Math.sin(time * 3.5) + 1) / 2;
          const topX = c.topLeft.x + (c.topRight.x - c.topLeft.x) * progress;
          const topY = c.topLeft.y + (c.topRight.y - c.topLeft.y) * progress;
          const botX = c.bottomLeft.x + (c.bottomRight.x - c.bottomLeft.x) * progress;
          const botY = c.bottomLeft.y + (c.bottomRight.y - c.bottomLeft.y) * progress;

          overlayCtx.strokeStyle = isConfirmedGreen ? '#10b981' : '#facc15';
          overlayCtx.lineWidth = 3;
          overlayCtx.shadowBlur = 20;
          overlayCtx.beginPath();
          overlayCtx.moveTo(topX, topY);
          overlayCtx.lineTo(botX, botY);
          overlayCtx.stroke();

          overlayCtx.restore();
        }
      }

      animFrameId = requestAnimationFrame(processFrame);
    };

    animFrameId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animFrameId);
  }, [selectedDocType, isCapturing, isAutoScanMode]);

  const isReadyToCapture = Boolean(scanResult?.readyToCapture);
  const debug = scanResult?.debugStats;

  return (
    <div className="relative w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center">
      
      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Real-time Dynamic OpenCV Quad Polygon Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Top Google Drive Scanner Control Header */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-col pointer-events-none space-y-2">
        
        {/* Header Action Controls */}
        <div className="w-full flex items-center justify-between pointer-events-auto">
          {/* Torch / Flashlight Toggle */}
          <button
            type="button"
            onClick={toggleTorch}
            className={`p-2.5 rounded-full font-bold shadow-lg border backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center justify-center ${
              isTorchOn
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-400/30'
                : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
            title="Toggle Flashlight / Torch"
            id="btn-toggle-torch"
          >
            {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
          </button>

          {/* Mode Switcher: Auto Scan vs Manual */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-full p-1 shadow-md backdrop-blur-md">
            <button
              type="button"
              onClick={() => setIsAutoScanMode(true)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                isAutoScanMode
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Auto Scan
            </button>
            <button
              type="button"
              onClick={() => setIsAutoScanMode(false)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                !isAutoScanMode
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Manual
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Real-Time CV Inspector Logs */}
            <button
              type="button"
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              className="p-2.5 rounded-full text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              title="Toggle OpenCV Debug Inspector"
            >
              <Terminal className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Camera Switcher */}
            <button
              type="button"
              onClick={toggleCameraFacingMode}
              className="p-2.5 rounded-full text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              title="Switch Camera"
              id="btn-switch-doc-camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Guidance Status Badge */}
        <div className={`px-4 py-2 rounded-xl text-xs font-extrabold shadow-xl flex items-center justify-center gap-2 backdrop-blur-md transition-all text-center pointer-events-auto ${
          isReadyToCapture
            ? 'bg-emerald-500/90 text-slate-950 border border-emerald-300 shadow-emerald-500/30'
            : scanResult?.hasFaceInFrame
            ? 'bg-rose-950/90 text-rose-200 border border-rose-500'
            : 'bg-slate-900/90 text-slate-200 border border-slate-700'
        }`}>
          {isReadyToCapture ? (
            <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
          ) : scanResult?.hasFaceInFrame ? (
            <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0 animate-bounce" />
          ) : (
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0 animate-spin" />
          )}
          <span>{scanResult?.userGuidance || 'Searching for document...'}</span>
        </div>

      </div>

      {/* REAL-TIME OPENCV INSPECTOR LOGS */}
      {showDebugPanel && (
        <div className="absolute top-24 left-3 z-20 w-64 sm:w-72 bg-slate-950/90 border border-amber-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md text-[11px] font-mono space-y-1 text-slate-300 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-bold text-amber-400 font-sans">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>OPENCV SCANNER ENGINE</span>
            </span>
            <span className="text-[10px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800">
              60 FPS
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Contours Found:</span>
            <span className="font-bold text-slate-100">{debug?.contoursFound ?? 0}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Largest Area:</span>
            <span className="font-bold text-slate-100">{debug?.largestArea ?? 0} px²</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Corners Detected:</span>
            <span className="font-bold text-slate-100">{debug?.cornerCount ?? 0}/4</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Aspect Ratio:</span>
            <span className="font-bold text-amber-300">{debug?.aspectRatio ?? 0}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Confidence:</span>
            <span className="font-bold text-amber-300">{debug?.confidence ?? 0}%</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Doc Type:</span>
            <span className="font-bold text-slate-100 truncate max-w-[130px]">{debug?.detectedDocument ?? 'None'}</span>
          </div>

          {debug?.rejectionReason && (
            <div className="flex justify-between text-rose-400">
              <span>Rejection:</span>
              <span className="font-bold truncate max-w-[120px]">{debug.rejectionReason}</span>
            </div>
          )}

          <div className="flex justify-between border-t border-slate-800 pt-1">
            <span className="text-slate-400 font-bold">Capture State:</span>
            <span className={`font-extrabold px-1.5 py-0.5 rounded text-[10px] ${
              isReadyToCapture
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {debug?.captureState ?? (isReadyToCapture ? 'READY' : 'DISABLED')}
            </span>
          </div>
        </div>
      )}

      {/* Embedded QR Code Badge */}
      {scanResult?.qrCodeData && (
        <div className="absolute bottom-20 left-3 z-20 bg-amber-950/85 border border-amber-500/50 px-3 py-1.5 rounded-lg backdrop-blur-md flex items-center gap-2 text-amber-300 text-xs font-semibold shadow-lg">
          <QrCode className="w-4 h-4 text-amber-400" />
          <span>QR Code Detected</span>
        </div>
      )}

      {/* Camera Permission Modal */}
      <CameraPermissionModal
        isOpen={cameraPermission === 'denied'}
        errorMessage={errorMessage}
        onPermissionGranted={() => {
          setCameraPermission('prompt');
          initCamera();
        }}
      />

      {/* Google Drive Style Bottom Camera Shutter Bar */}
      <div className="absolute bottom-3 inset-x-0 z-20 flex flex-col items-center justify-center px-4 space-y-2">
        
        {/* Auto-scan Progress Ring Indicator */}
        {isAutoScanMode && autoCaptureProgress > 0 && (
          <div className="w-48 bg-slate-900/90 border border-amber-500/50 rounded-full h-2 overflow-hidden shadow-lg backdrop-blur-md">
            <div 
              className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full transition-all duration-75"
              style={{ width: `${autoCaptureProgress}%` }}
            />
          </div>
        )}

        {errorMessage && (
          <button
            onClick={handleNativeCameraCapture}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Take Photo with Native Camera</span>
          </button>
        )}

        <button
          onClick={() => triggerCaptureAction(null)}
          disabled={!isReadyToCapture || isCapturing}
          className={`relative group px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-2xl flex items-center gap-2.5 uppercase tracking-wider transition-all transform ${
            isReadyToCapture && !isCapturing
              ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:scale-105 active:scale-95 text-slate-950 shadow-amber-400/40 cursor-pointer ring-4 ring-amber-400/30'
              : 'bg-slate-900/90 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
          }`}
          id="btn-manual-capture-canvas"
        >
          <Camera className="w-5 h-5" />
          <span>
            {isReadyToCapture ? 'CAPTURE DOCUMENT' : 'ALIGN VALID DOCUMENT'}
          </span>
        </button>

      </div>

    </div>
  );
};
