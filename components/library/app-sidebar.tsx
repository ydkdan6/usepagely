"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Download,
  Highlighter,
  History,
  House,
  LogOut,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/library/highlights", label: "Highlights", icon: Highlighter },
  { href: "/library/saved", label: "Saved", icon: History },
  { href: "/library/downloads", label: "Downloads", icon: Download },
  { href: "/library/profile", label: "Profile", icon: UserRound },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [confirmLogout, setConfirmLogout] = useState(false);

  async function handleLogout() {
    const { error } = await createClient().auth.signOut();
    if (error) {
      toast.error("Could not log out.");
      return;
    }
    toast.success("Logged out.");
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {confirmLogout && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
        >
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-xl">
            <h2 id="logout-title" className="text-lg font-semibold">
              Log out of UsePagely?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your current session will be cleared.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="rounded-xl px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmLogout(false);
                  void handleLogout();
                }}
                className="rounded-xl bg-[#f15a3a] px-4 py-2 text-sm font-semibold text-white"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
      <aside className="sticky top-0 hidden h-svh w-20 shrink-0 flex-col items-center border-r border-[#1c1c26]/10 bg-[#f1eee4] py-6 md:flex">
        <Link href="/" aria-label="UsePagely home" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
        </Link>
        <nav aria-label="Main" className="mt-auto mb-auto flex flex-col gap-5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={`${href}-${label}`}
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                title={label}
                className={cn(
                  "flex size-11 items-center justify-center rounded-xl text-[#1c1c26] transition-colors hover:bg-[#1c1c26]/5",
                  active && "bg-[#f15a3a] text-white hover:bg-[#e04e30]",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => setConfirmLogout(true)}
          aria-label="Log out"
          title="Log out"
          className="flex size-11 items-center justify-center rounded-xl text-[#1c1c26] transition-colors hover:bg-[#1c1c26]/5"
        >
          <LogOut className="size-5" aria-hidden="true" />
        </button>
      </aside>
      <nav
        aria-label="Mobile main"
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-[#1c1c26]/10 bg-[#f1eee4]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={`mobile-${label}`}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-14 flex-col items-center gap-0.5 px-2 py-1 text-[10px]",
                active ? "text-[#f15a3a]" : "text-[#1c1c26]/70",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
