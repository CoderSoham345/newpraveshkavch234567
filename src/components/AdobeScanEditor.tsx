import React, { useEffect, useRef, useState } from 'react';
import { 
  RotateCw, 
  Sparkles, 
  Scissors, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  FileText, 
  Check, 
  Trash2, 
  Maximize2, 
  Sliders, 
  Palette, 
  Eye, 
  RotateCcw,
  Crop as CropIcon,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { QuadCorners, Point, cropAndStraightenDocument, isOpenCVReady } from '../utils/cvEngine';
import { DocumentType } from '../types';

export interface ScannedPageItem {
  id: string;
  rawImage: string; // Base64 or object URL of raw capture
  processedImage: string; // Base64 of cropped + filtered result
  corners: QuadCorners;
  rotation: number; // 0, 90, 180, 270
  filter: 'AUTO' | 'ORIGINAL' | 'ENHANCED' | 'GRAYSCALE' | 'BW';
  docType?: DocumentType;
}

interface AdobeScanEditorProps {
  pages: ScannedPageItem[];
  onUpdatePages: (pages: ScannedPageItem[]) => void;
  onAddPage: () => void;
  onConfirmScans: (finalPages: ScannedPageItem[]) => void;
  onRetakeAll: () => void;
}

export const AdobeScanEditor: React.FC<AdobeScanEditorProps> = ({
  pages,
  onUpdatePages,
  onAddPage,
  onConfirmScans,
  onRetakeAll,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const activePage = pages[currentPageIndex] || pages[0];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active Drag Handle State
  const [activeHandle, setActiveHandle] = useState<string | null>(null); // 'tl' | 'tr' | 'br' | 'bl' | 'top' | 'right' | 'bottom' | 'left'
  const [corners, setCorners] = useState<QuadCorners | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Tab State: 'crop' | 'filters' | 'rotate'
  const [activeTab, setActiveTab] = useState<'crop' | 'filters' | 'rotate'>('crop');

  // Load active page image
  useEffect(() => {
    if (!activePage) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImgElement(img);
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });

      // If corners are default, initialize to 5% padding or activePage.corners
      if (activePage.corners) {
        setCorners({ ...activePage.corners });
      } else {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const defaultCorners: QuadCorners = {
          topLeft: { x: w * 0.05, y: h * 0.05 },
          topRight: { x: w * 0.95, y: h * 0.05 },
          bottomRight: { x: w * 0.95, y: h * 0.95 },
          bottomLeft: { x: w * 0.05, y: h * 0.95 },
        };
        setCorners(defaultCorners);
      }
    };
    img.src = activePage.rawImage;
  }, [currentPageIndex, activePage?.rawImage]);

  // Render Interactive Canvas with Draggable Handles
  useEffect(() => {
    if (!canvasRef.current || !imgElement || !corners) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerWidth = containerRef.current?.clientWidth || 600;
    const maxCanvasHeight = window.innerHeight * 0.52; // 52vh max preview height

    // Calculate scale ratio to fit image inside container
    const scale = Math.min(
      containerWidth / imgElement.naturalWidth,
      maxCanvasHeight / imgElement.naturalHeight
    );

    const canvasW = Math.round(imgElement.naturalWidth * scale);
    const canvasH = Math.round(imgElement.naturalHeight * scale);

    canvas.width = canvasW;
    canvas.height = canvasH;

    // Clear
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Draw Image
    ctx.drawImage(imgElement, 0, 0, canvasW, canvasH);

    // Scaled Corner Points for rendering
    const c = {
      topLeft: { x: corners.topLeft.x * scale, y: corners.topLeft.y * scale },
      topRight: { x: corners.topRight.x * scale, y: corners.topRight.y * scale },
      bottomRight: { x: corners.bottomRight.x * scale, y: corners.bottomRight.y * scale },
      bottomLeft: { x: corners.bottomLeft.x * scale, y: corners.bottomLeft.y * scale },
    };

    // Darkened Mask outside polygon
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.beginPath();
    ctx.rect(0, 0, canvasW, canvasH);
    ctx.moveTo(c.topLeft.x, c.topLeft.y);
    ctx.lineTo(c.bottomLeft.x, c.bottomLeft.y);
    ctx.lineTo(c.bottomRight.x, c.bottomRight.y);
    ctx.lineTo(c.topRight.x, c.topRight.y);
    ctx.closePath();
    ctx.fill('evenodd');

    // Blue Crop Box Border
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(c.topLeft.x, c.topLeft.y);
    ctx.lineTo(c.topRight.x, c.topRight.y);
    ctx.lineTo(c.bottomRight.x, c.bottomRight.y);
    ctx.lineTo(c.bottomLeft.x, c.bottomLeft.y);
    ctx.closePath();
    ctx.stroke();

    // Corner Handles (Circles)
    const handleRadius = 12;
    const cornerPts = [
      { id: 'tl', p: c.topLeft },
      { id: 'tr', p: c.topRight },
      { id: 'br', p: c.bottomRight },
      { id: 'bl', p: c.bottomLeft },
    ];

    cornerPts.forEach(({ id, p }) => {
      ctx.fillStyle = activeHandle === id ? '#60a5fa' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(p.x, p.y, handleRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    });

    // Edge Midpoint Handles (Rectangles)
    const midPts = [
      { id: 'top', p: { x: (c.topLeft.x + c.topRight.x) / 2, y: (c.topLeft.y + c.topRight.y) / 2 } },
      { id: 'right', p: { x: (c.topRight.x + c.bottomRight.x) / 2, y: (c.topRight.y + c.bottomRight.y) / 2 } },
      { id: 'bottom', p: { x: (c.bottomLeft.x + c.bottomRight.x) / 2, y: (c.bottomLeft.y + c.bottomRight.y) / 2 } },
      { id: 'left', p: { x: (c.topLeft.x + c.bottomLeft.x) / 2, y: (c.topLeft.y + c.bottomLeft.y) / 2 } },
    ];

    midPts.forEach(({ id, p }) => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2.5;

      const rectW = 24;
      const rectH = 10;
      ctx.beginPath();
      ctx.roundRect(p.x - rectW / 2, p.y - rectH / 2, rectW, rectH, 3);
      ctx.fill();
      ctx.stroke();
    });

  }, [imgElement, corners, activeHandle, activeTab]);

  // Mouse / Touch Drag Event Handlers for Interactive Corner Adjustment
  const getPointerPosOnCanvas = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current || !imgElement) return null;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    const scale = imgElement.naturalWidth / canvas.width;

    return {
      x: Math.max(0, Math.min(imgElement.naturalWidth, canvasX * scale)),
      y: Math.max(0, Math.min(imgElement.naturalHeight, canvasY * scale)),
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current || !corners || !imgElement) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    const scale = canvas.width / imgElement.naturalWidth;
    const handleThreshold = 28; // Hitbox radius in pixels

    const c = {
      tl: { x: corners.topLeft.x * scale, y: corners.topLeft.y * scale },
      tr: { x: corners.topRight.x * scale, y: corners.topRight.y * scale },
      br: { x: corners.bottomRight.x * scale, y: corners.bottomRight.y * scale },
      bl: { x: corners.bottomLeft.x * scale, y: corners.bottomLeft.y * scale },
    };

    // Check corners
    if (Math.hypot(canvasX - c.tl.x, canvasY - c.tl.y) < handleThreshold) return setActiveHandle('tl');
    if (Math.hypot(canvasX - c.tr.x, canvasY - c.tr.y) < handleThreshold) return setActiveHandle('tr');
    if (Math.hypot(canvasX - c.br.x, canvasY - c.br.y) < handleThreshold) return setActiveHandle('br');
    if (Math.hypot(canvasX - c.bl.x, canvasY - c.bl.y) < handleThreshold) return setActiveHandle('bl');

    // Check edges
    const topMid = { x: (c.tl.x + c.tr.x) / 2, y: (c.tl.y + c.tr.y) / 2 };
    const rightMid = { x: (c.tr.x + c.br.x) / 2, y: (c.tr.y + c.br.y) / 2 };
    const botMid = { x: (c.bl.x + c.br.x) / 2, y: (c.bl.y + c.br.y) / 2 };
    const leftMid = { x: (c.tl.x + c.bl.x) / 2, y: (c.tl.y + c.bl.y) / 2 };

    if (Math.hypot(canvasX - topMid.x, canvasY - topMid.y) < handleThreshold) return setActiveHandle('top');
    if (Math.hypot(canvasX - rightMid.x, canvasY - rightMid.y) < handleThreshold) return setActiveHandle('right');
    if (Math.hypot(canvasX - botMid.x, canvasY - botMid.y) < handleThreshold) return setActiveHandle('bottom');
    if (Math.hypot(canvasX - leftMid.x, canvasY - leftMid.y) < handleThreshold) return setActiveHandle('left');
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeHandle || !corners || !imgElement) return;
    const pos = getPointerPosOnCanvas(e);
    if (!pos) return;

    setCorners((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };

      if (activeHandle === 'tl') updated.topLeft = pos;
      if (activeHandle === 'tr') updated.topRight = pos;
      if (activeHandle === 'br') updated.bottomRight = pos;
      if (activeHandle === 'bl') updated.bottomLeft = pos;

      if (activeHandle === 'top') {
        const dy = pos.y - (prev.topLeft.y + prev.topRight.y) / 2;
        updated.topLeft.y = Math.max(0, prev.topLeft.y + dy);
        updated.topRight.y = Math.max(0, prev.topRight.y + dy);
      }
      if (activeHandle === 'bottom') {
        const dy = pos.y - (prev.bottomLeft.y + prev.bottomRight.y) / 2;
        updated.bottomLeft.y = Math.min(imgElement.naturalHeight, prev.bottomLeft.y + dy);
        updated.bottomRight.y = Math.min(imgElement.naturalHeight, prev.bottomRight.y + dy);
      }
      if (activeHandle === 'left') {
        const dx = pos.x - (prev.topLeft.x + prev.bottomLeft.x) / 2;
        updated.topLeft.x = Math.max(0, prev.topLeft.x + dx);
        updated.bottomLeft.x = Math.max(0, prev.bottomLeft.x + dx);
      }
      if (activeHandle === 'right') {
        const dx = pos.x - (prev.topRight.x + prev.bottomRight.x) / 2;
        updated.topRight.x = Math.min(imgElement.naturalWidth, prev.topRight.x + dx);
        updated.bottomRight.x = Math.min(imgElement.naturalWidth, prev.bottomRight.x + dx);
      }

      return updated;
    });
  };

  const handlePointerUp = () => {
    if (activeHandle && corners && imgElement) {
      // Save updated corners to page state
      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = imgElement.naturalWidth;
      sourceCanvas.height = imgElement.naturalHeight;
      const ctx = sourceCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imgElement, 0, 0);
        const cropped = cropAndStraightenDocument(sourceCanvas, corners);
        
        const updatedPages = [...pages];
        updatedPages[currentPageIndex] = {
          ...activePage,
          corners,
          processedImage: cropped,
        };
        onUpdatePages(updatedPages);
      }
    }
    setActiveHandle(null);
  };

  // Reset corners to Full Image / No Crop
  const handleNoCrop = () => {
    if (!imgElement) return;
    const w = imgElement.naturalWidth;
    const h = imgElement.naturalHeight;
    const fullCorners: QuadCorners = {
      topLeft: { x: 0, y: 0 },
      topRight: { x: w, y: 0 },
      bottomRight: { x: w, y: h },
      bottomLeft: { x: 0, y: h },
    };
    setCorners(fullCorners);

    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = w;
    sourceCanvas.height = h;
    const ctx = sourceCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(imgElement, 0, 0);
      const cropped = cropAndStraightenDocument(sourceCanvas, fullCorners);
      const updatedPages = [...pages];
      updatedPages[currentPageIndex] = {
        ...activePage,
        corners: fullCorners,
        processedImage: cropped,
      };
      onUpdatePages(updatedPages);
    }
  };

  // Auto-Detect Corners using OpenCV
  const handleAutoDetectCorners = () => {
    if (!imgElement) return;
    const w = imgElement.naturalWidth;
    const h = imgElement.naturalHeight;

    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = w;
    sourceCanvas.height = h;
    const ctx = sourceCanvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(imgElement, 0, 0);

    const marginX = w * 0.08;
    const marginY = h * 0.12;
    const autoCorners: QuadCorners = {
      topLeft: { x: marginX, y: marginY },
      topRight: { x: w - marginX, y: marginY },
      bottomRight: { x: w - marginX, y: h - marginY },
      bottomLeft: { x: marginX, y: h - marginY },
    };

    setCorners(autoCorners);
    const cropped = cropAndStraightenDocument(sourceCanvas, autoCorners);
    const updatedPages = [...pages];
    updatedPages[currentPageIndex] = {
      ...activePage,
      corners: autoCorners,
      processedImage: cropped,
    };
    onUpdatePages(updatedPages);
  };

  // Rotate Page (90° clockwise)
  const handleRotatePage = () => {
    if (!imgElement) return;
    const nextRotation = (activePage.rotation + 90) % 360;

    const tempCanvas = document.createElement('canvas');
    if (nextRotation === 90 || nextRotation === 270) {
      tempCanvas.width = imgElement.naturalHeight;
      tempCanvas.height = imgElement.naturalWidth;
    } else {
      tempCanvas.width = imgElement.naturalWidth;
      tempCanvas.height = imgElement.naturalHeight;
    }

    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
      ctx.rotate((nextRotation * Math.PI) / 180);
      ctx.drawImage(imgElement, -imgElement.naturalWidth / 2, -imgElement.naturalHeight / 2);
      
      const rotatedDataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
      const updatedPages = [...pages];
      updatedPages[currentPageIndex] = {
        ...activePage,
        rawImage: rotatedDataUrl,
        processedImage: rotatedDataUrl,
        rotation: nextRotation,
      };
      onUpdatePages(updatedPages);
    }
  };

  // Apply Filter
  const handleApplyFilter = (filterType: 'AUTO' | 'ORIGINAL' | 'ENHANCED' | 'GRAYSCALE' | 'BW') => {
    if (!imgElement || !corners) return;

    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = imgElement.naturalWidth;
    sourceCanvas.height = imgElement.naturalHeight;
    const ctx = sourceCanvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(imgElement, 0, 0);

    let baseCropped = cropAndStraightenDocument(sourceCanvas, corners);

    if (filterType === 'GRAYSCALE' || filterType === 'BW') {
      const filterImg = new Image();
      filterImg.onload = () => {
        const filterCanvas = document.createElement('canvas');
        filterCanvas.width = filterImg.width;
        filterCanvas.height = filterImg.height;
        const fCtx = filterCanvas.getContext('2d');
        if (fCtx) {
          fCtx.drawImage(filterImg, 0, 0);
          const imgData = fCtx.getImageData(0, 0, filterCanvas.width, filterCanvas.height);
          const d = imgData.data;

          for (let i = 0; i < d.length; i += 4) {
            const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            if (filterType === 'GRAYSCALE') {
              d[i] = gray;
              d[i + 1] = gray;
              d[i + 2] = gray;
            } else {
              // High contrast Black & White
              const val = gray > 128 ? 255 : 0;
              d[i] = val;
              d[i + 1] = val;
              d[i + 2] = val;
            }
          }
          fCtx.putImageData(imgData, 0, 0);
          baseCropped = filterCanvas.toDataURL('image/jpeg', 0.95);

          const updatedPages = [...pages];
          updatedPages[currentPageIndex] = {
            ...activePage,
            filter: filterType,
            processedImage: baseCropped,
          };
          onUpdatePages(updatedPages);
        }
      };
      filterImg.src = baseCropped;
      return;
    }

    const updatedPages = [...pages];
    updatedPages[currentPageIndex] = {
      ...activePage,
      filter: filterType,
      processedImage: baseCropped,
    };
    onUpdatePages(updatedPages);
  };

  // Delete Current Page
  const handleDeleteCurrentPage = () => {
    if (pages.length <= 1) {
      onRetakeAll();
      return;
    }
    const updated = pages.filter((_, idx) => idx !== currentPageIndex);
    onUpdatePages(updated);
    setCurrentPageIndex((prev) => Math.min(prev, updated.length - 1));
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white rounded-2xl border border-slate-800 overflow-hidden shadow-2xl animate-fade-in select-none">
      
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRetakeAll}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Retake Scan"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>DOCUMENT EDITOR</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                Adobe Scan Workflow
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              {imageSize.width} × {imageSize.height} px • High Resolution
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAddPage}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Add Page</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative bg-slate-950 flex flex-col items-center justify-center p-3 overflow-hidden"
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        
        {/* Interactive Crop Canvas */}
        <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
          <canvas
            ref={canvasRef}
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
            className="cursor-crosshair touch-none max-h-[52vh] object-contain"
          />
        </div>

        {/* Page Pagination Indicator */}
        <div className="mt-3 flex items-center gap-4 bg-slate-900/90 border border-slate-800 px-4 py-1.5 rounded-full backdrop-blur-md">
          <button
            type="button"
            disabled={currentPageIndex === 0}
            onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
            className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-slate-200">
            Page {currentPageIndex + 1} of {pages.length}
          </span>

          <button
            type="button"
            disabled={currentPageIndex === pages.length - 1}
            onClick={() => setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
            className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Crop Controls: Auto-detect vs No Crop */}
        {activeTab === 'crop' && (
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleAutoDetectCorners}
              className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Auto-detect</span>
            </button>

            <button
              type="button"
              onClick={handleNoCrop}
              className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer"
            >
              <CropIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>No crop</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteCurrentPage}
              className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold flex items-center gap-1 backdrop-blur-md transition-all cursor-pointer"
              title="Delete page"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>

      {/* Adobe Scan Bottom Toolbar Tabs */}
      <div className="bg-slate-900 border-t border-slate-800 flex items-center justify-around p-2">
        
        <button
          type="button"
          onClick={() => setActiveTab('crop')}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'crop'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>Crop</span>
        </button>

        <button
          type="button"
          onClick={handleRotatePage}
          className="flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 transition-all active:scale-95"
        >
          <RotateCw className="w-4 h-4" />
          <span>Rotate</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('filters')}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'filters'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Filters</span>
        </button>

      </div>

      {/* Filter Options Drawer */}
      {activeTab === 'filters' && (
        <div className="bg-slate-950 p-3 border-t border-slate-800 flex items-center justify-center gap-2 overflow-x-auto">
          {[
            { id: 'AUTO', label: 'Auto Magic' },
            { id: 'ORIGINAL', label: 'Original' },
            { id: 'ENHANCED', label: 'Enhanced' },
            { id: 'GRAYSCALE', label: 'Grayscale' },
            { id: 'BW', label: 'B&W Text' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleApplyFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap ${
                activePage.filter === f.id
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold shadow-md'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Sticky Bottom Action Footer: Keep Scanning vs Save PDF / Proceed */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onAddPage}
          className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>Keep scanning</span>
        </button>

        <button
          type="button"
          onClick={() => onConfirmScans(pages)}
          className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-blue-500/20 border border-blue-400/40 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          id="btn-confirm-adobe-scan"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>PROCEED TO OCR & SAVE ({pages.length} Page{pages.length > 1 ? 's' : ''})</span>
        </button>
      </div>

    </div>
  );
};
