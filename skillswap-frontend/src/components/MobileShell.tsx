import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

interface Props {
  title?: string;
  showBack?: boolean;
  children: React.ReactNode;
  actionArea?: React.ReactNode;
}

export default function MobileShell({
  title,
  showBack = true,
  children,
  actionArea,
}: Props) {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 relative overflow-hidden">

      {/* Safe top */}
      <div className="safe-top" />

      {/* 🔥 FLOATING GLASS HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 flex justify-center px-4 pt-2">
        <div className="w-full max-w-md">

          <div className="
            flex items-center gap-3
            px-4 py-3
            rounded-2xl
            bg-[#0c1317]/80
            backdrop-blur-xl
            border border-[#1a2a2e]
            shadow-lg shadow-black/40
          ">

            {/* Back button */}
            {showBack ? (
              <button
                onClick={() => history.back()}
                className="p-2 rounded-xl bg-[#111b1d] hover:bg-[#162326] transition"
              >
                <ChevronLeft className="w-5 h-5 text-teal-300" />
              </button>
            ) : (
              <div className="w-10" />
            )}

            {/* Title */}
            <h1 className="text-[15px] font-semibold truncate text-white tracking-wide">
              {title}
            </h1>

            <div className="flex-1" />

          </div>
        </div>
      </header>

      {/* 🔥 MAIN CONTENT */}
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="max-w-md mx-auto px-4 pt-[90px] pb-[140px]"
      >
        {children}
      </motion.main>

      {/* 🔥 FLOATING ACTION AREA */}
      {actionArea && (
        <div className="fixed left-0 right-0 bottom-[100px] z-50 px-4 flex justify-center">
          <div className="w-full max-w-md">

            <div className="
              bg-[#0c1317]/90
              backdrop-blur-xl
              border border-[#1a2a2e]
              rounded-2xl
              p-2
              shadow-xl shadow-black/40
            ">
              {actionArea}
            </div>

          </div>
        </div>
      )}

      {/* Safe bottom */}
      <div className="safe-bottom" />
    </div>
  );
}