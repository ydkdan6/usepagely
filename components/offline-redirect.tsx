"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function OfflineRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const redirectIfOffline = () => {
      const canReadOffline =
        pathname === "/offline" ||
        pathname === "/library/downloads" ||
        pathname.startsWith("/library/read/");
      if (!navigator.onLine && !canReadOffline) {
        router.replace("/offline");
      }
    };

    redirectIfOffline();
    window.addEventListener("offline", redirectIfOffline);
    return () => window.removeEventListener("offline", redirectIfOffline);
  }, [pathname, router]);

  return null;
}
