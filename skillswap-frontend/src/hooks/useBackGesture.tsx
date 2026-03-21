import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function useBackGesture(enabled = true) {
  const startX = useRef<number | null>(null);
  const currentX = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!enabled) return;

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;

      const t = e.touches[0];

      // 🔥 ONLY allow swipe from left edge
      if (t.clientX > 40) return;

      startX.current = t.clientX;
      currentX.current = t.clientX;
      startTime.current = performance.now();
    }

    function onTouchMove(e: TouchEvent) {
      if (startX.current === null) return;

      const t = e.touches[0];
      currentX.current = t.clientX;

      const dx = currentX.current - startX.current;

      // 🔥 OPTIONAL: subtle page drag effect
      if (dx > 0 && dx < 120) {
        document.body.style.transform = `translateX(${dx * 0.3}px)`;
      }
    }

    function onTouchEnd() {
      if (startX.current === null || currentX.current === null) return;

      const dx = currentX.current - startX.current;
      const dt = performance.now() - (startTime.current || 0);

      // Reset transform
      document.body.style.transform = "";

      // 🔥 Trigger navigation
      if (dx > 80 && dt < 600) {
        nav(-1);
      }

      startX.current = null;
      currentX.current = null;
      startTime.current = null;
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled, nav]);
}