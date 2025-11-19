import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const linkStyle =
    "block px-4 py-3 text-gray-300 hover:bg-[#0f1a1d] hover:text-teal-300 rounded-lg transition text-lg";

  return (
    <nav className="bg-[#0b0f10] text-white px-6 py-3 border-b border-[#10191c] shadow-lg sticky top-0 z-50">

      {/* Top bar wrapper */}
      <div className="max-w-6xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-bold text-teal-300 tracking-wide select-none"
        >
          SkillSwap
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/dashboard" className="text-gray-300 hover:text-teal-300 transition">
            Dashboard
          </Link>
          <Link to="/browse" className="text-gray-300 hover:text-teal-300 transition">
            Browse
          </Link>
          <Link to="/profile/edit" className="text-gray-300 hover:text-teal-300 transition">
            Edit Profile
          </Link>

          <button
            onClick={logout}
            className="bg-gradient-to-br from-red-600 to-red-700 px-4 py-1.5 rounded-lg text-sm font-semibold shadow hover:opacity-80 transition"
          >
            Logout
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setOpen(true)}
          className="md:hidden text-gray-300 hover:text-teal-300 transition"
        >
          <Menu size={26} />
        </button>
      </div>

      {/* BACKDROP */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        ></div>
      )}

      {/* SLIDE-IN SIDEBAR */}
      <div
        className={`fixed top-0 right-0 h-full w-3/4 max-w-xs bg-[#0c1317] border-l border-[#1a2a2e] z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#1a2a2e]">
          <h2 className="text-lg font-semibold text-teal-300">Menu</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-300 hover:text-teal-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Sidebar Links */}
        <div className="flex flex-col gap-2 p-4">
          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className={linkStyle}
          >
            Dashboard
          </Link>

          <Link
            to="/browse"
            onClick={() => setOpen(false)}
            className={linkStyle}
          >
            Browse
          </Link>

          <Link
            to="/profile/edit"
            onClick={() => setOpen(false)}
            className={linkStyle}
          >
            Edit Profile
          </Link>

          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="mt-4 w-full bg-gradient-to-br from-red-600 to-red-700 px-4 py-3 rounded-lg text-base font-semibold shadow hover:opacity-80 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
