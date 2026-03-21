import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import MobileShell from "../components/MobileShell";
import FullPageLoader from "../components/FullPageLoader";

export default function Work() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const profileId = params.get("u");

  const [meId, setMeId] = useState("");
  const [partners, setPartners] = useState<any[]>([]);
  const [partner, setPartner] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const meRes = await api.get("/users/me");
        const myId = meRes.data.profile.id;
        setMeId(myId);

        const chatRes = await api.get("/chats");
        const convs = chatRes.data.conversations;

        const users = convs.map((c: any) => {
          const isMe = c.participant1_id === myId;
          return {
            id: isMe ? c.participant2_id : c.participant1_id,
            ...c.partner,
          };
        });

        setPartners(users);

        if (profileId) {
          const selected = users.find((u: any) => u.id === profileId);
          setPartner(selected);

          const wRes = await api.get(`/work/profile/${profileId}`);
          setItems(wRes.data.workspace || []);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [profileId]);

  const submitWork = async () => {
    if (!profileId || !link.trim()) return;

    await api.post("/work", {
      receiver_id: profileId,
      work_link: link,
      note,
    });

    setLink("");
    setNote("");

    const wRes = await api.get(`/work/profile/${profileId}`);
    setItems(wRes.data.workspace || []);
  };

  if (loading) return <FullPageLoader />;

  // 🔥 STEP 1: USER LIST
  if (!profileId) {
    return (
      <MobileShell title="Work" showBack>
        <div className="space-y-3">
          <h2 className="text-white font-semibold">Select Chat</h2>

          {partners.length === 0 ? (
            <p className="text-gray-400">No chats yet</p>
          ) : (
            partners.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/work?u=${p.id}`)}
                className="p-3 border border-[#1a2a2e] rounded-xl cursor-pointer bg-[#0c1317]"
              >
                <p className="text-white">{p.full_name}</p>
                <p className="text-gray-400 text-sm">@{p.username}</p>
              </div>
            ))
          )}
        </div>
      </MobileShell>
    );
  }

  // 🔥 STEP 2: WORKSPACE CHAT STYLE
  return (
    <MobileShell title={partner?.full_name || "Workspace"} showBack>
      <div className="space-y-4 pb-24">

        {/* INPUT */}
        <div className="bg-[#0c1317] border border-[#1a2a2e] rounded-xl p-3 space-y-2">
          <input
            placeholder="Paste work link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full p-2 bg-black border border-[#1a2a2e] rounded text-white"
          />

          <textarea
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-2 bg-black border border-[#1a2a2e] rounded text-white"
          />

          <button
            onClick={submitWork}
            className="w-full py-2 bg-[#00e6c3] text-black rounded font-semibold"
          >
            Submit Work
          </button>
        </div>

        {/* CHAT STYLE HISTORY */}
        <div className="space-y-3">
          {items.length === 0 && (
            <p className="text-gray-400 text-center">No work yet</p>
          )}

          {items.map((item) => {
            const isMe = item.sender_id === meId;

            return (
              <div
                key={item.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] p-3 rounded-xl border ${
                    isMe
                      ? "bg-[#00e6c3]/10 border-[#00e6c3]/20"
                      : "bg-[#0c1317] border-[#1a2a2e]"
                  }`}
                >
                  {/* HEADER */}
                  <p className="text-xs text-gray-400 mb-1">
                    {isMe ? "You" : partner?.full_name}
                  </p>

                  {/* WORK CARD */}
                  <p className="text-xs text-teal-400 font-semibold mb-1">
                    📎 Work Submission
                  </p>

                  <a
                    href={item.work_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white underline break-all text-sm"
                  >
                    {item.work_link}
                  </a>

                  {item.note && (
                    <p className="text-gray-400 text-xs mt-2">
                      {item.note}
                    </p>
                  )}

                  {/* TIME */}
                  <p className="text-[10px] text-gray-600 mt-2 text-right">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </MobileShell>
  );
}