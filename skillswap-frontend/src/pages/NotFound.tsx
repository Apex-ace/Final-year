// src/pages/NotFound.tsx
import React from "react";
import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";

export default function NotFound() {
  return (
    <MobileShell title="Oops" showBack={true}>
      <div className="flex flex-col items-center justify-center text-center space-y-6 py-10">

        {/* 🔥 404 VISUAL */}
        <div className="relative">
          <div className="absolute inset-0 bg-[#00e6c3]/20 blur-3xl rounded-full" />
          <h1 className="relative text-6xl font-bold text-white">
            404
          </h1>
        </div>

        {/* 🔥 MESSAGE */}
        <div>
          <h2 className="text-lg font-semibold text-white">
            Page not found
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            The page you’re looking for doesn’t exist or was moved.
          </p>
        </div>

        {/* 🔥 ACTION BUTTONS */}
        <div className="w-full max-w-xs space-y-3">

          <Link
            to="/dashboard"
            className="
              block w-full text-center py-3
              rounded-2xl
              bg-[#00e6c3]
              text-black font-medium
              shadow-lg shadow-[#00e6c3]/20
              transition active:scale-[0.98]
            "
          >
            Go to Home
          </Link>

          <Link
            to="/browse"
            className="
              block w-full text-center py-3
              rounded-2xl
              bg-[#0c1317]
              border border-[#1a2a2e]
              text-gray-300
              transition hover:border-[#00e6c3]/30
            "
          >
            Browse Skills
          </Link>

        </div>

      </div>
    </MobileShell>
  );
}