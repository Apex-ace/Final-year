import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase"; // Import Supabase client

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  profile_image_url: string | null;
}

interface SwapRequest {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender: UserProfile;
}

interface Conversation {
  id: string;
  partner: UserProfile;
  created_at: string;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Hook for redirection
  const navigate = useNavigate();

  useEffect(() => {
    // FIX: Explicitly wait for the session before making authenticated API calls
    const checkSessionAndLoad = async () => {
        setLoading(true);
        // Step 1: Wait for the Supabase session to resolve
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            // Step 2: Session is valid, now proceed with authenticated loading
            loadData();
        } else {
            // Handle not logged in (e.g., redirect to login)
            console.warn("No active session found. Redirecting to login.");
            navigate("/"); // Redirect to the login page
        }
    }
    checkSessionAndLoad();
  }, [navigate]); // navigate is stable, but adding it for best practice

  async function loadData() {
    try {
      // 1. Fetch My Profile
      const profileRes = await api.get("/users/me");
      setProfile(profileRes.data.profile);

      // 2. Fetch Pending Swap Requests
      const requestsRes = await api.get("/swaps/pending");
      setRequests(requestsRes.data.requests || []);
      
      // 3. Fetch Active Conversations
      const convRes = await api.get("/chats/");
      setConversations(convRes.data.conversations || []);

    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleResponse = async (requestId: string, action: "accept" | "reject") => {
    try {
      const res = await api.post("/swaps/respond", {
        request_id: requestId,
        action: action,
      });

      if (action === "accept") {
        // If backend returns a conversation ID, redirect immediately
        if (res.data.conversation_id) {
            // This redirection is now reliable because the backend succeeded (200 OK)
            navigate(`/chat?c=${res.data.conversation_id}`);
            return; 
        } 
        alert("Request Accepted!");
      } 
      
      // Reload data if we didn't redirect
      await loadData(); 
      
    } catch (error) {
      console.error("Error responding:", error);
      alert("Failed to respond.");
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* --- SECTION 1: WELCOME --- */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hello, {profile?.full_name || profile?.email}!
            </h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back to your dashboard.</p>
          </div>
          <Link to="/profile/edit" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
            Edit Profile &rarr;
          </Link>
        </div>

        {/* --- SECTION 2: ACTIVE SWAPS --- */}
        <div className="pt-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Swaps / Conversations</h2>
          {conversations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
              <p className="text-gray-400">You don't have any active conversations yet.</p>
              <p className="text-gray-400 text-sm mt-1">Accept a request or send one to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conv) => (
                <div key={conv.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Profile Image Handling */}
                    <div className="h-12 w-12 rounded-full bg-indigo-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {conv.partner.profile_image_url ? (
                        <img src={conv.partner.profile_image_url} alt="User" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-indigo-600 font-bold">
                          {conv.partner.full_name?.[0] || "?"}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {conv.partner.full_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Active swap (Started: {new Date(conv.created_at).toLocaleDateString()})
                      </p>
                    </div>
                  </div>
                  
                  {/* CHAT BUTTON */}
                  <Link 
                    to={`/chat?c=${conv.id}`} 
                    className="flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition shadow-sm"
                  >
                    Chat Now &rarr;
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- SECTION 3: INCOMING REQUESTS --- */}
        <div className="pt-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Incoming Swap Requests</h2>
          
          {requests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
              <p className="text-gray-400">No pending requests at the moment.</p>
              <Link to="/browse" className="text-indigo-600 text-sm font-medium mt-2 inline-block hover:underline">
                Browse users to find a match
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  
                  {/* Sender Info with Image */}
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {req.sender?.profile_image_url ? (
                        <img src={req.sender.profile_image_url} alt="User" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold">
                          {req.sender?.full_name?.[0] || "?"}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {req.sender?.full_name || "Unknown User"}
                      </h3>
                      <p className="text-sm text-gray-500">
                          wants to swap skills with you.
                      </p>
                      <p className="text-sm text-gray-600 mt-1 italic">"{req.message}"</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-2 sm:mt-0 w-full sm:w-auto">
                    <button
                      onClick={() => handleResponse(req.id, "accept")}
                      className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition shadow-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleResponse(req.id, "reject")}
                      className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-md transition"
                    >
                      Reject
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}