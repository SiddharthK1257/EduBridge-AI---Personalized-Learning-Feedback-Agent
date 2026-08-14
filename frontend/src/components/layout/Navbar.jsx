import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Sparkles, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  BookOpen, 
  Compass,
  Menu,
  X
} from 'lucide-react';
import api from '../../services/api';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout, isAdmin } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      api.get('/notifications')
        .then(res => {
          if (res.data.success) {
            const count = res.data.notifications.filter(n => !n.isRead).length;
            setUnreadCount(count);
          }
        })
        .catch(err => console.warn('Notification count fetch error:', err.message));
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-soft-sm">
      {/* Top Radiant Accent Bar */}
      <div className="h-1 w-full gradient-bg-rainbow" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Logo & Toggle */}
          <div className="flex items-center space-x-3">
            {user && (
              <button 
                onClick={toggleSidebar}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden transition-colors border border-transparent hover:border-slate-200"
                aria-label="Toggle Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-glow-emerald group-hover:scale-105 transition-transform duration-200">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-sans">
                EduBridge<span className="gradient-text">.AI</span>
              </span>
            </Link>

            {user && (
              <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 border border-emerald-200 shadow-soft-sm">
                <Compass className="w-3.5 h-3.5 mr-1.5 text-emerald-600 animate-spin-slow" />
                {user.examTarget || 'JEE Main'} • {user.gradeClass || 'Class 12'}
              </span>
            )}
          </div>

          {/* Right Action Menu */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {user ? (
              <>
                {/* Notifications Bell */}
                <Link 
                  to="/notifications" 
                  className="relative p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2.5 p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="hidden md:inline-block text-sm font-semibold text-slate-800">
                      {user.name}
                    </span>
                  </button>

                  {dropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-56 rounded-2xl glass-card border border-slate-200 shadow-soft-md py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 bg-white"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>

                      <Link 
                        to="/dashboard" 
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        <BookOpen className="w-4 h-4 mr-2.5 text-emerald-600" />
                        Student Dashboard
                      </Link>

                      {isAdmin && (
                        <Link 
                          to="/admin" 
                          className="flex items-center px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 mr-2.5 text-amber-600" />
                          Admin Console
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100 mt-1"
                      >
                        <LogOut className="w-4 h-4 mr-2.5" />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white gradient-bg hover:opacity-95 transition-opacity shadow-glow-emerald"
                >
                  Get Started Free
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
