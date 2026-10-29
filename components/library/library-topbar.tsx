"use client";

import { useEffect, useState } from "react";
import { Bell, Search } from "lucide-react";
import { useLibraryFilters } from "@/hooks/use-library-filters";
import { SearchSuggestions } from "@/components/library/search-suggestions";
import { avatarDataUri } from "@/lib/avatar";

export function LibraryTopbar() {
  const { q, update } = useLibraryFilters();
  const [value, setValue] = useState(q);
  const [profile, setProfile] = useState<{
    username?: string;
    display_name?: string;
    avatar_seed?: string;
  }>({});
  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setProfile(data.profile ?? {}));
  }, []);

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
          className="w-full min-w-0 max-w-md appearance-none bg-transparent text-base text-[#1c1c26] outline-none placeholder:text-[#1c1c26]/60 md:text-sm"
        />
      </form>
      <SearchSuggestions
        query={value}
        onSelect={(selected) => {
          setValue(selected);
          update({ q: selected || null });
        }}
      />

      <div className="flex items-center gap-3">
        <img
          src={avatarDataUri(
            profile.avatar_seed ||
              profile.username ||
              profile.display_name ||
              "reader",
          )}
          alt=""
          className="size-9 rounded-full object-cover ring-2 ring-[#f15a3a]/60"
        />
        <span className="hidden text-sm font-semibold text-[#1c1c26] lg:inline">
          {profile.username || profile.display_name || "Reader"}
        </span>
      </div>
    </header>
  );
}
