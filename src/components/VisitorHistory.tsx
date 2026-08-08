import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Download, 
  FileSpreadsheet, 
  UserCheck, 
  Building2,
  Calendar,
  Sparkles,
  FolderOpen,
  LogOut,
  Shield,
  Trash2,
  X,
  FileText,
  User,
  Activity,
  Maximize2
} from 'lucide-react';
import { VisitorRecord, VisitorStatus, AuditLogItem } from '../types';
import { maskDocumentNumber } from '../utils/privacyUtils';
import { SavedScansList } from './SavedScansList';
import { printVisitorPassWindow, downloadVisitorPackage } from '../utils/documentStorage';

interface VisitorHistoryProps {
  visitors: VisitorRecord[];
  onSelectVisitor: (visitor: VisitorRecord) => void;
  onUpdateStatus: (id: string, status: VisitorStatus) => void;
  onMarkExit?: (visitorId: string) => void;
  onOpenCheckoutModal?: (visitor: VisitorRecord) => void;
  onDeleteVisitor?: (visitorId: string) => void;
  auditLogs?: AuditLogItem[];
  initialTab?: 'logs' | 'scans' | 'audit';
}

export const VisitorHistory: React.FC<VisitorHistoryProps> = ({
  visitors,
  onSelectVisitor,
  onUpdateStatus,
  onMarkExit,
  onOpenCheckoutModal,
  onDeleteVisitor,
  auditLogs = [],
  initialTab = 'logs',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'scans' | 'audit'>(initialTab);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [profileModalVisitor, setProfileModalVisitor] = useState<VisitorRecord | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const filteredVisitors = visitors.filter((v) => {
    const matchesSearch =
      v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.passNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.documentNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === 'ALL' || v.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = [
      'Pass Number',
      'Visitor Name',
      'Phone',
      'Doc Type',
      'Doc Number',
      'Resident Name',
      'Unit',
      'Purpose',
      'Status',
      'Check In Time',
      'Check Out Time',
      'Duration',
      'Created At'
    ];
    const rows = filteredVisitors.map((v) => [
      v.passNumber,
      `"${v.visitorName}"`,
      v.phone,
      v.documentType,
      v.documentNumber,
      `"${v.residentName}"`,
      `"${v.buildingUnit}"`,
      `"${v.purpose}"`,
      v.status,
      v.checkInAt ? `"${new Date(v.checkInAt).toLocaleString()}"` : 'N/A',
      v.checkOutAt ? `"${new Date(v.checkOutAt).toLocaleString()}"` : 'N/A',
      v.visitDuration ? `"${v.visitDuration}"` : 'N/A',
      v.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PraveshKavach_Visitor_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Sub-Tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'logs'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          id="tab-visitor-logs"
        >
          <Clock className="w-4 h-4" />
          <span>Visitor Access Logs ({visitors.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'audit'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          id="tab-audit-logs"
        >
          <Activity className="w-4 h-4" />
          <span>Gate System Audit Trail ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('scans')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'scans'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          id="tab-saved-scans"
        >
          <FolderOpen className="w-4 h-4" />
          <span>Saved Scans Folder (/Scans)</span>
        </button>
      </div>

      {activeSubTab === 'scans' ? (
        <SavedScansList />
      ) : activeSubTab === 'audit' ? (
        /* Audit Trail View */
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <span>Gate Entry & Exit System Audit Trail</span>
              </h2>
              <p className="text-xs text-slate-400">Detailed security events, gate timestamps, devices, and operator logs</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="p-3.5 font-bold">Timestamp</th>
                    <th className="p-3.5 font-bold">Event Action</th>
                    <th className="p-3.5 font-bold">Performed By</th>
                    <th className="p-3.5 font-bold">Gate / Device</th>
                    <th className="p-3.5 font-bold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 text-slate-300">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action.includes('EXIT')
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                            : log.action.includes('CHECKED_IN')
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                            : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-200 font-sans font-semibold">
                        {log.performedBy} ({log.role})
                      </td>
                      <td className="p-3.5 text-cyan-400 font-sans">
                        {log.gateName || 'Main Gate 01'} • {log.deviceName || 'Security Tablet'}
                      </td>
                      <td className="p-3.5 text-slate-300 font-sans">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Clock className="w-6 h-6 text-cyan-400" />
                <span>Visitor Access Logs & History</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time audit log of all issued visitor passes, check-ins, exit events, and document records
              </p>
            </div>

            <button
              onClick={exportToCSV}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-slate-700 flex items-center gap-1.5 shadow"
              id="btn-export-csv"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export CSV Report</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
            
            {/* Search */}
            <div className="sm:col-span-8 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search visitor name, pass #, resident, document number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                id="input-search-history"
              />
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-4">
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
                id="select-status-filter"
              >
                <option value="ALL">All Statuses ({visitors.length})</option>
                <option value="CHECKED_IN">Currently Inside (Checked In)</option>
                <option value="CHECKED_OUT">Completed (Checked Out)</option>
                <option value="APPROVED">Approved (Awaiting Entry)</option>
                <option value="PENDING">Pending Approval</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

          </div>

          {/* Visitor History Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="p-3.5 font-bold">Pass # & Date</th>
                    <th className="p-3.5 font-bold">Visitor Details</th>
                    <th className="p-3.5 font-bold">ID Document</th>
                    <th className="p-3.5 font-bold">Resident Host</th>
                    <th className="p-3.5 font-bold">Check In / Out</th>
                    <th className="p-3.5 font-bold">Duration</th>
                    <th className="p-3.5 font-bold">Status</th>
                    <th className="p-3.5 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredVisitors.map((visitor) => (
                    <tr key={visitor.id} className="hover:bg-slate-800/40 transition-colors">
                      
                      {/* Pass # & Date */}
                      <td className="p-3.5">
                        <p className="font-mono font-bold text-cyan-300">{visitor.passNumber}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(visitor.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </td>

                      {/* Visitor Details */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          {visitor.liveFaceUrl ? (
                            <img src={visitor.liveFaceUrl} alt={visitor.visitorName} className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-cyan-400 shrink-0">
                              {visitor.visitorName[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white">{visitor.visitorName}</p>
                            <p className="text-[11px] text-slate-400">{visitor.phone}</p>
                          </div>
                        </div>
                      </td>

                      {/* ID Document */}
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-200">{visitor.documentType}</p>
                        <p className="font-mono text-[11px] text-slate-400">
                          {maskDocumentNumber(
                            visitor.documentNumber,
                            visitor.documentType,
                            visitor.privacyMode ? visitor.privacyMode === 'masked' : (visitor.isMaskedAadhaar !== false)
                          )}
                        </p>
                      </td>

                      {/* Resident Host */}
                      <td className="p-3.5">
                        <p className="font-bold text-slate-200">{visitor.residentName}</p>
                        <p className="text-[11px] text-slate-400">{visitor.buildingUnit}</p>
                      </td>

                      {/* Check In / Out Times */}
                      <td className="p-3.5 text-[11px]">
                        <p className="text-emerald-400 font-mono">
                          In: {visitor.checkInAt ? new Date(visitor.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </p>
                        <p className="text-cyan-400 font-mono mt-0.5">
                          Out: {visitor.checkOutAt ? new Date(visitor.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </p>
                      </td>

                      {/* Duration */}
                      <td className="p-3.5 font-mono text-[11px] text-slate-300">
                        {visitor.visitDuration || (visitor.checkInAt && !visitor.checkOutAt ? 'Active Inside' : 'N/A')}
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          visitor.status === 'CHECKED_IN' || visitor.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : visitor.status === 'CHECKED_OUT'
                            ? 'bg-slate-800 text-slate-300 border border-slate-700'
                            : visitor.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {visitor.status === 'CHECKED_IN'
                            ? 'Inside Premises'
                            : visitor.status === 'CHECKED_OUT'
                            ? 'Checked Out'
                            : visitor.status}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {(visitor.status === 'CHECKED_IN' || visitor.status === 'APPROVED' || visitor.status === 'ACTIVE') && (
                            <button
                              onClick={() => onOpenCheckoutModal ? onOpenCheckoutModal(visitor) : (onMarkExit && onMarkExit(visitor.id))}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all shadow"
                              title="Mark Visitor Exit / Checkout"
                              id={`btn-table-exit-${visitor.id}`}
                            >
                              Check Out
                            </button>
                          )}

                          <button
                            onClick={() => setProfileModalVisitor(visitor)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
                            title="View Visitor Profile & Scanned Documents"
                            id={`btn-view-visitor-${visitor.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Visitor Profile & Attached Scanned Documents Modal */}
      {profileModalVisitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{profileModalVisitor.visitorName}</h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Pass #: {profileModalVisitor.passNumber} • Date: {new Date(profileModalVisitor.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setProfileModalVisitor(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Status & Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Current Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  profileModalVisitor.status === 'CHECKED_IN'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : profileModalVisitor.status === 'CHECKED_OUT'
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}>
                  {profileModalVisitor.status}
                </span>
                {profileModalVisitor.visitDuration && (
                  <span className="text-xs text-cyan-400 font-mono font-bold bg-cyan-950 px-2.5 py-0.5 rounded-md border border-cyan-800">
                    Duration: {profileModalVisitor.visitDuration}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => printVisitorPassWindow(profileModalVisitor)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>PRINT PASS</span>
                </button>

                <button
                  onClick={() => downloadVisitorPackage(profileModalVisitor)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>DOWNLOAD PACKAGE</span>
                </button>

                {(profileModalVisitor.status === 'CHECKED_IN' || profileModalVisitor.status === 'APPROVED') && onMarkExit && (
                  <button
                    onClick={() => {
                      onMarkExit(profileModalVisitor.id);
                      setProfileModalVisitor(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 flex items-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>MARK VISITOR EXIT</span>
                  </button>
                )}

                {onDeleteVisitor && (
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete the visitor record and documents for ${profileModalVisitor.visitorName}?`)) {
                        onDeleteVisitor(profileModalVisitor.id);
                        setProfileModalVisitor(null);
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-rose-400 border border-slate-700 hover:border-rose-800"
                    title="Delete Visitor Record (Admin)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Profile Grid Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                <p className="font-bold text-cyan-400 uppercase tracking-wider text-[10px]">Visitor Identity Details</p>
                <p><span className="text-slate-400">Full Name:</span> <strong className="text-white">{profileModalVisitor.visitorName}</strong></p>
                <p><span className="text-slate-400">Phone Number:</span> <strong className="text-white">{profileModalVisitor.phone}</strong></p>
                {profileModalVisitor.email && <p><span className="text-slate-400">Email:</span> <strong className="text-cyan-300">{profileModalVisitor.email}</strong></p>}
                {profileModalVisitor.company && <p><span className="text-slate-400">Company:</span> <strong className="text-white">{profileModalVisitor.company}</strong></p>}
                <p><span className="text-slate-400">Document Type:</span> <strong className="text-white">{profileModalVisitor.documentType}</strong></p>
                <p><span className="text-slate-400">Document Number:</span> <strong className="text-white font-mono">{maskDocumentNumber(profileModalVisitor.documentNumber, profileModalVisitor.documentType, profileModalVisitor.privacyMode ? profileModalVisitor.privacyMode === 'masked' : (profileModalVisitor.isMaskedAadhaar !== false))}</strong></p>
                {profileModalVisitor.address && <p><span className="text-slate-400">Address:</span> <strong className="text-white">{profileModalVisitor.address}</strong></p>}
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                <p className="font-bold text-cyan-400 uppercase tracking-wider text-[10px]">Host & Gate Security Audit</p>
                <p><span className="text-slate-400">Resident Host:</span> <strong className="text-white">{profileModalVisitor.residentName}</strong></p>
                <p><span className="text-slate-400">Building Unit:</span> <strong className="text-white">{profileModalVisitor.buildingUnit}</strong></p>
                <p><span className="text-slate-400">Purpose of Visit:</span> <strong className="text-white">{profileModalVisitor.purpose}</strong></p>
                <p><span className="text-slate-400">Entry Gate & Guard:</span> <strong className="text-white">{profileModalVisitor.gateName} ({profileModalVisitor.guardName})</strong></p>
                <p><span className="text-slate-400">Check-in Time:</span> <strong className="text-emerald-400 font-mono">{profileModalVisitor.checkInAt ? new Date(profileModalVisitor.checkInAt).toLocaleString() : 'N/A'}</strong></p>
                <p><span className="text-slate-400">Check-out Time:</span> <strong className="text-cyan-400 font-mono">{profileModalVisitor.checkOutAt ? new Date(profileModalVisitor.checkOutAt).toLocaleString() : 'N/A'}</strong></p>
                <p><span className="text-slate-400">Verification Status:</span> <strong className="text-emerald-400 font-bold uppercase">{profileModalVisitor.verificationStatus || 'VERIFIED'}</strong></p>
              </div>
            </div>

            {/* Attached Scanned Documents Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-cyan-400" />
                <span>Scanned Documents & Captured Face Verification</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Front Document */}
                {profileModalVisitor.frontDocUrl && (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300">Front ID Scan</span>
                      <button
                        onClick={() => setZoomedImage(profileModalVisitor.frontDocUrl!)}
                        className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <Maximize2 className="w-3 h-3" /> Zoom
                      </button>
                    </div>
                    <img
                      src={profileModalVisitor.frontDocUrl}
                      alt="Front Scan"
                      className="w-full h-40 object-cover rounded-xl border border-slate-800"
                    />
                  </div>
                )}

                {/* Face Image */}
                {profileModalVisitor.liveFaceUrl && (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300">Captured Face Verification</span>
                      <button
                        onClick={() => setZoomedImage(profileModalVisitor.liveFaceUrl!)}
                        className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <Maximize2 className="w-3 h-3" /> Zoom
                      </button>
                    </div>
                    <img
                      src={profileModalVisitor.liveFaceUrl}
                      alt="Face Capture"
                      className="w-full h-40 object-cover rounded-xl border border-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* OCR Extracted Data JSON */}
              {profileModalVisitor.extractedData && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <p className="text-xs font-bold text-cyan-400">Extracted OCR Field Attributes</p>
                  <pre className="text-[11px] font-mono text-emerald-400 bg-slate-900 p-2.5 rounded-xl overflow-x-auto border border-slate-800">
                    {JSON.stringify(profileModalVisitor.extractedData, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end border-t border-slate-800 pt-4">
              <button
                onClick={() => setProfileModalVisitor(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <img src={zoomedImage} alt="Zoomed document" className="max-w-full max-h-full rounded-2xl shadow-2xl border border-cyan-500/40" />
        </div>
      )}

    </div>
  );
};
