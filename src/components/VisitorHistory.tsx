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
  Sparkles
} from 'lucide-react';
import { VisitorRecord, VisitorStatus } from '../types';

interface VisitorHistoryProps {
  visitors: VisitorRecord[];
  onSelectVisitor: (visitor: VisitorRecord) => void;
  onUpdateStatus: (id: string, status: VisitorStatus) => void;
}

export const VisitorHistory: React.FC<VisitorHistoryProps> = ({
  visitors,
  onSelectVisitor,
  onUpdateStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

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
    const headers = ['Pass Number', 'Visitor Name', 'Phone', 'Doc Type', 'Doc Number', 'Resident Name', 'Unit', 'Purpose', 'Status', 'Created At'];
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
      v.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PraveshKavach_Visitors_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-cyan-400" />
            <span>Visitor Access Logs & History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time audit log of all issued visitor passes, check-ins, and approval decisions
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
            <option value="CHECKED_IN">Checked In</option>
            <option value="APPROVED">Approved (Awaiting Entry)</option>
            <option value="PENDING">Pending Approval</option>
            <option value="REJECTED">Rejected</option>
            <option value="CHECKED_OUT">Checked Out</option>
          </select>
        </div>

      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="p-3.5 font-bold">Pass #</th>
                <th className="p-3.5 font-bold">Visitor Details</th>
                <th className="p-3.5 font-bold">ID Document</th>
                <th className="p-3.5 font-bold">Resident Host</th>
                <th className="p-3.5 font-bold">Purpose</th>
                <th className="p-3.5 font-bold">Status</th>
                <th className="p-3.5 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredVisitors.map((visitor) => (
                <tr key={visitor.id} className="hover:bg-slate-800/40 transition-colors">
                  
                  {/* Pass # */}
                  <td className="p-3.5 font-mono font-bold text-cyan-300">
                    {visitor.passNumber}
                  </td>

                  {/* Visitor */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      {visitor.liveFaceUrl ? (
                        <img src={visitor.liveFaceUrl} alt={visitor.visitorName} className="w-9 h-9 rounded-full object-cover border border-slate-700" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-cyan-400">
                          {visitor.visitorName[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-white">{visitor.visitorName}</p>
                        <p className="text-[11px] text-slate-400">{visitor.phone}</p>
                      </div>
                    </div>
                  </td>

                  {/* Doc */}
                  <td className="p-3.5">
                    <p className="font-semibold text-slate-200">{visitor.documentType}</p>
                    <p className="font-mono text-[11px] text-slate-400">{visitor.documentNumber}</p>
                  </td>

                  {/* Resident */}
                  <td className="p-3.5">
                    <p className="font-bold text-slate-200">{visitor.residentName}</p>
                    <p className="text-[11px] text-slate-400">{visitor.buildingUnit}</p>
                  </td>

                  {/* Purpose */}
                  <td className="p-3.5 font-medium text-slate-300">
                    {visitor.purpose}
                  </td>

                  {/* Status */}
                  <td className="p-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      visitor.status === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : visitor.status === 'CHECKED_IN'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : visitor.status === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : visitor.status === 'CHECKED_OUT'
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {visitor.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => onSelectVisitor(visitor)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
                      title="View Pass Details"
                      id={`btn-view-visitor-${visitor.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
