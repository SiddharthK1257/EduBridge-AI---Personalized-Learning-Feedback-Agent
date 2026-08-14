import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Sparkles,
  CalendarCheck,
  BarChart3,
  Bell,
  ShieldCheck,
  Award,
  Zap
} from 'lucide-react';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { isAdmin } = useAuth();

  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: LayoutDashboard,
      iconColor: 'text-emerald-600',
      activeColor: 'bg-emerald-50 text-emerald-900 border-emerald-300' 
    },
    { 
      name: 'Marksheet Analyzer', 
      path: '/marksheet-analyzer', 
      icon: FileSpreadsheet, 
      badge: 'AI OCR', 
      iconColor: 'text-violet-600',
      activeColor: 'bg-violet-50 text-violet-900 border-violet-300' 
    },
    { 
      name: 'AI Test Generator', 
      path: '/generate-test', 
      icon: Sparkles, 
      iconColor: 'text-teal-600',
      activeColor: 'bg-teal-50 text-teal-900 border-teal-300' 
    },
    { 
      name: 'Study Roadmap', 
      path: '/study-planner', 
      icon: CalendarCheck, 
      iconColor: 'text-amber-600',
      activeColor: 'bg-amber-50 text-amber-900 border-amber-300' 
    },
    { 
      name: 'Analytics Hub', 
      path: '/analytics', 
      icon: BarChart3, 
      iconColor: 'text-sky-600',
      activeColor: 'bg-sky-50 text-sky-900 border-sky-300' 
    },
    { 
      name: 'Notifications', 
      path: '/notifications', 
      icon: Bell, 
      iconColor: 'text-rose-500',
      activeColor: 'bg-rose-50 text-rose-900 border-rose-300' 
    },
  ];

  if (isAdmin) {
    navItems.push({ 
      name: 'Admin Console', 
      path: '/admin', 
      icon: ShieldCheck, 
      isSpecial: true,
      iconColor: 'text-purple-600',
      activeColor: 'bg-purple-50 text-purple-900 border-purple-300' 
    });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={closeSidebar}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:sticky top-[68px] left-0 z-30 h-[calc(100vh-68px)] w-64 glass-panel border-r border-slate-200 bg-white/95 flex flex-col justify-between transition-transform duration-300 shadow-soft-sm ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          
          {/* Main Navigation */}
          <div className="space-y-1.5">
            <p className="px-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Main Menu
            </p>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `flex items-center px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all duration-150 border ${
                      isActive
                        ? `${item.activeColor} shadow-soft-sm font-extrabold`
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 border-transparent'
                    }`
                  }
                >
                  <Icon className={`w-4 h-4 mr-3 shrink-0 ${item.iconColor}`} />
                  <span className="flex-1 truncate">{item.name}</span>
                  {item.badge && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Quick AI Tip Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-violet-500/10 border border-emerald-200/80 shadow-soft-sm">
            <div className="flex items-center space-x-2 text-emerald-800 mb-1.5">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-extrabold uppercase tracking-wider">Gemini AI Tutor</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              Every test generates deep learning gap diagnostics with recommended study hours.
            </p>
          </div>

        </div>

        {/* Footer info inside sidebar */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50">
          <div className="flex items-center space-x-2 text-slate-600 text-xs font-semibold">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>EduBridge AI • Active & Ready</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

