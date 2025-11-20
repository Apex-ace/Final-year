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

  socket.onmessage = (e) => {
    const data = JSON.parse(e.data);

    // Normal chat message
    if (data.id && data.content) {
      setMessages((prev) =>
        prev.some((m) => m.id === data.id) ? prev : [...prev, data]
      );
      return;
    }

    // Incoming call request
    if (data.type === "call_request" && data.to === me) {
      setIncomingCall({
        from: data.from,
        room: data.room,
        partner: activePartner,
      });
      return;
    }

    // Call accepted → open video
    if (data.type === "call_accept" && data.room) {
      window.location.href = `/video-call?room=${data.room}&name=${activePartner.full_name}`;
      return;
    }

    // Call rejected
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
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [activePartner, setActivePartner] = useState(null);
  const [me, setMe] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  const [input, setInput] = useState("");

  const ws = useRef(null);
  const bottomRef = useRef(null);
  const [searchParams] = useSearchParams();

  // Load chat + WebSocket
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

  // Send chat message
  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !ws.current) return;

    ws.current.send(JSON.stringify({ content: input.trim() }));
    setInput("");
  };

  // Start video call
  const startVideoCall = () => {
    if (!ws.current || !activePartner) return;

    const payload = {
      type: "call_request",
      from: me,
      to: activePartner.id,
      room: `skill_room_${activeChat}`,
    };

    ws.current.send(JSON.stringify(payload));
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // --------------------------------------
  // UI
  // --------------------------------------
  return (
    <div className="fixed top-0 left-0 right-0 bottom-[70px] flex flex-col bg-[#050505]">

      {/* Incoming Call */}
      {incomingCall && (
        <div className="absolute top-20 left-0 right-0 mx-auto w-[90%] bg-[#0b0f10] border border-[#1a2a2e] rounded-2xl p-6 shadow-xl text-center z-50">
          <p className="text-gray-200 text-lg mb-2">Incoming Video Call</p>
          <p className="text-teal-300 font-semibold mb-4">
            {incomingCall.partner?.full_name}
          </p>

          <div className="flex justify-center gap-5">
            <button
              onClick={() => {
                ws.current?.send(
                  JSON.stringify({
                    type: "call_accept",
                    room: incomingCall.room,
                  })
                );
                window.location.href = `/video-call?room=${incomingCall.room}&name=${incomingCall.partner.full_name}`;
              }}
              className="px-6 py-2 bg-teal-500 rounded-xl font-semibold text-black"
            >
              Accept
            </button>

            <button
              onClick={() => {
                ws.current?.send(JSON.stringify({ type: "call_reject" }));
                setIncomingCall(null);
              }}
              className="px-6 py-2 bg-red-600 rounded-xl font-semibold"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="shrink-0 w-full bg-[#0a0f10] border-b border-[#111a1c] px-4 pb-4 pt-14 flex items-center justify-between">

        <div className="flex items-center gap-3">
          <button onClick={() => history.back()} className="p-2">
            <ChevronLeft className="text-teal-300" />
          </button>

          {activePartner && (
            <>
              <img
                src={
                  activePartner.profile_image_url ||
                  "https://api.dicebear.com/7.x/initials/svg?seed=U"
                }
                className="w-10 h-10 rounded-full border border-[#1a2a2e]"
              />

              <div>
                <p className="text-gray-100 font-medium">{activePartner.full_name}</p>
                <p className="text-xs text-gray-500">Online</p>
              </div>
            </>
          )}
        </div>

        <button
          onClick={startVideoCall}
          className="p-2 rounded-lg bg-gradient-to-br from-[#00e6c3] to-[#009f82] shadow-md active:scale-95 transition"
        >
          <Video className="text-black w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
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

      {/* Input Bar */}
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

          <button
            type="submit"
            className="bg-[#00e6c3] text-black px-5 py-2 rounded-full font-semibold active:scale-95 transition"
          >
            Send
          </button>
        </form>
      </div>

    </div>
  );
}
