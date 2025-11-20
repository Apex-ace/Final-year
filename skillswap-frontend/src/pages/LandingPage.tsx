import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import FullPageLoader from "../components/FullPageLoader"; // Import

export default function LandingPage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("id, full_name, profile_image_url").eq("id", user.id).single();
      setProfile(data);
    } catch (err) {
      console.error("Landing fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- UPDATED ---
  if (loading) return <FullPageLoader />;

  return (
    <MobileShell title="Welcome" showBack={false}>
      <div className="flex flex-col items-center">
        <div className="h-28 w-28 rounded-full border-2 border-teal-400 shadow-lg overflow-hidden bg-[#0c1317] flex items-center justify-center">
          {profile?.profile_image_url ? <img src={profile.profile_image_url} className="h-full w-full object-cover" /> : <span className="text-gray-500 text-3xl">{profile?.full_name?.[0] || "?"}</span>}
        </div>

        <h2 className="text-2xl font-bold text-teal-300 mt-6">{profile?.full_name || "User"}</h2>

        <div className="w-full max-w-sm mt-8 space-y-3">
          <Link to="/dashboard" className="block w-full text-center py-3 bg-gradient-to-br from-[#00e6c3] to-[#009f82] text-black font-semibold rounded-xl">Go to Dashboard</Link>
          <Link to="/browse" className="block w-full text-center py-3 bg-[#0c1317] border border-[#1a2a2e] text-teal-300 rounded-xl">Browse Skills</Link>
          <Link to="/profile/edit" className="block w-full text-center py-3 bg-[#0c1317] border border-[#1a2a2e] text-teal-300 rounded-xl">Edit Profile</Link>
        </div>
      </div>
    </MobileShell>
  );
}