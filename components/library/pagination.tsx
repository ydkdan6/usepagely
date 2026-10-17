"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function getPageItems(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) items.push("gap");
    items.push(p);
  });
  return items;
}

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const baseButton =
    "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium text-[#1c1c26] transition-colors hover:bg-[#1c1c26]/5 disabled:pointer-events-none disabled:opacity-30";

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1"
    >
      <button
        type="button"
        className={cn(baseButton, "gap-1 pr-3")}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Prev</span>
      </button>
      {getPageItems(page, totalPages).map((item, index) =>
        item === "gap" ? (
          <span
            key={`gap-${index}`}
            className="px-1 text-sm text-[#1c1c26]/50"
            aria-hidden="true"
          >
            {"..."}
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPageChange(item)}
            className={cn(
              baseButton,
              item === page && "bg-[#1c1c26] text-white hover:bg-[#1c1c26]",
            )}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className={cn(baseButton, "gap-1 pl-3")}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
