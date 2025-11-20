// src/components/FullPageLoader.tsx
import React from "react";

export default function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]">
      {/* The Loading Bar Container */}
      <div className="w-48 h-1.5 bg-[#1a2a2e] rounded-full overflow-hidden">
        {/* The Moving Indicator */}
        <div className="h-full bg-[#00e6c3] w-full origin-left animate-[loading-bar_1s_ease-in-out_infinite]" />
      </div>
      
      {/* Optional pulsing text */}
      <p className="mt-4 text-xs font-mono text-teal-300/60 animate-pulse">
        LOADING
      </p>

      {/* CSS Animation for the bar */}
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}