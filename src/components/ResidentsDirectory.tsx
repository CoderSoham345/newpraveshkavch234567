import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Zap, 
  UserPlus, 
  Home,
  FileCheck,
  X,
  ShieldCheck,
  Award
} from 'lucide-react';
import { Resident } from '../types';

interface ResidentsDirectoryProps {
  residents: Resident[];
  onSelectResidentToInvite?: (resident: Resident) => void;
}

export const ResidentsDirectory: React.FC<ResidentsDirectoryProps> = ({
  residents,
  onSelectResidentToInvite,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');
  const [viewingResidentDoc, setViewingResidentDoc] = useState<Resident | null>(null);

  const filtered = residents.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone.includes(searchTerm) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBuilding =
      selectedBuilding === 'ALL' || r.building.includes(selectedBuilding);

    return matchesSearch && matchesBuilding;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>Residents & Facility Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Search registered residents, verify unit tenancy certificates, and configure notification hosts
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search resident name, flat number, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
            id="input-search-residents"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
            id="select-building-filter"
          >
            <option value="ALL">All Towers / Buildings</option>
            <option value="Tower A">Tower A - Apex Heights</option>
            <option value="Tower B">Tower B - Zenith Park</option>
            <option value="Tower C">Tower C - Corporate Suite</option>
          </select>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((res) => (
          <div
            key={res.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all shadow-lg space-y-4 flex flex-col justify-between"
          >
            <div className="flex items-start gap-3.5">
              {res.avatarUrl ? (
                <img src={res.avatarUrl} alt={res.name} className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400 shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold text-cyan-400 text-base shrink-0">
                  {res.name[0]}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base text-white truncate">{res.name}</h3>
                <p className="text-xs font-bold text-cyan-400 flex items-center gap-1 mt-0.5">
                  <Home className="w-3.5 h-3.5" /> {res.flatNumber} • {res.building}
                </p>
                {res.department && (
                  <p className="text-[11px] text-slate-400 mt-1">{res.department}</p>
                )}
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{res.phone}</span>
              </div>
              <div className="flex items-center gap-2 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{res.email}</span>
              </div>
            </div>

            {/* Actions: View Resident Proof & Select Host */}
            <div className="flex items-center justify-between pt-1 gap-2">
              <button
                onClick={() => setViewingResidentDoc(res)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1 transition-colors"
                id={`btn-view-res-doc-${res.id}`}
              >
                <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>View Resident Doc</span>
              </button>

              {onSelectResidentToInvite && (
                <button
                  onClick={() => onSelectResidentToInvite(res)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition-colors"
                  id={`btn-invite-resident-${res.id}`}
                >
                  Select Host
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Resident Document Modal */}
      {viewingResidentDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-white text-base">RESIDENT PROOF OF OCCUPANCY</h3>
                  <p className="text-xs text-slate-400">Official Resident Registration & Tenancy Records</p>
                </div>
              </div>
              <button
                onClick={() => setViewingResidentDoc(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resident Card Details */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-300 text-lg">
                  {viewingResidentDoc.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">{viewingResidentDoc.name}</h4>
                  <p className="text-xs text-cyan-400 font-semibold">{viewingResidentDoc.flatNumber}, {viewingResidentDoc.building}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">Reg ID: RES-2026-{viewingResidentDoc.id.replace('res-', '')}</p>
                </div>
              </div>

              {/* Simulated Official Resident Certificate Image */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-slate-900 to-blue-950 border border-cyan-500/30 text-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    PraveshKavach™ Tenancy & Access Token
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    VERIFIED
                  </span>
                </div>
                <p><strong>Primary Resident:</strong> {viewingResidentDoc.name}</p>
                <p><strong>Allocated Flat / Office:</strong> {viewingResidentDoc.flatNumber}, {viewingResidentDoc.building}</p>
                <p><strong>Contact Phone:</strong> {viewingResidentDoc.phone}</p>
                <p><strong>Verification Status:</strong> Government ID Verified (UIDAI / RTO)</p>
                <p><strong>Gate Notification Bot:</strong> Registered via Telegram (@PraveshKavachGateBot)</p>
              </div>
            </div>

            <button
              onClick={() => setViewingResidentDoc(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 uppercase"
            >
              Close Resident Profile
            </button>

          </div>
        </div>
      )}

    </div>
  );
};

