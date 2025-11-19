import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { api } from "../lib/api"; 
import { supabase } from "../lib/supabase";
import { useSearchParams } from "react-router-dom";

const WS_URL = "ws://localhost:10000/ws/";

export default function Chat() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activePartner, setActivePartner] = useState<any>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  const [me, setMe] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const bottomRef = useRef<any>(null);

  const [searchParams] = useSearchParams();

  // --------------------------------------------
  // 1) LOAD USER + CONVERSATIONS
  // --------------------------------------------
  useEffect(() => {
    loadInitial();
  }, []);

  async function loadInitial() {
    // Load user profile from backend (auth handled automatically)
    const meRes = await api.get("/users/me");
    const userId = meRes.data.user.id;
    setMe(userId);

    // Load conversations
    const convRes = await api.get("/chats/");
    const list = convRes.data.conversations || [];
    setConversations(list);

    // If URL has conversation param, use that
    const urlConv = searchParams.get("c");
    if (urlConv) {
      setActiveChat(urlConv);
    } else if (list.length > 0) {
      setActiveChat(list[0].id);
    }
  }

  // --------------------------------------------
  // 2) LOAD MESSAGES + SETUP WEBSOCKET WHEN CHAT CHANGES
  // --------------------------------------------
  useEffect(() => {
    if (!activeChat || !me) return;

    const conv = conversations.find((c) => c.id === activeChat);
    setActivePartner(conv?.partner || null);

    loadMessages(activeChat);

    // Close old socket if exists
    if (ws.current) ws.current.close();

    // Open new WS connection
    const socket = new WebSocket(`${WS_URL}${activeChat}?user_id=${me}`);
    ws.current = socket;

    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id) {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
        );
      }
    };

    return () => socket.close();
  }, [activeChat, me]);

  // --------------------------------------------
  // 3) LOAD MESSAGES FROM BACKEND
  // --------------------------------------------
  async function loadMessages(convId: string) {
    const res = await api.get(`/chats/${convId}/messages`);
    setMessages(res.data.messages);
  }

  // --------------------------------------------
  // 4) SEND MESSAGE
  // --------------------------------------------
  function sendMessage(e: any) {
    e.preventDefault();
    if (!input.trim() || !ws.current) return;

    ws.current.send(
      JSON.stringify({
        content: input.trim(),
      })
    );

    setInput("");
  }

  // --------------------------------------------
  // 5) AUTO SCROLL TO BOTTOM
  // --------------------------------------------
  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --------------------------------------------
  // UI
  // --------------------------------------------
  return (
    <div className="flex h-[calc(100vh-60px)] bg-gray-100">
      
      {/* ---------- LEFT SIDEBAR (Conversations) ---------- */}
      <div className="w-1/3 bg-white border-r overflow-y-auto">
        <h2 className="p-4 font-bold text-lg border-b">Chats</h2>

        {conversations.length === 0 && (
          <div className="text-gray-400 p-4">No conversations yet.</div>
        )}

        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveChat(c.id)}
            className={`flex w-full items-center gap-3 p-4 border-b text-left hover:bg-gray-100 ${
              activeChat === c.id ? "bg-indigo-50" : ""
            }`}
          >
            <img
              src={c.partner.profile_image_url || "https://via.placeholder.com/40"}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold">{c.partner.full_name}</p>
              <p className="text-xs text-gray-500">@{c.partner.username}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ---------- RIGHT CHAT PANEL ---------- */}
      <div className="flex-1 flex flex-col">

        {!activePartner ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
            Loading chat…
          </div>
        ) : (
          <>
            {/* TOP BAR */}
            <div className="p-4 bg-white border-b flex items-center gap-3">
              <img
                src={activePartner.profile_image_url || "https://via.placeholder.com/40"}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-lg">{activePartner.full_name}</p>
                <p className="text-xs text-gray-500">@{activePartner.username}</p>
              </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((msg) => {
                const isMe = msg.sender_id === me;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : ""}`}>
                    <div
                      className={`px-4 py-2 rounded-xl max-w-xs ${
                        isMe
                          ? "bg-indigo-600 text-white"
                          : "bg-white border"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef}></div>
            </div>

            {/* INPUT BAR */}
            <form onSubmit={sendMessage} className="p-4 bg-white flex gap-3">
              <input
                className="flex-1 border px-4 py-2 rounded-full"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700"
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
