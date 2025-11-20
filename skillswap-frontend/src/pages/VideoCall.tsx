import React, { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

export default function VideoCall() {
  const [params] = useSearchParams();
  const room = params.get("room");
  const name = params.get("name") || "User";

  const containerRef = useRef(null);

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
      userInfo: { displayName: name }
    });

    return () => api.dispose();
  }, []);

  return <div className="w-full h-screen" ref={containerRef}></div>;
}
