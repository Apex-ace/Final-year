import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { api } from "../lib/api"; 
import { supabase } from "../lib/supabase";
import { useSearchParams } from "react-router-dom";

// Note: Use 127.0.0.1 for stability if you changed your API client
const WS_URL = "ws://localhost:10000/chats/ws/";
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
            setMessages((prev) =>
                prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
            );
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
    };

    loadAndSetupChat().catch(err => {
        console.error("Failed to load chat or connect WebSocket:", err);
    });

    // Cleanup function: Close WebSocket when component unmounts
    return () => {
        if (ws.current) ws.current.close(1000, "Component Unmount");
    };
  }, [searchParams]);

  // --------------------------------------------
  // 2) HANDLE SIDEBAR CLICK
  // --------------------------------------------
  const handleChatChange = async (convId: string) => {
    if (convId === activeChat) return;
    
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

  // --------------------------------------------
  // UI (Unchanged)
  // --------------------------------------------
  return (
    <div className="flex h-[calc(100vh-60px)] bg-gray-100">
      
      {/* LEFT SIDEBAR (Conversations) */}
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

      {/* RIGHT CHAT PANEL */}
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