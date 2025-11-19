import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

// --- TYPES ---
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
  const navigate = useNavigate();

  // ------------------------------
  // SESSION CHECK (Important Logic Unchanged)
  // ------------------------------
  useEffect(() => {
    const checkSessionAndLoad = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session) loadData();
      else navigate("/");
    };

    checkSessionAndLoad();
  }, [navigate]);

  // ------------------------------
  // LOAD DATA (Important Logic Unchanged)
  // ------------------------------
  async function loadData() {
    try {
      const profileRes = await api.get("/users/me");
      setProfile(profileRes.data.profile);

      const requestsRes = await api.get("/swaps/pending");
      setRequests(requestsRes.data.requests || []);

      const convRes = await api.get("/chats/");
      setConversations(convRes.data.conversations || []);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------
  // ACCEPT / REJECT REQUEST (Important Logic Unchanged)
  // ------------------------------
  const handleResponse = async (requestId: string, action: "accept" | "reject") => {
    try {
      const res = await api.post("/swaps/respond", {
        request_id: requestId,
        action: action,
      });

      if (action === "accept" && res.data.conversation_id) {
        navigate(`/chat?c=${res.data.conversation_id}`);
        return;
      }

      await loadData();
    } catch (error) {
      console.error("Error responding:", error);
      alert("Failed to respond.");
    }
  };

  if (loading)
    return <div className="text-center text-gray-400 p-10">Loading Dashboard...</div>;

  // ------------------------------
  // AMOLED DARK UI (UI only, logic untouched)
  // ------------------------------
const screen = "min-h-screen bg-[#050505] text-gray-200 px-4 safe-top pb-6";

  const card = "bg-[#0b0f10]/80 backdrop-blur-xl border border-[#10191c] rounded-xl shadow-md";
  const tealBtn = "bg-gradient-to-br from-[#00e6c3] to-[#009f82] text-black font-semibold";
  const subtleText = "text-gray-400";

  return (
    <div className={screen}>
      <div className="max-w-md mx-auto space-y-8">

        {/* ------------------ HEADER ------------------ */}
        <div className={`p-6 ${card} flex justify-between items-center`}>
          <div>
            <h1 className="text-xl font-bold text-teal-300">
              Hello, {profile?.full_name || profile?.email}!
            </h1>
            <p className={`${subtleText} text-sm mt-1`}>Welcome back 👋</p>
          </div>
          <Link to="/profile/edit" className="text-teal-400 text-sm hover:underline">
            Edit Profile →
          </Link>
        </div>

        {/* ------------------ ACTIVE CONVERSATIONS ------------------ */}
        <div>
          <h2 className="text-lg font-semibold text-teal-300 mb-3 px-1">Active Conversations</h2>

          {conversations.length === 0 ? (
            <div className={`p-6 text-center ${card} ${subtleText}`}>No active conversations.</div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <div key={conv.id} className={`p-4 flex items-center justify-between ${card}`}>                  
                  <div className="flex items-center gap-4">
                    <img
                      src={conv.partner.profile_image_url || "https://via.placeholder.com/40"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-100">{conv.partner.full_name}</p>
                      <p className="text-xs text-gray-500">Started {new Date(conv.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <Link
                    to={`/chat?c=${conv.id}`}
                    className={`px-4 py-2 rounded-lg ${tealBtn}`}
                  >
                    Chat →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ------------------ INCOMING REQUESTS ------------------ */}
        <div>
          <h2 className="text-lg font-semibold text-teal-300 mb-3 px-1">Incoming Requests</h2>

          {requests.length === 0 ? (
            <div className={`p-6 text-center ${card} ${subtleText}`}>
              No pending requests.
              <Link to="/browse" className="block text-teal-400 text-sm mt-2 hover:underline">
                Browse skills →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className={`p-4 ${card}`}>                  
                  <div className="flex items-center gap-4 mb-3">
                    <img
                      src={req.sender.profile_image_url || "https://via.placeholder.com/40"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-100">{req.sender.full_name}</p>
                      <p className="text-sm text-gray-400 italic">"{req.message}"</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleResponse(req.id, "accept")}
                      className={`flex-1 px-4 py-2 rounded-lg ${tealBtn}`}
                    >
                      Accept
                    </button>

                    <button
                      onClick={() => handleResponse(req.id, "reject")}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-[#111]"
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