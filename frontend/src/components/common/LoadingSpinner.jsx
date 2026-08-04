import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ label = 'Loading EduBridge AI...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-8">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
        <Loader2 className="w-8 h-8 text-indigo-400 animate-pulse absolute" />
      </div>
      <p className="mt-4 text-slate-400 font-medium text-sm tracking-wide animate-pulse">{label}</p>
    </div>
  );
};

export default LoadingSpinner;
