import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Send, 
  UserCheck, 
  Car, 
  Users, 
  Briefcase, 
  FileText, 
  Edit2, 
  Building2, 
  Phone, 
  MapPin, 
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ExtractedDocData, Resident, FaceVerificationData } from '../types';

interface Step6SummaryProps {
  frontDocUrl: string;
  backDocUrl?: string;
  liveFaceUrl: string;
  extractedData: ExtractedDocData;
  faceMetrics: FaceVerificationData;
  residents: Resident[];
  selectedResidentId: string;
  setSelectedResidentId: (id: string) => void;
  purpose: string;
  setPurpose: (purpose: string) => void;
  vehicleNumber: string;
  setVehicleNumber: (veh: string) => void;
  numAccompanying: number;
  setNumAccompanying: (n: number) => void;
  visitorPhone: string;
  setVisitorPhone: (ph: string) => void;
  onSendRequest: () => void;
  onBackToFace: () => void;
}

export const Step6Summary: React.FC<Step6SummaryProps> = ({
  frontDocUrl,
  backDocUrl,
  liveFaceUrl,
  extractedData,
  faceMetrics,
  residents,
  selectedResidentId,
  setSelectedResidentId,
  purpose,
  setPurpose,
  vehicleNumber,
  setVehicleNumber,
  numAccompanying,
  setNumAccompanying,
  visitorPhone,
  setVisitorPhone,
  onSendRequest,
  onBackToFace,
}) => {
  const [residentSearchTerm, setResidentSearchTerm] = useState<string>('');

  const filteredResidents = residents.filter(
    (r) =>
      r.name.toLowerCase().includes(residentSearchTerm.toLowerCase()) ||
      r.flatNumber.toLowerCase().includes(residentSearchTerm.toLowerCase()) ||
      r.building.toLowerCase().includes(residentSearchTerm.toLowerCase())
  );

  const currentResident = residents.find((r) => r.id === selectedResidentId) || residents[0];

  const purposesList = [
    'Personal Visit',
    'Courier & Package Delivery',
    'Maintenance & Repair Work',
    'Business Meeting / Interview',
    'Guest / Overnight Stay',
    'Cab / Taxi Pick & Drop',
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center">
              ✓
            </span>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              All Data Captured & Verified
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            SUMMARY & SEND APPROVAL REQUEST
          </h2>
          <p className="text-xs text-slate-400">
            Review captured photos, visitor information, and select the target resident host.
          </p>
        </div>

        <button
          onClick={onBackToFace}
          className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900"
        >
          Back
        </button>
      </div>

      {/* Captured Photo Triad (Front, Back, Face) */}
      <div className="grid grid-cols-3 gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
        
        {/* Front Doc */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Aadhaar / ID Front
          </span>
          <div className="rounded-xl overflow-hidden border border-slate-700 aspect-[1.586/1] bg-black">
            <img src={frontDocUrl} alt="Front ID" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Back Doc */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            ID Back Side
          </span>
          <div className="rounded-xl overflow-hidden border border-slate-700 aspect-[1.586/1] bg-black">
            {backDocUrl ? (
              <img src={backDocUrl} alt="Back ID" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 font-bold">
                Skipped
              </div>
            )}
          </div>
        </div>

        {/* Live Face Photo */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
            Live Photo (Face Match {faceMetrics.faceMatchScore}%)
          </span>
          <div className="rounded-xl overflow-hidden border-2 border-cyan-400/80 aspect-[1.586/1] bg-black">
            <img src={liveFaceUrl} alt="Live Face" className="w-full h-full object-cover" />
          </div>
        </div>

      </div>

      {/* Main Grid: Visitor Details (Left) vs Resident Selector & Purpose (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Visitor Info Card */}
        <div className="md:col-span-6 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Visitor Information</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block text-[11px] uppercase">Visitor Name</span>
              <p className="text-sm font-bold text-white">{extractedData.fullName}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 font-semibold block text-[11px] uppercase">Document Type</span>
                <p className="font-semibold text-slate-200">{extractedData.documentType}</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[11px] uppercase">Doc Number</span>
                <p className="font-bold text-cyan-300 font-mono">{extractedData.documentNumber}</p>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block text-[11px] uppercase">Phone Number</span>
              <input
                type="text"
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                placeholder="+91 98000 00000"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white mt-1 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {extractedData.address && (
              <div>
                <span className="text-slate-400 font-semibold block text-[11px] uppercase">Full Address</span>
                <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {extractedData.address}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Resident Host Selection & Entry Form */}
        <div className="md:col-span-6 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>Select Resident Host & Purpose</span>
            </h3>

            {/* Resident Host Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Target Resident / Apartment Unit
              </label>

              {/* Resident Search Input */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search resident name or flat..."
                  value={residentSearchTerm}
                  onChange={(e) => setResidentSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Resident Cards Picker */}
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {filteredResidents.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedResidentId(r.id)}
                    className={`w-full p-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                      selectedResidentId === r.id
                        ? 'bg-cyan-500/10 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                    id={`select-resident-${r.id}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-cyan-400 text-xs">
                        {r.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-white">{r.name}</p>
                        <p className="text-[10px] text-slate-400">{r.building} ({r.flatNumber})</p>
                      </div>
                    </div>
                    {selectedResidentId === r.id && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Purpose Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Visit Purpose
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-cyan-400 focus:outline-none"
                id="select-visit-purpose"
              >
                {purposesList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Number (Optional) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Vehicle Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. TN 09 BX 4421"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3">
            <button
              onClick={onSendRequest}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.01]"
              id="btn-send-request-to-resident"
            >
              <Send className="w-5 h-5 text-slate-950" />
              <span>SEND REQUEST TO RESIDENT</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Instant real-time alert will be dispatches via Socket, Telegram, WhatsApp & Push notification.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
