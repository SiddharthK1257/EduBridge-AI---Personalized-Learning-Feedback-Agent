import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, BookOpen, Clock, Check } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';

const NotificationsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await api.put(`/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error('Mark read error:', err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.put('/notifications/read-all');
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Mark all read error:', err.message);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'Low Performance Alert': return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'Weekly Report': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'Study Reminder': return <Clock className="w-5 h-5 text-indigo-400" />;
      default: return <Info className="w-5 h-5 text-purple-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner label="Loading real notifications from MongoDB..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-indigo-500">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden space-y-8">
          
          {/* Header */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center">
                <Bell className="w-6 h-6 mr-3 text-indigo-400" />
                Notification Center
              </h1>
              <p className="text-xs text-slate-400 mt-1">Real-time alerts, study reminders, and low performance warnings</p>
            </div>

            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800 flex items-center space-x-2"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Mark All as Read</span>
            </button>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {notifications && notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-5 rounded-2xl border flex items-start justify-between space-x-4 transition-all ${
                    notif.isRead
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-70'
                      : 'bg-indigo-600/10 border-indigo-500/30 shadow-glow-indigo'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-white">{notif.title}</h4>
                        {!notif.isRead && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] text-slate-500 mt-2 block">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notif._id)}
                      className="text-xs font-semibold text-indigo-400 hover:underline shrink-0"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 glass-card rounded-3xl border border-slate-800">
                <Bell className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-white">No notifications present.</p>
              </div>
            )}
          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
};

export default NotificationsPage;
