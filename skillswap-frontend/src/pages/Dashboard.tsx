import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import MobileShell from "../components/MobileShell";
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

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/");
        return;
      }

      await loadData();
    };

    checkSessionAndLoad();
  }, [navigate]);

  const loadData = async () => {
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
  };

  const handleResponse = async (
    requestId: string,
    action: "accept" | "reject"
  ) => {
    try {
      const res = await api.post("/swaps/respond", {
        request_id: requestId,
        action,
      });

      if (action === "accept" && res.data.conversation_id) {
        navigate(`/chat?c=${res.data.conversation_id}`);
        return;
      }

      await loadData();
    } catch (err) {
      console.error("Error responding:", err);
      alert("Failed to respond");
    }
  };

  // 🔥 LOADER
  if (loading) return <FullPageLoader />;

  return (
    <MobileShell title="Home" showBack={false}>
      <div className="space-y-6">

        {/* 🔥 HERO CARD */}
        <div className="
          p-5 rounded-2xl
          bg-gradient-to-br from-[#00e6c3]/20 to-transparent
          border border-[#1a2a2e]
        ">
          <h2 className="text-xl font-semibold text-white">
            Hey {profile?.full_name?.split(" ")[0] || "there"} 👋
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            Let’s get productive today
          </p>

          <Link
            to="/profile"
            className="inline-block mt-3 text-sm text-[#00e6c3]"
          >
            Edit profile →
          </Link>
        </div>

        {/* 🔥 CONVERSATIONS */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Chats
          </h3>

          {conversations.length === 0 ? (
            <div className="text-gray-500 text-sm">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <Link
                key={conv.id}
                to={`/chat?c=${conv.id}`}
                className="
                  flex items-center gap-4
                  p-4 rounded-2xl
                  bg-[#0c1317]/80
                  border border-[#1a2a2e]
                  hover:border-[#00e6c3]/30
                  transition
                "
              >
                <img
                  src={
                    conv.partner.profile_image_url ||
                    "https://api.dicebear.com/7.x/initials/svg?seed=U"
                  }
                  className="w-12 h-12 rounded-full object-cover"
                />

                <div className="flex-1">
                  <p className="text-white font-medium">
                    {conv.partner.full_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    Tap to open chat
                  </p>
                </div>

                <span className="text-xs text-gray-500">→</span>
              </Link>
            ))
          )}
        </div>

        {/* 🔥 REQUESTS */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Requests
          </h3>

          {requests.length === 0 ? (
            <div className="text-gray-500 text-sm">
              No pending requests
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="
                  p-4 rounded-2xl
                  bg-[#0c1317]/80
                  border border-[#1a2a2e]
                "
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={
                      req.sender.profile_image_url ||
                      "https://api.dicebear.com/7.x/initials/svg?seed=U"
                    }
                    className="w-10 h-10 rounded-full"
                  />

                  <div>
                    <p className="text-white font-medium">
                      {req.sender.full_name}
                    </p>
                    <p className="text-xs text-gray-400 italic">
                      "{req.message}"
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleResponse(req.id, "accept")}
                    className="
                      flex-1 py-2 rounded-xl
                      bg-[#00e6c3]
                      text-black text-sm font-medium
                    "
                  >
                    Accept
                  </button>

                  <button
                    onClick={() => handleResponse(req.id, "reject")}
                    className="
                      flex-1 py-2 rounded-xl
                      border border-[#1a2a2e]
                      text-gray-300 text-sm
                    "
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </MobileShell>
  );
}