import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg gradient-bg flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-300">
            EduBridge AI <span className="text-slate-500 font-normal">| Personalized Learning & Diagnostic Feedback Platform</span>
          </span>
        </div>

        <p className="text-xs text-slate-500 flex items-center">
          Empowered by Google Gemini AI & MongoDB Atlas
        </p>

      </div>
    </footer>
  );
};

export default Footer;
