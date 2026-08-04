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
  Terminal
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
import { requestCameraPermissions } from '../utils/nativeCameraPermissions';
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

  // Detection and Validation States
  const [scanResult, setScanResult] = useState<ScanValidationResult | null>(null);
  const prevCornersRef = useRef<QuadCorners | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(true);

  // Stability & Hysteresis Tracking Refs across consecutive frames
  const lossFrameCountRef = useRef<number>(0);
  const lastValidQuadRef = useRef<DetectedQuad | null>(null);

  // Initialize camera stream
  const initCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      setErrorMessage(null);
      const permResult = await requestCameraPermissions();
      if (!permResult.granted) {
        setCameraPermission('denied');
        setErrorMessage(permResult.error || 'Camera permission denied. Please allow camera access in system settings.');
        return;
      }

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (e) {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      }

      setStream(mediaStream);
      setCameraPermission('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera Access Error:', err);
      setCameraPermission('denied');
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in settings.'
          : 'Camera hardware is busy or unavailable.'
      );
    }
  };

  useEffect(() => {
    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const toggleCameraFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
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

              // Green border and Ready-to-Capture when card quad is detected
              const isCardDetected = Boolean(result.quad);
              result.readyToCapture = isCardDetected;

              if (isCardDetected) {
                result.userGuidance = `✔ Card detected - Ready to capture`;
              } else {
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
          const guideW = width * 0.76;
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

          // 2. Dynamic Border Polygon Stroke & Tint Fill
          overlayCtx.save();

          const strokeColor = hasFace
            ? '#f43f5e' // Red for face warning
            : isConfirmedGreen
            ? '#10b981' // Green when stable document & readyToCapture
            : '#FFC800'; // Yellow guide when searching or aligning

          const fillColor = hasFace
            ? 'rgba(244, 63, 94, 0.15)'
            : isConfirmedGreen
            ? 'rgba(16, 185, 129, 0.22)'
            : 'rgba(255, 200, 0, 0.14)';

          overlayCtx.fillStyle = fillColor;
          overlayCtx.beginPath();
          overlayCtx.moveTo(c.topLeft.x, c.topLeft.y);
          overlayCtx.lineTo(c.topRight.x, c.topRight.y);
          overlayCtx.lineTo(c.bottomRight.x, c.bottomRight.y);
          overlayCtx.lineTo(c.bottomLeft.x, c.bottomLeft.y);
          overlayCtx.closePath();
          overlayCtx.fill();

          // Border Stroke following 4 corners continuously
          overlayCtx.strokeStyle = strokeColor;
          overlayCtx.lineWidth = isConfirmedGreen ? 5 : 3.5;
          overlayCtx.shadowColor = strokeColor;
          overlayCtx.shadowBlur = isConfirmedGreen ? 25 : 15;

          overlayCtx.beginPath();
          overlayCtx.moveTo(c.topLeft.x, c.topLeft.y);
          overlayCtx.lineTo(c.topRight.x, c.topRight.y);
          overlayCtx.lineTo(c.bottomRight.x, c.bottomRight.y);
          overlayCtx.lineTo(c.bottomLeft.x, c.bottomLeft.y);
          overlayCtx.closePath();
          overlayCtx.stroke();

          // 3. Corner Vertices & Reticle Brackets on all 4 corners
          const cornersArr = [c.topLeft, c.topRight, c.bottomRight, c.bottomLeft];
          cornersArr.forEach((pt) => {
            overlayCtx.fillStyle = '#ffffff';
            overlayCtx.beginPath();
            overlayCtx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
            overlayCtx.fill();

            overlayCtx.strokeStyle = strokeColor;
            overlayCtx.lineWidth = 2.5;
            overlayCtx.beginPath();
            overlayCtx.arc(pt.x, pt.y, 12, 0, Math.PI * 2);
            overlayCtx.stroke();
          });

          // 4. Animated Laser Line
          const time = Date.now() / 1000;
          const progress = (Math.sin(time * 3) + 1) / 2;
          const topX = c.topLeft.x + (c.topRight.x - c.topLeft.x) * progress;
          const topY = c.topLeft.y + (c.topRight.y - c.topLeft.y) * progress;
          const botX = c.bottomLeft.x + (c.bottomRight.x - c.bottomLeft.x) * progress;
          const botY = c.bottomLeft.y + (c.bottomRight.y - c.bottomLeft.y) * progress;

          overlayCtx.strokeStyle = isConfirmedGreen ? '#10b981' : '#FFC800';
          overlayCtx.lineWidth = 2.5;
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
  }, [selectedDocType, isCapturing]);

  // Execute Manual Capture on Button Click
  const executeCapture = () => {
    if (!videoRef.current || isCapturing) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (ctx && scanResult) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      let croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const qrData: string | null = scanResult.qrCodeData;

      if (scanResult.quad) {
        // Perspective Transformation: warped & cropped to exact rectangular card geometry
        croppedDataUrl = cropAndStraightenDocument(canvas, scanResult.quad.corners);
      }

      onCaptured(croppedDataUrl, qrData);
    }
    setIsCapturing(false);
  };

  const isReadyToCapture = Boolean(scanResult?.readyToCapture);
  const debug = scanResult?.debugStats;

  return (
    <div className="relative w-full rounded-2xl bg-black border border-slate-800 overflow-hidden shadow-2xl aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center">
      
      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Real-time Dynamic OpenCV Quad Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Top Action Bar & Live Guidance */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-col pointer-events-none space-y-2">
        
        {/* Controls Bar */}
        <div className="w-full flex items-center justify-between pointer-events-auto">
          {/* Camera Info Badge */}
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/80 text-cyan-300 border border-slate-700/80 shadow-md backdrop-blur-md flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>{facingMode === 'environment' ? 'Rear Camera' : 'Front (Selfie)'}</span>
          </span>

          <div className="flex items-center gap-2">
            {/* Toggle Debug Panel */}
            <button
              type="button"
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              className="px-2.5 py-1.5 rounded-full text-xs font-bold bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              title="Toggle Real-Time CV Debug Console"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showDebugPanel ? 'Hide Logs' : 'Debug Logs'}</span>
            </button>

            {/* Switch Camera Button */}
            <button
              type="button"
              onClick={toggleCameraFacingMode}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 shadow-lg border border-cyan-300 flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              title="Switch between Rear and Front Camera"
              id="btn-switch-doc-camera"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-once" />
              <span>Switch</span>
            </button>
          </div>
        </div>

        {/* Live Guidance Banner */}
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
            <Sparkles className="w-4 h-4 text-cyan-300 shrink-0 animate-spin" />
          )}
          <span>{scanResult?.userGuidance || 'Searching for document...'}</span>
        </div>

      </div>

      {/* REQUIRED REAL-TIME COMPUTER VISION DEBUG PANEL */}
      {showDebugPanel && (
        <div className="absolute top-24 left-3 z-20 w-64 sm:w-72 bg-slate-950/90 border border-cyan-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md text-[11px] font-mono space-y-1 text-slate-300 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-bold text-cyan-400 font-sans">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>OPENCV CV INSPECTOR</span>
            </span>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">
              30 FPS
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Contours Found:</span>
            <span className="font-bold text-slate-100">{debug?.contoursFound ?? 0}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Largest Contour:</span>
            <span className="font-bold text-slate-100">{debug?.largestArea ?? 0} px²</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Corner Count:</span>
            <span className="font-bold text-slate-100">{debug?.cornerCount ?? 0}/4</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Aspect Ratio:</span>
            <span className="font-bold text-cyan-300">{debug?.aspectRatio ?? 0}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Confidence:</span>
            <span className="font-bold text-cyan-300">{debug?.confidence ?? 0}%</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Detected Doc:</span>
            <span className="font-bold text-slate-100 truncate max-w-[130px]">{debug?.detectedDocument ?? 'None'}</span>
          </div>

          {debug?.rejectionReason && (
            <div className="flex justify-between text-rose-400">
              <span>Rejection Reason:</span>
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

          <div className="text-[9px] text-slate-500 truncate pt-0.5">
            Coords: {debug?.cornerCoords || 'None'}
          </div>
        </div>
      )}

      {/* Embedded QR Code Indicator Badge */}
      {scanResult?.qrCodeData && (
        <div className="absolute bottom-16 left-3 z-20 bg-cyan-950/85 border border-cyan-500/50 px-3 py-1.5 rounded-lg backdrop-blur-md flex items-center gap-2 text-cyan-300 text-xs font-semibold shadow-lg">
          <QrCode className="w-4 h-4 text-cyan-400" />
          <span>Embedded QR Code Detected</span>
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

      {/* Manual Capture Button Bar (ENABLED ONLY WHEN readyToCapture IS TRUE) */}
      <div className="absolute bottom-3 inset-x-0 z-20 flex items-center justify-center px-4">
        <button
          onClick={executeCapture}
          disabled={!isReadyToCapture || isCapturing}
          className={`px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-2xl flex items-center gap-2.5 uppercase tracking-wider transition-all transform ${
            isReadyToCapture && !isCapturing
              ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:scale-105 active:scale-95 text-slate-950 shadow-emerald-500/40 cursor-pointer ring-4 ring-emerald-400/30'
              : 'bg-slate-900/90 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
          }`}
          id="btn-manual-capture-canvas"
        >
          <Camera className="w-5 h-5" />
          <span>
            {isReadyToCapture ? 'CAPTURE PHOTO' : 'ALIGN A VALID DOCUMENT'}
          </span>
        </button>
      </div>

    </div>
  );
};
