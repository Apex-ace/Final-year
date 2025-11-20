// src/hooks/useBackGesture.tsx
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function useBackGesture(enabled = true) {
  const startX = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!enabled) return;

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      startX.current = t.clientX;
      startTime.current = performance.now();
    }

    function onTouchEnd(e: TouchEvent) {
      if (startX.current === null || !e.changedTouches) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX.current;
      const dt = performance.now() - (startTime.current || 0);

      // Conditions: quick-ish or significant movement to the right, started near left edge
      if (dx > 80 && dt < 600 && (startX.current < 60 || dx / dt > 0.12)) {
        nav(-1);
      }

      startX.current = null;
      startTime.current = null;
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled, nav]);
}
