"use client";

import { useEffect, useState } from "react";
import { Bell, Search } from "lucide-react";
import { useLibraryFilters } from "@/hooks/use-library-filters";

export function LibraryTopbar() {
  const { q, update } = useLibraryFilters();
  const [value, setValue] = useState(q);

  useEffect(() => {
    if (value.trim() === q) return;
    const timeout = setTimeout(() => update({ q: value.trim() || null }), 350);
    return () => clearTimeout(timeout);
  }, [value, q, update]);

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-[#1c1c26]/10 bg-[#f1eee4]/95 px-4 py-4 backdrop-blur md:px-8">
      <form
        role="search"
        className="flex min-w-0 flex-1 items-center gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          update({ q: value.trim() || null });
        }}
      >
        <label htmlFor="library-search" className="sr-only">
          Search books
        </label>
        <Search className="size-5 shrink-0 text-[#1c1c26]" aria-hidden="true" />
        <input
          id="library-search"
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search book, name, author..."
          className="w-full min-w-0 max-w-md bg-transparent text-sm text-[#1c1c26] outline-none placeholder:text-[#1c1c26]/60"
        />
      </form>

      <button
        type="button"
        className="hidden items-center gap-2 rounded-full border-2 border-[#0799ea] bg-white px-3 py-1.5 text-sm font-semibold text-[#1c1c26] sm:inline-flex"
        aria-label="Language: English"
      >
        EN
      </button>

      <div className="flex items-center gap-3">
        <img
          src="/placeholder-user.jpg"
          alt=""
          className="size-9 rounded-full object-cover ring-2 ring-[#f15a3a]/60"
        />
        <span className="hidden text-sm font-semibold text-[#1c1c26] lg:inline">
          Harleen Quinzel
        </span>
      </div>

      <button
        type="button"
        aria-label="Notifications"
        className="flex size-9 items-center justify-center rounded-full text-[#1c1c26] hover:bg-[#1c1c26]/5"
      >
        <Bell className="size-5" aria-hidden="true" />
      </button>
    </header>
  );
}
