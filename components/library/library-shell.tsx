"use client";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/library/app-sidebar";
import { LibraryTopbar } from "@/components/library/library-topbar";
import { LibraryFooter } from "@/components/library/library-footer";
import { ShelfScreen, ProfileScreen } from "@/components/library/shelf-screen";
import { SavedScreen } from "@/components/library/saved-screen";
import { HighlightsScreen } from "@/components/library/highlights-screen";
import { useEffect } from "react";
import { playClickSound } from "@/lib/click-sound";

export function LibraryShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest("button, a, [role=button], input[type=checkbox], select")
      ) {
        const enabled = window.localStorage.getItem("click-sounds") !== "off";
        playClickSound(enabled);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);
  const screen =
    path.endsWith("/highlights") || path.startsWith("/library/highlights/") ? (
      <HighlightsScreen />
    ) : path.endsWith("/history") || path.endsWith("/saved") ? (
      <SavedScreen />
    ) : path.endsWith("/downloads") ? (
      <ShelfScreen title="Downloaded books" kind="downloads" />
    ) : path.endsWith("/profile") ? (
      <ProfileScreen />
    ) : (
      children
    );
  return (
    <div className="flex min-h-svh bg-[#f7f6f2] text-[#1c1c26]">
      <AppSidebar />
      <div className="min-w-0 flex-1">
        <LibraryTopbar />
        <main className="mx-auto max-w-7xl px-5 pb-24 pt-8 md:px-10 md:pb-8 lg:py-14">
          {screen}
        </main>
        <LibraryFooter />
      </div>
    </div>
  );
}
