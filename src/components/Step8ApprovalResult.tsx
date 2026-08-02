import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  QrCode, 
  Download, 
  Printer, 
  Share2, 
  ArrowRight, 
  RotateCcw, 
  ShieldCheck, 
  Building2, 
  Clock, 
  UserCheck, 
  FileText,
  Sparkles,
  Barcode
} from 'lucide-react';
import { VisitorRecord } from '../types';

interface Step8ApprovalResultProps {
  visitor: VisitorRecord;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onNewVerification: () => void;
}

export const Step8ApprovalResult: React.FC<Step8ApprovalResultProps> = ({
  visitor,
  onCheckIn,
  onCheckOut,
  onNewVerification,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const isApproved = visitor.status === 'APPROVED' || visitor.status === 'CHECKED_IN' || visitor.status === 'CHECKED_OUT';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `PraveshKavach™ - Visitor Pass ${visitor.passNumber}`,
        text: `Visitor Pass approved for ${visitor.visitorName} visiting ${visitor.residentName}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`Pass Number: ${visitor.passNumber} | Visitor: ${visitor.visitorName}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      
      {/* Result Status Banner */}
      {isApproved ? (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-2 border-emerald-500/50 p-6 rounded-2xl text-center space-y-3 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 uppercase tracking-widest">
            VISITOR APPROVED!
          </span>
          <h2 className="text-2xl font-black text-white">ACCESS GRANTED</h2>
          <p className="text-xs text-emerald-300">
            Resident {visitor.residentName} has approved entry for {visitor.visitorName}.
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-rose-950 via-red-950 to-slate-900 border-2 border-rose-500/50 p-6 rounded-2xl text-center space-y-3 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-500/30">
            <XCircle className="w-10 h-10" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white uppercase tracking-widest">
            VISITOR REJECTED!
          </span>
          <h2 className="text-2xl font-black text-white">ACCESS DENIED</h2>
          <p className="text-xs text-rose-300 font-semibold">
            Reason: {visitor.rejectionReason || 'Resident rejected entry request'}
          </p>
        </div>
      )}

      {/* Digital Visitor Pass Card (Printable) */}
      {isApproved && (
        <div className="bg-slate-900 border-2 border-blue-500/40 rounded-2xl p-6 shadow-2xl space-y-6 relative print:border-black print:bg-white print:text-black">
          
          {/* Pass Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">PRAVESHKAVACH™ DIGITAL GATE PASS</h3>
                <p className="text-xs text-slate-400">Issued by Main Gate Security Guard</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Pass No</span>
              <span className="font-mono text-sm font-black text-cyan-400">{visitor.passNumber}</span>
            </div>
          </div>

          {/* Pass Body: Photo + Details + QR Code */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            
            {/* Visitor Photo & Details */}
            <div className="sm:col-span-8 flex items-start gap-4">
              <img
                src={visitor.liveFaceUrl}
                alt={visitor.visitorName}
                className="w-20 h-24 rounded-xl object-cover border-2 border-cyan-400 shadow-md shrink-0"
              />

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Visitor Name</span>
                  <p className="font-extrabold text-sm text-white">{visitor.visitorName}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">ID Type</span>
                    <p className="font-semibold text-slate-200">{visitor.documentType}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">ID Number</span>
                    <p className="font-mono font-bold text-cyan-300">{visitor.documentNumber}</p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Resident Host</span>
                  <p className="font-bold text-emerald-400">{visitor.residentName} ({visitor.buildingUnit})</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Visit Purpose</span>
                  <p className="font-semibold text-slate-200">{visitor.purpose}</p>
                </div>
              </div>
            </div>

            {/* QR Code & Barcode */}
            <div className="sm:col-span-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2 flex flex-col items-center justify-center">
              <div className="bg-white p-2.5 rounded-lg shadow-inner">
                {/* SVG Mock QR Code */}
                <svg className="w-28 h-28" viewBox="0 0 100 100" fill="black">
                  <rect x="0" y="0" width="30" height="30" />
                  <rect x="5" y="5" width="20" height="20" fill="white" />
                  <rect x="10" y="10" width="10" height="10" fill="black" />
                  
                  <rect x="70" y="0" width="30" height="30" />
                  <rect x="75" y="5" width="20" height="20" fill="white" />
                  <rect x="80" y="10" width="10" height="10" fill="black" />

                  <rect x="0" y="70" width="30" height="30" />
                  <rect x="5" y="75" width="20" height="20" fill="white" />
                  <rect x="10" y="80" width="10" height="10" fill="black" />

                  <rect x="35" y="10" width="10" height="20" />
                  <rect x="50" y="5" width="15" height="15" />
                  <rect x="40" y="40" width="20" height="20" />
                  <rect x="65" y="45" width="15" height="15" />
                  <rect x="35" y="70" width="15" height="15" />
                  <rect x="55" y="80" width="25" height="10" />
                </svg>
              </div>

              <div className="text-center">
                <p className="font-mono text-[10px] text-slate-400 font-bold tracking-widest">{visitor.qrCodeValue}</p>
                <p className="text-[9px] text-emerald-400 font-bold uppercase mt-0.5">Scannable Gate Pass</p>
              </div>
            </div>

          </div>

          {/* Gate Entry & Status Action Bar */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5"
                id="btn-print-pass"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Print Pass</span>
              </button>

              <button
                onClick={handleShare}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5"
                id="btn-share-pass"
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{copied ? 'Copied!' : 'Share Pass'}</span>
              </button>
            </div>

            {/* Check-In / Check-Out Controls */}
            {visitor.status === 'APPROVED' && (
              <button
                onClick={onCheckIn}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                id="btn-proceed-checkin"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>PROCEED WITH ENTRY (CHECK IN)</span>
              </button>
            )}

            {visitor.status === 'CHECKED_IN' && (
              <button
                onClick={onCheckOut}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2"
                id="btn-mark-checkout"
              >
                <Clock className="w-4 h-4" />
                <span>MARK CHECKED OUT</span>
              </button>
            )}

            {visitor.status === 'CHECKED_OUT' && (
              <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold">
                Pass Checked Out & Closed
              </span>
            )}
          </div>

        </div>
      )}

      {/* Start Next Verification Action */}
      <div className="text-center pt-4 print:hidden">
        <button
          onClick={onNewVerification}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 mx-auto"
          id="btn-start-next-verification"
        >
          <RotateCcw className="w-4 h-4" />
          <span>START NEW VISITOR VERIFICATION</span>
        </button>
      </div>

    </div>
  );
};
