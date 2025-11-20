import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import MobileShell from "../components/MobileShell";
// Import the loader
import FullPageLoader from "../components/FullPageLoader";

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSessionAndLoad = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) loadData();
      else navigate("/");
    };
    checkSessionAndLoad();
  }, [navigate]);

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

  const handleResponse = async (requestId: string, action: "accept" | "reject") => {
    try {
      const res = await api.post("/swaps/respond", { request_id: requestId, action });
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

  // --- UPDATED: Use FullPageLoader ---
  if (loading) return <FullPageLoader />;

  return (
    <MobileShell title="Dashboard" showBack={false}>
      {/* ... rest of your dashboard code remains exactly the same ... */}
      <div className="space-y-6">
        <div className="p-4 bg-[#0b0f10]/80 border border-[#10191c] rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-teal-300">Hello, {profile?.full_name || profile?.email}!</h2>
              <p className="text-sm text-gray-400 mt-1">Welcome back 👋</p>
            </div>
            <Link to="/profile/edit" className="text-teal-400 text-sm">Edit</Link>
          </div>
        </div>

        <div>
          <h3 className="text-md font-semibold text-teal-300 mb-3">Active Conversations</h3>
          {conversations.length === 0 ? (
            <div className="p-4 bg-[#0c1317] border border-[#1a2a2e] rounded-xl text-gray-400 text-center">No active conversations.</div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <div key={conv.id} className="p-3 bg-[#0c1317] border border-[#1a2a2e] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={conv.partner.profile_image_url || "https://via.placeholder.com/40"} className="w-12 h-12 rounded-full" />
                    <div>
                      <div className="font-semibold text-gray-100">{conv.partner.full_name}</div>
                      <div className="text-xs text-gray-400">Started {new Date(conv.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <Link to={`/chat?c=${conv.id}`} className="px-3 py-2 rounded-lg bg-gradient-to-br from-[#00e6c3] to-[#009f82] text-black text-sm">Chat</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-md font-semibold text-teal-300 mb-3">Incoming Requests</h3>
          {requests.length === 0 ? (
            <div className="p-4 bg-[#0c1317] border border-[#1a2a2e] rounded-xl text-gray-400 text-center">
              No pending requests. <Link to="/browse" className="text-teal-300">Browse skills</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="p-3 bg-[#0c1317] border border-[#1a2a2e] rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={req.sender.profile_image_url || "https://via.placeholder.com/40"} className="w-12 h-12 rounded-full" />
                    <div>
                      <div className="font-semibold text-gray-100">{req.sender.full_name}</div>
                      <div className="text-sm text-gray-400 italic">"{req.message}"</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleResponse(req.id, "accept")} className="flex-1 py-2 rounded-lg bg-gradient-to-br from-[#00e6c3] to-[#009f82] text-black">Accept</button>
                    <button onClick={() => handleResponse(req.id, "reject")} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-300">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}