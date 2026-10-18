"use client";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
export function ReadingActivityTracker() {
  const active = useRef(0);
  const last = useRef(Date.now());
  const engaged = useRef(Date.now());
  const goalReached = useRef(false);
  useEffect(() => {
    const touch = () => {
      engaged.current = Date.now();
    };
    const tick = () => {
      const now = Date.now();
      if (
        document.visibilityState === "visible" &&
        now - engaged.current < 60000
      )
        active.current += Math.min(30, Math.round((now - last.current) / 1000));
      last.current = now;
      if (active.current >= 30) {
        void flush();
      }
    };
    const flush = async () => {
      if (!active.current) return;
      const seconds = active.current;
      active.current = 0;
      const response = await fetch("/api/reading-activity", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          seconds,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      if (response.ok && !goalReached.current) {
        const data = await fetch("/api/reading-activity").then((r) => r.json());
        if (data.today >= data.goal) {
          goalReached.current = true;
          toast.success("Daily reading goal reached.");
        }
      }
    };
    const beacon = () => {
      if (!active.current) return;
      navigator.sendBeacon(
        "/api/reading-activity",
        new Blob(
          [
            JSON.stringify({
              seconds: active.current,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }),
          ],
          { type: "application/json" },
        ),
      );
    };
    ["scroll", "pointerdown", "keydown", "touchstart"].forEach((event) =>
      window.addEventListener(event, touch, { passive: true }),
    );
    const timer = window.setInterval(tick, 30000);
    window.addEventListener("pagehide", beacon);
    return () => {
      window.clearInterval(timer);
      void flush();
      window.removeEventListener("pagehide", beacon);
      ["scroll", "pointerdown", "keydown", "touchstart"].forEach((event) =>
        window.removeEventListener(event, touch),
      );
    };
  }, []);
  return null;
}
