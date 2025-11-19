import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api"; // Use your axios instance
import { supabase } from "../lib/supabase";

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
        // Fetch public profile via backend
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
      // Call Backend to request swap
      await api.post("/swaps/request", {
        receiver_id: profile?.id,
        message: `Hi ${profile?.full_name}, I'd like to swap skills!`
      });
      
      setRequestStatus('success');
      setStatusMsg("Request sent successfully!");
    } catch (error: any) {
      setRequestStatus('error');
      setStatusMsg(error.response?.data?.detail || "Failed to send request.");
    }
  };

  if (loading) return <div className="text-center mt-20 text-gray-500">Loading profile...</div>;
  if (!profile) return <div className="text-center mt-20 text-red-500">User not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        
        {/* HEADER BANNER */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

        <div className="px-8 pb-8">
          {/* AVATAR & INFO */}
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="flex items-end">
              <div className="h-24 w-24 rounded-full ring-4 ring-white bg-white overflow-hidden">
                 {profile.profile_image_url ? (
                    <img src={profile.profile_image_url} className="h-full w-full object-cover" alt="Profile" />
                 ) : (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-400">
                        {profile.full_name?.[0] || "?"}
                    </div>
                 )}
              </div>
              
              <div className="ml-4 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
                <p className="text-sm text-gray-500">@{profile.username}</p>
              </div>
            </div>

            {/* SWAP ACTION BUTTON */}
            <div className="mb-2">
                {requestStatus === 'success' ? (
                    <button disabled className="px-6 py-2 bg-green-100 text-green-700 font-medium rounded-md border border-green-200">
                        Request Sent ✓
                    </button>
                ) : (
                    <button 
                        onClick={handleRequestSwap}
                        disabled={requestStatus === 'sending'}
                        className={`px-6 py-2 rounded-md text-sm font-medium text-white shadow-sm transition
                            ${requestStatus === 'sending' ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
                    >
                        {requestStatus === 'sending' ? "Sending..." : "Request Swap"}
                    </button>
                )}
            </div>
          </div>
          
          {/* Messages / Errors */}
          {statusMsg && (
             <div className={`mb-4 p-3 rounded-md text-sm ${requestStatus === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                 {statusMsg}
             </div>
          )}

          <div className="flex items-center text-gray-600 text-sm mb-6">
             <span className="mr-2">📍</span> {profile.city || "No location"}, {profile.country}
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {profile.bio || "This user hasn't written a bio yet."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-green-50 p-5 rounded-lg border border-green-100">
                <h3 className="text-md font-bold text-green-800 mb-3">Can Teach You</h3>
                <div className="flex flex-wrap gap-2">
                    {profile.skills_offered?.map(skill => (
                        <span key={skill} className="px-3 py-1 bg-white text-green-700 text-sm font-medium rounded-full shadow-sm border border-green-100">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                <h3 className="text-md font-bold text-blue-800 mb-3">Wants to Learn</h3>
                <div className="flex flex-wrap gap-2">
                    {profile.skills_wanted?.map(skill => (
                        <span key={skill} className="px-3 py-1 bg-white text-blue-700 text-sm font-medium rounded-full shadow-sm border border-blue-100">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center">
            <Link to="/browse" className="text-indigo-600 hover:underline text-sm">
                &larr; Back to Browse
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}