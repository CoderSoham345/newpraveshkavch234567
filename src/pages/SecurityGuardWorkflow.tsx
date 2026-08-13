import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { safeFetch } from '../utils/safeApi';
import { logOCRInputDetails } from '../utils/debugLogger';
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
import { CheckoutModal } from '../components/CheckoutModal';
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
import { 
  saveVisitorWithDocuments, 
  checkDuplicateRegistration, 
  syncOfflineQueue, 
  UploadProgressStatus, 
  SaveVisitorPayload 
} from '../utils/documentStorage';
import { validateFinalRegistration } from '../utils/registrationValidator';
import { AlertTriangle, CheckCircle2, CloudUpload, RefreshCw, X, HardDrive } from 'lucide-react';

export function SecurityGuardWorkflow() {
  const { user, logout, switchRole } = useAuth();
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

  // Additional Form & Document Storage States
  const [visitorEmail, setVisitorEmail] = useState<string>('');
  const [visitorCompany, setVisitorCompany] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgressStatus | null>(null);
  const [duplicateModal, setDuplicateModal] = useState<{ show: boolean; existingVisitor?: VisitorRecord; payload?: SaveVisitorPayload } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Auto-sync offline queue on reconnect
  useEffect(() => {
    const handleOnline = async () => {
      console.log('[Network] Internet restored. Syncing offline visitor queue...');
      const result = await syncOfflineQueue();
      if (result.syncedCount > 0) {
        setToastMessage(`✔ Offline Auto-sync: ${result.syncedCount} visitor scan record(s) uploaded successfully.`);
        // Refresh visitors list
        const res = await safeFetch('/api/visitors');
        if (res.ok && Array.isArray(res.data?.visitors)) {
          setVisitors(res.data.visitors);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);
  // Workflow state
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('PAN_CARD');
  const [aadhaarSettings, setAadhaarSettings] = useState<{ useMaskedAadhaar: boolean }>({ useMaskedAadhaar: true });
  const [frontDocImage, setFrontDocImage] = useState<string>('');
  const [backDocImage, setBackDocImage] = useState<string>('');
  const [liveFaceImage, setLiveFaceImage] = useState<string>('');
  const [checkoutVisitor, setCheckoutVisitor] = useState<VisitorRecord | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);

  const handleOpenCheckoutModal = (visitor: VisitorRecord) => {
    setCheckoutVisitor(visitor);
    setIsCheckoutModalOpen(true);
  };
  const [extractedData, setExtractedData] = useState<ExtractedDocData>({
    fullName: '',
    dob: '',
    gender: '',
    documentNumber: '',
    documentType: 'PAN_CARD',
    confidenceScore: 0,
    lowConfidenceFields: [],
  });

  const generateEmptyDocData = (docType: DocumentType): ExtractedDocData => {
    const target = docType !== 'AUTOMATIC_DETECTION' ? docType : 'PAN_CARD';
    return {
      fullName: '',
      documentNumber: '',
      fatherName: '',
      dob: '',
      documentType: target,
      confidenceScore: 0,
      lowConfidenceFields: ['fullName', 'documentNumber', 'dob'],
    };
  };
  const [faceMetrics, setFaceMetrics] = useState<FaceVerificationData>({
    faceDetected: false,
    qualityScore: 0,
    brightness: 0,
    sharpness: 0,
    framingPass: false,
    livenessPassed: false,
    maskDetected: false,
    faceMatchScore: 0,
  });

  const [selectedResidentId, setSelectedResidentId] = useState<string>('');
  const [visitPurpose, setVisitPurpose] = useState<string>('Personal Visit');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [numAccompanying, setNumAccompanying] = useState<number>(1);
  const [visitorPhone, setVisitorPhone] = useState<string>('');
  const [currentVisitorRecord, setCurrentVisitorRecord] = useState<VisitorRecord | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    console.log('[v0] SecurityGuardWorkflow mounted - user:', user?.name, 'gate:', user?.gate);
    
    // Fetch analytics
    safeFetch('/api/analytics')
      .then(response => {
        if (response.ok && response.data?.analytics) {
          setAnalytics(response.data.analytics);
        }
        if (response.ok && Array.isArray(response.data?.auditLogs)) {
          setAuditLogs(response.data.auditLogs);
        }
      })
      .catch(err => console.error('[v0] Failed to fetch analytics:', err));

    // Fetch visitors
    safeFetch('/api/visitors')
      .then(response => {
        if (response.ok && Array.isArray(response.data?.visitors)) {
          setVisitors(response.data.visitors);
        }
      })
      .catch(err => console.error('[v0] Failed to fetch visitors:', err));

    // Fetch residents
    safeFetch('/api/residents')
      .then(response => {
        if (response.ok && Array.isArray(response.data?.residents)) {
          setResidents(response.data.residents);
        }
      })
      .catch(err => console.error('[v0] Failed to fetch residents:', err));

    // Fetch buildings
    safeFetch('/api/buildings')
      .then(response => {
        if (response.ok && Array.isArray(response.data?.buildings)) {
          setBuildings(response.data.buildings);
        }
      })
      .catch(err => console.error('[v0] Failed to fetch buildings:', err));
  }, [user]);

  // Real-time SSE listener for instant cross-device and exit updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'visitor_updated' || parsed.type === 'visitor_exit') {
            const updatedVis: VisitorRecord = parsed.data?.visitor || parsed.data;
            if (updatedVis && updatedVis.id) {
              setVisitors((prev) => {
                const idx = prev.findIndex((v) => v.id === updatedVis.id || v.passNumber === updatedVis.passNumber);
                if (idx >= 0) {
                  const updatedList = [...prev];
                  updatedList[idx] = updatedVis;
                  return updatedList;
                }
                return [updatedVis, ...prev];
              });

              if (currentVisitorRecord && (currentVisitorRecord.id === updatedVis.id || currentVisitorRecord.passNumber === updatedVis.passNumber)) {
                setCurrentVisitorRecord(updatedVis);
              }
            }

            // Refresh analytics and audit logs
            safeFetch('/api/analytics').then((res) => {
              if (res.ok && res.data?.analytics) setAnalytics(res.data.analytics);
              if (res.ok && Array.isArray(res.data?.auditLogs)) setAuditLogs(res.data.auditLogs);
            });
          }
        } catch (e) {
          // parse error ignored
        }
      };
    } catch (err) {
      console.warn('[v0] SSE EventSource connection warning:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [currentVisitorRecord]);

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
    console.log('[v0] Front capture completed. Selected docType:', selectedDocType);
    setFrontDocImage(imageUrl);

    const userChosenDocType = selectedDocType;

    if ((isSample && sampleData) || (sampleData && (sampleData.fullName || sampleData.documentNumber))) {
      const targetType = userChosenDocType !== 'AUTOMATIC_DETECTION' ? userChosenDocType : (sampleData.documentType || 'PAN_CARD');
      setExtractedData({
        ...sampleData,
        documentType: targetType,
      });
      setCurrentStep(3);
      return;
    }

    try {
      await logOCRInputDetails(imageUrl, userChosenDocType);

      const response = await safeFetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: imageUrl, docType: userChosenDocType }),
      });

      console.log('OCR RESPONSE:', { received: true, status: response.status, data: response.data });

      if (response.ok && response.data?.extractedData) {
        const targetType = userChosenDocType !== 'AUTOMATIC_DETECTION' 
          ? userChosenDocType 
          : (response.data.extractedData.documentType || 'PAN_CARD');

        setExtractedData({
          ...response.data.extractedData,
          documentType: targetType,
        });
      } else {
        setExtractedData(generateEmptyDocData(userChosenDocType));
      }
    } catch (err) {
      console.error('[v0] OCR error:', err);
      setExtractedData(generateEmptyDocData(userChosenDocType));
    }

    setCurrentStep(3);
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
    if (selectedDocType === 'AADHAAR_CARD' && !backDocImage) {
      setCurrentStep(4);
    } else {
      setCurrentStep(5);
    }
  };

  const handleFaceCaptureCompleted = async (faceUrl: string, metrics: FaceVerificationData) => {
    setLiveFaceImage(faceUrl);
    setFaceMetrics(metrics);
    setCurrentStep(6);
  };

  const executeSaveRegistration = async (payload: SaveVisitorPayload) => {
    setIsSaving(true);
    try {
      const result = await saveVisitorWithDocuments(payload, (status) => {
        setUploadProgress(status);
      });

      if (result.success && result.visitor) {
        setVisitors((prev) => [result.visitor, ...prev.filter((v) => v.id !== result.visitor.id)]);
        setCurrentVisitorRecord(result.visitor);
        setToastMessage('✔ Visitor Registered Successfully | ✔ Scanned Documents Saved');
        
        setTimeout(() => {
          setUploadProgress(null);
          setIsSaving(false);
          setCurrentStep(8); // Advance to Pass & Summary
        }, 1200);
      }
    } catch (err: any) {
      console.error('Registration save error:', err);
      setIsSaving(false);
      setUploadProgress({
        step: 'ERROR',
        progressPercent: 0,
        message: 'Failed to save documents. Please check connection and retry.',
      });
    }
  };

  const handleSendRequest = async () => {
    console.log('[REGISTRATION] Initiating registration submission check...');
    setRegistrationError(null);

    try {
      // Hard Registration Gate Validation
      const validation = validateFinalRegistration({
        frontDocImage,
        backDocImage,
        liveFaceImage,
        extractedData,
        faceMetrics,
        selectedResidentId,
        residents,
        visitorPhone,
        purpose: visitPurpose,
      });

      console.log('[REGISTRATION] Gate validation result:', validation);

      if (!validation.valid) {
        const primaryError = validation.errors[0] || 'Registration blocked due to missing or invalid information.';
        console.warn('[REGISTRATION] Submission BLOCKED:', validation.errors);
        setRegistrationError(primaryError);
        setToastMessage(`⚠️ ${primaryError}`);
        return;
      }

      const resident = validation.targetResident!;

      const payload: SaveVisitorPayload = {
        visitorName: extractedData.fullName,
        phone: visitorPhone,
        email: visitorEmail || `${extractedData.fullName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        company: visitorCompany || extractedData.companyName || 'Self / Private',
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
        purpose: visitPurpose || 'Personal Visit',
        vehicleNumber,
        numAccompanying,
        guardName: user?.name || 'Security Officer',
        guardId: user?.id || 'guard-01',
        gateName: user?.gate || 'Main Gate 01',
        verificationStatus: 'VERIFIED',
      };

      // Check duplicate visitor within 24 hours
      const dupCheck = checkDuplicateRegistration(visitors, payload.documentNumber, payload.phone, 24);
      if (dupCheck.isDuplicate && dupCheck.existingVisitor) {
        console.log('[REGISTRATION] Duplicate visitor detected within 24h:', dupCheck.existingVisitor.passNumber);
        setDuplicateModal({
          show: true,
          existingVisitor: dupCheck.existingVisitor,
          payload,
        });
        return;
      }

      await executeSaveRegistration(payload);
    } catch (err: any) {
      console.error('[REGISTRATION] Fatal error during handleSendRequest:', err);
      const errMsg = err?.message || 'An unexpected error occurred during visitor registration.';
      setRegistrationError(errMsg);
      setToastMessage(`❌ Registration Error: ${errMsg}`);
    }
  };

  const handleApproveStatus = async () => {
    if (!currentVisitorRecord) return;
    try {
      const res = await safeFetch(`/api/visitors/${currentVisitorRecord.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      if (res.ok && res.data?.visitor) {
        setCurrentVisitorRecord(res.data.visitor);
      } else {
        setCurrentVisitorRecord((prev) => prev ? { ...prev, status: 'APPROVED' } : null);
      }
    } catch (err) {
      setCurrentVisitorRecord((prev) => prev ? { ...prev, status: 'APPROVED' } : null);
    }
    setCurrentStep(8);
  };

  const handleRejectStatus = async (reason: string) => {
    if (!currentVisitorRecord) return;
    try {
      const res = await safeFetch(`/api/visitors/${currentVisitorRecord.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', rejectionReason: reason }),
      });
      if (res.ok && res.data?.visitor) {
        setCurrentVisitorRecord(res.data.visitor);
      } else {
        setCurrentVisitorRecord((prev) => prev ? { ...prev, status: 'REJECTED', rejectionReason: reason } : null);
      }
    } catch (err) {
      setCurrentVisitorRecord((prev) => prev ? { ...prev, status: 'REJECTED', rejectionReason: reason } : null);
    }
    setCurrentStep(8);
  };

  const handleCheckInPass = async () => {
    if (!currentVisitorRecord) return;
    try {
      const res = await safeFetch(`/api/visitors/${currentVisitorRecord.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CHECKED_IN', checkInAt: new Date().toISOString() }),
      });
      if (res.ok && res.data?.visitor) {
        setCurrentVisitorRecord(res.data.visitor);
      } else {
        setCurrentVisitorRecord((prev) => prev ? { ...prev, status: 'CHECKED_IN', checkInAt: new Date().toISOString() } : null);
      }
    } catch (err) {
      console.error('[v0] Check-in error:', err);
    }
  };

  const handleCheckOutPass = async () => {
    if (!currentVisitorRecord) return;
    handleOpenCheckoutModal(currentVisitorRecord);
  };

  const handleMarkExit = async (visitorId: string) => {
    try {
      const res = await safeFetch(`/api/visitors/${visitorId}/exit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performedBy: user?.name || 'Security Guard', gateName: user?.gate || 'Main Gate 01' }),
      });

      if (res.ok && res.data?.visitor) {
        const updatedVisitor = res.data.visitor;
        setVisitors((prev) =>
          prev.map((v) => (v.id === visitorId || v.passNumber === updatedVisitor.passNumber ? updatedVisitor : v))
        );
        if (currentVisitorRecord && (currentVisitorRecord.id === visitorId || currentVisitorRecord.passNumber === updatedVisitor.passNumber)) {
          setCurrentVisitorRecord(updatedVisitor);
        }
      } else {
        const now = new Date().toISOString();
        setVisitors((prev) =>
          prev.map((v) => (v.id === visitorId ? { ...v, status: 'CHECKED_OUT', checkOutAt: now, visitDuration: '12 mins' } : v))
        );
      }

      // Re-fetch analytics & audit logs
      const analyticsRes = await safeFetch('/api/analytics');
      if (analyticsRes.ok && analyticsRes.data?.analytics) {
        setAnalytics(analyticsRes.data.analytics);
      }
      if (analyticsRes.ok && Array.isArray(analyticsRes.data?.auditLogs)) {
        setAuditLogs(analyticsRes.data.auditLogs);
      }
    } catch (err) {
      console.error('[v0] Exit marking error:', err);
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
        currentRole={user?.role || 'SECURITY_GUARD'}
        setCurrentRole={switchRole}
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
              onMarkExit={handleMarkExit}
              onOpenCheckoutModal={handleOpenCheckoutModal}
            />
          )}

          {activeTab === 'scanner' && (
            <div>
              {currentStep === 2 && (
                <Step2ScanFront
                  selectedDocType={selectedDocType}
                  setSelectedDocType={setSelectedDocType}
                  aadhaarSettings={aadhaarSettings}
                  onUpdateAadhaarSettings={setAadhaarSettings}
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
                  onNavigateToHistory={() => setActiveTab('history')}
                  onUpdateFrontImage={setFrontDocImage}
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
                  visitorEmail={visitorEmail}
                  setVisitorEmail={setVisitorEmail}
                  visitorCompany={visitorCompany}
                  setVisitorCompany={setVisitorCompany}
                  onSendRequest={handleSendRequest}
                  onBackToFace={() => setCurrentStep(5)}
                  isSaving={isSaving}
                  registrationError={registrationError}
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
              auditLogs={auditLogs}
              onMarkExit={handleMarkExit}
              onOpenCheckoutModal={handleOpenCheckoutModal}
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
              onDeleteVisitor={async (id) => {
                try {
                  await safeFetch(`/api/visitors/${id}`, { method: 'DELETE' });
                  setVisitors((prev) => prev.filter((v) => v.id !== id));
                } catch (e) {
                  setVisitors((prev) => prev.filter((v) => v.id !== id));
                }
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

      {/* Upload Progress Overlay */}
      {uploadProgress && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <CloudUpload className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Saving Visitor & Document Scans</h3>
              <p className="text-xs text-slate-400 mt-1">{uploadProgress.message}</p>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
                style={{ width: `${uploadProgress.progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>{uploadProgress.step}</span>
              <span>{uploadProgress.progressPercent}%</span>
            </div>
            {uploadProgress.isOffline && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] p-2.5 rounded-lg flex items-center gap-2 text-left">
                <HardDrive className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Saved to local Capacitor filesystem queue. Auto-syncs when online.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Duplicate Prevention Alert Modal */}
      {duplicateModal && duplicateModal.show && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Duplicate Registration Alert</h3>
                <p className="text-[11px] text-amber-300">Matching visitor found within 24 hours</p>
              </div>
            </div>

            {duplicateModal.existingVisitor && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Visitor Name:</span>
                  <span className="font-bold text-white">{duplicateModal.existingVisitor.visitorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pass Number:</span>
                  <span className="font-mono text-cyan-400">{duplicateModal.existingVisitor.passNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Document No:</span>
                  <span className="font-mono text-slate-300">{duplicateModal.existingVisitor.documentNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Previous Entry:</span>
                  <span className="text-slate-300">{new Date(duplicateModal.existingVisitor.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <span className="font-bold text-emerald-400">{duplicateModal.existingVisitor.status}</span>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-300">
              This visitor was recently registered at the gate. Would you like to issue a new pass anyway or view the existing pass?
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDuplicateModal(null)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (duplicateModal.payload) {
                    const payload = { ...duplicateModal.payload, overrideDuplicate: true };
                    setDuplicateModal(null);
                    await executeSaveRegistration(payload);
                  }
                }}
                className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs"
              >
                Override & Re-Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-3 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Checkout Confirmation & Receipt Modal */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        visitor={checkoutVisitor}
        onClose={() => setIsCheckoutModalOpen(false)}
        onConfirmCheckout={handleMarkExit}
      />
    </div>
  );
}
