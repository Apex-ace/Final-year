// src/pages/Chat.tsx
import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { api } from "../lib/api";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const WS_URL = "wss://talent-ml2c.onrender.com/chats/ws/";
const RECONNECT_DELAY = 3000;

function setupWebSocket(convId, userId, wsRef, setMessages) {
  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
    wsRef.current.close(1000);
  }

  const socket = new WebSocket(`${WS_URL}${convId}?user_id=${userId}`);
  wsRef.current = socket;

  socket.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (!msg.id) return;
    setMessages((prev) =>
      prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
    );
  };

  socket.onclose = () => {
    setTimeout(() => setupWebSocket(convId, userId, wsRef, setMessages), RECONNECT_DELAY);
  };
}

export default function ChatMobile() {
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [activePartner, setActivePartner] = useState(null);
  const [me, setMe] = useState(null);
  const [input, setInput] = useState("");

  const ws = useRef(null);
  const bottomRef = useRef(null);
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
      setActivePartner(list.find((c) => c.id === convId)?.partner);

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

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !ws.current) return;
    ws.current.send(JSON.stringify({ content: input.trim() }));
    setInput("");
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    /** * ADJUSTMENT:
     * Changed bottom-[90px] -> bottom-[70px]
     * This tightens the gap between the input bar and the nav bar.
     */
    <div className="fixed top-0 left-0 right-0 bottom-[70px] flex flex-col bg-[#050505]">

      {/* HEADER (Kept pt-14 for camera notch) */}
      <div className="shrink-0 w-full bg-[#0a0f10] border-b border-[#111a1c] px-4 pb-4 pt-14 flex items-center gap-3">
        <button onClick={() => history.back()} className="p-2">
          <ChevronLeft className="text-teal-300" />
        </button>

        {activePartner && (
          <>
            <img
              src={activePartner.profile_image_url || "https://api.dicebear.com/7.x/initials/svg?seed=U"}
              className="w-10 h-10 rounded-full border border-[#1a2a2e]"
            />
            <div>
              <p className="text-gray-100 font-medium">{activePartner.full_name}</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </>
        )}
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.sender_id === me;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                  isMe
                    ? "bg-[#00e6c3] text-black"
                    : "bg-[#111b1d] text-gray-200 border border-[#1a2a2e]"
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? "text-black/60" : "text-gray-400"}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT BAR */}
      <div className="shrink-0 w-full px-3 py-3 bg-[#050505] border-t border-[#0b1113]">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <button type="button" className="p-2 rounded-full bg-[#0f1a1c] text-gray-400">
            +
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message"
            className="flex-1 bg-[#0c1317] border border-[#1a2a2e] text-gray-100 px-4 py-3 rounded-full outline-none"
          />

          <button type="submit" className="bg-[#00e6c3] text-black px-5 py-2 rounded-full font-semibold">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}