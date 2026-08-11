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
  Info,
  Terminal,
  Zap,
  ZapOff,
  RotateCcw,
  Settings,
  ArrowRight,
  Scissors,
  Sliders,
  Image as ImageIcon
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
  requestCameraPermissions,
  openAppSettings,
  takeNativePhoto,
  CameraPermissionStatus
} from '../services/cameraService';

interface DocumentScannerCanvasProps {
  selectedDocType: DocumentType;
  onCaptured: (croppedImageUrl: string, qrCodeData?: string | null) => void;
  onOpenEditor?: (croppedImageUrl: string) => void;
}

export const DocumentScannerCanvas: React.FC<DocumentScannerCanvasProps> = ({
  selectedDocType,
  onCaptured,
  onOpenEditor,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenFrameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraPermissionStatus>('CHECKING_PERMISSION');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Scanner Modes & Settings
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isAutoScanMode, setIsAutoScanMode] = useState<boolean>(true); // Auto-capture default
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false);

  // Captured Image State for Freeze/Retake/Continue Flow
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedQrData, setCapturedQrData] = useState<string | null>(null);
  const [detectionFailed, setDetectionFailed] = useState<boolean>(false);
  const highResCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  // Stop camera tracks helper
  const handleStopCamera = () => {
    if (stream) {
      stopCameraStream(stream);
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Initialize camera stream
  const initCamera = async () => {
    try {
      handleStopCamera();
      setErrorMessage(null);
      setCameraState('CAMERA_STARTING');

      const initResult = await initializeDocumentCamera({ facingMode });

      if (!initResult.permissionState.granted) {
        setCameraState('PERMISSION_DENIED');
        setErrorMessage(
          initResult.error || 'PraveshKavach needs camera access to scan the visitor\'s identity document.'
        );
        return;
      }

      if (initResult.stream) {
        setStream(initResult.stream);
        setCameraState('CAMERA_ACTIVE');
        if (videoRef.current) {
          videoRef.current.srcObject = initResult.stream;
          await videoRef.current.play().catch((e) => logCamera('Video play error:', e));
        }
      } else {
        setCameraState('CAMERA_ERROR');
        setErrorMessage(initResult.error || 'Failed to initialize live camera feed.');
      }
    } catch (err: any) {
      logCamera(`Camera stream error:`, err);
      setCameraState('CAMERA_ERROR');
      setErrorMessage(err?.message || 'Camera stream is unavailable.');
    }
  };

  const handleNativeCameraFallback = async () => {
    logCamera('User clicked Native Camera fallback');
    const photoDataUrl = await takeNativePhoto();
    if (photoDataUrl) {
      setCapturedImage(photoDataUrl);
      setCameraState('CAPTURED');
      handleStopCamera();
    }
  };

  const handleRequestPermission = async () => {
    setCameraState('REQUESTING_PERMISSION');
    setErrorMessage(null);
    const res = await requestCameraPermissions();
    if (res.granted) {
      initCamera();
    } else {
      setCameraState('PERMISSION_DENIED');
      setErrorMessage(
        res.error || 'PraveshKavach needs camera access to scan the visitor\'s identity document.'
      );
    }
  };

  useEffect(() => {
    initCamera();

    const unregisterResume = registerAppResumeListener(() => {
      if (cameraState !== 'CAPTURED') {
        initCamera();
      }
    });

    return () => {
      unregisterResume();
      handleStopCamera();
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

  // Capture frame action
  const triggerCaptureAction = (resultToCapture: ScanValidationResult | null) => {
    if (!videoRef.current || isCapturing) return;
    logCamera('Capture frame started');
    setIsCapturing(true);
    setDetectionFailed(false);

    const video = videoRef.current;
    const highResCanvas = document.createElement('canvas');
    highResCanvas.width = video.videoWidth || 1920;
    highResCanvas.height = video.videoHeight || 1080;
    const ctx = highResCanvas.getContext('2d');

    const activeResult = resultToCapture || scanResult;

    if (ctx) {
      ctx.drawImage(video, 0, 0, highResCanvas.width, highResCanvas.height);
      highResCanvasRef.current = highResCanvas;

      const qrData: string | null = activeResult?.qrCodeData || null;

      // RE-DETECT DOCUMENT ON HIGH-RESOLUTION CAPTURE IMAGE
      const highResAnalysis = analyzeDocumentFrame(highResCanvas, selectedDocType);

      let finalCorners: QuadCorners | null = null;

      if (highResAnalysis.quadDetected && highResAnalysis.quad) {
        finalCorners = highResAnalysis.quad.corners;
      } else if (activeResult?.quad) {
        // Proportional scale preview corners to high-res dimensions
        const previewW = canvasRef.current?.width || 1280;
        const previewH = canvasRef.current?.height || 720;
        const scaleX = highResCanvas.width / (previewW || 1);
        const scaleY = highResCanvas.height / (previewH || 1);
        const c = activeResult.quad.corners;
        finalCorners = {
          topLeft: { x: c.topLeft.x * scaleX, y: c.topLeft.y * scaleY },
          topRight: { x: c.topRight.x * scaleX, y: c.topRight.y * scaleY },
          bottomRight: { x: c.bottomRight.x * scaleX, y: c.bottomRight.y * scaleY },
          bottomLeft: { x: c.bottomLeft.x * scaleX, y: c.bottomLeft.y * scaleY },
        };
      }

      if (finalCorners) {
        const croppedDataUrl = cropAndStraightenDocument(highResCanvas, finalCorners);
        logCamera('Frame captured with high-res auto crop & perspective transform');
        setCapturedImage(croppedDataUrl);
        setCapturedQrData(qrData);
        setCameraState('CAPTURED');
        handleStopCamera();
        setIsCapturing(false);
      } else {
        // AUTOMATIC DETECTION FAILED - SHOW FAILURE FALLBACK
        logCamera('Document edges could not be detected on high-res capture');
        setDetectionFailed(true);
        setCapturedQrData(qrData);
        setCameraState('CAPTURED');
        handleStopCamera();
        setIsCapturing(false);
      }
    } else {
      setIsCapturing(false);
    }
  };

  // Fallback: Use full image if automatic detection fails
  const handleUseFullImageFallback = () => {
    if (highResCanvasRef.current) {
      const canvas = highResCanvasRef.current;
      const fullCorners: QuadCorners = {
        topLeft: { x: 0, y: 0 },
        topRight: { x: canvas.width, y: 0 },
        bottomRight: { x: canvas.width, y: canvas.height },
        bottomLeft: { x: 0, y: canvas.height },
      };
      const enhancedFullUrl = cropAndStraightenDocument(canvas, fullCorners);
      onCaptured(enhancedFullUrl, capturedQrData);
    }
  };

  // Retake captured photo
  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedQrData(null);
    setScanResult(null);
    setDetectionFailed(false);
    highResCanvasRef.current = null;
    steadyFrameCountRef.current = 0;
    setAutoCaptureProgress(0);
    initCamera();
  };

  // Continue with captured photo
  const handleContinue = () => {
    if (capturedImage) {
      onCaptured(capturedImage, capturedQrData);
    }
  };

  // Real-Time Computer Vision Continuous Corner Tracking & Overlay Animation
  useEffect(() => {
    if (cameraState !== 'CAMERA_ACTIVE') return;

    let animFrameId: number;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (canvas && video && cameraState === 'CAMERA_ACTIVE') {
        const width = video.videoWidth || canvas.clientWidth || 1280;
        const height = video.videoHeight || canvas.clientHeight || 720;

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        let currentResult: ScanValidationResult | null = null;

        if (video.readyState === video.HAVE_ENOUGH_DATA && !isCapturing) {
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
              result.userGuidance = 'HOLD DOCUMENT STRAIGHT';
            } else {
              // --- STABILITY & HYSTERESIS SYSTEM ---
              const currentQuad = result.quad;

              if (currentQuad) {
                lossFrameCountRef.current = 0;
                lastValidQuadRef.current = currentQuad;

                const smoothed = smoothCorners(currentQuad.corners, prevCornersRef.current, 0.35);
                if (smoothed) {
                  currentQuad.corners = smoothed;
                  prevCornersRef.current = smoothed;
                }
              } else if (lastValidQuadRef.current && lossFrameCountRef.current < 25) {
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

              // Ready-to-Capture logic & guidance messages
              const isCardDetected = Boolean(result.quad);
              result.readyToCapture = isCardDetected && result.cardDistance !== 'TOO_FAR';

              if (isCardDetected) {
                if (result.cardDistance === 'TOO_FAR') {
                  result.userGuidance = 'MOVE CLOSER';
                  steadyFrameCountRef.current = 0;
                  setAutoCaptureProgress(0);
                } else if (result.cardDistance === 'TOO_CLOSE') {
                  result.userGuidance = 'MOVE FARTHER';
                  steadyFrameCountRef.current = 0;
                  setAutoCaptureProgress(0);
                } else {
                  result.userGuidance = 'DOCUMENT ALIGNED';
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
                result.userGuidance = 'SEARCHING FOR DOCUMENT...';
              }
            }

            currentResult = result;
            setScanResult(result);
          }
        }

        // Draw dynamic overlay quadrilateral canvas
        const overlayCtx = canvas.getContext('2d');
        if (overlayCtx) {
          overlayCtx.clearRect(0, 0, width, height);

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

          // Darkened Outer Mask
          overlayCtx.fillStyle = 'rgba(2, 6, 23, 0.65)';
          overlayCtx.beginPath();
          overlayCtx.rect(0, 0, width, height);
          overlayCtx.moveTo(c.topLeft.x, c.topLeft.y);
          overlayCtx.lineTo(c.bottomLeft.x, c.bottomLeft.y);
          overlayCtx.lineTo(c.bottomRight.x, c.bottomRight.y);
          overlayCtx.lineTo(c.topRight.x, c.topRight.y);
          overlayCtx.closePath();
          overlayCtx.fill('evenodd');

          // Dynamic Polygon Border
          overlayCtx.save();

          const strokeColor = hasFace
            ? '#f43f5e'
            : isConfirmedGreen
            ? '#10b981'
            : '#facc15';

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

          // Corner Brackets
          const cornersArr = [
            { pt: c.topLeft },
            { pt: c.topRight },
            { pt: c.bottomRight },
            { pt: c.bottomLeft }
          ];

          cornersArr.forEach(({ pt }) => {
            overlayCtx.fillStyle = '#ffffff';
            overlayCtx.beginPath();
            overlayCtx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
            overlayCtx.fill();

            overlayCtx.strokeStyle = strokeColor;
            overlayCtx.lineWidth = 3;
            overlayCtx.beginPath();
            overlayCtx.arc(pt.x, pt.y, 14, 0, Math.PI * 2);
            overlayCtx.stroke();
          });

          // Scanning Laser Line
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
  }, [selectedDocType, isCapturing, isAutoScanMode, cameraState]);

  const isReadyToCapture = Boolean(scanResult?.readyToCapture);
  const debug = scanResult?.debugStats;

  // --- FAILURE FALLBACK DISPLAY ---
  if (cameraState === 'CAPTURED' && detectionFailed) {
    return (
      <div className="w-full rounded-2xl bg-slate-950 border border-amber-500/60 p-6 sm:p-8 text-center flex flex-col items-center justify-center space-y-5 shadow-2xl animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-1.5 max-w-md">
          <h3 className="text-base font-bold text-white tracking-wide uppercase">
            Document Edges Could Not Be Detected
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            The scanner could not locate clear document boundaries. You can retake the scan or proceed using the full camera capture.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md pt-2">
          <button
            type="button"
            onClick={handleRetake}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
            id="btn-retake-scan-fallback"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Retake Scan</span>
          </button>

          <button
            type="button"
            onClick={handleUseFullImageFallback}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold shadow-lg border border-emerald-400/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
            id="btn-use-full-image-fallback"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Use Full Image</span>
          </button>
        </div>
      </div>
    );
  }

  // --- CAPTURED STATE DISPLAY ---
  if (cameraState === 'CAPTURED' && capturedImage) {
    return (
      <div className="relative w-full rounded-2xl bg-slate-950 border border-emerald-500/40 overflow-hidden shadow-2xl flex flex-col items-center justify-center p-4 sm:p-6 space-y-4 animate-fade-in">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm tracking-wide">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>DOCUMENT DETECTED ✓ Auto-cropped & Straightened</span>
        </div>

        <div className="relative max-w-lg w-full rounded-xl overflow-hidden border-2 border-emerald-500/50 shadow-2xl bg-slate-900">
          <img 
            src={capturedImage} 
            alt="Captured Document" 
            className="w-full h-auto object-contain max-h-[350px] mx-auto"
          />
          {capturedQrData && (
            <div className="absolute bottom-2 left-2 right-2 bg-slate-950/90 border border-emerald-500/50 p-2 rounded-lg text-xs font-mono text-emerald-300 truncate flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>QR Code Extracted</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 w-full max-w-md pt-2">
          <button
            type="button"
            onClick={handleRetake}
            className="flex-1 py-3 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            id="btn-retake-captured-doc"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>RETAKE</span>
          </button>

          {onOpenEditor && (
            <button
              type="button"
              onClick={() => onOpenEditor(capturedImage)}
              className="flex-1 py-3 px-3 rounded-xl text-xs font-bold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              id="btn-edit-captured-doc"
            >
              <Scissors className="w-4 h-4 text-cyan-400" />
              <span>MANUAL CROP / EDIT</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleContinue}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg border border-emerald-400/40 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            id="btn-continue-captured-doc"
          >
            <span>CONTINUE TO OCR</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // --- PERMISSION DENIED DISPLAY ---
  if (cameraState === 'PERMISSION_DENIED') {
    return (
      <div className="w-full rounded-2xl bg-slate-950 border border-rose-800/60 p-6 sm:p-8 text-center flex flex-col items-center justify-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
          <Camera className="w-8 h-8 animate-pulse" />
        </div>

        <h3 className="text-lg font-bold text-white tracking-wide">
          CAMERA PERMISSION REQUIRED
        </h3>

        <p className="text-xs text-slate-300 max-w-md leading-relaxed">
          PraveshKavach needs camera access to scan the visitor's identity document.
        </p>

        {errorMessage && (
          <div className="w-full max-w-md p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl flex items-start gap-2.5 text-left text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-2">
          <button
            type="button"
            onClick={handleRequestPermission}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg border border-cyan-400/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            id="btn-permission-try-again"
          >
            <RefreshCw className="w-4 h-4" />
            <span>TRY AGAIN</span>
          </button>

          <button
            type="button"
            onClick={handleNativeCameraFallback}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold border border-amber-300 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            id="btn-permission-native-camera"
          >
            <Camera className="w-4 h-4" />
            <span>USE NATIVE CAMERA</span>
          </button>

          <button
            type="button"
            onClick={openAppSettings}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
            id="btn-permission-open-settings"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            <span>OPEN SETTINGS</span>
          </button>
        </div>
      </div>
    );
  }

  // --- LIVE CAMERA SCREEN ---
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

      {/* Top Scanner Control Header */}
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
          <span>{scanResult?.userGuidance || 'SEARCHING FOR DOCUMENT...'}</span>
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

      {/* Bottom Camera Shutter Bar */}
      <div className="absolute bottom-3 inset-x-0 z-20 flex items-center justify-center gap-3 px-4">
        
        {/* Hidden File Input for Gallery / Document Upload */}
        <input
          type="file"
          id="gallery-file-input"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              if (dataUrl) {
                const img = new Image();
                img.onload = () => {
                  const tempCanvas = document.createElement('canvas');
                  tempCanvas.width = img.naturalWidth || 1920;
                  tempCanvas.height = img.naturalHeight || 1080;
                  const ctx = tempCanvas.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const galleryAnalysis = analyzeDocumentFrame(tempCanvas, selectedDocType);
                    let galleryCorners: QuadCorners;
                    if (galleryAnalysis.quadDetected && galleryAnalysis.quad) {
                      galleryCorners = galleryAnalysis.quad.corners;
                    } else {
                      const marginX = tempCanvas.width * 0.05;
                      const marginY = tempCanvas.height * 0.05;
                      galleryCorners = {
                        topLeft: { x: marginX, y: marginY },
                        topRight: { x: tempCanvas.width - marginX, y: marginY },
                        bottomRight: { x: tempCanvas.width - marginX, y: tempCanvas.height - marginY },
                        bottomLeft: { x: marginX, y: tempCanvas.height - marginY },
                      };
                    }
                    const cropped = cropAndStraightenDocument(tempCanvas, galleryCorners);
                    onCaptured(cropped, galleryAnalysis.qrCodeData || null);
                  }
                };
                img.src = dataUrl;
              }
            };
            reader.readAsDataURL(file);
          }}
        />

        {/* Gallery Import Button */}
        <button
          type="button"
          onClick={() => document.getElementById('gallery-file-input')?.click()}
          className="px-3.5 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg backdrop-blur-md flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
          title="Import from Gallery"
          id="btn-import-gallery"
        >
          <ImageIcon className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Gallery</span>
        </button>

        {/* Shutter Capture Button - ALWAYS ENABLED FOR MANUAL CAPTURE FALLBACK */}
        <button
          type="button"
          onClick={() => triggerCaptureAction(null)}
          disabled={isCapturing}
          className={`relative group px-6 sm:px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-2xl flex items-center gap-2.5 uppercase tracking-wider transition-all transform cursor-pointer ${
            isReadyToCapture && !isCapturing
              ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:scale-105 active:scale-95 text-slate-950 shadow-amber-400/40 ring-4 ring-amber-400/30'
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400/40 shadow-cyan-500/20 active:scale-95'
          }`}
          id="btn-manual-capture-canvas"
        >
          <Camera className="w-5 h-5" />
          <span>
            {isCapturing 
              ? 'CAPTURING...' 
              : isReadyToCapture 
              ? 'CAPTURE DOCUMENT (AUTO ALIGNED)' 
              : 'CAPTURE DOCUMENT (MANUAL)'}
          </span>
        </button>

      </div>

    </div>
  );
};
