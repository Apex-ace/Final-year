import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Note: Use 127.0.0.1 for stability if you changed your API client
const WS_URL = "wss://talent-ml2c.onrender.com/chats/ws/";
const RECONNECT_DELAY = 3000; // 3 seconds delay for reconnection attempts

// --- Reusable WebSocket setup function ---
function setupWebSocket(
  convId: string,
  userId: string,
  wsRef: React.MutableRefObject<WebSocket | null>,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
) {
  // Close old socket cleanly if it exists and is open
  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
    wsRef.current.close(1000, "Switching Chat");
  }

  const socket = new WebSocket(`${WS_URL}${convId}?user_id=${userId}`);
  wsRef.current = socket;

  socket.onopen = () => {
    console.log("WebSocket connected successfully.");
  };

  socket.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id) {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    }
  };

  // --- CRITICAL RECONNECTION LOGIC ---
  socket.onclose = (event) => {
    console.warn(`WebSocket closed: Code ${event.code}. Reason: ${event.reason || 'No specific reason'}.`);

    // Only attempt reconnect if the closure was unexpected (e.g., 403/1006 failure)
    // Code 1000 is clean closure (intentional disconnect)
    if (event.code !== 1000) {
      setTimeout(() => {
        console.log("Attempting to reconnect WebSocket...");
        // Recursively call setupWebSocket to retry
        setupWebSocket(convId, userId, wsRef, setMessages);
      }, RECONNECT_DELAY);
    }
  };

  socket.onerror = (error) => {
    // This often captures the initial 403 failure
    console.error("WebSocket Connection Error Detected:", error);
  };

  return socket;
}
// --- End WebSocket setup function ---

// -----------------------------
// Mobile-first WhatsApp-style
// Theme: WhatsApp Dark (Teal highlights, AMOLED friendly)
// -----------------------------

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

  // Mobile view state: 'list' or 'chat'
  const [view, setView] = useState<'list' | 'chat'>('list');

  // Helper function to load messages from the backend
  async function loadMessages(convId: string) {
    const res = await api.get(`/chats/${convId}/messages`);
    setMessages(res.data.messages);
  }

  // --------------------------------------------
  // 1) CONSOLIDATED LOADING + INITIAL WEBSOCKET SETUP
  // --------------------------------------------
  useEffect(() => {
    const loadAndSetupChat = async () => {
      let userId = me;

      // 1. Authenticate and Load User ID
      if (!userId) {
        try {
          const meRes = await api.get("/users/me");
          userId = meRes.data.profile.id;
          setMe(userId);
        } catch (e) {
          console.error("Authentication Error:", e);
          return;
        }
      }

      if (!userId) return;

      // 2. Load Conversations List
      const convRes = await api.get("/chats/");
      const list = convRes.data.conversations || [];
      setConversations(list);

      // 3. Determine Active Chat ID
      const urlConv = searchParams.get("c");
      const targetConvId = urlConv || (list.length > 0 ? list[0].id : null);

      if (!targetConvId) return;

      setActiveChat(targetConvId);

      // 4. Set Active Partner and Load Messages
      const conv = list.find((c: any) => c.id === targetConvId);
      setActivePartner(conv?.partner || null);
      await loadMessages(targetConvId);

      // 5. Setup WebSocket connection
      setupWebSocket(targetConvId, userId, ws, setMessages);

      // On mobile, show chat if we have an active conversation
      setView('chat');
    };

    loadAndSetupChat().catch((err) => {
      console.error("Failed to load chat or connect WebSocket:", err);
    });

    // Cleanup function: Close WebSocket when component unmounts
    return () => {
      if (ws.current) ws.current.close(1000, "Component Unmount");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // --------------------------------------------
  // 2) HANDLE SIDEBAR CLICK (Mobile List -> Chat)
  // --------------------------------------------
  const handleChatChange = async (convId: string) => {
    if (convId === activeChat) {
      setView('chat');
      return;
    }

    // 1. Close old socket cleanly
    if (ws.current) ws.current.close(1000, "Switching Chat");

    // 2. Update state and load messages/partner
    setActiveChat(convId);

    const conv = conversations.find((c) => c.id === convId);
    setActivePartner(conv?.partner || null);
    await loadMessages(convId);

    // 3. Open new WS connection
    if (me) {
      setupWebSocket(convId, me, ws, setMessages);
    }

    // show chat view on mobile
    setView('chat');
  };

  // --------------------------------------------
  // 3) SEND MESSAGE
  // --------------------------------------------
  function sendMessage(e: any) {
    e.preventDefault();

    // Check ensures socket is not only present but also open
    if (!input.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.error("Cannot send message: WebSocket is not open.");
      // Optional: Trigger a manual reconnect if the state is CLOSING or CLOSED
      if (ws.current && ws.current.readyState === WebSocket.CLOSED && activeChat && me) {
        setupWebSocket(activeChat, me, ws, setMessages);
      }
      return;
    }

    ws.current.send(
      JSON.stringify({
        content: input.trim(),
      })
    );

    setInput("");
  }

  // --------------------------------------------
  // 4) AUTO SCROLL TO BOTTOM
  // --------------------------------------------
  useLayoutEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, [messages]);

  // -----------------------------
  // Presentation & Styles (Dark Teal / AMOLED)
  // -----------------------------
  const containerBg = "bg-[#050505]"; // near-black for AMOLED
  const panelBg = "bg-gradient-to-br from-[#071018]/60 via-[#071720]/60 to-[#001213]/60";

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
  };

  // message bubble styles
  const myBubble = "bg-gradient-to-br from-[#03dac6] to-[#02897a] text-black"; // teal-ish
  const theirBubble = "bg-[#0b1013] border border-[#0f1720] text-gray-200";

  return (
    <div className={`min-h-screen ${containerBg} text-gray-200`}>
      <div className="max-w-md mx-auto h-screen flex flex-col">
        {/* App header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#0b1113]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#002e2a] to-[#003b3a] flex items-center justify-center text-sm font-semibold text-[#a7fff0]">
              D
            </div>
            <div>
              <div className="text-sm font-semibold">SkillSwap</div>
              <div className="text-xs text-gray-400">Chats</div>
            </div>
          </div>
          <div className="text-xs text-gray-400">● Online</div>
        </div>

        {/* Main area (list <-> chat) */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence initial={false} custom={view === 'chat' ? 1 : -1}>
            {view === 'list' && (
              <motion.div
                key="list"
                custom={-1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28 }}
                className={`absolute inset-0 px-2 py-3 overflow-y-auto ${panelBg} rounded-tl-xl rounded-tr-xl`}
              >
                <div className="px-2">
                  <div className="text-xs text-gray-400 px-2 mb-2">Your conversations</div>
                  {conversations.length === 0 && (
                    <div className="text-gray-500 px-4 py-6">No conversations yet.</div>
                  )}

                  <div className="space-y-2">
                    {conversations.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleChatChange(c.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#062427]/40 transition ${activeChat === c.id ? 'ring-1 ring-[#04e6c1]/30' : ''}`}
                      >
                        <img
                          src={c.partner.profile_image_url || "https://via.placeholder.com/40"}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-sm text-gray-100">{c.partner.full_name}</div>
                            <div className="text-xs text-gray-400">{c.unread_count > 0 ? `${c.unread_count}` : ''}</div>
                          </div>
                          <div className="text-xs text-gray-400 truncate">@{c.partner.username}</div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">{c.last_message?.content || 'No messages yet'}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'chat' && (
              <motion.div
                key="chat"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28 }}
                className={`absolute inset-0 flex flex-col ${panelBg} rounded-tl-xl rounded-tr-xl`}
              >
                {/* Chat top bar */}
                <div className="flex items-center gap-3 px-3 py-3 border-b border-[#071719]">
                  <button
                    onClick={() => setView('list')}
                    className="p-2 rounded-md hover:bg-[#062427]/40 transition"
                    aria-label="Back to list"
                  >
                    ←
                  </button>

                  <img
                    src={activePartner?.profile_image_url || 'https://via.placeholder.com/40'}
                    className="w-10 h-10 rounded-full object-cover"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-100 truncate">{activePartner?.full_name || 'Loading...'}</div>
                    <div className="text-xs text-gray-400 truncate">@{activePartner?.username || ''}</div>
                  </div>

                  <div className="text-xs text-gray-400">⋮</div>
                </div>

                {/* Messages area */}
                <div className="flex-1 px-3 py-4 overflow-y-auto space-y-3" style={{ backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0.02), transparent)' }}>
                  {messages.map((msg: any) => {
                    const isMe = msg.sender_id === me;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}> 
                        <div className={`px-4 py-2 rounded-2xl max-w-[78%] break-words ${isMe ? myBubble : theirBubble}`}>
                          <div className={`text-sm ${isMe ? 'font-medium' : 'text-gray-200'}`}>{msg.content}</div>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={bottomRef} />
                </div>

                {/* Input Bar */}
                <form onSubmit={sendMessage} className="px-3 py-3 border-t border-[#071719] bg-gradient-to-t from-transparent to-[#000000]/20">
                  <div className="flex items-center gap-3">
                    <button type="button" className="p-2 rounded-full hover:bg-[#062427]/40 transition">+</button>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type a message"
                      className="flex-1 bg-[#051014] border border-[#073036] px-4 py-3 rounded-full focus:outline-none text-gray-100"
                    />
                    <button type="submit" className="px-4 py-2 rounded-full bg-gradient-to-br from-[#00e2c6] to-[#00a387] text-black font-semibold shadow-md hover:scale-95 transition">
                      Send
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer hint on list view */}
        {view === 'list' && (
          <div className="px-4 py-2 text-xs text-gray-400 border-t border-[#071719]">Tap a conversation to open chat</div>
        )}
      </div>
    </div>
  );
}
