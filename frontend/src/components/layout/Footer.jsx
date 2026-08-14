import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-8 px-4 sm:px-6 lg:px-8 mt-auto shadow-soft-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center shadow-glow-emerald">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-800">
            EduBridge AI <span className="text-slate-500 font-medium">| Personalized Learning & Scorecard Diagnostic Feedback Platform</span>
          </span>
        </div>

        <p className="text-xs text-slate-500 font-medium flex items-center">
          Empowered by Google Gemini AI & MongoDB Atlas
        </p>

      </div>
    </footer>
  );
};

export default Footer;
