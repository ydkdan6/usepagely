"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, History, House, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/library", label: "Home", icon: House },
  { href: "/library/history", label: "History", icon: History },
  { href: "/library/downloads", label: "Downloads", icon: Download },
  { href: "/library/profile", label: "Profile", icon: UserRound },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-svh w-20 shrink-0 flex-col items-center border-r border-[#1c1c26]/10 bg-[#f1eee4] py-6 md:flex">
      <Link href="/library" aria-label="BookOnline home" className="brand">
        <span className="brand-mark" aria-hidden="true">
          <span />
        </span>
      </Link>
      <nav aria-label="Main" className="mt-auto mb-auto flex flex-col gap-5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
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
  );
}
