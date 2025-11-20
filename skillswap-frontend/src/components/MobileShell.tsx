// src/components/MobileShell.tsx
import React from "react";
import { motion } from "framer-motion";

interface Props {
  title?: string;
  showBack?: boolean;
  children: React.ReactNode;
  actionArea?: React.ReactNode; // Save/Send button
}

export default function MobileShell({ title, showBack = true, children, actionArea }: Props) {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 relative">
      
      {/* Safe top area for notches */}
      <div className="safe-top bg-transparent" />

      {/* HEADER */}
      <header className="w-full sticky top-0 z-40 bg-[#050505] border-b border-[#0b1113]">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          {showBack ? (
            <button
              onClick={() => history.back()}
              className="p-2 rounded-md hover:bg-[#062427]/20"
            >
              ←
            </button>
          ) : (
            <div className="w-8" />
          )}

          <h1 className="text-lg font-semibold truncate">{title}</h1>
          <div className="flex-1" />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
        className="max-w-md mx-auto px-4 py-4 pb-[160px]"
      >
        {children}
      </motion.main>

      {/* FIXED ACTION BUTTON ABOVE NAV */}
      {actionArea && (
        <div className="fixed left-0 right-0 bottom-[100px] z-50 px-4 pointer-events-auto">
          <div className="max-w-md mx-auto">
            {actionArea}
          </div>
        </div>
      )}

      {/* Safe bottom padding */}
      <div className="safe-bottom" />
    </div>
  );
}
