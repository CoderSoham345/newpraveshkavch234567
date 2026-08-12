import React, { useEffect, useRef, useState } from 'react';
import { 
  RotateCw, 
  Scissors, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Palette, 
  RotateCcw,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  X
} from 'lucide-react';
import { QuadCorners, cropAndStraightenDocument, applyImageFiltersAndAdjustments } from '../utils/cvEngine';
import { DocumentType } from '../types';

export interface ScannedPageItem {
  id: string;
  rawImage: string; // Base64 or object URL of raw capture
  processedImage: string; // Base64 of cropped + filtered result
  corners: QuadCorners;
  rotation: number; // 0, 90, 180, 270
  filter: 'AUTO' | 'ORIGINAL' | 'ENHANCED' | 'DOCUMENT' | 'GRAYSCALE' | 'BW' | 'SHARP' | 'HIGH_CONTRAST';
  brightness?: number; // -100 to +100
  contrast?: number;   // -100 to +100
  sharpness?: number;  // 0 to 100
  docType?: DocumentType;
}

interface AdobeScanEditorProps {
  pages: ScannedPageItem[];
  onUpdatePages: (pages: ScannedPageItem[]) => void;
  onAddPage: () => void;
  onConfirmScans: (finalPages: ScannedPageItem[]) => void;
  onRetakeAll: () => void;
}

function isPointInPolygon(p: { x: number; y: number }, poly: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = ((yi > p.y) !== (yj > p.y)) && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
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

  // Drag handle & zoom state
  const [activeHandle, setActiveHandle] = useState<string | null>(null); // 'tl' | 'tr' | 'br' | 'bl' | 'top' | 'right' | 'bottom' | 'left' | 'move'
  const [corners, setCorners] = useState<QuadCorners | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [zoomScale, setZoomScale] = useState<number>(1.0);

  const dragStartRef = useRef<{ canvasX: number; canvasY: number; corners: QuadCorners } | null>(null);

  // Tab State: 'crop' | 'filters'
  const [activeTab, setActiveTab] = useState<'crop' | 'filters'>('crop');

  // Filters & Adjustment Sliders State
  const [selectedFilter, setSelectedFilter] = useState<'AUTO' | 'ORIGINAL' | 'ENHANCED' | 'DOCUMENT' | 'GRAYSCALE' | 'BW' | 'SHARP' | 'HIGH_CONTRAST'>(activePage?.filter || 'AUTO');
  const [brightness, setBrightness] = useState<number>(activePage?.brightness || 0);
  const [contrast, setContrast] = useState<number>(activePage?.contrast || 0);
  const [sharpness, setSharpness] = useState<number>(activePage?.sharpness || 0);

  // Lock body scroll during active crop editing
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Sync filter slider values when page changes
  useEffect(() => {
    if (activePage) {
      setSelectedFilter(activePage.filter || 'AUTO');
      setBrightness(activePage.brightness || 0);
      setContrast(activePage.contrast || 0);
      setSharpness(activePage.sharpness || 0);
    }
  }, [currentPageIndex, activePage?.id]);

  // Load active page image
  useEffect(() => {
    if (!activePage) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImgElement(img);
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });

      if (activePage.corners) {
        setCorners({ ...activePage.corners });
      } else {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const defaultCorners: QuadCorners = {
          topLeft: { x: Math.round(w * 0.05), y: Math.round(h * 0.05) },
          topRight: { x: Math.round(w * 0.95), y: Math.round(h * 0.05) },
          bottomRight: { x: Math.round(w * 0.95), y: Math.round(h * 0.95) },
          bottomLeft: { x: Math.round(w * 0.05), y: Math.round(h * 0.95) },
        };
        setCorners(defaultCorners);
      }
    };
    img.src = activePage.rawImage;
  }, [currentPageIndex, activePage?.rawImage]);

  // Render Interactive Canvas with Draggable Handles & Polygon Overlay
  useEffect(() => {
    if (!canvasRef.current || !imgElement || !corners) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerWidth = (containerRef.current?.clientWidth || 360) - 24;
    const containerHeight = (containerRef.current?.clientHeight || 450) - 24;

    const fitScale = Math.min(
      containerWidth / imgElement.naturalWidth,
      containerHeight / imgElement.naturalHeight
    );

    const scale = fitScale * zoomScale;
    const canvasW = Math.max(100, Math.round(imgElement.naturalWidth * scale));
    const canvasH = Math.max(100, Math.round(imgElement.naturalHeight * scale));

    canvas.width = canvasW;
    canvas.height = canvasH;

    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.drawImage(imgElement, 0, 0, canvasW, canvasH);

    const c = {
      tl: { x: (corners.topLeft.x / imgElement.naturalWidth) * canvasW, y: (corners.topLeft.y / imgElement.naturalHeight) * canvasH },
      tr: { x: (corners.topRight.x / imgElement.naturalWidth) * canvasW, y: (corners.topRight.y / imgElement.naturalHeight) * canvasH },
      br: { x: (corners.bottomRight.x / imgElement.naturalWidth) * canvasW, y: (corners.bottomRight.y / imgElement.naturalHeight) * canvasH },
      bl: { x: (corners.bottomLeft.x / imgElement.naturalWidth) * canvasW, y: (corners.bottomLeft.y / imgElement.naturalHeight) * canvasH },
    };

    // Outer Dark Overlay
    ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Save context for clipping crop path
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(c.tl.x, c.tl.y);
    ctx.lineTo(c.tr.x, c.tr.y);
    ctx.lineTo(c.br.x, c.br.y);
    ctx.lineTo(c.bl.x, c.bl.y);
    ctx.closePath();
    ctx.clip();

    // Redraw unmasked original image inside crop region
    ctx.drawImage(imgElement, 0, 0, canvasW, canvasH);
    ctx.restore();

    // Draw Crop Quad Edge Border
    ctx.strokeStyle = '#06b6d4'; // Cyan-500
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(c.tl.x, c.tl.y);
    ctx.lineTo(c.tr.x, c.tr.y);
    ctx.lineTo(c.br.x, c.br.y);
    ctx.lineTo(c.bl.x, c.bl.y);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // Edge Midpoints
    const topMid = { x: (c.tl.x + c.tr.x) / 2, y: (c.tl.y + c.tr.y) / 2 };
    const rightMid = { x: (c.tr.x + c.br.x) / 2, y: (c.tr.y + c.br.y) / 2 };
    const botMid = { x: (c.bl.x + c.br.x) / 2, y: (c.bl.y + c.br.y) / 2 };
    const leftMid = { x: (c.tl.x + c.bl.x) / 2, y: (c.tl.y + c.bl.y) / 2 };

    const drawMidHandle = (p: { x: number; y: number }) => {
      ctx.fillStyle = '#06b6d4';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };

    drawMidHandle(topMid);
    drawMidHandle(rightMid);
    drawMidHandle(botMid);
    drawMidHandle(leftMid);

    // Corner Handles (Cyan Circle with Inner Dot)
    const drawCornerHandle = (p: { x: number; y: number }, label: string) => {
      ctx.fillStyle = '#0284c7'; // Sky-600
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    };

    drawCornerHandle(c.tl, 'TL');
    drawCornerHandle(c.tr, 'TR');
    drawCornerHandle(c.br, 'BR');
    drawCornerHandle(c.bl, 'BL');

  }, [imgElement, corners, zoomScale]);

  // Helper to convert Pointer event coordinates to Natural Image Coordinates
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imgElement) return null;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    return {
      canvasX,
      canvasY,
      imgX: Math.max(0, Math.min(imgElement.naturalWidth, (canvasX / canvas.width) * imgElement.naturalWidth)),
      imgY: Math.max(0, Math.min(imgElement.naturalHeight, (canvasY / canvas.height) * imgElement.naturalHeight)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !corners || !imgElement) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const coords = getCanvasCoords(e);
    if (!coords) return;
    const { canvasX, canvasY } = coords;

    const canvas = canvasRef.current;
    const canvasW = canvas.width;
    const canvasH = canvas.height;

    const c = {
      tl: { x: (corners.topLeft.x / imgElement.naturalWidth) * canvasW, y: (corners.topLeft.y / imgElement.naturalHeight) * canvasH },
      tr: { x: (corners.topRight.x / imgElement.naturalWidth) * canvasW, y: (corners.topRight.y / imgElement.naturalHeight) * canvasH },
      br: { x: (corners.bottomRight.x / imgElement.naturalWidth) * canvasW, y: (corners.bottomRight.y / imgElement.naturalHeight) * canvasH },
      bl: { x: (corners.bottomLeft.x / imgElement.naturalWidth) * canvasW, y: (corners.bottomLeft.y / imgElement.naturalHeight) * canvasH },
    };

    const handleThreshold = 32; // Generous 32px touch target radius for mobile fingers

    // Check corners
    if (Math.hypot(canvasX - c.tl.x, canvasY - c.tl.y) < handleThreshold) {
      setActiveHandle('tl');
      return;
    }
    if (Math.hypot(canvasX - c.tr.x, canvasY - c.tr.y) < handleThreshold) {
      setActiveHandle('tr');
      return;
    }
    if (Math.hypot(canvasX - c.br.x, canvasY - c.br.y) < handleThreshold) {
      setActiveHandle('br');
      return;
    }
    if (Math.hypot(canvasX - c.bl.x, canvasY - c.bl.y) < handleThreshold) {
      setActiveHandle('bl');
      return;
    }

    // Check edge midpoints
    const topMid = { x: (c.tl.x + c.tr.x) / 2, y: (c.tl.y + c.tr.y) / 2 };
    const rightMid = { x: (c.tr.x + c.br.x) / 2, y: (c.tr.y + c.br.y) / 2 };
    const botMid = { x: (c.bl.x + c.br.x) / 2, y: (c.bl.y + c.br.y) / 2 };
    const leftMid = { x: (c.tl.x + c.bl.x) / 2, y: (c.tl.y + c.bl.y) / 2 };

    if (Math.hypot(canvasX - topMid.x, canvasY - topMid.y) < handleThreshold) {
      setActiveHandle('top');
      return;
    }
    if (Math.hypot(canvasX - rightMid.x, canvasY - rightMid.y) < handleThreshold) {
      setActiveHandle('right');
      return;
    }
    if (Math.hypot(canvasX - botMid.x, canvasY - botMid.y) < handleThreshold) {
      setActiveHandle('bottom');
      return;
    }
    if (Math.hypot(canvasX - leftMid.x, canvasY - leftMid.y) < handleThreshold) {
      setActiveHandle('left');
      return;
    }

    // Check if inside polygon to drag entire crop box
    if (isPointInPolygon({ x: canvasX, y: canvasY }, [c.tl, c.tr, c.br, c.bl])) {
      setActiveHandle('move');
      dragStartRef.current = { canvasX, canvasY, corners: { ...corners } };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeHandle || !corners || !imgElement || !canvasRef.current) return;
    e.preventDefault();

    const coords = getCanvasCoords(e);
    if (!coords) return;
    const { canvasX, canvasY, imgX, imgY } = coords;
    const canvas = canvasRef.current;

    setCorners((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };

      if (activeHandle === 'tl') updated.topLeft = { x: imgX, y: imgY };
      if (activeHandle === 'tr') updated.topRight = { x: imgX, y: imgY };
      if (activeHandle === 'br') updated.bottomRight = { x: imgX, y: imgY };
      if (activeHandle === 'bl') updated.bottomLeft = { x: imgX, y: imgY };

      if (activeHandle === 'top') {
        const dy = imgY - (prev.topLeft.y + prev.topRight.y) / 2;
        updated.topLeft.y = Math.max(0, prev.topLeft.y + dy);
        updated.topRight.y = Math.max(0, prev.topRight.y + dy);
      }
      if (activeHandle === 'bottom') {
        const dy = imgY - (prev.bottomLeft.y + prev.bottomRight.y) / 2;
        updated.bottomLeft.y = Math.min(imgElement.naturalHeight, prev.bottomLeft.y + dy);
        updated.bottomRight.y = Math.min(imgElement.naturalHeight, prev.bottomRight.y + dy);
      }
      if (activeHandle === 'left') {
        const dx = imgX - (prev.topLeft.x + prev.bottomLeft.x) / 2;
        updated.topLeft.x = Math.max(0, prev.topLeft.x + dx);
        updated.bottomLeft.x = Math.max(0, prev.bottomLeft.x + dx);
      }
      if (activeHandle === 'right') {
        const dx = imgX - (prev.topRight.x + prev.bottomRight.x) / 2;
        updated.topRight.x = Math.min(imgElement.naturalWidth, prev.topRight.x + dx);
        updated.bottomRight.x = Math.min(imgElement.naturalWidth, prev.bottomRight.x + dx);
      }

      if (activeHandle === 'move' && dragStartRef.current) {
        const dx = (canvasX - dragStartRef.current.canvasX) * (imgElement.naturalWidth / canvas.width);
        const dy = (canvasY - dragStartRef.current.canvasY) * (imgElement.naturalHeight / canvas.height);
        const orig = dragStartRef.current.corners;
        const w = imgElement.naturalWidth;
        const h = imgElement.naturalHeight;

        const minX = Math.min(orig.topLeft.x, orig.topRight.x, orig.bottomRight.x, orig.bottomLeft.x);
        const maxX = Math.max(orig.topLeft.x, orig.topRight.x, orig.bottomRight.x, orig.bottomLeft.x);
        const minY = Math.min(orig.topLeft.y, orig.topRight.y, orig.bottomRight.y, orig.bottomLeft.y);
        const maxY = Math.max(orig.topLeft.y, orig.topRight.y, orig.bottomRight.y, orig.bottomLeft.y);

        const shiftX = Math.max(-minX, Math.min(w - maxX, dx));
        const shiftY = Math.max(-minY, Math.min(h - maxY, dy));

        updated.topLeft = { x: Math.round(orig.topLeft.x + shiftX), y: Math.round(orig.topLeft.y + shiftY) };
        updated.topRight = { x: Math.round(orig.topRight.x + shiftX), y: Math.round(orig.topRight.y + shiftY) };
        updated.bottomRight = { x: Math.round(orig.bottomRight.x + shiftX), y: Math.round(orig.bottomRight.y + shiftY) };
        updated.bottomLeft = { x: Math.round(orig.bottomLeft.x + shiftX), y: Math.round(orig.bottomLeft.y + shiftY) };
      }

      return updated;
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (activeHandle && corners && imgElement) {
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
    dragStartRef.current = null;
  };

  // Reset Corners to Full Document Bounding Box
  const handleNoCropReset = () => {
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

  // Rotate Page 90 Degrees Clockwise
  const handleRotatePage = () => {
    if (!imgElement || !corners) return;
    const oldW = imgElement.naturalWidth;
    const oldH = imgElement.naturalHeight;

    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = oldH;
    sourceCanvas.height = oldW;
    const ctx = sourceCanvas.getContext('2d');
    if (!ctx) return;

    ctx.translate(oldH / 2, oldW / 2);
    ctx.rotate((90 * Math.PI) / 180);
    ctx.drawImage(imgElement, -oldW / 2, -oldH / 2);

    const rotatedBase64 = sourceCanvas.toDataURL('image/jpeg', 0.92);

    // Map corners for 90 degree clockwise rotation: (x, y) => (H - y, x)
    const rotatedCorners: QuadCorners = {
      topLeft: { x: Math.round(oldH - corners.bottomLeft.y), y: Math.round(corners.bottomLeft.x) },
      topRight: { x: Math.round(oldH - corners.topLeft.y), y: Math.round(corners.topLeft.x) },
      bottomRight: { x: Math.round(oldH - corners.topRight.y), y: Math.round(corners.topRight.x) },
      bottomLeft: { x: Math.round(oldH - corners.bottomRight.y), y: Math.round(corners.bottomRight.x) },
    };

    const cropped = cropAndStraightenDocument(sourceCanvas, rotatedCorners);

    const updatedPages = [...pages];
    updatedPages[currentPageIndex] = {
      ...activePage,
      rawImage: rotatedBase64,
      processedImage: cropped,
      corners: rotatedCorners,
      rotation: (activePage.rotation + 90) % 360,
    };

    onUpdatePages(updatedPages);
  };

  // Re-process current page with filter adjustment options
  const reprocessCurrentPage = (
    filter: any,
    bright: number,
    cont: number,
    sharp: number
  ) => {
    if (!imgElement || !corners) return;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = imgElement.naturalWidth;
    cropCanvas.height = imgElement.naturalHeight;
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(imgElement, 0, 0);
    const croppedDataUrl = cropAndStraightenDocument(cropCanvas, corners);

    const croppedImg = new Image();
    croppedImg.onload = () => {
      const filterCanvas = document.createElement('canvas');
      filterCanvas.width = croppedImg.naturalWidth;
      filterCanvas.height = croppedImg.naturalHeight;
      const fCtx = filterCanvas.getContext('2d');
      if (!fCtx) return;

      fCtx.drawImage(croppedImg, 0, 0);
      applyImageFiltersAndAdjustments(filterCanvas, {
        filter: filter,
        brightness: bright,
        contrast: cont,
        sharpness: sharp,
      }).then((filteredDataUrl) => {
        const updatedPages = [...pages];
        updatedPages[currentPageIndex] = {
          ...activePage,
          filter,
          brightness: bright,
          contrast: cont,
          sharpness: sharp,
          processedImage: filteredDataUrl,
        };
        onUpdatePages(updatedPages);
      });
    };
    croppedImg.src = croppedDataUrl;
  };

  const handleApplyFilterPreset = (preset: any) => {
    setSelectedFilter(preset);
    reprocessCurrentPage(preset, brightness, contrast, sharpness);
  };

  const handleDeleteCurrentPage = () => {
    if (pages.length <= 1) {
      onRetakeAll();
      return;
    }
    const updated = pages.filter((_, idx) => idx !== currentPageIndex);
    onUpdatePages(updated);
    setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col w-full h-full overflow-hidden select-none touch-manipulation font-sans">
      
      {/* Top Navigation Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRetakeAll}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer active:scale-95"
            title="Cancel & Retake"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
              <Scissors className="w-4 h-4 text-cyan-400" />
              <span>Document Crop & Edit</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              Drag handles or touch crop box to adjust borders
            </p>
          </div>
        </div>

        {/* Page Switcher if Multi-page */}
        {pages.length > 1 && (
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
            <button
              type="button"
              disabled={currentPageIndex === 0}
              onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
              className="p-1 text-slate-300 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {currentPageIndex + 1}/{pages.length}
            </span>
            <button
              type="button"
              disabled={currentPageIndex === pages.length - 1}
              onClick={() => setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
              className="p-1 text-slate-300 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Interactive Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative bg-slate-950 flex items-center justify-center p-3 overflow-hidden touch-none"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="shadow-2xl border-2 border-slate-800 rounded-lg cursor-crosshair max-w-full max-h-full touch-none"
        />

        {/* Page Delete Floating Tool */}
        {pages.length > 1 && (
          <button
            type="button"
            onClick={handleDeleteCurrentPage}
            className="absolute top-4 right-4 p-2.5 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-800 text-xs font-bold shadow-xl backdrop-blur-md transition cursor-pointer active:scale-95"
            title="Delete current page"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Touch Zoom Control Bar */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2 flex items-center justify-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setZoomScale((z) => Math.max(0.7, z - 0.2))}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95"
        >
          <ZoomOut className="w-3.5 h-3.5 text-cyan-400" />
          <span>Zoom -</span>
        </button>

        <span className="text-xs font-mono font-black text-cyan-300 min-w-[50px] text-center">
          {Math.round(zoomScale * 100)}%
        </span>

        <button
          type="button"
          onClick={() => setZoomScale((z) => Math.min(2.5, z + 0.2))}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95"
        >
          <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
          <span>Zoom +</span>
        </button>

        {zoomScale !== 1.0 && (
          <button
            type="button"
            onClick={() => setZoomScale(1.0)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 text-[10px] font-bold cursor-pointer"
          >
            Reset Zoom
          </button>
        )}
      </div>

      {/* Action Toolbar Row: Rotate, Reset, Filters */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 flex items-center justify-around gap-2 shrink-0">
        
        <button
          type="button"
          onClick={handleRotatePage}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
        >
          <RotateCw className="w-4 h-4 text-cyan-400" />
          <span>Rotate</span>
        </button>

        <button
          type="button"
          onClick={handleNoCropReset}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>Reset Crop</span>
        </button>

        <button
          type="button"
          onClick={onRetakeAll}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
        >
          <RefreshCw className="w-4 h-4 text-rose-400" />
          <span>Retake</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'filters' ? 'crop' : 'filters')}
          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 ${
            activeTab === 'filters'
              ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
        >
          <Palette className="w-4 h-4 text-cyan-300" />
          <span>Filters</span>
        </button>

      </div>

      {/* Filter Options Drawer */}
      {activeTab === 'filters' && (
        <div className="bg-slate-950 p-3 border-t border-slate-800 space-y-2 max-h-[180px] overflow-y-auto shrink-0 animate-fade-in">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'AUTO', label: '✨ Auto Magic' },
              { id: 'ORIGINAL', label: 'Original' },
              { id: 'ENHANCED', label: 'Enhanced' },
              { id: 'DOCUMENT', label: 'Document' },
              { id: 'GRAYSCALE', label: 'Grayscale' },
              { id: 'BW', label: 'B&W Text' },
              { id: 'SHARP', label: 'Sharp Text' },
              { id: 'HIGH_CONTRAST', label: 'High Contrast' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleApplyFilterPreset(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition whitespace-nowrap cursor-pointer ${
                  selectedFilter === f.id
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold shadow-md scale-105'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-300">
                <span>Brightness</span>
                <span className="text-cyan-400 font-mono">{brightness > 0 ? `+${brightness}` : brightness}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={brightness}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBrightness(val);
                  reprocessCurrentPage(selectedFilter, val, contrast, sharpness);
                }}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-300">
                <span>Contrast</span>
                <span className="text-cyan-400 font-mono">{contrast > 0 ? `+${contrast}` : contrast}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={contrast}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setContrast(val);
                  reprocessCurrentPage(selectedFilter, brightness, val, sharpness);
                }}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-300">
                <span>Sharpness</span>
                <span className="text-cyan-400 font-mono">{sharpness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sharpness}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSharpness(val);
                  reprocessCurrentPage(selectedFilter, brightness, contrast, val);
                }}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Main Confirm Action Footer */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {pages.length > 1 && (
          <button
            type="button"
            onClick={onAddPage}
            className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-extrabold flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Keep scanning</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onConfirmScans(pages)}
          className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-blue-500/20 border border-blue-400/40 flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 touch-manipulation min-h-[52px]"
          id="btn-confirm-adobe-scan"
        >
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span>PROCEED TO OCR & SAVE ({pages.length} Page{pages.length > 1 ? 's' : ''})</span>
        </button>
      </div>

    </div>
  );
};
