import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";

interface UserProfile {
  id: string;
  full_name: string;
  profile_image_url: string | null;
}

export default function LandingPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // fetch profile from supabase
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, profile_image_url")
        .eq("id", user.id)
        .single();

      setProfile(data);
    } catch (err) {
      console.error("Landing fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#050505] text-gray-400 flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 px-6 py-10 flex flex-col items-center">
      
      {/* Top Animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center"
      >
        {/* Profile Image */}
        <div className="h-28 w-28 rounded-full border-2 border-teal-400 shadow-lg overflow-hidden bg-[#0c1317] flex items-center justify-center">
          {profile?.profile_image_url ? (
            <img
              src={profile.profile_image_url}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-gray-500 text-3xl">
              {profile?.full_name?.[0] || "?"}
            </span>
          )}
        </div>

        {/* Welcome */}
        <h1 className="text-2xl font-bold text-teal-300 mt-5">
          Welcome back,
        </h1>
        <h2 className="text-3xl font-extrabold text-white mt-1">
          {profile?.full_name || "User"}
        </h2>
      </motion.div>

      {/* Buttons Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-sm mt-10 space-y-4"
      >
        <Link
          to="/dashboard"
          className="block w-full text-center py-3 bg-gradient-to-br from-[#00e6c3] to-[#009f82] text-black font-semibold rounded-xl shadow-lg active:scale-95 transition"
        >
          Go to Dashboard
        </Link>

        <Link
          to="/browse"
          className="block w-full text-center py-3 bg-[#0c1317] border border-[#1a2a2e] text-teal-300 font-medium rounded-xl hover:bg-[#101a1e] transition"
        >
          Browse Skills
        </Link>

        <Link
          to="/profile/edit"
          className="block w-full text-center py-3 bg-[#0c1317] border border-[#1a2a2e] text-teal-300 font-medium rounded-xl hover:bg-[#101a1e] transition"
        >
          Edit Profile
        </Link>
      </motion.div>

    </div>
  );
}
