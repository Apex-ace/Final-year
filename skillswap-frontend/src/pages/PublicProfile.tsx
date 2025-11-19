// WhatsApp Dark AMOLED Theme Applied — All logic remains EXACTLY the same.
// Only UI/UX upgraded. Safe for direct use.

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";

interface Profile {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  city: string;
  country: string;
  profile_image_url: string | null;
  skills_offered: string[];
  skills_wanted: string[];
}

export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
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
    if (!user) {
      setStatusMsg("You must be logged in.");
      setRequestStatus('error');
      return;
    }
    if (user.id === profile?.id) {
      setStatusMsg("You cannot swap with yourself.");
      setRequestStatus('error');
      return;
    }
    try {
      setRequestStatus('sending');
      await api.post("/swaps/request", {
        receiver_id: profile?.id,
        message: `Hi ${profile?.full_name}, I'd like to swap skills!`,
      });
      setRequestStatus('success');
      setStatusMsg("Request sent successfully!");
    } catch (error: any) {
      setRequestStatus('error');
      setStatusMsg(error.response?.data?.detail || "Failed to send request.");
    }
  };

  if (loading)
    return <div className="text-center text-gray-400 mt-20">Loading profile...</div>;
  if (!profile)
    return <div className="text-center text-red-500 mt-20">User not found.</div>;

  // THEME CLASSES
  const screen = "min-h-screen bg-[#050505] text-gray-200 px-4 py-6";
  const card = "bg-[#0b0f10]/80 backdrop-blur-xl border border-[#10191c] rounded-2xl shadow-xl overflow-hidden";
  const sectionCard = "bg-[#0c1317] border border-[#1a2a2e] p-5 rounded-xl";
  const chip = "px-3 py-1 bg-[#111c20] border border-[#1f2f33] text-teal-300 text-xs rounded-full";
  const tealBtn = "px-6 py-2 bg-gradient-to-br from-[#00e6c3] to-[#009f82] text-black font-semibold rounded-xl shadow-md active:scale-95 transition";

  return (
    <div className={screen}>
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={card}
        >
          {/* HEADER BANNER */}
          <div className="h-32 bg-gradient-to-br from-[#003b36] to-[#001f1c]"></div>

          <div className="px-6 pb-8 -mt-12 relative">
            {/* Avatar + Name */}
            <div className="flex justify-between items-end mb-6">
              <div className="flex items-end">
                <div className="h-24 w-24 rounded-full ring-4 ring-[#050505] bg-[#0c1317] overflow-hidden border border-[#1a2a2e]">
                  {profile.profile_image_url ? (
                    <img src={profile.profile_image_url} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-3xl text-gray-500">
                      {profile.full_name?.[0]}
                    </div>
                  )}
                </div>
                <div className="ml-4 mb-2">
                  <h1 className="text-2xl font-bold text-teal-300">{profile.full_name}</h1>
                  <p className="text-xs text-gray-400">@{profile.username}</p>
                </div>
              </div>

              {/* Request Swap Button */}
              <div className="mb-2">
                {requestStatus === 'success' ? (
                  <button disabled className="px-5 py-2 bg-[#003b36] text-teal-300 border border-[#005f52] rounded-xl text-sm">
                    Request Sent ✓
                  </button>
                ) : (
                  <button
                    onClick={handleRequestSwap}
                    disabled={requestStatus === 'sending'}
                    className={`${tealBtn} ${requestStatus === 'sending' ? 'opacity-70' : ''}`}
                  >
                    {requestStatus === 'sending' ? 'Sending...' : 'Request Swap'}
                  </button>
                )}
              </div>
            </div>

            {/* Status Message */}
            {statusMsg && (
              <div
                className={`mb-4 p-3 rounded-md text-sm ${
                  requestStatus === 'error'
                    ? 'bg-red-900/40 text-red-300 border border-red-700/40'
                    : 'bg-green-900/30 text-green-300 border border-green-700/40'
                }`}
              >
                {statusMsg}
              </div>
            )}

            {/* Location */}
            <div className="flex items-center text-gray-400 text-sm mb-6">
              <span className="mr-2">📍</span>
              {profile.city || 'No location'}, {profile.country}
            </div>

            {/* ABOUT */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-teal-300 mb-2">About</h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {profile.bio || 'This user has no bio.'}
              </p>
            </div>

            {/* SKILLS */}
            <div className="grid grid-cols-1 gap-6">
              <div className={sectionCard}>
                <h3 className="text-md font-bold text-teal-300 mb-3">Can Teach You</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills_offered?.map((skill) => (
                    <span key={skill} className={chip}>{skill}</span>
                  ))}
                </div>
              </div>

              <div className={sectionCard}>
                <h3 className="text-md font-bold text-teal-300 mb-3">Wants to Learn</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills_wanted?.map((skill) => (
                    <span key={skill} className={chip}>{skill}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* BACK LINK */}
            <div className="mt-8 text-center border-t border-[#1a2a2e] pt-6">
              <Link to="/browse" className="text-teal-300 text-sm hover:underline">
                ← Back to Browse
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
