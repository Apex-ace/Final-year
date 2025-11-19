import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { api } from "../lib/api"; 
import { supabase } from "../lib/supabase";
import { useSearchParams } from "react-router-dom";

const WS_URL = "ws://localhost:10000/ws/"; // !! Ensure this matches your FastAPI host/port !!

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

  // Helper function to load messages from the backend
  async function loadMessages(convId: string) {
    const res = await api.get(`/chats/${convId}/messages`);
    setMessages(res.data.messages);
  }

  // --------------------------------------------
  // 1) CONSOLIDATED LOADING + INITIAL WEBSOCKET SETUP (FIXED)
  //    Ensures authentication check runs first to fix the 401 error.
  // --------------------------------------------
  useEffect(() => {
    const loadAndSetupChat = async () => {
      let userId = me;
      
      // 1. Authenticate and Load User ID (MANDATORY first step to guarantee token is set)
      if (!userId) {
        try {
          // This call forces the API interceptor to resolve the session token
          const meRes = await api.get("/users/me");
          // Path corrected based on your users.py returning {"profile": {...}}
          userId = meRes.data.profile.id; 
          setMe(userId);
        } catch (e) {
          console.error("Authentication Error: Failed to fetch user ID. Session may be expired or token missing.");
          // Stop execution if we cannot authenticate
          return; 
        }
      }
      
      // --- From here, we know userId is valid and token is in the interceptor ---

      // 2. Load Conversations List (Now authorized)
      const convRes = await api.get("/chats/");
      const list = convRes.data.conversations || [];
      setConversations(list);

      // 3. Determine Active Chat ID from URL or List
      const urlConv = searchParams.get("c");
      const targetConvId = urlConv || (list.length > 0 ? list[0].id : null);
      
      if (!targetConvId) return;

      setActiveChat(targetConvId);
      
      // 4. Set Active Partner and Load Messages
      const conv = list.find((c: any) => c.id === targetConvId);
      setActivePartner(conv?.partner || null);
      await loadMessages(targetConvId); 

      // 5. Setup WebSocket connection
      if (ws.current) ws.current.close(); 
      
      // Open new WS connection using the determined ID
      const socket = new WebSocket(`${WS_URL}${targetConvId}?user_id=${userId}`);
      ws.current = socket;

      socket.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id) {
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
          );
        }
      };
      
      // Handle socket closure
      socket.onclose = () => {
          console.log(`WebSocket disconnected for conversation ${targetConvId}`);
      };
    };

    loadAndSetupChat().catch(err => {
        console.error("Failed to load chat or connect WebSocket:", err);
    });

    // Cleanup function: Close WebSocket when component unmounts or dependencies change
    return () => {
        if (ws.current) ws.current.close();
    };
  }, [searchParams]); // Depend only on searchParams (for URL navigation)

  // --------------------------------------------
  // 2) HANDLE SIDEBAR CLICK
  // --------------------------------------------
  const handleChatChange = async (convId: string) => {
    if (convId === activeChat) return;
    
    // 1. Close old socket
    if (ws.current) ws.current.close(); 

    // 2. Update state and load messages/partner
    setActiveChat(convId);
    
    const conv = conversations.find((c) => c.id === convId);
    setActivePartner(conv?.partner || null);
    await loadMessages(convId);

    // 3. Open new WS connection
    if (me) {
        const socket = new WebSocket(`${WS_URL}${convId}?user_id=${me}`);
        ws.current = socket;
        
        socket.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.id) {
                setMessages((prev) =>
                    prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
                );
            }
        };
        
        socket.onclose = () => {
            console.log(`WebSocket disconnected for conversation ${convId}`);
        };
    }
  };


  // --------------------------------------------
  // 3) SEND MESSAGE
  // --------------------------------------------
  function sendMessage(e: any) {
    e.preventDefault();
    if (!input.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

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
    // Use setTimeout for reliability if message rendering is delayed
    setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
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
            onClick={() => handleChatChange(c.id)}
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

        {!activePartner && activeChat ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
            Loading chat details...
          </div>
        ) : !activeChat ? (
             <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
                Select a conversation or send a swap request to start chatting.
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
                type="submit"
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