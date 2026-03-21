import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Briefcase, User } from "lucide-react";

export default function BottomNav() {
  const { pathname } = useLocation();

  const isActive = (route: string) => pathname.startsWith(route);

  const navItem = (to: string, Icon: any, label: string) => {
    const active = isActive(to);

    return (
      <Link
        to={to}
        className="flex flex-col items-center justify-center relative"
      >
        {/* Active Glow */}
        {active && (
          <div className="absolute -top-1 w-10 h-10 bg-[#00e6c3]/20 blur-xl rounded-full" />
        )}

        {/* Icon */}
        <div
          className={`p-2 rounded-xl transition-all duration-200 ${
            active
              ? "bg-[#00e6c3]/10 text-[#00e6c3]"
              : "text-gray-400"
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Label */}
        <span
          className={`text-[11px] mt-1 transition ${
            active ? "text-[#00e6c3]" : "text-gray-500"
          }`}
        >
          {label}
        </span>
      </Link>
    );
  };

  return (
    <div className="md:hidden fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
      <div className="w-full max-w-md">

        {/* Floating Glass Container */}
        <div className="
          flex justify-between items-center
          px-6 py-3
          rounded-2xl
          bg-[#0c1317]/80
          backdrop-blur-xl
          border border-[#1a2a2e]
          shadow-lg shadow-black/40
        ">

          {navItem("/dashboard", Home, "Home")}
          {navItem("/browse", Search, "Browse")}
          {navItem("/work", Briefcase, "Work")}
          {navItem("/profile", User, "Profile")}

        </div>
      </div>
    </div>
  );
}