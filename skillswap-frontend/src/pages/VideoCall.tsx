import React, { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function VideoCall() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const room = params.get("room");
  const name = params.get("name") || "User";

  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    if (!(window as any).JitsiMeetExternalAPI) {
      alert("Jitsi API not loaded! Check index.html");
      return;
    }

    const api = new (window as any).JitsiMeetExternalAPI("meet.jit.si", {
      roomName: room,
      parentNode: containerRef.current,
      width: "100%",
      height: "100%",
      userInfo: { displayName: name },

      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
      },

      interfaceConfigOverwrite: {
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
      },
    });

    apiRef.current = api;

    return () => {
      api.dispose();
    };
  }, []);

  const leaveCall = () => {
    apiRef.current?.dispose();
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 bg-black">

      {/* 🔥 JITSI CONTAINER */}
      <div ref={containerRef} className="w-full h-full" />

      {/* 🔥 FLOATING HEADER */}
      <div className="absolute top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
        <div className="w-full max-w-md">

          <div className="
            flex items-center justify-between
            px-4 py-3
            rounded-2xl
            bg-black/40
            backdrop-blur-xl
            border border-white/10
          ">

            {/* LEFT */}
            <div className="flex items-center gap-3">
              <button
                onClick={leaveCall}
                className="p-2 rounded-xl bg-[#111b1d]"
              >
                <ChevronLeft className="text-white w-5 h-5" />
              </button>

              <div>
                <p className="text-sm font-medium text-white">
                  {name}
                </p>
                <p className="text-[11px] text-gray-400">
                  Video Call
                </p>
              </div>
            </div>

            {/* RIGHT STATUS */}
            <div className="text-xs text-green-400">
              ● Live
            </div>

          </div>
        </div>
      </div>

      {/* 🔥 BOTTOM CONTROLS (OPTIONAL FUTURE) */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <button
          onClick={leaveCall}
          className="
            px-6 py-3 rounded-full
            bg-red-500 text-white font-medium
            shadow-lg shadow-red-900/40
          "
        >
          End Call
        </button>
      </div>

    </div>
  );
}