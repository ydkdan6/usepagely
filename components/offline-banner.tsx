"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => {
      setOffline(false);
      toast.success("Back online");
    };
    setOffline(!navigator.onLine);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);
  if (!offline) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 bg-[#1c1c26] px-4 py-2 text-center text-sm text-white"
    >
      You&apos;re offline. Downloaded books are still available.
    </div>
  );
}
