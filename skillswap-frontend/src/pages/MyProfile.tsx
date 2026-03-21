import React, { useEffect, useState } from "react";
import { getMyProfile } from "../lib/api";
import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import FullPageLoader from "../components/FullPageLoader";
import { supabase } from "../lib/supabase";
import { LogOut } from "lucide-react";

export default function MyProfile() {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) return <FullPageLoader />;
  if (!profile) return <div className="text-center mt-20">No profile</div>;

  return (
    <MobileShell title="My Profile" showBack={false}>
      <div className="space-y-6">

        {/* 🔥 HERO */}
        <div className="relative">
          <div className="h-40 rounded-2xl bg-gradient-to-br from-[#00e6c3]/30 to-[#001915]" />

          <div className="flex items-end gap-4 px-4 -mt-16">
            <div className="relative">
              <div className="absolute inset-0 bg-[#00e6c3]/20 blur-xl rounded-full" />

              <div className="relative h-24 w-24 rounded-full overflow-hidden border border-[#1a2a2e] bg-[#0c1317]">
                {profile.profile_image_url ? (
                  <img src={profile.profile_image_url} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-3xl text-gray-400">
                    {profile.full_name?.[0]}
                  </div>
                )}
              </div>
            </div>

            <div className="pb-2">
              <h2 className="text-lg font-semibold text-white">
                {profile.full_name}
              </h2>
              <p className="text-xs text-gray-400">@{profile.username}</p>
            </div>
          </div>
        </div>

        {/* 🔥 LOCATION */}
        <p className="text-sm text-gray-400 px-4">
          📍 {profile.city || "Unknown"}, {profile.country}
        </p>

        {/* 🔥 ABOUT */}
        <div className="px-4">
          <h3 className="text-sm text-gray-400 mb-2">About</h3>
          <p className="text-sm text-gray-300">
            {profile.bio || "No bio yet"}
          </p>
        </div>

        {/* 🔥 SKILLS */}
        <div className="px-4 space-y-4">

          <div className="p-4 rounded-2xl bg-[#0c1317]/80 border border-[#1a2a2e]">
            <p className="text-sm text-gray-400 mb-2">Skills Offered</p>
            <div className="flex flex-wrap gap-2">
              {profile.skills_offered?.map((s: string) => (
                <span key={s} className="px-3 py-1 rounded-full bg-[#00e6c3]/10 border border-[#00e6c3]/20 text-teal-300 text-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0c1317]/80 border border-[#1a2a2e]">
            <p className="text-sm text-gray-400 mb-2">Skills Wanted</p>
            <div className="flex flex-wrap gap-2">
              {profile.skills_wanted?.map((s: string) => (
                <span key={s} className="px-3 py-1 rounded-full bg-[#00e6c3]/10 border border-[#00e6c3]/20 text-teal-300 text-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* 🔥 ACTIONS */}
        <div className="px-4 space-y-3">

          <Link
            to="/profile/edit"
            className="
              block w-full text-center py-3 rounded-2xl
              bg-[#00e6c3]
              text-black font-medium
            "
          >
            Edit Profile
          </Link>

          {/* 🔴 LOGOUT BUTTON */}
          <button
            onClick={() => setShowLogout(true)}
            className="
              w-full py-3 rounded-2xl
              bg-[#0c1317]
              border border-red-500/30
              text-red-400 flex items-center justify-center gap-2
            "
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>

        </div>

        {/* 🔥 LOGOUT CONFIRM MODAL */}
        {showLogout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="
              w-[90%] max-w-sm
              bg-[#0c1317]
              border border-[#1a2a2e]
              rounded-2xl p-5
            ">
              <h3 className="text-white text-lg font-semibold mb-2">
                Log out?
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Are you sure you want to log out?
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowLogout(false)}
                  className="flex-1 py-2 rounded-xl bg-[#111b1d] text-gray-300"
                >
                  Cancel
                </button>

                <button
                  onClick={handleLogout}
                  className="flex-1 py-2 rounded-xl bg-red-500 text-white"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </MobileShell>
  );
}