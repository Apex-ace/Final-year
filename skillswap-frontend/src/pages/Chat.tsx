// src/pages/Chat.tsx
import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { api } from "../lib/api";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, Video } from "lucide-react";

const WS_URL = "wss://talent-ml2c.onrender.com/chats/ws/";
const RECONNECT_DELAY = 3000;

// --------------------------------------
// WEBSOCKET SETUP
// --------------------------------------
function setupWebSocket(convId: string, userId: string, wsRef: any, setMessages: any) {
  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
    wsRef.current.close(1000);
  }

  const socket = new WebSocket(`${WS_URL}${convId}?user_id=${userId}`);
  wsRef.current = socket;

  socket.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (!msg.id) return;
    setMessages((prev: any[]) =>
      prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
    );
  };

  socket.onclose = () => {
    setTimeout(() => setupWebSocket(convId, userId, wsRef, setMessages), RECONNECT_DELAY);
  };
}

// --------------------------------------
// MAIN COMPONENT
// --------------------------------------
export default function ChatMobile() {
  const [messages, setMessages] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activePartner, setActivePartner] = useState<any>(null);
  const [me, setMe] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const ws = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const init = async () => {
      let userId = me;
      if (!userId) {
        const meRes = await api.get("/users/me");
        userId = meRes.data.profile.id;
        setMe(userId);
      }

      const convRes = await api.get("/chats/");
      const list = convRes.data.conversations || [];
      const convId = searchParams.get("c") || list[0]?.id;
      if (!convId) return;

      setActiveChat(convId);
      setActivePartner(list.find((c: any) => c.id === convId)?.partner);

      const msgRes = await api.get(`/chats/${convId}/messages`);
      setMessages(msgRes.data.messages || []);

      setupWebSocket(convId, userId, ws, setMessages);
    };

    init();
    return () => ws.current?.close(1000);
  }, []);

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !ws.current) return;
    ws.current.send(JSON.stringify({ content: input.trim() }));
    setInput("");
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col">
      {/* 🔥 FLOATING HEADER */}
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-center px-4 pt-2">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#0c1317]/80 backdrop-blur-xl border border-[#1a2a2e] shadow-lg shadow-black/40">
            <div className="flex items-center gap-3">
              <button
                onClick={() => history.back()}
                className="p-2 rounded-xl bg-[#111b1d] hover:bg-[#1a2a2e] transition"
              >
                <ChevronLeft className="text-teal-300 w-5 h-5" />
              </button>

              {activePartner && (
                <>
                  <img
                    src={
                      activePartner.profile_image_url ||
                      "https://api.dicebear.com/7.x/initials/svg?seed=U"
                    }
                    className="w-9 h-9 rounded-full object-cover"
                    alt="Partner"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {activePartner.full_name}
                    </p>
                    <p className="text-[11px] text-gray-400">Online</p>
                  </div>
                </>
              )}
            </div>

            <Video className="text-teal-300 w-5 h-5 cursor-pointer hover:text-teal-200" />
          </div>
        </div>
      </div>

      {/* 🔥 MESSAGES */}
      {/* Increased pb-[150px] so the last message clears the raised input bar */}
      <div className="flex-1 overflow-y-auto px-4 pt-[90px] pb-[150px] space-y-3 max-w-md mx-auto w-full scrollbar-hide">
        {messages.map((msg) => {
          const isMe = msg.sender_id === me;
          let content = msg.content;

          if (typeof content === "string") {
            try {
              content = JSON.parse(content);
            } catch {
              content = { type: "text", text: content };
            }
          }

          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  isMe
                    ? "bg-[#00e6c3] text-black"
                    : "bg-[#0c1317] border border-[#1a2a2e] text-white"
                }`}
              >
                {content?.type === "work" ? (
                  <>
                    <p className="text-xs text-teal-700 font-semibold mb-1">
                      📎 Work Submission
                    </p>
                    <a
                      href={content.work_link}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-sm break-all"
                    >
                      {content.work_link}
                    </a>
                    {content.note && (
                      <p className="text-xs text-black/70 mt-2 font-medium">
                        {content.note}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm">{content.text || content}</p>
                )}

                <p
                  className={`text-[10px] mt-2 text-right ${
                    isMe ? "text-black/60" : "text-gray-500"
                  }`}
                >
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 🔥 INPUT BAR */}
      {/* Changed to bottom-[100px] to sit perfectly above your app's main navigation */}
      <div className="fixed bottom-[100px] left-0 right-0 z-40 flex justify-center px-4">
        <div className="w-full max-w-md">
          <form
            onSubmit={sendMessage}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#0c1317]/90 backdrop-blur-xl border border-[#1a2a2e] shadow-lg shadow-black/40"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent outline-none text-white px-2 placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-[#00e6c3] px-4 py-2 rounded-xl text-black text-sm font-semibold disabled:opacity-50 transition-opacity"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}