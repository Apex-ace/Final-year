import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const WS_URL = "wss://talent-ml2c.onrender.com/chats/ws/";
const RECONNECT_DELAY = 3000;

function setupWebSocket(
  convId: string,
  userId: string,
  wsRef: React.MutableRefObject<WebSocket | null>,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
) {
  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
    wsRef.current.close(1000, "Switching Chat");
  }

  const socket = new WebSocket(`${WS_URL}${convId}?user_id=${userId}`);
  wsRef.current = socket;

  socket.onopen = () => console.log("WebSocket connected.");

  socket.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id) {
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
    }
  };

  socket.onclose = (event) => {
    if (event.code !== 1000) {
      setTimeout(
        () => setupWebSocket(convId, userId, wsRef, setMessages),
        RECONNECT_DELAY
      );
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket Error:", error);
  };
}

export default function ChatMobile() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activePartner, setActivePartner] = useState<any>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  const [me, setMe] = useState<string | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const bottomRef = useRef<any>(null);

  const [searchParams] = useSearchParams();

  const [view, setView] = useState<"list" | "chat">("list");

  async function loadMessages(convId: string) {
    const res = await api.get(`/chats/${convId}/messages`);
    setMessages(res.data.messages);
  }

  useEffect(() => {
    const loadChat = async () => {
      let userId = me;

      if (!userId) {
        try {
          const meRes = await api.get("/users/me");
          userId = meRes.data.profile.id;
          setMe(userId);
        } catch {
          return;
        }
      }

      if (!userId) return;

      const convRes = await api.get("/chats/");
      const list = convRes.data.conversations || [];
      setConversations(list);

      const urlConv = searchParams.get("c");
      const targetConvId = urlConv || (list.length > 0 ? list[0].id : null);

      if (!targetConvId) return;

      setActiveChat(targetConvId);

      const conv = list.find((c) => c.id === targetConvId);
      setActivePartner(conv?.partner || null);

      await loadMessages(targetConvId);

      setupWebSocket(targetConvId, userId, ws, setMessages);

      setView("chat");
    };

    loadChat();

    return () => {
      if (ws.current) ws.current.close(1000, "Unmount");
    };
  }, [searchParams]);

  const handleChatChange = async (convId: string) => {
    if (convId === activeChat) {
      setView("chat");
      return;
    }

    if (ws.current) ws.current.close(1000, "Switching Chat");

    setActiveChat(convId);

    const conv = conversations.find((c) => c.id === convId);
    setActivePartner(conv?.partner || null);

    await loadMessages(convId);

    if (me) setupWebSocket(convId, me, ws, setMessages);

    setView("chat");
  };

  function sendMessage(e: any) {
    e.preventDefault();

    if (!input.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    ws.current.send(JSON.stringify({ content: input.trim() }));
    setInput("");
  }

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const containerBg = "bg-[#050505]";
  const panelBg =
    "bg-gradient-to-br from-[#071018]/60 via-[#071720]/60 to-[#001213]/60";

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  const myBubble = "bg-gradient-to-br from-[#03dac6] to-[#02897a] text-black";
  const theirBubble = "bg-[#0b1013] border border-[#0f1720] text-gray-200";

  return (
    <div className={`min-h-screen safe-top ${containerBg} text-gray-200`}>
      <div className="max-w-md mx-auto h-screen flex flex-col">

        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#0b1113]">
          <button
            onClick={() => setView("list")}
            className="p-2 rounded-md hover:bg-[#062427]/40 transition"
          >
            ←
          </button>

          <img
            src={activePartner?.profile_image_url || "https://via.placeholder.com/40"}
            className="w-10 h-10 rounded-full object-cover"
          />

          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-100 truncate">
              {activePartner?.full_name}
            </div>
            <div className="text-xs text-gray-400 truncate">
              @{activePartner?.username}
            </div>
          </div>

          <div className="text-xs text-gray-400">⋮</div>
        </div>

        {/* ⭐ INPUT BAR BELOW HEADER ⭐ */}
        <form
          onSubmit={sendMessage}
          className="px-4 py-3 border-b border-[#071719] bg-[#050505]"
        >
          <div className="flex items-center gap-3">
            <button type="button" className="p-2 rounded-full hover:bg-[#062427]/40 transition">
              +
            </button>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message"
              className="flex-1 bg-[#051014] border border-[#073036] px-4 py-3 rounded-full focus:outline-none text-gray-100"
            />

            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-gradient-to-br from-[#00e2c6] to-[#00a387] text-black font-semibold shadow-md hover:scale-95 transition"
            >
              Send
            </button>
          </div>
        </form>

        {/* ------------------------ */}
        {/* ⭐ MESSAGES UNDER INPUT ⭐ */}
        {/* ------------------------ */}
        <div
          className="flex-1 px-3 py-4 overflow-y-auto space-y-3 pb-20"
          style={{
            backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0.02), transparent)",
          }}
        >
          {messages.map((msg: any) => {
            const isMe = msg.sender_id === me;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[78%] break-words ${
                    isMe ? myBubble : theirBubble
                  }`}
                >
                  <div className={`text-sm ${isMe ? "font-medium" : "text-gray-200"}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
