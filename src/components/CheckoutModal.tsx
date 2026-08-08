import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  Clock, 
  LogOut, 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  QrCode,
  FileText
} from 'lucide-react';
import { VisitorRecord } from '../types';
import { maskDocumentNumber } from '../utils/privacyUtils';

interface CheckoutModalProps {
  isOpen: boolean;
  visitor: VisitorRecord | null;
  onClose: () => void;
  onConfirmCheckout: (visitorId: string) => Promise<void>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  visitor,
  onClose,
  onConfirmCheckout,
}) => {
  const [step, setStep] = useState<'confirm' | 'completed'>('confirm');
  const [loading, setLoading] = useState(false);
  const [completedVisitor, setCompletedVisitor] = useState<VisitorRecord | null>(null);

  if (!isOpen || !visitor) return null;

  const entryTimeObj = visitor.checkInAt ? new Date(visitor.checkInAt) : new Date(visitor.createdAt);
  const nowObj = new Date();

  // Calculate duration string
  const calculateDuration = (start: Date, end: Date) => {
    const diffMs = Math.max(0, end.getTime() - start.getTime());
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return '< 1 minute';
    if (diffMins < 60) return `${diffMins} minutes`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const currentDuration = calculateDuration(entryTimeObj, nowObj);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirmCheckout(visitor.id);
      const exitIso = new Date().toISOString();
      const updated: VisitorRecord = {
        ...visitor,
        status: 'CHECKED_OUT',
        checkOutAt: exitIso,
        exitTime: exitIso,
        visitDuration: currentDuration,
      };
      setCompletedVisitor(updated);
      setStep('completed');
    } catch (err) {
      console.error('Checkout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const isMasked = visitor.privacyMode === 'masked' || visitor.isMaskedAadhaar !== false;
  const maskedIdNumber = maskDocumentNumber(visitor.documentNumber, visitor.documentType, isMasked);
  const activeVisitor = completedVisitor || visitor;
  const visitIdStr = activeVisitor.visitId || activeVisitor.passNumber;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      
      {/* Printable Receipt Area (Only visible when printing) */}
      <div className="hidden print:block printable-document bg-white text-black p-8 max-w-2xl mx-auto border-2 border-black">
        <div className="text-center border-b-2 border-black pb-4 mb-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-xl font-black uppercase tracking-wider">PRAVESHKAVACH™ SECURITY</h1>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-700">OFFICIAL VISITOR CHECKOUT RECEIPT</p>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Gate Pass & Exit Verification Document</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs font-mono my-4 border-b border-black pb-4">
          <div>
            <span className="font-bold block text-[10px] text-slate-500 uppercase">VISIT ID</span>
            <span className="font-black text-sm">{visitIdStr}</span>
          </div>
          <div>
            <span className="font-bold block text-[10px] text-slate-500 uppercase">STATUS</span>
            <span className="font-black text-sm text-black uppercase">CHECKED OUT</span>
          </div>
          <div>
            <span className="font-bold block text-[10px] text-slate-500 uppercase">VISITOR NAME</span>
            <span className="font-bold">{activeVisitor.visitorName}</span>
          </div>
          <div>
            <span className="font-bold block text-[10px] text-slate-500 uppercase">IDENTITY DOCUMENT</span>
            <span className="font-bold">{activeVisitor.documentType} ({maskedIdNumber})</span>
          </div>
          <div>
            <span className="font-bold block text-[10px] text-slate-500 uppercase">PURPOSE OF VISIT</span>
            <span>{activeVisitor.purpose}</span>
          </div>
          <div>
            <span className="font-bold block text-[10px] text-slate-500 uppercase">HOST / RESIDENT</span>
            <span>{activeVisitor.residentName} ({activeVisitor.buildingUnit})</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs font-mono bg-slate-100 p-3 rounded border border-slate-300 my-4">
          <div>
            <span className="font-bold block text-[10px] text-slate-500 uppercase">ENTRY TIME</span>
            <span className="font-bold">{entryTimeObj.toLocaleDateString()} {entryTimeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div>
            <span className="font-bold block text-[10px] text-slate-500 uppercase">EXIT TIME</span>
            <span className="font-bold">{activeVisitor.checkOutAt ? new Date(activeVisitor.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString()}</span>
          </div>
          <div>
            <span className="font-bold block text-[10px] text-slate-500 uppercase">VISIT DURATION</span>
            <span className="font-bold text-black">{activeVisitor.visitDuration || currentDuration}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-black text-[10px] font-mono">
          <div>
            <p>Gate: {activeVisitor.gateName || 'Main Gate 01'}</p>
            <p>Officer: {activeVisitor.guardName || 'Security Guard'}</p>
          </div>
          <div className="text-right">
            <p className="font-bold">PRAVESHKAVACH™ SECURE LOG</p>
            <p>System Generated Receipt</p>
          </div>
        </div>
      </div>

      {/* Screen Modal Dialog */}
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-6 print:hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'confirm' ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">CONFIRM VISITOR CHECKOUT</h2>
                <p className="text-xs text-slate-400">Process exit for active visitor on premises</p>
              </div>
            </div>

            {/* Visitor Summary Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Visit ID</span>
                  <span className="font-mono text-sm font-black text-cyan-400">{visitIdStr}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                  STATUS: ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Visitor Name</span>
                  <p className="font-bold text-white">{visitor.visitorName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Host / Person to Visit</span>
                  <p className="font-bold text-slate-200">{visitor.residentName} ({visitor.buildingUnit})</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Entry Time</span>
                  <p className="font-mono font-semibold text-slate-300">
                    {entryTimeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Current Visit Duration</span>
                  <p className="font-mono font-extrabold text-amber-400">{currentDuration}</p>
                </div>
              </div>
            </div>

            {/* Confirmation Alert Question */}
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3.5 rounded-xl text-xs space-y-1">
              <p className="font-bold">Are you sure you want to check out this visitor?</p>
              <p className="text-[11px] text-amber-300/80">
                This action will record the exit timestamp ({nowObj.toLocaleTimeString()}), calculate total visit duration, and update visitor status to CHECKED OUT.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-white font-black text-xs shadow-lg shadow-rose-500/20 flex items-center gap-2"
              >
                {loading ? (
                  <span>PROCESSING EXIT...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CONFIRM CHECKOUT</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Completed Success View */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-widest">
                CHECKOUT COMPLETED
              </span>
              <h2 className="text-2xl font-black text-white">VISITOR CHECKED OUT</h2>
              <p className="text-xs text-slate-300">
                ✓ {activeVisitor.visitorName} has successfully checked out at {new Date(activeVisitor.checkOutAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-bold">VISIT ID:</span>
                <span className="text-cyan-400 font-black">{visitIdStr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ENTRY TIME:</span>
                <span className="text-slate-200">{entryTimeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">EXIT TIME:</span>
                <span className="text-emerald-400 font-bold">{new Date(activeVisitor.checkOutAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400">TOTAL DURATION:</span>
                <span className="text-amber-400 font-extrabold">{activeVisitor.visitDuration || currentDuration}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={handlePrintReceipt}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center gap-2"
                id="btn-print-checkout-receipt"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>PRINT CHECKOUT RECEIPT</span>
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-lg"
              >
                DONE & RETURN TO DASHBOARD
              </button>
            </div>
          </>
        )}

      </div>

    </div>
  );
};
