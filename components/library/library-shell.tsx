"use client";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/library/app-sidebar";
import { LibraryTopbar } from "@/components/library/library-topbar";
import { LibraryFooter } from "@/components/library/library-footer";
import { ShelfScreen, ProfileScreen } from "@/components/library/shelf-screen";

export function LibraryShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const screen = path.endsWith("/history") ? (
    <ShelfScreen title="History" kind="history" />
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
