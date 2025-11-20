// src/components/BottomNav.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, MessageCircle, User } from "lucide-react";

export default function BottomNav() {
  const { pathname } = useLocation();
  const iconClass = (route: string) => (pathname.startsWith(route) ? "text-teal-300" : "text-gray-400");

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0b0f10] border-t border-[#10191c] safe-bottom z-50">
      <div className="max-w-md mx-auto flex justify-around py-3">
        <Link to="/dashboard" className="flex flex-col items-center gap-1">
          <Home className={`w-6 h-6 ${iconClass("/dashboard")}`} />
          <span className="text-xs text-gray-400">Home</span>
        </Link>
        <Link to="/browse" className="flex flex-col items-center gap-1">
          <Search className={`w-6 h-6 ${iconClass("/browse")}`} />
          <span className="text-xs text-gray-400">Browse</span>
        </Link>
        <Link to="/chat" className="flex flex-col items-center gap-1">
          <MessageCircle className={`w-6 h-6 ${iconClass("/chat")}`} />
          <span className="text-xs text-gray-400">Chat</span>
        </Link>
        <Link to="/profile/edit" className="flex flex-col items-center gap-1">
          <User className={`w-6 h-6 ${iconClass("/profile")}`} />
          <span className="text-xs text-gray-400">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
