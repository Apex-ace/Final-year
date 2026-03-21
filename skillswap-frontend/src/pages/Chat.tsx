import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { api } from "../lib/api";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, Video } from "lucide-react";

const WS_URL = "ws://talent-ml2c.onrender.com/chats/ws/";
const RECONNECT_DELAY = 3000;

// --------------------------------------
// WEBSOCKET SETUP
// --------------------------------------
function setupWebSocket(
  convId,
  userId,
  wsRef,
  setMessages,
  setIncomingCall,
  me,
  activePartner
) {
  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
    wsRef.current.close(1000);
  }

  const socket = new WebSocket(`${WS_URL}${convId}?user_id=${userId}`);
  wsRef.current = socket;

  socket.onopen = () => {
    console.log("WebSocket Connected ✅");
  };

  socket.onmessage = (e) => {
    const data = JSON.parse(e.data);

    if (data.id && data.content) {
      setMessages((prev) =>
        prev.some((m) => m.id === data.id) ? prev : [...prev, data]
      );
      return;
    }

    if (data.type === "call_request" && data.to === me) {
      setIncomingCall({
        from: data.from,
        room: data.room,
        partner: activePartner,
      });
      return;
    }

    if (data.type === "call_accept" && data.room) {
      window.location.href = `/video-call?room=${data.room}&name=${activePartner.full_name}`;
      return;
    }

    if (data.type === "call_reject") {
      alert("Call rejected");
      return;
    }
  };

  socket.onclose = () => {
    setTimeout(
      () =>
        setupWebSocket(
          convId,
          userId,
          wsRef,
          setMessages,
          setIncomingCall,
          me,
          activePartner
        ),
      RECONNECT_DELAY
    );
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
  const [incomingCall, setIncomingCall] = useState<any>(null);

  const [input, setInput] = useState("");

  const ws = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [searchParams] = useSearchParams();

  // Load chat
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

      const partner = list.find((c) => c.id === convId)?.partner;
      setActivePartner(partner);

      const msgRes = await api.get(`/chats/${convId}/messages`);
      setMessages(msgRes.data.messages || []);

      setupWebSocket(
        convId,
        userId,
        ws,
        setMessages,
        setIncomingCall,
        userId,
        partner
      );
    };

    init();
    return () => ws.current?.close(1000);
  }, []);

  // Auto scroll
  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = (e: any) => {
    e.preventDefault();

    if (!input.trim() || !ws.current) return;

    if (ws.current.readyState !== WebSocket.OPEN) {
      console.log("WebSocket not ready");
      return;
    }

    ws.current.send(
      JSON.stringify({
        content: {
          type: "text",
          text: input.trim(),
        },
      })
    );

    setInput("");
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // --------------------------------------
  // UI
  // --------------------------------------
  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col">

      {/* 🔥 FLOATING HEADER */}
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-center px-4 pt-2">
        <div className="w-full max-w-md">
          <div className="
            flex items-center justify-between
            px-4 py-3
            rounded-2xl
            bg-[#0c1317]/80
            backdrop-blur-xl
            border border-[#1a2a2e]
            shadow-lg shadow-black/40
          ">

            <div className="flex items-center gap-3">
              <button
                onClick={() => history.back()}
                className="p-2 rounded-xl bg-[#111b1d]"
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
                  />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {activePartner.full_name}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Online
                    </p>
                  </div>
                </>
              )}
            </div>

            <Video className="text-teal-300 w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 🔥 MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 pt-[90px] pb-[120px] space-y-3 max-w-md mx-auto w-full">
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
                    <p className="text-xs text-teal-400 mb-1">
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
                      <p className="text-xs text-gray-300 mt-2">
                        {content.note}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm">
                    {content.text || content}
                  </p>
                )}

                <p className="text-[10px] mt-2 text-right opacity-60">
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* 🔥 INPUT BAR */}
      <div className="fixed bottom-[90px] left-0 right-0 z-40 flex justify-center px-4">
        <div className="w-full max-w-md">
          <form
            onSubmit={sendMessage}
            className="
              flex items-center gap-2
              px-3 py-2
              rounded-2xl
              bg-[#0c1317]/90
              backdrop-blur-xl
              border border-[#1a2a2e]
            "
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent outline-none text-white px-2"
            />

            <button className="bg-[#00e6c3] px-4 py-2 rounded-xl text-black text-sm font-medium">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}