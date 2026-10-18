"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, History, House, Library, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/library", label: "Home", icon: House },
  { href: "/library", label: "Library", icon: Library },
  { href: "/library/saved", label: "Saved", icon: History },
  { href: "/library/downloads", label: "Downloads", icon: Download },
  { href: "/library/profile", label: "Profile", icon: UserRound },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="sticky top-0 hidden h-svh w-20 shrink-0 flex-col items-center border-r border-[#1c1c26]/10 bg-[#f1eee4] py-6 md:flex">
        <Link href="/library" aria-label="UsePagely home" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
        </Link>
        <nav aria-label="Main" className="mt-auto mb-auto flex flex-col gap-5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
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
      </aside>
      <nav
        aria-label="Mobile main"
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-[#1c1c26]/10 bg-[#f1eee4]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
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
