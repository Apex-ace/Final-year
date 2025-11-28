// src/pages/Work.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import MobileShell from "../components/MobileShell";
import FullPageLoader from "../components/FullPageLoader";
import { Link as LinkIcon, ExternalLink } from "lucide-react"; // Optional: Icons for better UI

interface WorkItem {
  id: string;
  sender_id: string;
  receiver_id: string;
  work_link: string;
  note: string | null;
  created_at: string;
}

interface PartnerProfile {
  id: string;
  full_name: string;
  username: string;
  profile_image_url: string | null;
}

export default function Work() {
  const [params] = useSearchParams();
  const profileId = params.get("u"); // Get partner ID from URL (?u=...)

  const [meId, setMeId] = useState<string | null>(null);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      // If no profile ID is present, we stop loading and show the empty state
      if (!profileId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1. Get my profile (to identify which messages are mine)
        const meRes = await api.get("/users/me");
        setMeId(meRes.data.profile.id);

        // 2. Get partner profile details
        const pRes = await api.get(`/users/${profileId}`);
        setPartner(pRes.data.profile);

        // 3. Get workspace history (both sent and received)
        const wRes = await api.get(`/work/profile/${profileId}`);
        setItems(wRes.data.workspace || []);
      } catch (err) {
        console.error("Error loading workspace:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [profileId]);

  const submitWork = async () => {
    if (!profileId) return;
    if (!link.trim()) {
      alert("Please paste a work link.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/work", {
        receiver_id: profileId,
        work_link: link,
        note: note,
      });

      setLink("");
      setNote("");

      // Refresh the list to show the new item
      const wRes = await api.get(`/work/profile/${profileId}`);
      setItems(wRes.data.workspace || []);
    } catch (err) {
      console.error("Error submitting work:", err);
      alert("Failed to submit work.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <FullPageLoader />;

  // --- EMPTY STATE (No User Selected) ---
  if (!profileId) {
    return (
      <MobileShell title="Work" showBack={true}>
        <div className="space-y-6 pt-4">
          <div className="p-5 rounded-2xl bg-[#0c1317] border border-[#1a2a2e] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#1a2a2e] flex items-center justify-center mx-auto text-teal-300">
              <LinkIcon size={24} />
            </div>
            <h3 className="text-white font-semibold">Select a Partner</h3>
            <p className="text-gray-400 text-sm">
              To start a workspace, find a user and click "Open Workspace".
            </p>
            <Link 
              to="/browse"
              className="inline-block mt-2 text-teal-300 text-sm font-semibold hover:underline"
            >
              Go to Browse &rarr;
            </Link>
          </div>
        </div>
      </MobileShell>
    );
  }

  // --- WORKSPACE VIEW ---
  return (
    <MobileShell
      title={partner ? `Workspace` : "Workspace"}
      showBack={true}
    >
      <div className="space-y-5 pb-20">
        
        {/* Partner Header Card */}
        {partner && (
          <div className="p-4 rounded-2xl bg-[#0b0f10]/80 border border-[#10191c] flex items-center gap-3">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-[#0c1317] border border-[#1a2a2e] flex-shrink-0">
              {partner.profile_image_url ? (
                <img
                  src={partner.profile_image_url}
                  alt={partner.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-teal-300 font-semibold bg-[#111]">
                  {partner.full_name?.[0] || "U"}
                </div>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-white font-semibold truncate">
                {partner.full_name}
              </p>
              <p className="text-xs text-gray-400 truncate">@{partner.username}</p>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-[#0c1317] border border-[#1a2a2e] rounded-2xl p-4 space-y-3 shadow-lg shadow-black/20">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            New Submission
          </p>

          <input
            placeholder="Paste link (GitHub, Figma, Docs...)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full bg-[#050505] border border-[#1a2a2e] rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-teal-500/50 transition-colors"
          />

          <textarea
            placeholder="Add a note (optional)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full bg-[#050505] border border-[#1a2a2e] rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-teal-500/50 transition-colors resize-none"
          />

          <button
            onClick={submitWork}
            disabled={submitting || !link.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00e6c3] to-[#009f82] text-black font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {submitting ? "Sending..." : "Submit Work"}
          </button>
        </div>

        {/* Timeline */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-semibold text-gray-300">History</h3>
            <span className="text-xs text-gray-500">{items.length} items</span>
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-[#1a2a2e] text-gray-500 text-sm">
              <p>No work shared yet.</p>
              <p className="text-xs mt-1">Be the first to submit something!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const isMe = meId && item.sender_id === meId;
                return (
                  <div
                    key={item.id}
                    className={`relative p-4 rounded-xl border text-sm transition-all ${
                      isMe
                        ? "bg-[#00e6c3]/5 border-[#00e6c3]/20 ml-8"
                        : "bg-[#0c1317] border-[#1a2a2e] mr-8"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isMe ? "text-teal-400" : "text-gray-400"
                        }`}
                      >
                        {isMe ? "You" : partner?.full_name || "Partner"}
                      </span>
                      <span className="text-[10px] text-gray-600">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Link Display */}
                    <div className="mb-2">
                      <a
                        href={item.work_link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-teal-300 hover:text-teal-200 hover:underline group break-all"
                      >
                        <ExternalLink size={12} className="flex-shrink-0" />
                        <span className="line-clamp-2">{item.work_link}</span>
                      </a>
                    </div>

                    {/* Note Display */}
                    {item.note && (
                      <div className="pt-2 border-t border-white/5">
                        <p className="text-gray-300 text-xs leading-relaxed">
                          {item.note}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}