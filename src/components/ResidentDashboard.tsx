import React, { useState, useEffect } from 'react';
import { Bell, MapPin, AlertTriangle, CheckCircle, Clock, Users, BarChart3, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PendingApproval {
  id: string;
  visitorName: string;
  documentType: string;
  documentNumber: string;
  createdAt: string;
  visitorPhoto?: string;
  purpose: string;
}

interface VisitorRecord {
  id: string;
  visitorName: string;
  status: 'approved' | 'rejected' | 'pending' | 'checked_in' | 'checked_out';
  createdAt: string;
  timestamp?: string;
  passNumber: string;
}

interface Notification {
  id: string;
  type: 'visitor_arrived' | 'approval_requested' | 'emergency';
  message: string;
  timestamp: string;
  read: boolean;
}

export function ResidentDashboard() {
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [visitorHistory, setVisitorHistory] = useState<VisitorRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'approvals' | 'history' | 'notifications'>('overview');
  const [approvalAction, setApprovalAction] = useState<{ visitorId: string; action: 'approve' | 'reject' | null }>({ visitorId: '', action: null });

  // Fetch pending approvals
  useEffect(() => {
    const fetchPendingApprovals = async () => {
      try {
        const response = await fetch('/api/visitors?status=pending_approval&residentId=' + user?.id);
        if (response.ok) {
          const data = await response.json();
          setPendingApprovals(data.visitors || []);
        }
      } catch (error) {
        console.error('[v0] Error fetching pending approvals:', error);
      }
    };

    if (user?.id) {
      fetchPendingApprovals();
    }
  }, [user?.id]);

  // Fetch visitor history
  useEffect(() => {
    const fetchVisitorHistory = async () => {
      try {
        const response = await fetch('/api/visitors?residentId=' + user?.id);
        if (response.ok) {
          const data = await response.json();
          setVisitorHistory(data.visitors || []);
        }
      } catch (error) {
        console.error('[v0] Error fetching visitor history:', error);
      }
    };

    if (user?.id) {
      fetchVisitorHistory();
    }
  }, [user?.id]);

  // Setup SSE listener for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    const handleTelegramApprovalReceived = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        // Update pending approvals
        setPendingApprovals(prev => prev.filter(a => a.id !== data.visitorId));
        // Add notification
        addNotification('approval_requested', `Approval processed for ${data.visitorName}`);
      } catch (e) {
        console.error('[v0] Error parsing telegram approval event:', e);
      }
    };

    const handleVisitorStatusUpdated = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'checked_in') {
          addNotification('visitor_arrived', `${data.visitorName} has checked in`);
        }
      } catch (e) {
        console.error('[v0] Error parsing visitor status event:', e);
      }
    };

    eventSource.addEventListener('telegram_approval_received', handleTelegramApprovalReceived);
    eventSource.addEventListener('visitor_status_updated', handleVisitorStatusUpdated);

    return () => {
      eventSource.removeEventListener('telegram_approval_received', handleTelegramApprovalReceived);
      eventSource.removeEventListener('visitor_status_updated', handleVisitorStatusUpdated);
      eventSource.close();
    };
  }, []);

  // Add notification helper
  const addNotification = (type: Notification['type'], message: string) => {
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      type,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
    setUnreadCount(prev => prev + 1);
  };

  // Handle approval action
  const handleApprovalAction = async (visitorId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/visitors/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          action,
          residentId: user?.id,
        }),
      });

      if (response.ok) {
        setPendingApprovals(prev => prev.filter(a => a.id !== visitorId));
        addNotification('approval_requested', `Visitor ${action === 'approve' ? 'approved' : 'rejected'}`);
      }
    } catch (error) {
      console.error('[v0] Error handling approval:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'checked_in':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome, {user?.name}!</h1>
              <p className="text-slate-400 mt-2">Unit: {user?.residencyId || 'N/A'}</p>
            </div>
            <button className="relative p-3 bg-white/10 hover:bg-white/20 rounded-lg transition">
              <Bell className="w-6 h-6 text-cyan-400" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`px-4 py-3 font-medium transition ${
              selectedTab === 'overview'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedTab('approvals')}
            className={`px-4 py-3 font-medium transition relative ${
              selectedTab === 'approvals'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Approvals
            {pendingApprovals.length > 0 && (
              <span className="ml-2 inline-block bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {pendingApprovals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setSelectedTab('history')}
            className={`px-4 py-3 font-medium transition ${
              selectedTab === 'history'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setSelectedTab('notifications')}
            className={`px-4 py-3 font-medium transition relative ${
              selectedTab === 'notifications'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-block bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Pending Approvals</p>
                    <p className="text-3xl font-bold text-cyan-400 mt-1">{pendingApprovals.length}</p>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-yellow-400 opacity-20" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">This Month</p>
                    <p className="text-3xl font-bold text-green-400 mt-1">
                      {visitorHistory.filter(v => v.status === 'checked_in').length}
                    </p>
                  </div>
                  <Users className="w-10 h-10 text-green-400 opacity-20" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Last Visit</p>
                    <p className="text-sm font-medium text-white mt-1">
                      {visitorHistory.length > 0 ? new Date(visitorHistory[0].createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <Clock className="w-10 h-10 text-blue-400 opacity-20" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Visitors</p>
                    <p className="text-3xl font-bold text-purple-400 mt-1">{visitorHistory.length}</p>
                  </div>
                  <BarChart3 className="w-10 h-10 text-purple-400 opacity-20" />
                </div>
              </div>
            </div>

            {/* Pending Approvals Widget */}
            {pendingApprovals.length > 0 && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-yellow-400/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Pending Visitor Approvals
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pendingApprovals.map(approval => (
                    <div key={approval.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-white">{approval.visitorName}</p>
                          <p className="text-sm text-slate-400">{approval.documentType} - {approval.documentNumber}</p>
                          <p className="text-xs text-slate-500 mt-1">{new Date(approval.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprovalAction(approval.id, 'approve')}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApprovalAction(approval.id, 'reject')}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Approvals Tab */}
        {selectedTab === 'approvals' && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Pending Approvals</h3>
            {pendingApprovals.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No pending approvals</p>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map(approval => (
                  <div key={approval.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-slate-400">Visitor Name</p>
                        <p className="font-semibold text-white">{approval.visitorName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Document Type</p>
                        <p className="font-semibold text-white">{approval.documentType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Purpose</p>
                        <p className="font-semibold text-white">{approval.purpose}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Request Time</p>
                        <p className="font-semibold text-white">{new Date(approval.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprovalAction(approval.id, 'approve')}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprovalAction(approval.id, 'reject')}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {selectedTab === 'history' && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Visitor History</h3>
            {visitorHistory.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No visitor history</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-700">
                    <tr>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Visitor Name</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Pass Number</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitorHistory.map(visitor => (
                      <tr key={visitor.id} className="border-b border-slate-700 hover:bg-slate-900/50 transition">
                        <td className="py-3 px-4 text-white">{visitor.visitorName}</td>
                        <td className="py-3 px-4 text-slate-300">{visitor.passNumber}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(visitor.status)}`}>
                            {visitor.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{new Date(visitor.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {selectedTab === 'notifications' && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition"
                >
                  Mark all as read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No notifications</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-lg border ${
                      notif.read ? 'bg-slate-900/50 border-slate-700' : 'bg-cyan-900/20 border-cyan-400/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {notif.type === 'visitor_arrived' && (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      )}
                      {notif.type === 'approval_requested' && (
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      )}
                      {notif.type === 'emergency' && (
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-white">{notif.message}</p>
                        <p className="text-xs text-slate-500 mt-1">{new Date(notif.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
