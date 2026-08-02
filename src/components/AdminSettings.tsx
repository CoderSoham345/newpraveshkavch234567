import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  ShieldCheck, 
  KeyRound, 
  Sliders, 
  FileText, 
  Users, 
  CheckCircle2, 
  Zap,
  Save,
  Server,
  Send as TelegramIcon,
  Activity,
  Check,
  X,
  RefreshCw,
  Send
} from 'lucide-react';
import { SystemBuilding, AuditLogItem } from '../types';

interface AdminSettingsProps {
  buildings: SystemBuilding[];
  auditLogs: AuditLogItem[];
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ buildings, auditLogs }) => {
  const [autoApproveCourier, setAutoApproveCourier] = useState<boolean>(true);
  const [cameraAutoScan, setCameraAutoScan] = useState<boolean>(true);
  const [livenessThreshold, setLivenessThreshold] = useState<number>(85);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Telegram Config state (read-only, from environment variables)
  const [botConfigStatus, setBotConfigStatus] = useState<{
    botConfigured: boolean;
    chatIdConfigured: boolean;
    lastMessageTime: string | null;
  }>({
    botConfigured: false,
    chatIdConfigured: false,
    lastMessageTime: null,
  });
  
  // Test connection state
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    botName?: string;
  }>({
    tested: false,
    success: false,
    message: 'Click "Test Telegram Connection" to verify backend configuration',
  });

  useEffect(() => {
    // Fetch Telegram settings status from server (read-only)
    fetch('/api/telegram/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setBotConfigStatus({
            botConfigured: data.config.hasBotToken,
            chatIdConfigured: !!data.config.defaultChatId,
            lastMessageTime: data.config.lastMessageTime,
          });
        }
      })
      .catch((err) => console.warn('Failed to load Telegram settings:', err));
  }, []);

  const handleTestTelegram = async () => {
    setTestingConnection(true);
    console.log('[v0] Testing Telegram connection using backend environment variables');
    try {
      console.log('[v0] Sending POST to /api/telegram/test');
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // No user input - uses env vars only
      });
      
      console.log('[v0] Response status:', res.status, res.statusText);
      console.log('[v0] Response content-type:', res.headers.get('content-type'));
      
      if (!res.ok) {
        console.error('[v0] Response not OK, attempting to read text first');
        const text = await res.text();
        console.error('[v0] Response body (first 200 chars):', text.substring(0, 200));
        throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
      }
      
      const data = await res.json();
      console.log('[v0] Parsed JSON response:', { success: data.success, message: data.message });
      
      setConnectionStatus({
        tested: true,
        success: data.success,
        message: data.message || (data.success ? 'Telegram Connected Successfully' : 'Telegram Connection Failed'),
        botName: data.botInfo?.username ? `@${data.botInfo.username}` : undefined,
      });
      if (data.success) {
        setBotConfigStatus(prev => ({
          ...prev,
          lastMessageTime: new Date().toISOString(),
        }));
      }
    } catch (e: any) {
      console.error('[v0] Telegram test error:', e);
      setConnectionStatus({
        tested: true,
        success: false,
        message: `Telegram Connection Failed: ${e.message}`,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-cyan-400" />
            <span>PraveshKavach™ Platform Administration</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure buildings, security rules, Telegram Bot integration, AI OCR parameters, and view audit trails
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg flex items-center gap-2"
          id="btn-save-admin-settings"
        >
          <Save className="w-4 h-4" />
          <span>{savedSuccess ? 'Settings Saved! ✓' : 'Save Configuration'}</span>
        </button>
      </div>

      {/* Grid: Rules & Telegram (Left) vs Buildings & Audit (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Telegram Integration & Security Rules */}
        <div className="md:col-span-6 space-y-6">
          
          {/* Telegram Bot Settings Section */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-cyan-500/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TelegramIcon className="w-4 h-4 text-cyan-400" />
                <span>Telegram Bot Integration</span>
              </h3>
              
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                botConfigStatus.botConfigured && botConfigStatus.chatIdConfigured
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                <Activity className="w-3 h-3" />
                <span>{botConfigStatus.botConfigured && botConfigStatus.chatIdConfigured ? 'Bot Configured' : 'Bot Not Configured'}</span>
              </span>
            </div>

            {/* Status Banner */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              connectionStatus.tested
                ? connectionStatus.success
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-center gap-2.5">
                {connectionStatus.tested ? (
                  connectionStatus.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <X className="w-5 h-5 text-rose-400 shrink-0" />
                  )
                ) : (
                  <TelegramIcon className="w-5 h-5 text-cyan-400 shrink-0" />
                )}
                <div>
                  <p className="font-extrabold text-white">
                    {connectionStatus.tested
                      ? connectionStatus.success
                        ? '✅ Telegram Connected Successfully'
                        : '❌ Telegram Connection Failed'
                      : 'Telegram Bot Authorization Service'}
                  </p>
                  <p className="text-[11px] opacity-80 mt-0.5">{connectionStatus.message}</p>
                </div>
              </div>

              {connectionStatus.botName && (
                <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] border border-cyan-500/30">
                  {connectionStatus.botName}
                </span>
              )}
            </div>

            {/* Backend Configuration Status (Read-Only) */}
            <div className="space-y-3 text-xs">
              
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-300">Bot Token</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Configured via TELEGRAM_BOT_TOKEN environment variable</p>
                  </div>
                  {botConfigStatus.botConfigured ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-[10px] whitespace-nowrap flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Configured
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 font-bold text-[10px] whitespace-nowrap flex items-center gap-1">
                      <X className="w-3 h-3" />
                      Not Set
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-300">Chat ID</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Configured via TELEGRAM_CHAT_ID environment variable</p>
                  </div>
                  {botConfigStatus.chatIdConfigured ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-[10px] whitespace-nowrap flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Configured
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 font-bold text-[10px] whitespace-nowrap flex items-center gap-1">
                      <X className="w-3 h-3" />
                      Not Set
                    </span>
                  )}
                </div>
              </div>

              {/* Info Stats */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-2">
                <span>Last Telegram Notification:</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {botConfigStatus.lastMessageTime ? new Date(botConfigStatus.lastMessageTime).toLocaleTimeString() : 'No messages yet'}
                </span>
              </div>

              {/* Test Button */}
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={testingConnection || !botConfigStatus.botConfigured || !botConfigStatus.chatIdConfigured}
                className="w-full py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                id="btn-test-telegram"
                title={!botConfigStatus.botConfigured || !botConfigStatus.chatIdConfigured ? 'Configure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables first' : 'Test connection to Telegram API'}
              >
                {testingConnection ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                ) : (
                  <Send className="w-4 h-4 text-cyan-400" />
                )}
                <span>{testingConnection ? 'Testing Connection...' : 'Test Telegram Connection'}</span>
              </button>

            </div>
          </div>
          
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Visitor Approval Policy Rules</span>
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <div>
                  <p className="font-bold text-white">Auto-Approve Verified Couriers</p>
                  <p className="text-[11px] text-slate-400">Allow instant pass generation for trusted courier deliveries</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoApproveCourier}
                  onChange={(e) => setAutoApproveCourier(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <div>
                  <p className="font-bold text-white">Camera Auto Capture & Edge Align</p>
                  <p className="text-[11px] text-slate-400">Automatically trigger countdown when ID card enters bounding box</p>
                </div>
                <input
                  type="checkbox"
                  checked={cameraAutoScan}
                  onChange={(e) => setCameraAutoScan(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400"
                />
              </label>
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Biometric & OCR Thresholds</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-300 mb-1">
                  <span>Face Liveness Strictness Threshold</span>
                  <span className="text-cyan-400">{livenessThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="98"
                  value={livenessThreshold}
                  onChange={(e) => setLivenessThreshold(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Buildings & Audit Logs */}
        <div className="md:col-span-6 space-y-6">
          
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>Registered Buildings & Towers</span>
            </h3>

            <div className="space-y-2 text-xs">
              {buildings.map((b) => (
                <div key={b.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">{b.name} ({b.code})</p>
                    <p className="text-[11px] text-slate-400">Total Units: {b.totalUnits} • Manager: {b.managerName}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                    {b.occupancyRate}% Occupied
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Security Audit Logs</span>
            </h3>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex justify-between font-mono text-[10px] text-slate-400">
                    <span className="text-cyan-400 font-bold">{log.action}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-200 text-[11px]">{log.details}</p>
                  <p className="text-[10px] text-slate-500">By: {log.performedBy} ({log.role})</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

