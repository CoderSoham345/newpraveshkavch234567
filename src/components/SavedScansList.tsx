import React, { useState, useEffect } from 'react';
import { 
  FolderDown, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  Eye, 
  Share2, 
  Edit2, 
  Trash2, 
  Download, 
  Calendar, 
  HardDrive, 
  RefreshCw, 
  Filter,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import { SavedScanDocument, ScanExportFormat } from '../types';
import { 
  fetchAllSavedScans, 
  downloadScanFile, 
  shareScanDocument, 
  renameSavedDocument, 
  deleteSavedDocument 
} from '../services/scanStorageService';
import { ScanDocumentViewerModal } from './ScanDocumentViewerModal';

interface SavedScansListProps {
  onSelectScanForWorkflow?: (doc: SavedScanDocument) => void;
}

export const SavedScansList: React.FC<SavedScansListProps> = ({ onSelectScanForWorkflow }) => {
  const [scans, setScans] = useState<SavedScanDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFormatFilter, setSelectedFormatFilter] = useState<string>('ALL');

  // Selected scan for full modal view
  const [selectedScan, setSelectedScan] = useState<SavedScanDocument | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);

  // Rename modal state
  const [renamingScanId, setRenamingScanId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');

  const loadScans = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllSavedScans();
      setScans(data);
    } catch (e) {
      console.error('Failed loading saved scans:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
  }, []);

  const filteredScans = scans.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.docTypeLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.extractedData?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.extractedData?.documentNumber || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFormat =
      selectedFormatFilter === 'ALL' || s.format.toUpperCase() === selectedFormatFilter.toUpperCase();

    return matchesSearch && matchesFormat;
  });

  const handleOpenViewer = (scan: SavedScanDocument) => {
    setSelectedScan(scan);
    setIsViewerOpen(true);
  };

  const handleStartRename = (scan: SavedScanDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingScanId(scan.id);
    setRenameValue(scan.title);
  };

  const handleSaveRename = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!renameValue.trim()) return;
    await renameSavedDocument(id, renameValue.trim());
    setRenamingScanId(null);
    loadScans();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document from /Scans folder?')) {
      await deleteSavedDocument(id);
      loadScans();
    }
  };

  const handleDownload = (scan: SavedScanDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    downloadScanFile(scan);
  };

  const handleShare = async (scan: SavedScanDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    await shareScanDocument(scan);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Saved Scanned Documents</span>
              <span className="text-xs font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                /Scans ({scans.length})
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              High-quality processed PDFs, PNGs & JPEGs stored permanently in app storage across sessions
            </p>
          </div>
        </div>

        <button
          onClick={loadScans}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 font-bold text-xs border border-slate-700 flex items-center gap-2 shadow"
          id="btn-refresh-scans"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Folder</span>
        </button>
      </div>

      {/* Search & Format Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
        
        {/* Search */}
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search in /Scans by title, ID number, name, or filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
            id="input-search-scans"
          />
        </div>

        {/* Format Filter */}
        <div className="sm:col-span-4">
          <select
            value={selectedFormatFilter}
            onChange={(e) => setSelectedFormatFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-cyan-400 focus:outline-none"
            id="select-format-filter"
          >
            <option value="ALL">All Formats ({scans.length})</option>
            <option value="PDF">PDF Documents</option>
            <option value="PNG">PNG Images</option>
            <option value="JPEG">JPEG Images</option>
          </select>
        </div>

      </div>

      {/* Document Grid */}
      {isLoading ? (
        <div className="p-12 text-center space-y-3 bg-slate-900/50 rounded-2xl border border-slate-800">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold">Loading documents from /Scans folder...</p>
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-slate-900/50 rounded-2xl border border-slate-800">
          <FolderDown className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No Scanned Documents Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm || selectedFormatFilter !== 'ALL'
              ? 'No documents matched your search filter. Try resetting the search.'
              : 'When you scan ID documents using the scanner workflow, saved PDFs and images will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScans.map((scan) => (
            <div
              key={scan.id}
              onClick={() => handleOpenViewer(scan)}
              className="group bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-lg flex flex-col justify-between relative overflow-hidden"
              id={`scan-card-${scan.id}`}
            >
              {/* Top Row: Thumbnail + Details */}
              <div className="space-y-3">
                <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:border-cyan-500/30 transition">
                  <img
                    src={scan.processedImageUrl || scan.fileUrl}
                    alt={scan.title}
                    className="w-full h-full object-contain p-1"
                  />
                  
                  {/* Format Badge */}
                  <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shadow border ${
                    scan.format === 'pdf'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : scan.format === 'png'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-amber-500 text-slate-950 border-amber-400'
                  }`}>
                    {scan.format}
                  </div>

                  {/* Folder Indicator */}
                  <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300 border border-slate-800">
                    /Scans
                  </div>
                </div>

                {/* Title & Rename inline */}
                {renamingScanId === scan.id ? (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="bg-slate-950 border border-cyan-400 rounded px-2 py-1 text-xs text-white w-full font-bold focus:outline-none"
                    />
                    <button
                      onClick={(e) => handleSaveRename(scan.id, e)}
                      className="px-2 py-1 bg-emerald-500 text-slate-950 font-bold rounded text-xs"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition line-clamp-1">
                      {scan.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                      {scan.fileName}
                    </p>
                  </div>
                )}

                {/* Attributes Pill */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-300">
                  <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-cyan-400 font-semibold">
                    {scan.docTypeLabel}
                  </span>
                  {scan.extractedData?.documentNumber && (
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono text-slate-200">
                      #{scan.extractedData.documentNumber}
                    </span>
                  )}
                  <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
                    {new Date(scan.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenViewer(scan); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold border border-slate-700 flex items-center gap-1 transition"
                  title="Open Fullscreen View"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleShare(scan, e)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition"
                    title="Share Document"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleStartRename(scan, e)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition"
                    title="Rename"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleDownload(scan, e)}
                    className="p-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 transition"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(scan.id, e)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Document Viewer Modal */}
      <ScanDocumentViewerModal
        document={selectedScan}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        onDocumentUpdated={loadScans}
        onDocumentDeleted={loadScans}
      />

    </div>
  );
};
