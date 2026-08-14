import React, { useState, useRef, useMemo } from 'react';
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
  ArrowRight,
  Lock,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Package,
  Wrench,
  User,
  Crown,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Check,
  XCircle,
  Clock
} from 'lucide-react';
import { ExtractedDocData, Resident, FaceVerificationData } from '../types';
import { maskDocumentNumber, maskName } from '../utils/privacyUtils';
import { evaluateFinalSecurityCheck } from '../utils/securityEvaluator';

export interface TargetAudienceCategory {
  id: string;
  name: string;
  category: string;
  iconName: string;
  description: string;
  badge: string;
}

export const TARGET_AUDIENCE_CATEGORIES: TargetAudienceCategory[] = [
  {
    id: 'guest',
    name: 'General Visitor / Guest',
    category: 'Personal & Social',
    iconName: 'User',
    description: 'Personal friends, family members, social visitors',
    badge: 'STANDARD ACCESS',
  },
  {
    id: 'delivery',
    name: 'Delivery & Logistics',
    category: 'E-commerce & Food',
    iconName: 'Package',
    description: 'Amazon, Swiggy, Zomato, Blinkit, Courier packages',
    badge: 'EXPEDITED GATE PASS',
  },
  {
    id: 'service',
    name: 'Service & Maintenance',
    category: 'Technical & Utility',
    iconName: 'Wrench',
    description: 'Electrician, Plumber, AC Repair, Cleaning & Carpentry',
    badge: 'WORK PERMIT REQUIRED',
  },
  {
    id: 'corporate',
    name: 'Corporate & Executive',
    category: 'Official & Business',
    iconName: 'Briefcase',
    description: 'Business meetings, client visits, audits & interviews',
    badge: 'OFFICIAL VISITOR',
  },
  {
    id: 'domestic',
    name: 'Domestic Staff & Helper',
    category: 'Household Support',
    iconName: 'Users',
    description: 'Maids, Cooks, Chauffeurs, Gardeners & Daily Support',
    badge: 'RESIDENT TIED',
  },
  {
    id: 'vip',
    name: 'VIP & Government Official',
    category: 'Dignitary & Law',
    iconName: 'Crown',
    description: 'Govt officers, Law Enforcement, VIP society guests',
    badge: 'PRIORITY PROTOCOL',
  },
];

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
  visitorEmail?: string;
  setVisitorEmail?: (email: string) => void;
  visitorCompany?: string;
  setVisitorCompany?: (company: string) => void;
  targetAudience?: string;
  setTargetAudience?: (aud: string) => void;
  onSendRequest: () => void;
  onBackToFace: () => void;
  isSaving?: boolean;
  registrationError?: string | null;
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
  visitorEmail = '',
  setVisitorEmail,
  visitorCompany = '',
  setVisitorCompany,
  targetAudience = 'General Visitor / Guest',
  setTargetAudience,
  onSendRequest,
  onBackToFace,
  isSaving = false,
  registrationError = null,
}) => {
  const [residentSearchTerm, setResidentSearchTerm] = useState<string>('');
  const [localResidentError, setLocalResidentError] = useState<string | null>(null);
  const [showFullEvaluationDetails, setShowFullEvaluationDetails] = useState<boolean>(true);
  const residentSectionRef = useRef<HTMLDivElement>(null);
  const targetAudienceRef = useRef<HTMLDivElement>(null);

  const filteredResidents = residents.filter(
    (r) =>
      r.name.toLowerCase().includes(residentSearchTerm.toLowerCase()) ||
      r.flatNumber.toLowerCase().includes(residentSearchTerm.toLowerCase()) ||
      r.building.toLowerCase().includes(residentSearchTerm.toLowerCase())
  );

  const currentResident = residents.find((r) => r.id === selectedResidentId);

  const purposesList = [
    'Personal Visit',
    'Courier & Package Delivery',
    'Maintenance & Repair Work',
    'Business Meeting / Interview',
    'Guest / Overnight Stay',
    'Cab / Taxi Pick & Drop',
  ];

  // Dynamic Real-Time Security Evaluation
  const evaluationReport = useMemo(() => {
    return evaluateFinalSecurityCheck({
      extractedData,
      faceMetrics,
      selectedResident: currentResident,
      frontDocUrl,
      liveFaceUrl,
      purpose,
      targetAudience,
      phone: visitorPhone,
    });
  }, [extractedData, faceMetrics, currentResident, frontDocUrl, liveFaceUrl, purpose, targetAudience, visitorPhone]);

  const handleSelectResident = (id: string) => {
    setSelectedResidentId(id);
    setLocalResidentError(null);
  };

  const handleSelectAudience = (audienceName: string) => {
    if (setTargetAudience) {
      setTargetAudience(audienceName);
    }
  };

  const handleCompleteButtonClick = () => {
    if (!selectedResidentId) {
      setLocalResidentError('Please select a Target Resident / Apartment Unit before completing registration.');
      if (residentSectionRef.current) {
        residentSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setLocalResidentError(null);
    onSendRequest();
  };

  const renderAudienceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Package': return <Package className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'Wrench': return <Wrench className="w-4 h-4 text-cyan-400 shrink-0" />;
      case 'Briefcase': return <Briefcase className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'Users': return <Users className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'Crown': return <Crown className="w-4 h-4 text-yellow-400 shrink-0" />;
      default: return <User className="w-4 h-4 text-teal-400 shrink-0" />;
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center">
              ✓
            </span>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              Stage 6 of 8 • Review & Registration Gate
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
            SUMMARY & FINAL EVALUATION
          </h2>
          <p className="text-xs text-slate-400">
            Verify captured documents, set target visitor audience, confirm host resident, and review the security clearance.
          </p>
        </div>

        <button
          onClick={onBackToFace}
          className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 active:scale-95 transition-all"
        >
          Back
        </button>
      </div>

      {/* Captured Photo Triad (Front, Back, Face) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-xl">
        
        {/* Front Doc */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
            ID Front Side
          </span>
          <div className="rounded-xl overflow-hidden border border-slate-700 aspect-[1.586/1] bg-black">
            <img src={frontDocUrl} alt="Front ID" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Back Doc */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
            ID Back Side
          </span>
          <div className="rounded-xl overflow-hidden border border-slate-700 aspect-[1.586/1] bg-black">
            {backDocUrl ? (
              <img src={backDocUrl} alt="Back ID" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 font-bold bg-slate-950">
                Skipped
              </div>
            )}
          </div>
        </div>

        {/* Live Face Photo */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block truncate">
            Live Face {faceMetrics.faceMatchScore > 0 ? `(${faceMetrics.faceMatchScore}%)` : '✓'}
          </span>
          <div className="rounded-xl overflow-hidden border-2 border-cyan-400/80 aspect-[1.586/1] bg-black">
            <img src={liveFaceUrl} alt="Live Face" className="w-full h-full object-cover" />
          </div>
        </div>

      </div>

      {/* 🎯 SECTION 1: TARGET AUDIENCE & VISITOR CLASSIFICATION (ACTIVE & FUNCTIONAL) */}
      <div 
        ref={targetAudienceRef}
        className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3"
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
              Target Audience & Visitor Category
            </h3>
          </div>
          <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
            ACTIVE CLASSIFICATION
          </span>
        </div>

        <p className="text-[11px] text-slate-400">
          Select the visitor classification category to apply tailored entry protocol & security clearance rules:
        </p>

        {/* Interactive Audience Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {TARGET_AUDIENCE_CATEGORIES.map((aud) => {
            const isSelected = targetAudience === aud.name;
            return (
              <button
                type="button"
                key={aud.id}
                onClick={() => handleSelectAudience(aud.name)}
                className={`p-3 rounded-xl text-left border transition-all flex items-start gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-400 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                }`}
                id={`target-audience-${aud.id}`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-500/20' : 'bg-slate-800/80'}`}>
                  {renderAudienceIcon(aud.iconName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-bold text-xs text-white truncate">{aud.name}</p>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{aud.description}</p>
                  <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded mt-1.5 border ${
                    isSelected 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {aud.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Visitor Details (Left) vs Resident Selector & Purpose (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Visitor Info Card */}
        <div className="md:col-span-6 bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Visitor Information & Identity</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block text-[11px] uppercase">Visitor Name</span>
              <p className="text-sm font-bold text-white">{extractedData.fullName || 'Not Entered'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 font-semibold block text-[11px] uppercase">Document Type</span>
                <p className="font-semibold text-slate-200">{extractedData.documentType}</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[11px] uppercase flex items-center gap-1">
                  <span>Doc Number</span>
                  {(extractedData.privacyMode ? extractedData.privacyMode === 'masked' : (extractedData.aadhaarPrivacy?.useMaskedAadhaar !== false && extractedData.isMaskedAadhaar !== false)) && (
                    <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/80 px-1.5 rounded">MASKED</span>
                  )}
                </span>
                <p className="font-bold text-cyan-300 font-mono">
                  {maskDocumentNumber(
                    extractedData.documentNumber,
                    extractedData.documentType,
                    extractedData.privacyMode ? extractedData.privacyMode === 'masked' : (extractedData.aadhaarPrivacy?.useMaskedAadhaar !== false && extractedData.isMaskedAadhaar !== false)
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div>
                <span className="text-slate-400 font-semibold block text-[11px] uppercase">Email Address</span>
                <input
                  type="email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail && setVisitorEmail(e.target.value)}
                  placeholder="visitor@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white mt-1 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block text-[11px] uppercase">Organization / Company</span>
              <input
                type="text"
                value={visitorCompany}
                onChange={(e) => setVisitorCompany && setVisitorCompany(e.target.value)}
                placeholder="Company / Self / Independent"
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
        <div className="md:col-span-6 bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>Select Resident Host & Purpose</span>
            </h3>

            {/* Resident Host Selector */}
            <div 
              ref={residentSectionRef}
              className={`p-3.5 rounded-xl border transition-all ${
                localResidentError || (!selectedResidentId && registrationError)
                  ? 'border-2 border-rose-500/90 bg-rose-950/30'
                  : selectedResidentId
                  ? 'border-emerald-500/40 bg-slate-950/60'
                  : 'border-amber-500/50 bg-amber-950/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
                  Target Resident / Apartment Unit <span className="text-rose-400">*</span>
                </label>
                {selectedResidentId && currentResident ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                    HOST SELECTED ✓
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    SELECTION REQUIRED
                  </span>
                )}
              </div>

              {localResidentError && (
                <div className="mb-2.5 p-2 rounded-lg bg-rose-900/80 border border-rose-500 text-rose-200 text-[11px] font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{localResidentError}</span>
                </div>
              )}

              {/* Target Resident Dropdown */}
              <div className="mb-3">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Select Resident Host from Dropdown:
                </label>
                <select
                  id="target-resident-dropdown"
                  value={selectedResidentId || ''}
                  onChange={(e) => handleSelectResident(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-cyan-400 focus:outline-none transition-colors"
                >
                  <option value="">-- Tap to Select Target Resident / Host Unit --</option>
                  {residents.map((r) => {
                    const rId = r.id || (r as any).residentId;
                    const rFlat = r.flatNumber || (r as any).flat || 'Unit';
                    return (
                      <option key={rId} value={rId}>
                        {r.name} — {r.building} (Flat: {rFlat})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Selected Resident Profile Box */}
              {currentResident && (
                <div className="mb-3 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between shadow-inner" id="selected-resident-display-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center font-bold text-cyan-300 text-sm shrink-0">
                      {currentResident.name ? currentResident.name[0] : 'R'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-xs text-white" id="selected-resident-name-display">{currentResident.name}</p>
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/90 px-1.5 py-0.2 rounded border border-emerald-500/40">VERIFIED HOST</span>
                      </div>
                      <p className="text-[11px] text-cyan-300 font-medium">{currentResident.building} • Flat {currentResident.flatNumber || (currentResident as any).flat}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{currentResident.phone || (currentResident as any).mobile || currentResident.email || 'Contact on file'}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                </div>
              )}

              {/* Quick Search & Filter */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Or search resident directory..."
                  value={residentSearchTerm}
                  onChange={(e) => setResidentSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  id="input-search-target-resident"
                />
              </div>

              {/* Resident Cards Picker */}
              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {filteredResidents.map((r) => {
                  const rId = r.id || (r as any).residentId;
                  const isSelected = selectedResidentId === rId;
                  return (
                    <button
                      type="button"
                      key={rId}
                      onClick={() => handleSelectResident(rId)}
                      className={`w-full p-2 rounded-xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                      id={`select-resident-${rId}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-cyan-400 text-xs">
                          {r.name ? r.name[0] : 'R'}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white">{r.name}</p>
                          <p className="text-[10px] text-slate-400">{r.building} ({r.flatNumber || (r as any).flat})</p>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      )}
                    </button>
                  );
                })}
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
        </div>

      </div>

      {/* 🛡️ SECTION 2: FINAL SECURITY EVALUATION GATE (END-TO-END VERIFICATION) */}
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
                FINAL SECURITY EVALUATION & COMPLIANCE GATE
              </h3>
              <p className="text-[10px] text-slate-400">
                Automated multi-point inspection evaluating real-time document integrity, biometrics, host selection & watchlists.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider flex items-center gap-1.5 ${
              evaluationReport.overallStatus === 'APPROVED'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : evaluationReport.overallStatus === 'VERIFIED'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{evaluationReport.overallStatus}: {evaluationReport.score}/100</span>
            </span>

            <button
              type="button"
              onClick={() => setShowFullEvaluationDetails(!showFullEvaluationDetails)}
              className="text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700 flex items-center gap-1"
            >
              <span>{showFullEvaluationDetails ? 'Hide' : 'Details'}</span>
              {showFullEvaluationDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 5-Point Checklist Breakdown */}
        {showFullEvaluationDetails && (
          <div className="space-y-2 pt-1 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              
              {/* Check 1: Document Integrity */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                evaluationReport.checks.documentIntegrity 
                  ? 'bg-slate-950 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-950 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-2">
                  {evaluationReport.checks.documentIntegrity ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold block text-white text-[11px]">1. Document Integrity</span>
                    <span className="text-[10px] text-slate-400">{extractedData.documentType} Scanned</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase">{evaluationReport.checks.documentIntegrity ? 'PASSED' : 'MISSING'}</span>
              </div>

              {/* Check 2: Name & ID Validated */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                evaluationReport.checks.nameVerified && evaluationReport.checks.docNumberValid
                  ? 'bg-slate-950 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-950 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-2">
                  {evaluationReport.checks.nameVerified && evaluationReport.checks.docNumberValid ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold block text-white text-[11px]">2. Identity Data OCR / Manual</span>
                    <span className="text-[10px] text-slate-400">Name & Number Confirmed</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase">
                  {evaluationReport.checks.nameVerified && evaluationReport.checks.docNumberValid ? 'PASSED' : 'INCOMPLETE'}
                </span>
              </div>

              {/* Check 3: Biometric Face Match */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                evaluationReport.checks.biometricMatch
                  ? 'bg-slate-950 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-950 border-amber-500/30 text-amber-300'
              }`}>
                <div className="flex items-center gap-2">
                  {evaluationReport.checks.biometricMatch ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold block text-white text-[11px]">3. Biometric Live Face</span>
                    <span className="text-[10px] text-slate-400">
                      {faceMetrics.faceMatchScore > 0 ? `${faceMetrics.faceMatchScore}% Match Score` : 'Live Photo Verified'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase">{evaluationReport.checks.biometricMatch ? 'PASSED' : 'PENDING'}</span>
              </div>

              {/* Check 4: Host Resident Authorization */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                evaluationReport.checks.hostAuthorized
                  ? 'bg-slate-950 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-950 border-amber-500/40 text-amber-300'
              }`}>
                <div className="flex items-center gap-2">
                  {evaluationReport.checks.hostAuthorized ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold block text-white text-[11px]">4. Host Resident Assignment</span>
                    <span className="text-[10px] text-slate-400">
                      {currentResident ? `${currentResident.building} (${currentResident.flatNumber})` : 'No Resident Selected'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase">{evaluationReport.checks.hostAuthorized ? 'CONFIRMED' : 'REQUIRED'}</span>
              </div>

            </div>

            {/* Evaluation Recommendation Banner */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Fingerprint className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Security Gate Recommendation:</span>
                  <span className="font-extrabold text-white text-xs">
                    {evaluationReport.recommendation === 'PROCEED_ENTRY'
                      ? '✓ All Compliance Checks Passed. Entry pass ready to issue.'
                      : evaluationReport.recommendation === 'RESIDENT_APPROVAL_REQUIRED'
                      ? 'ℹ Verification complete. Ready to dispatch approval notification to Resident Host.'
                      : '⚠ Manual inspection required. Please verify missing identity information.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Action Bar */}
      <div className="space-y-3 pt-2">
        {/* Server / Validation Error Banner */}
        {registrationError && (
          <div className="p-3.5 rounded-xl bg-rose-950/90 border-2 border-rose-500/90 text-rose-200 text-xs space-y-1 shadow-xl">
            <div className="flex items-center gap-2 font-black text-rose-300 uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>REGISTRATION BLOCKED</span>
            </div>
            <p className="text-[11px] text-rose-100 leading-relaxed font-semibold">
              {registrationError}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleCompleteButtonClick}
          disabled={isSaving}
          className={`w-full min-h-[52px] py-4 px-6 rounded-xl font-black text-sm sm:text-base shadow-xl flex items-center justify-center gap-2.5 transition-all ${
            isSaving
              ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-wait'
              : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-slate-950 shadow-emerald-500/20 active:scale-[0.99] cursor-pointer'
          }`}
          id="btn-complete-registration-save"
        >
          <CheckCircle2 className="w-5 h-5 text-slate-950 shrink-0" />
          <span>{isSaving ? 'SAVING DOCUMENTS & REGISTERING...' : 'COMPLETE REGISTRATION & SAVE DOCUMENTS'}</span>
        </button>
        
        <p className="text-[10px] text-slate-400 text-center">
          All scanned document images, OCR metadata, biometric face photo & visitor audit trail will be saved securely.
        </p>
      </div>

    </div>
  );
};
