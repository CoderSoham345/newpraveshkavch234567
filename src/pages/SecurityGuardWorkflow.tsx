import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Navigation } from '../components/Navigation';
import { MobileFrame } from '../components/MobileFrame';
import { Step1Dashboard } from '../components/Step1Dashboard';
import { Step2ScanFront } from '../components/Step2ScanFront';
import { Step3VerifyFront } from '../components/Step3VerifyFront';
import { Step4ScanBack } from '../components/Step4ScanBack';
import { Step5CaptureFace } from '../components/Step5CaptureFace';
import { Step6Summary } from '../components/Step6Summary';
import { Step7WaitingApproval } from '../components/Step7WaitingApproval';
import { Step8ApprovalResult } from '../components/Step8ApprovalResult';
import { VisitorHistory } from '../components/VisitorHistory';
import { ResidentsDirectory } from '../components/ResidentsDirectory';
import { ReportsAnalytics } from '../components/ReportsAnalytics';
import { AdminSettings } from '../components/AdminSettings';
import { AIChatbot } from '../components/chatbot/AIChatbot';
import { 
  WorkflowStep, 
  DocumentType, 
  VisitorRecord, 
  ExtractedDocData, 
  FaceVerificationData, 
  Resident, 
  SystemBuilding, 
  AuditLogItem, 
  AnalyticsStats 
} from '../types';

export function SecurityGuardWorkflow() {
  const { user, logout } = useAuth();
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scanner' | 'history' | 'residents' | 'reports' | 'admin'>('dashboard');
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(1);
  const [syncTime, setSyncTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Data stores
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [buildings, setBuildings] = useState<SystemBuilding[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsStats>({
    totalVisitorsToday: 0,
    currentlyInside: 0,
    pendingApprovals: 0,
    rejectedVisitorsToday: 0,
    avgVerificationTimeSec: 0,
    peakHour: '',
    weeklyTrends: [],
    hourlyTraffic: [],
    purposeBreakdown: [],
  });

  // Workflow state
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('AADHAAR_FRONT');
  const [frontDocImage, setFrontDocImage] = useState<string>('');
  const [backDocImage, setBackDocImage] = useState<string>('');
  const [liveFaceImage, setLiveFaceImage] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedDocData>({
    fullName: '',
    dob: '',
    gender: '',
    documentNumber: '',
    documentType: 'AADHAAR_FRONT',
    confidenceScore: 0,
    lowConfidenceFields: [],
  });
  const [faceMetrics, setFaceMetrics] = useState<FaceVerificationData>({
    faceDetected: true,
    qualityScore: 96,
    brightness: 92,
    sharpness: 94,
    framingPass: true,
    livenessPassed: true,
    maskDetected: false,
    faceMatchScore: 98,
  });

  const [selectedResidentId, setSelectedResidentId] = useState<string>('');
  const [visitPurpose, setVisitPurpose] = useState<string>('');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [numAccompanying, setNumAccompanying] = useState<number>(1);
  const [visitorPhone, setVisitorPhone] = useState<string>('');
  const [currentVisitorRecord, setCurrentVisitorRecord] = useState<VisitorRecord | null>(null);

  // Fetch data on mount
  useEffect(() => {
    console.log('[v0] SecurityGuardWorkflow mounted - user:', user?.name, 'gate:', user?.gate);
    
    // Fetch visitors
    fetch('/api/visitors')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.visitors)) {
          setVisitors(data.visitors);
        }
      })
      .catch(err => console.error('[v0] Failed to fetch visitors:', err));

    // Fetch residents
    fetch('/api/residents')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.residents)) {
          setResidents(data.residents);
        }
      })
      .catch(err => console.error('[v0] Failed to fetch residents:', err));

    // Fetch buildings
    fetch('/api/buildings')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.buildings)) {
          setBuildings(data.buildings);
        }
      })
      .catch(err => console.error('[v0] Failed to fetch buildings:', err));
  }, [user]);

  // Update sync clock
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Workflow handlers
  const handleStartWorkflow = () => {
    setActiveTab('scanner');
    setCurrentStep(2);
  };

  const handleFrontCaptureCompleted = async (imageUrl: string, isSample?: boolean, sampleData?: any) => {
    console.log('[v0] Front capture completed');
    setFrontDocImage(imageUrl);

    if (isSample && sampleData) {
      setExtractedData(sampleData);
      setCurrentStep(4);
      return;
    }

    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: imageUrl, docType: selectedDocType }),
      });
      const data = await res.json();
      if (data.success && data.extractedData) {
        setExtractedData(data.extractedData);
      }
    } catch (err) {
      console.error('[v0] OCR error:', err);
    }

    setCurrentStep(4);
  };

  const handleBackCaptureCompleted = (backUrl: string, addressData?: any) => {
    setBackDocImage(backUrl);
    if (addressData) {
      setExtractedData((prev) => ({
        ...prev,
        address: addressData.address || prev.address,
        pinCode: addressData.pinCode || prev.pinCode,
      }));
    }
    setCurrentStep(3);
  };

  const handleBackSkipped = () => {
    setCurrentStep(3);
  };

  const handleProceedToFaceCheck = () => {
    setCurrentStep(5);
  };

  const handleFaceCaptureCompleted = async (faceUrl: string, metrics: FaceVerificationData) => {
    setLiveFaceImage(faceUrl);
    setFaceMetrics(metrics);
    setCurrentStep(6);
  };

  const handleSendRequest = async () => {
    const resident = residents.find((r) => r.id === selectedResidentId) || residents[0];

    const payload = {
      visitorName: extractedData.fullName,
      phone: visitorPhone,
      documentType: selectedDocType,
      documentNumber: extractedData.documentNumber,
      frontDocUrl: frontDocImage,
      backDocUrl: backDocImage,
      liveFaceUrl: liveFaceImage,
      extractedData,
      faceMetrics,
      residentId: resident.id,
      residentName: resident.name,
      buildingUnit: `${resident.building} (${resident.flatNumber})`,
      purpose: visitPurpose,
      vehicleNumber,
      numAccompanying,
    };

    try {
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.visitor) {
        setCurrentVisitorRecord(data.visitor);
        setVisitors((prev) => [data.visitor, ...prev]);
        setCurrentStep(data.visitor.status === 'APPROVED' ? 8 : 7);
        return;
      }
    } catch (err) {
      console.warn('[v0] Server error, using fallback');
    }

    // Fallback
    const newRecord: VisitorRecord = {
      id: `vis-${Date.now()}`,
      passNumber: `VP-${Math.floor(1000 + Math.random() * 9000)}`,
      visitorName: extractedData.fullName,
      phone: visitorPhone,
      documentType: selectedDocType,
      documentNumber: extractedData.documentNumber,
      frontDocUrl: frontDocImage,
      backDocUrl: backDocImage,
      liveFaceUrl: liveFaceImage,
      extractedData,
      faceMetrics,
      residentId: resident.id,
      residentName: resident.name,
      buildingUnit: `${resident.building} (${resident.flatNumber})`,
      purpose: visitPurpose,
      vehicleNumber,
      numAccompanying,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      gateName: user?.gate || 'Main Gate',
      guardName: user?.name || 'Security Officer',
      qrCodeValue: `PRAVESH-${Date.now()}`,
    };

    setCurrentVisitorRecord(newRecord);
    setVisitors((prev) => [newRecord, ...prev]);
    setCurrentStep(7);
  };

  const handleApproveStatus = async () => {
    if (!currentVisitorRecord) return;
    try {
      const res = await fetch(`/api/visitors/${currentVisitorRecord.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      const data = await res.json();
      if (data.success) setCurrentVisitorRecord(data.visitor);
    } catch (err) {
      setCurrentVisitorRecord((prev) => prev ? { ...prev, status: 'APPROVED' } : null);
    }
    setCurrentStep(8);
  };

  const handleRejectStatus = async (reason: string) => {
    if (!currentVisitorRecord) return;
    try {
      const res = await fetch(`/api/visitors/${currentVisitorRecord.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', rejectionReason: reason }),
      });
      const data = await res.json();
      if (data.success) setCurrentVisitorRecord(data.visitor);
    } catch (err) {
      setCurrentVisitorRecord((prev) => prev ? { ...prev, status: 'REJECTED' } : null);
    }
    setCurrentStep(8);
  };

  const handleCheckInPass = async () => {
    if (!currentVisitorRecord) return;
    try {
      const res = await fetch(`/api/visitors/${currentVisitorRecord.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CHECKED_IN', checkInAt: new Date().toISOString() }),
      });
      const data = await res.json();
      if (data.success) setCurrentVisitorRecord(data.visitor);
    } catch (err) {
      console.error('[v0] Check-in error:', err);
    }
  };

  const handleCheckOutPass = async () => {
    if (!currentVisitorRecord) return;
    try {
      const res = await fetch(`/api/visitors/${currentVisitorRecord.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CHECKED_OUT', checkOutAt: new Date().toISOString() }),
      });
      const data = await res.json();
      if (data.success) setCurrentVisitorRecord(data.visitor);
    } catch (err) {
      console.error('[v0] Check-out error:', err);
    }
  };

  const handleResetVerification = () => {
    setCurrentVisitorRecord(null);
    setFrontDocImage('');
    setBackDocImage('');
    setLiveFaceImage('');
    setCurrentStep(2);
    setActiveTab('scanner');
  };

  const pendingApprovalsCount = visitors.filter((v) => v.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        currentRole="SECURITY_GUARD"
        setCurrentRole={() => {}}
        isMobileView={isMobileView}
        setIsMobileView={setIsMobileView}
        pendingApprovalsCount={pendingApprovalsCount}
        cameraActive={activeTab === 'scanner' && [2, 4, 5].includes(currentStep)}
        syncTime={syncTime}
        onNavigateHome={() => { setActiveTab('dashboard'); setCurrentStep(1); }}
      />

      <Navigation
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'scanner' && currentStep === 1) setCurrentStep(2);
        }}
        pendingCount={pendingApprovalsCount}
      />

      <main className="flex-1">
        <MobileFrame isMobileView={isMobileView}>
          {activeTab === 'dashboard' && (
            <Step1Dashboard
              stats={analytics}
              recentVisitors={visitors}
              currentRole="SECURITY_GUARD"
              onStartVerification={handleStartWorkflow}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'scanner' && (
            <div>
              {currentStep === 2 && (
                <Step2ScanFront
                  selectedDocType={selectedDocType}
                  setSelectedDocType={setSelectedDocType}
                  onCaptureCompleted={handleFrontCaptureCompleted}
                  onCancel={() => { setActiveTab('dashboard'); setCurrentStep(1); }}
                />
              )}
              {currentStep === 4 && (
                <Step4ScanBack
                  docType={selectedDocType}
                  onBackCaptureCompleted={handleBackCaptureCompleted}
                  onBackSkipped={handleBackSkipped}
                />
              )}
              {currentStep === 3 && (
                <Step3VerifyFront
                  frontImage={frontDocImage}
                  extractedData={extractedData}
                  setExtractedData={setExtractedData}
                  onProceedToScanBack={handleProceedToFaceCheck}
                  onRetakeFront={() => setCurrentStep(2)}
                />
              )}
              {currentStep === 5 && (
                <Step5CaptureFace
                  idImage={frontDocImage}
                  onFaceCaptureCompleted={handleFaceCaptureCompleted}
                  onBackToDocs={() => setCurrentStep(3)}
                />
              )}
              {currentStep === 6 && (
                <Step6Summary
                  frontDocUrl={frontDocImage}
                  backDocUrl={backDocImage}
                  liveFaceUrl={liveFaceImage}
                  extractedData={extractedData}
                  faceMetrics={faceMetrics}
                  residents={residents}
                  selectedResidentId={selectedResidentId}
                  setSelectedResidentId={setSelectedResidentId}
                  purpose={visitPurpose}
                  setPurpose={setVisitPurpose}
                  vehicleNumber={vehicleNumber}
                  setVehicleNumber={setVehicleNumber}
                  numAccompanying={numAccompanying}
                  setNumAccompanying={setNumAccompanying}
                  visitorPhone={visitorPhone}
                  setVisitorPhone={setVisitorPhone}
                  onSendRequest={handleSendRequest}
                  onBackToFace={() => setCurrentStep(5)}
                />
              )}
              {currentStep === 7 && currentVisitorRecord && (
                <Step7WaitingApproval
                  currentVisitor={currentVisitorRecord}
                  onApprove={handleApproveStatus}
                  onReject={(reason) => handleRejectStatus(reason)}
                  onCancelRequest={() => setCurrentStep(6)}
                />
              )}
              {currentStep === 8 && currentVisitorRecord && (
                <Step8ApprovalResult
                  visitor={currentVisitorRecord}
                  onCheckIn={handleCheckInPass}
                  onCheckOut={handleCheckOutPass}
                  onNewVerification={handleResetVerification}
                />
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <VisitorHistory
              visitors={visitors}
              onSelectVisitor={(visitor) => {
                setCurrentVisitorRecord(visitor);
                setActiveTab('scanner');
                setCurrentStep(8);
              }}
              onUpdateStatus={(id, status) => {
                setVisitors((prev) =>
                  prev.map((v) => (v.id === id ? { ...v, status } : v))
                );
              }}
            />
          )}

          {activeTab === 'residents' && (
            <ResidentsDirectory
              residents={residents}
              onSelectResidentToInvite={(res) => {
                setSelectedResidentId(res.id);
                handleStartWorkflow();
              }}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsAnalytics stats={analytics} />
          )}

          {activeTab === 'admin' && (
            <AdminSettings buildings={buildings} auditLogs={auditLogs} />
          )}
        </MobileFrame>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-400">
        <p>PraveshKavach™ Visitor Management System | Gate: {user?.gate} | Guard: {user?.name}</p>
      </footer>

      <AIChatbot currentPage={activeTab} currentRole="SECURITY_GUARD" />
    </div>
  );
}
