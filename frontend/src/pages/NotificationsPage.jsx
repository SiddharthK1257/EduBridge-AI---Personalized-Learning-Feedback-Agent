import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, Clock, Check, Sparkles } from 'lucide-react';
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

  const getIconAndStyle = (type) => {
    switch (type) {
      case 'Low Performance Alert': 
        return {
          icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
          wrapper: 'bg-rose-100 border-rose-200',
          badge: 'bg-rose-100 text-rose-800 border-rose-200'
        };
      case 'Weekly Report': 
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          wrapper: 'bg-emerald-100 border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200'
        };
      case 'Study Reminder': 
        return {
          icon: <Clock className="w-5 h-5 text-amber-600" />,
          wrapper: 'bg-amber-100 border-amber-200',
          badge: 'bg-amber-100 text-amber-800 border-amber-200'
        };
      default: 
        return {
          icon: <Info className="w-5 h-5 text-violet-600" />,
          wrapper: 'bg-violet-100 border-violet-200',
          badge: 'bg-violet-100 text-violet-800 border-violet-200'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner label="Loading real notifications from MongoDB..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden space-y-8">
          
          {/* Header */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-sm flex items-center justify-between flex-wrap gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            <div>
              <div className="flex items-center space-x-2 text-rose-600 font-extrabold text-xs uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Real-Time Learning Alerts</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center">
                <Bell className="w-7 h-7 mr-3 text-rose-500" />
                Notification Center
              </h1>
              <p className="text-xs text-slate-600 mt-1 font-medium">Real-time alerts, study reminders, and low performance warnings from MongoDB</p>
            </div>

            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 transition-all flex items-center space-x-2 shadow-soft-sm hover:border-emerald-500"
            >
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Mark All as Read</span>
            </button>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {notifications && notifications.length > 0 ? (
              notifications.map((notif) => {
                const style = getIconAndStyle(notif.type);
                return (
                  <div
                    key={notif._id}
                    className={`p-5 rounded-2xl border flex items-start justify-between space-x-4 transition-all duration-200 ${
                      notif.isRead
                        ? 'bg-white border-slate-200 opacity-80'
                        : 'bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-white border-emerald-300 shadow-soft-sm'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className={`p-2.5 rounded-xl border shrink-0 ${style.wrapper}`}>
                        {style.icon}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-black text-slate-900">{notif.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.badge}`}>
                            {notif.type || 'Notice'}
                          </span>
                          {!notif.isRead && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 mt-1.5 leading-relaxed font-medium">{notif.message}</p>
                        <span className="text-[11px] text-slate-500 mt-2 block font-semibold">
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif._id)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors shrink-0"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-14 text-center text-slate-500 glass-card rounded-3xl border border-slate-200 bg-white">
                <Bell className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
                <p className="text-base font-bold text-slate-800">No notifications present.</p>
                <p className="text-xs text-slate-500 mt-1">You’re all caught up with your study schedules and test feedback!</p>
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

