"use client";
import { useEffect, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";
export function InstallPrompt() {
  const [event, setEvent] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    const dismissed = Number(
      localStorage.getItem("usepagely-install-dismissed") ?? 0,
    );
    if (Date.now() - dismissed < 12096e5) return;
    const handler = (value: any) => {
      value.preventDefault();
      setEvent(value);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    setIos(
      /iphone|ipad|ipod/i.test(navigator.userAgent) && !("MSStream" in window),
    );
    const visits = Number(sessionStorage.getItem("usepagely-visits") ?? 0) + 1;
    sessionStorage.setItem("usepagely-visits", String(visits));
    if (visits >= 2) setVisible(true);
    window.addEventListener("appinstalled", () => {
      setVisible(false);
      toast.success("UsePagely installed.");
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  if (!visible) return null;
  return (
    <aside className="fixed inset-x-4 bottom-4 z-50 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xl">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        {ios ? <Share2 className="size-5" /> : <Download className="size-5" />}
      </div>
      <p className="min-w-0 flex-1 text-sm">
        {ios
          ? "Tap Share, then Add to Home Screen"
          : "Install UsePagely to read your downloaded books offline"}
      </p>
      {ios ? null : (
        <button
          type="button"
          onClick={async () => {
            await event?.prompt();
            setVisible(false);
          }}
          className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
        >
          Install
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(
            "usepagely-install-dismissed",
            String(Date.now()),
          );
          setVisible(false);
        }}
        className="rounded-xl border border-border px-3 py-2 text-sm font-semibold"
      >
        Not now
      </button>
    </aside>
  );
}
