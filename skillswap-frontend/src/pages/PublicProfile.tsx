import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import MobileShell from "../components/MobileShell";
import FullPageLoader from "../components/FullPageLoader";

export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      try {
        const res = await api.get(`/users/${id}`);
        setProfile(res.data.profile);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleRequestSwap = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return setStatusMsg("Please log in first.");
    if (user.id === profile?.id)
      return setStatusMsg("You can't swap with yourself.");

    try {
      setRequestStatus("sending");

      await api.post("/swaps/request", {
        receiver_id: profile?.id,
        message: `Hi ${profile?.full_name}, I'd like to swap skills!`,
      });

      setRequestStatus("success");
      setStatusMsg("Request Sent ✓");
    } catch {
      setRequestStatus("error");
      setStatusMsg("Failed to send request.");
    }
  };

  if (loading) return <FullPageLoader />;
  if (!profile) return <div className="text-center mt-20">User not found</div>;

  return (
    <MobileShell title="Profile" showBack>
      <div className="space-y-6">

        {/* 🔥 HERO */}
        <div className="relative">

          {/* Gradient background */}
          <div className="h-40 rounded-2xl bg-gradient-to-br from-[#00e6c3]/30 to-[#001915]" />

          {/* Profile */}
          <div className="flex items-end gap-4 px-4 -mt-16">
            <div className="relative">
              <div className="absolute inset-0 bg-[#00e6c3]/20 blur-xl rounded-full" />

              <div className="relative h-24 w-24 rounded-full overflow-hidden border border-[#1a2a2e] bg-[#0c1317]">
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    className="h-full w-full object-cover"
                  />
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
              <p className="text-xs text-gray-400">
                @{profile.username}
              </p>
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
          <p className="text-sm text-gray-300 leading-relaxed">
            {profile.bio || "No bio available"}
          </p>
        </div>

        {/* 🔥 SKILLS */}
        <div className="px-4 space-y-4">

          {/* Offered */}
          <div className="p-4 rounded-2xl bg-[#0c1317]/80 border border-[#1a2a2e]">
            <p className="text-sm text-gray-400 mb-2">Can Help With</p>
            <div className="flex flex-wrap gap-2">
              {profile.skills_offered?.map((skill: any) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full bg-[#00e6c3]/10 border border-[#00e6c3]/20 text-teal-300 text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Wanted */}
          <div className="p-4 rounded-2xl bg-[#0c1317]/80 border border-[#1a2a2e]">
            <p className="text-sm text-gray-400 mb-2">Wants to Learn</p>
            <div className="flex flex-wrap gap-2">
              {profile.skills_wanted?.map((skill: any) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full bg-[#00e6c3]/10 border border-[#00e6c3]/20 text-teal-300 text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* 🔥 ACTIONS */}
        <div className="px-4 space-y-3">

          {requestStatus === "success" ? (
            <button className="w-full py-3 rounded-2xl bg-[#003b36] text-teal-300">
              Request Sent ✓
            </button>
          ) : (
            <button
              onClick={handleRequestSwap}
              className="
                w-full py-3 rounded-2xl
                bg-[#00e6c3]
                text-black font-medium
                shadow-lg shadow-[#00e6c3]/20
              "
            >
              {requestStatus === "sending" ? "Sending..." : "Request Swap"}
            </button>
          )}

          <Link
            to={`/work?u=${profile.id}`}
            className="
              block w-full text-center py-3 rounded-2xl
              bg-[#0c1317]
              border border-[#1a2a2e]
              text-white
            "
          >
            Open Workspace
          </Link>

          {statusMsg && (
            <p className="text-xs text-gray-400 text-center">
              {statusMsg}
            </p>
          )}
        </div>

      </div>
    </MobileShell>
  );
}