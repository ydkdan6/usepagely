"use client";
import { useEffect } from "react";
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    void fetch("/api/catalog/seed", { method: "POST" }).then(
      async (response) => {
        if (!response.ok)
          console.error(
            "[v0] Catalog seed request failed",
            await response.text(),
          );
      },
    );
  }, []);
  return null;
}
