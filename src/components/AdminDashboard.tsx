import React, { useState, useEffect } from 'react';
import { Settings, BarChart3, Users, Building2, AlertCircle, TrendingUp, Database, Shield } from 'lucide-react';

interface DashboardStats {
  totalVisitors: number;
  totalResidents: number;
  totalBuildings: number;
  avgApprovalTime: number;
  ocrSuccessRate: number;
  systemUptime: number;
}

interface SystemMetrics {
  timestamp: string;
  activeConnections: number;
  apiResponseTime: number;
  ocrQueueLength: number;
  telegramDeliveryRate: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVisitors: 0,
    totalResidents: 0,
    totalBuildings: 0,
    avgApprovalTime: 0,
    ocrSuccessRate: 0,
    systemUptime: 99.8,
  });

  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'buildings' | 'residents' | 'settings' | 'analytics'>('overview');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [telegramConfig, setTelegramConfig] = useState({ botToken: '', chatId: '', enabled: false });

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('[v0] Error fetching stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  // Fetch system metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/admin/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data.metrics);
        }
      } catch (error) {
        console.error('[v0] Error fetching metrics:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  // Fetch Telegram config
  useEffect(() => {
    const fetchTelegramConfig = async () => {
      try {
        const response = await fetch('/api/telegram/config');
        if (response.ok) {
          const data = await response.json();
          setTelegramConfig(data.config);
        }
      } catch (error) {
        console.error('[v0] Error fetching telegram config:', error);
      }
    };

    fetchTelegramConfig();
  }, []);

  const handleTelegramTest = async () => {
    try {
      const response = await fetch('/api/telegram/test', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        alert('Telegram Bot connected successfully!');
      } else {
        alert(`Telegram Connection Failed: ${data.message}`);
      }
    } catch (error) {
      alert('Error testing Telegram connection');
    }
  };

  const getHealthStatus = () => {
    if (stats.systemUptime >= 99.5) return { status: 'Healthy', color: 'bg-green-400' };
    if (stats.systemUptime >= 99) return { status: 'Good', color: 'bg-yellow-400' };
    return { status: 'Issues', color: 'bg-red-400' };
  };

  const health = getHealthStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Shield className="w-8 h-8 text-cyan-400" />
            Admin Dashboard
          </h1>
          <p className="text-slate-400 mt-2">System Overview & Management</p>
        </div>

        {/* System Health Banner */}
        <div className="mb-6 bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${health.color} animate-pulse`}></div>
              <div>
                <p className="text-sm text-slate-400">System Status</p>
                <p className="text-2xl font-bold text-white">{health.status}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Uptime</p>
              <p className="text-2xl font-bold text-cyan-400">{stats.systemUptime.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-400 uppercase">Total Visitors</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">{stats.totalVisitors}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-400 uppercase">Residents</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{stats.totalResidents}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-400 uppercase">Buildings</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{stats.totalBuildings}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-400 uppercase">Avg Approval</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">{stats.avgApprovalTime}min</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-400 uppercase">OCR Success</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.ocrSuccessRate}%</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-400 uppercase">Active Connections</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{metrics[metrics.length - 1]?.activeConnections || 0}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          {(['overview', 'buildings', 'residents', 'settings', 'analytics'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-3 font-medium transition capitalize ${
                selectedTab === tab
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Performance Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-400 mb-2">API Response Time (ms)</p>
                  <div className="flex items-end gap-2 h-24">
                    {metrics.map((m, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-cyan-500 rounded-t"
                        style={{ height: `${(m.apiResponseTime / 500) * 100}%`, minHeight: '4px' }}
                      ></div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Current: {metrics[metrics.length - 1]?.apiResponseTime || 0}ms</p>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-2">OCR Queue Length</p>
                  <div className="flex items-end gap-2 h-24">
                    {metrics.map((m, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-yellow-500 rounded-t"
                        style={{ height: `${(m.ocrQueueLength / 50) * 100}%`, minHeight: '4px' }}
                      ></div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Current: {metrics[metrics.length - 1]?.ocrQueueLength || 0} jobs</p>
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                System Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Database Status</p>
                  <p className="text-white font-medium mt-1">Connected (In-Memory)</p>
                  <p className="text-xs text-yellow-400 mt-2">⚠ TODO: Migrate to Firebase Firestore</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Storage</p>
                  <p className="text-white font-medium mt-1">~24 MB (Development)</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">API Version</p>
                  <p className="text-white font-medium mt-1">v1.0 (Phase 4)</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Last Backup</p>
                  <p className="text-white font-medium mt-1">Not Configured</p>
                  <p className="text-xs text-red-400 mt-2">⚠ Enable automated backups</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buildings Tab */}
        {selectedTab === 'buildings' && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-400" />
              Buildings Management
            </h3>
            <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition mb-4">
              Add New Building
            </button>
            <p className="text-slate-400">Building management interface will display buildings list with:</p>
            <ul className="list-disc list-inside text-slate-400 text-sm mt-2 space-y-1">
              <li>Building name and address</li>
              <li>Number of residents</li>
              <li>Assigned security guards</li>
              <li>Total visitors this month</li>
              <li>Edit / Delete actions</li>
            </ul>
          </div>
        )}

        {/* Residents Tab */}
        {selectedTab === 'residents' && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Residents Management
            </h3>
            <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition mb-4">
              Add New Resident
            </button>
            <p className="text-slate-400">Resident management interface will display:</p>
            <ul className="list-disc list-inside text-slate-400 text-sm mt-2 space-y-1">
              <li>Resident name and contact</li>
              <li>Building and flat number</li>
              <li>Telegram chat ID configuration</li>
              <li>Total visitors approved/rejected</li>
              <li>Last activity</li>
              <li>Edit / Delete actions</li>
            </ul>
          </div>
        )}

        {/* Settings Tab */}
        {selectedTab === 'settings' && (
          <div className="space-y-6">
            {/* Telegram Configuration */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-cyan-400" />
                Telegram Bot Configuration
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400 mb-2">Bot Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${telegramConfig.enabled && telegramConfig.botToken ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <p className="text-white font-medium">
                      {telegramConfig.enabled && telegramConfig.botToken ? 'Connected' : 'Not Configured'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-2">Bot Token</p>
                  <p className={`font-mono text-xs p-3 rounded-lg bg-slate-900 border border-slate-700 ${
                    telegramConfig.botToken ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {telegramConfig.botToken ? telegramConfig.botTokenMasked || 'Configured' : 'Not set - Set TELEGRAM_BOT_TOKEN env var'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-2">Default Chat ID</p>
                  <p className={`font-mono text-xs p-3 rounded-lg bg-slate-900 border border-slate-700 ${
                    telegramConfig.chatId ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {telegramConfig.chatId || 'Not set - Set TELEGRAM_CHAT_ID env var'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <button
                    onClick={handleTelegramTest}
                    disabled={!telegramConfig.botToken}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition"
                  >
                    Test Connection
                  </button>
                  <p className="text-xs text-slate-500 mt-2">
                    Instructions: Get bot token from @BotFather, set as TELEGRAM_BOT_TOKEN env var
                  </p>
                </div>
              </div>
            </div>

            {/* OCR Configuration */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">OCR Configuration</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400 mb-2">Confidence Thresholds</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-white">• Green (≥95%): Auto-approve</p>
                    <p className="text-white">• Yellow (75-94%): Manual review</p>
                    <p className="text-white">• Red (&lt;75%): Rejected</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">Customize thresholds in admin settings to optimize for your use case.</p>
              </div>
            </div>

            {/* System Settings */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">System Settings</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded" defaultChecked />
                  <span className="text-white">Enable notifications</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded" defaultChecked />
                  <span className="text-white">Auto-archive old records</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded" />
                  <span className="text-white">Maintenance mode</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {selectedTab === 'analytics' && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-yellow-400" />
              Analytics & Reports
            </h3>
            <p className="text-slate-400 mb-4">Advanced analytics dashboard will include:</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Visitor statistics by building/guard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Peak hours visualization</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Approval rate metrics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Failed OCR rate tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Emergency alerts history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Export reports (CSV, PDF)</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
