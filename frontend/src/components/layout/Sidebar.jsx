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
  BookOpen,
  Award,
  Zap
} from 'lucide-react';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { isAdmin } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Marksheet Analyzer', path: '/marksheet-analyzer', icon: FileSpreadsheet, badge: 'NEW' },
    { name: 'AI Test Generator', path: '/generate-test', icon: Sparkles },
    { name: 'Study Roadmap', path: '/study-planner', icon: CalendarCheck },
    { name: 'Analytics Hub', path: '/analytics', icon: BarChart3 },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Admin Console', path: '/admin', icon: ShieldCheck, isSpecial: true });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={closeSidebar}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 glass-panel border-r border-slate-800/80 bg-slate-950/90 flex flex-col justify-between transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          
          {/* Main Navigation */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
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
                    `flex items-center px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                      item.isSpecial
                        ? isActive
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'text-amber-400 hover:bg-amber-500/10'
                        : isActive
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-glow-indigo'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 mr-3 shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Quick AI Tip Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-slate-900 border border-indigo-500/20 shadow-lg">
            <div className="flex items-center space-x-2 text-indigo-400 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Gemini AI Tutor</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every test generates deep learning gap diagnostics instead of just showing numbers.
            </p>
          </div>

        </div>

        {/* Footer info inside sidebar */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="flex items-center space-x-2 text-slate-500 text-xs">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>EduBridge AI v1.0 • Connected</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
