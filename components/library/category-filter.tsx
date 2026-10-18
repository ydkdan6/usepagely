"use client";

import { useCategories } from "@/hooks/use-books";
import { useLibraryFilters } from "@/hooks/use-library-filters";
import { cn } from "@/lib/utils";

export function CategoryFilter() {
  const { data, error, isLoading, mutate } = useCategories();
  const { category, update } = useLibraryFilters();
  const categories = [{ slug: "all", name: "All" }, ...(data?.data ?? [])];

  return (
    <div
      role="group"
      aria-label="Filter by category"
      className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 md:-mx-8 md:px-8"
    >
      {error ? (
        <span className="flex items-center gap-2 text-sm text-[#1c1c26]/70">
          Categories unavailable
          <button type="button" className="underline" onClick={() => mutate()}>
            Retry
          </button>
        </span>
      ) : isLoading ? (
        Array.from({ length: 7 }, (_, index) => (
          <span
            key={index}
            className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-[#1c1c26]/10"
          />
        ))
      ) : categories.length > 4 ? (
        <label className="relative flex items-center gap-2 text-sm font-medium">
          <span className="sr-only">Filter by category</span>
          <select
            value={category}
            onChange={(event) => update({ category: event.target.value })}
            className="select-control rounded-full border border-[#1c1c26]/20 bg-white px-4 py-2.5 pr-10 text-sm shadow-sm outline-none transition focus:border-[#0799ea] focus:ring-2 focus:ring-[#0799ea]/15"
          >
            <option value="all">All</option>
            {categories
              .filter((item) => item.slug !== "all")
              .map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>
      ) : (
        categories.map((item) => {
          const active = category === item.slug;
          return (
            <button
              key={item.slug}
              type="button"
              aria-pressed={active}
              onClick={() => update({ category: item.slug })}
              className={cn(
                "shrink-0 snap-start rounded-full border border-[#1c1c26]/20 bg-white px-4 py-2 text-sm font-medium text-[#1c1c26] transition-colors hover:border-[#1c1c26]",
                active && "border-[#1c1c26] bg-[#1c1c26] text-white",
              )}
            >
              {item.name}
            </button>
          );
        })
      )}
    </div>
  );
}
