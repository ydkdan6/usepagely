"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function OfflineRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const redirectIfOffline = () => {
      if (!navigator.onLine && pathname !== "/offline") {
        router.replace("/offline");
      }
    };

    redirectIfOffline();
    window.addEventListener("offline", redirectIfOffline);
    return () => window.removeEventListener("offline", redirectIfOffline);
  }, [pathname, router]);

  return null;
}
