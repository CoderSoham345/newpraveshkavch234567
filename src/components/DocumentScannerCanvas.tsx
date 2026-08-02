import React, { useEffect, useRef, useState } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Camera, 
  ShieldCheck,
  QrCode,
  Scan,
  XCircle
} from 'lucide-react';
import { DocumentType } from '../types';
import { 
  analyzeDocumentFrame, 
  smoothCorners, 
  cropAndStraightenDocument, 
  QuadCorners, 
  ScanValidationResult 
} from '../utils/cvEngine';

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

  // Detection and Validation States
  const [scanResult, setScanResult] = useState<ScanValidationResult | null>(null);
  const prevCornersRef = useRef<QuadCorners | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Document types are now all supported (20+ types)
  const isSupportedDocType = selectedDocType !== 'AUTOMATIC_DETECTION' || selectedDocType !== 'OTHER_IDENTITY_DOC';

  // Initialize camera
  const initCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      setErrorMessage(null);
      const constraints: MediaStreamConstraints = {
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
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
          ? 'Camera permission denied. Please allow camera access in browser settings.'
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
  }, []);

  // Main OpenCV Real-time Detection & Animation Loop (NO AUTO CAPTURE)
  useEffect(() => {
    let animFrameId: number;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && !isCapturing) {
        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        if (!hiddenFrameCanvasRef.current) {
          hiddenFrameCanvasRef.current = document.createElement('canvas');
        }
        const frameCanvas = hiddenFrameCanvasRef.current;
        frameCanvas.width = width;
        frameCanvas.height = height;
        const frameCtx = frameCanvas.getContext('2d');

        if (frameCtx) {
          frameCtx.drawImage(video, 0, 0, width, height);

          // Run Computer Vision Analysis
          const result = analyzeDocumentFrame(frameCanvas, selectedDocType);

          // Smooth corners to eliminate jitter
          if (result.quad) {
            const smoothed = smoothCorners(result.quad.corners, prevCornersRef.current, 0.4);
            if (smoothed) {
              result.quad.corners = smoothed;
              prevCornersRef.current = smoothed;
            }
          }

          setScanResult(result);

          // Draw real-time dynamic bounding polygon on overlay canvas
          const overlayCtx = canvas.getContext('2d');
          if (overlayCtx) {
            overlayCtx.clearRect(0, 0, width, height);

            if (result.quad && isSupportedDocType) {
              const c = result.quad.corners;

              // 1. Draw Outer Mask
              overlayCtx.fillStyle = 'rgba(2, 6, 23, 0.65)';
              overlayCtx.beginPath();
              overlayCtx.rect(0, 0, width, height);
              overlayCtx.moveTo(c.topLeft.x, c.topLeft.y);
              overlayCtx.lineTo(c.bottomLeft.x, c.bottomLeft.y);
              overlayCtx.lineTo(c.bottomRight.x, c.bottomRight.y);
              overlayCtx.lineTo(c.topRight.x, c.topRight.y);
              overlayCtx.closePath();
              overlayCtx.fill('evenodd');

              // 2. Draw Dynamic Glowing Polygon Border
              overlayCtx.save();
              const isPassing = result.allCriteriaPassed && !result.hasFaceInFrame;
              const hasFace = result.hasFaceInFrame;

              overlayCtx.strokeStyle = hasFace
                ? '#f43f5e' // Red for face warning
                : isPassing
                ? '#10b981' // Emerald green for valid document
                : '#22d3ee'; // Cyan for aligning

              overlayCtx.lineWidth = isPassing ? 4 : 3;
              overlayCtx.shadowColor = hasFace ? '#f43f5e' : isPassing ? '#10b981' : '#22d3ee';
              overlayCtx.shadowBlur = isPassing ? 25 : 15;

              overlayCtx.beginPath();
              overlayCtx.moveTo(c.topLeft.x, c.topLeft.y);
              overlayCtx.lineTo(c.topRight.x, c.topRight.y);
              overlayCtx.lineTo(c.bottomRight.x, c.bottomRight.y);
              overlayCtx.lineTo(c.bottomLeft.x, c.bottomLeft.y);
              overlayCtx.closePath();
              overlayCtx.stroke();

              // 3. Draw Corner Reticles at 4 Corners
              const cornersArr = [c.topLeft, c.topRight, c.bottomRight, c.bottomLeft];
              cornersArr.forEach((pt) => {
                overlayCtx.fillStyle = '#ffffff';
                overlayCtx.beginPath();
                overlayCtx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
                overlayCtx.fill();

                overlayCtx.strokeStyle = hasFace ? '#f43f5e' : isPassing ? '#10b981' : '#22d3ee';
                overlayCtx.lineWidth = 2;
                overlayCtx.beginPath();
                overlayCtx.arc(pt.x, pt.y, 12, 0, Math.PI * 2);
                overlayCtx.stroke();
              });

              // 4. Draw Animated Scan Laser Line
              const time = Date.now() / 1000;
              const progress = (Math.sin(time * 3) + 1) / 2;
              const topX = c.topLeft.x + (c.topRight.x - c.topLeft.x) * progress;
              const topY = c.topLeft.y + (c.topRight.y - c.topLeft.y) * progress;
              const botX = c.bottomLeft.x + (c.bottomRight.x - c.bottomLeft.x) * progress;
              const botY = c.bottomLeft.y + (c.bottomRight.y - c.bottomLeft.y) * progress;

              overlayCtx.strokeStyle = isPassing ? '#10b981' : '#22d3ee';
              overlayCtx.lineWidth = 2;
              overlayCtx.shadowBlur = 20;
              overlayCtx.beginPath();
              overlayCtx.moveTo(topX, topY);
              overlayCtx.lineTo(botX, botY);
              overlayCtx.stroke();

              overlayCtx.restore();
            } else {
              // Standard dark overlay
              overlayCtx.fillStyle = 'rgba(2, 6, 23, 0.5)';
              overlayCtx.fillRect(0, 0, width, height);
            }
          }
        }
      }

      animFrameId = requestAnimationFrame(processFrame);
    };

    animFrameId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animFrameId);
  }, [selectedDocType, isSupportedDocType, isCapturing]);

  // Execute Manual Capture on Button Click
  const executeCapture = () => {
    if (!videoRef.current || isCapturing) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      let croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      let qrData: string | null = null;

      if (scanResult?.quad) {
        croppedDataUrl = cropAndStraightenDocument(canvas, scanResult.quad.corners);
        qrData = scanResult.qrCodeData;
      }

      onCaptured(croppedDataUrl, qrData);
    }
    setIsCapturing(false);
  };

  // Determine if Document is Valid for Capture Button Activation
  const isValidDocument = Boolean(
    isSupportedDocType &&
    !scanResult?.hasFaceInFrame
  );

  return (
    <div className="relative w-full rounded-2xl bg-black border border-slate-800 overflow-hidden shadow-2xl aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center">
      
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Real-time Dynamic Overlay Canvas for Glowing Document Quad */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Top Banner Warning & Real-time Status Guidance */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col items-center pointer-events-none space-y-2">
        
        {/* Unsupported Document Warning */}
        {!isSupportedDocType && (
          <div className="bg-rose-600/95 text-white px-5 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 border border-rose-400">
            <XCircle className="w-5 h-5 text-amber-300 shrink-0" />
            <span className="text-xs sm:text-sm font-extrabold tracking-wide">
              Scanning any government-issued ID. Position document in frame.
            </span>
          </div>
        )}

        {/* Face Warning Alert Box */}
        {isSupportedDocType && scanResult?.hasFaceInFrame && (
          <div className="bg-rose-600/95 text-white px-5 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 border border-rose-400 animate-bounce">
            <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
            <span className="text-xs sm:text-sm font-bold tracking-wide">
              Face detected. Please place your ID card inside the frame.
            </span>
          </div>
        )}

        {/* Real-time Document Status Banner */}
        {isSupportedDocType && !scanResult?.hasFaceInFrame && scanResult && (
          <div className={`px-4 py-2 rounded-full text-xs font-extrabold shadow-xl flex items-center gap-2 backdrop-blur-md transition-all ${
            isValidDocument
              ? 'bg-emerald-500/90 text-slate-950 border border-emerald-300 shadow-emerald-500/40 animate-pulse'
              : scanResult.quadDetected
              ? 'bg-amber-500/90 text-slate-950 border border-amber-300 shadow-amber-500/20'
              : 'bg-slate-900/80 text-slate-200 border border-slate-700'
          }`}>
            {isValidDocument ? (
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
            ) : (
              <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
            )}
            <span>
              {isValidDocument
                ? 'VALID DOCUMENT DETECTED ✓ - CAPTURE BUTTON ENABLED'
                : scanResult.quadDetected
                ? 'Document Detected. Check glare & hold camera steady...'
                : 'Position Aadhaar or PAN Card inside camera frame'}
            </span>
          </div>
        )}

      </div>

      {/* Embedded QR Code Indicator Badge */}
      {scanResult?.qrCodeData && isSupportedDocType && (
        <div className="absolute bottom-16 left-4 z-20 bg-cyan-950/80 border border-cyan-500/50 px-3 py-1.5 rounded-lg backdrop-blur-md flex items-center gap-2 text-cyan-300 text-xs font-semibold">
          <QrCode className="w-4 h-4 text-cyan-400" />
          <span>Embedded QR Code Detected</span>
        </div>
      )}

      {/* Camera Permission Error Overlay */}
      {cameraPermission === 'denied' && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md p-6 text-center flex flex-col items-center justify-center space-y-3 z-30">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Camera Permission Denied</h3>
          <p className="text-xs text-slate-400 max-w-sm">{errorMessage}</p>
        </div>
      )}

      {/* Bottom Manual Capture Control Bar (ENABLED ONLY WHEN VALID DOCUMENT DETECTED) */}
      <div className="absolute bottom-4 inset-x-0 z-20 flex items-center justify-center px-4">
        <button
          onClick={executeCapture}
          disabled={!isValidDocument}
          className={`px-8 py-3.5 rounded-2xl font-black text-sm shadow-2xl flex items-center gap-2.5 uppercase tracking-wider transition-all transform ${
            isValidDocument
              ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:scale-105 active:scale-95 text-slate-950 shadow-emerald-500/40 cursor-pointer ring-4 ring-emerald-400/30'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
          }`}
          id="btn-manual-capture-canvas"
        >
          <Camera className="w-5 h-5" />
          <span>
            {isValidDocument ? 'CAPTURE PHOTO' : 'WAITING FOR VALID DOCUMENT...'}
          </span>
        </button>
      </div>

    </div>
  );
};
