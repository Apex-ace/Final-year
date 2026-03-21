import React from "react";

export default function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]">

      {/* Glass Card */}
      <div className="flex flex-col items-center gap-6 px-8 py-6 rounded-2xl bg-[#0c1317]/80 backdrop-blur-xl border border-[#1a2a2e] shadow-xl shadow-black/40">

        {/* Glow Spinner */}
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-[#1a2a2e]" />

          {/* Animated ring */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#00e6c3] animate-spin" />

          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-[#00e6c3]/20 blur-xl" />
        </div>

        {/* Text */}
        <p className="text-sm text-gray-300 tracking-wide">
          Loading your workspace...
        </p>

      </div>
    </div>
  );
}