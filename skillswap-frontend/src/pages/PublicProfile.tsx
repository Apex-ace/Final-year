// src/pages/PublicProfile.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import MobileShell from "../components/MobileShell";

export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState("idle");
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await api.get(`/users/${id}`);
        setProfile(res.data.profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleRequestSwap = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setStatusMsg("Please log in first.");

    if (user.id === profile?.id) return setStatusMsg("You can't swap with yourself.");

    try {
      setRequestStatus("sending");
      await api.post("/swaps/request", {
        receiver_id: profile?.id,
        message: `Hi ${profile?.full_name}, I'd like to swap skills!`
      });
      setRequestStatus("success");
      setStatusMsg("Request Sent ✓");
    } catch (e) {
      setRequestStatus("error");
      setStatusMsg("Failed to send request.");
    }
  };

  if (loading) return <div className="text-center text-gray-400 mt-20">Loading profile...</div>;
  if (!profile) return <div className="text-center text-red-500 mt-20">User not found.</div>;

  return (
    <MobileShell title="Profile" showBack={true}>
      <div className="max-w-md mx-auto">

        {/* HEADER CARD */}
        <div className="bg-[#0c1317] rounded-2xl overflow-hidden border border-[#1a2a2e] shadow-xl">
          
          {/* Cover Background */}
          <div className="h-40 w-full bg-gradient-to-br from-[#003b36] to-[#001915]" />

          {/* Profile Image */}
          <div className="-mt-20 px-5 relative">
            <div className="flex items-end gap-5">
              <div className="h-32 w-32 rounded-2xl ring-4 ring-[#050505] bg-black overflow-hidden border border-[#1a2a2e] shadow-lg">
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    className="h-full w-full object-cover"
                    alt="Profile"
                  />
                ) : (
                  <div className="flex items-center justify-center text-5xl text-gray-500 h-full">
                    {profile.full_name?.[0]}
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="pb-3">
                <h1 className="text-2xl font-bold text-teal-300">{profile.full_name}</h1>
                <p className="text-sm text-gray-400">@{profile.username}</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="px-5 mt-4 text-gray-400 text-sm">
            📍 {profile.city || "Unknown"}, {profile.country}
          </div>

          {/* About Section */}
          <div className="px-5 mt-6 mb-6">
            <h3 className="text-lg font-semibold text-teal-300 mb-2">About</h3>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {profile.bio || "This user has no bio."}
            </p>
          </div>

          {/* SKILLS */}
          <div className="px-5 space-y-5 pb-6">
            
            {/* Can Give (was Can Teach You) */}
            <div className="p-4 rounded-xl bg-[#0b1113] border border-[#1a2a2e]">
              <h3 className="text-md font-bold text-teal-300 mb-2">Can Give</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills_offered?.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-[#111c20] border border-[#1f2f33] text-teal-300 text-xs rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Needs (was Wants to Learn) */}
            <div className="p-4 rounded-xl bg-[#0b1113] border border-[#1a2a2e]">
              <h3 className="text-md font-bold text-teal-300 mb-2">Needs</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills_wanted?.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-[#111c20] border border-[#1f2f33] text-teal-300 text-xs rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Request Button */}
          <div className="px-5 pb-6">
            {requestStatus === "success" ? (
              <button
                disabled
                className="w-full py-3 bg-[#003b36] text-teal-300 rounded-xl"
              >
                Request Sent ✓
              </button>
            ) : (
              <button
                onClick={handleRequestSwap}
                disabled={requestStatus === "sending"}
                className="w-full py-3 rounded-xl bg-gradient-to-br from-[#00e6c3] to-[#009f82] text-black font-semibold"
              >
                {requestStatus === "sending" ? "Sending..." : "Request Swap"}
              </button>
            )}
          </div>

        </div>

        {/* Back to browse */}
        <div className="text-center pt-5">
          <Link to="/browse" className="text-teal-300 text-sm">← Back to Browse</Link>
        </div>
      </div>
    </MobileShell>
  );
}