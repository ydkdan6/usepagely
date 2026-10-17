"use client";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/library/app-sidebar";
import { LibraryTopbar } from "@/components/library/library-topbar";
import { LibraryFooter } from "@/components/library/library-footer";
import { BOOKS } from "@/lib/books/mock-data";
import { ShelfScreen, ProfileScreen } from "@/components/library/shelf-screen";

export function LibraryShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const screen = path.endsWith("/history") ? (
    <ShelfScreen title="History" kind="history" books={BOOKS.slice(0, 4)} />
  ) : path.endsWith("/downloads") ? (
    <ShelfScreen
      title="Downloaded books"
      kind="downloads"
      books={BOOKS.slice(4, 8)}
    />
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
        <main className="mx-auto max-w-7xl px-5 py-8 md:px-10 lg:py-14">
          {screen}
        </main>
        <LibraryFooter />
      </div>
    </div>
  );
}
