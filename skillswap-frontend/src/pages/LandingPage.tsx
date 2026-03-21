import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import FullPageLoader from "../components/FullPageLoader";

export default function LandingPage() {
  const [profile, setProfile] = useState<any | null>(null);
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

  // 🔥 LOADER
  if (loading) return <FullPageLoader />;

  return (
    <MobileShell title="Welcome" showBack={false}>
      <div className="flex flex-col items-center text-center space-y-6">

        {/* 🔥 HERO PROFILE */}
        <div className="relative mt-4">

          {/* Glow */}
          <div className="absolute inset-0 bg-[#00e6c3]/20 blur-2xl rounded-full" />

          {/* Avatar */}
          <div className="
            relative
            h-28 w-28
            rounded-full
            border border-[#1a2a2e]
            bg-[#0c1317]
            flex items-center justify-center
            overflow-hidden
            shadow-xl shadow-black/40
          ">
            {profile?.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-gray-400 text-3xl font-semibold">
                {profile?.full_name?.[0] || "?"}
              </span>
            )}
          </div>
        </div>

        {/* 🔥 NAME */}
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {profile?.full_name || "User"}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Welcome back 👋
          </p>
        </div>

        {/* 🔥 ACTION BUTTONS */}
        <div className="w-full max-w-sm space-y-3 mt-4">

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
            Go to Dashboard
          </Link>

          <Link
            to="/browse"
            className="
              block w-full text-center py-3
              rounded-2xl
              bg-[#0c1317]
              border border-[#1a2a2e]
              text-white
              transition hover:border-[#00e6c3]/30
            "
          >
            Browse Skills
          </Link>

          <Link
            to="/profile/edit"
            className="
              block w-full text-center py-3
              rounded-2xl
              bg-[#0c1317]
              border border-[#1a2a2e]
              text-gray-300
              transition hover:border-[#00e6c3]/30
            "
          >
            Edit Profile
          </Link>

        </div>

      </div>
    </MobileShell>
  );
}