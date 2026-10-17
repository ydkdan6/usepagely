"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookCard, BookCardSkeleton } from "@/components/library/book-card";
import { useBooks } from "@/hooks/use-books";
import { useLibraryFilters } from "@/hooks/use-library-filters";
import { ROW_PAGE_SIZE } from "@/lib/books/sections";
import type { SectionSlug } from "@/lib/books/types";
import { cn } from "@/lib/utils";

const CARD_WIDTH = "w-[140px] shrink-0 snap-start sm:w-[160px] lg:w-[170px]";

export function BookRow({ slug, title }: { slug: SectionSlug; title: string }) {
  const { category, q, buildHref } = useLibraryFilters();
  const [page, setPage] = useState(1);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const headingId = `section-${slug}`;

  useEffect(() => setPage(1), [category, q]);

  const { data, isLoading, isValidating, error } = useBooks({
    section: slug,
    category,
    q,
    page,
    limit: ROW_PAGE_SIZE,
  });

  useEffect(() => {
    scrollerRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, [page]);

  const scrollBy = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * el.clientWidth * 0.85,
      behavior: "smooth",
    });
  };

  const totalPages = data?.totalPages ?? 1;
  const isEmpty = data && data.total === 0;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2
            id={headingId}
            className="text-lg font-semibold tracking-tight text-[#1c1c26] uppercase md:text-xl"
          >
            {title}
          </h2>
          <Link
            href={buildHref(`/library/${slug}`)}
            className="text-xs text-[#1c1c26] underline underline-offset-2 hover:text-[#0799ea]"
          >
            (view all)
          </Link>
        </div>

        {!isEmpty && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label={`Scroll ${title} left`}
              className="hidden size-8 items-center justify-center rounded-full border border-[#1c1c26]/20 bg-white text-[#1c1c26] hover:border-[#1c1c26] sm:flex"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label={`Scroll ${title} right`}
              className="hidden size-8 items-center justify-center rounded-full border border-[#1c1c26]/20 bg-white text-[#1c1c26] hover:border-[#1c1c26] sm:flex"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            {totalPages > 1 && (
              <nav
                aria-label={`${title} pages`}
                className="ml-1 flex items-center gap-1 rounded-full border border-[#1c1c26]/20 bg-white px-1 py-0.5"
              >
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Previous page"
                  className="flex size-7 items-center justify-center rounded-full text-[#1c1c26] hover:bg-[#1c1c26]/5 disabled:opacity-30"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
                <span
                  className="min-w-12 text-center text-xs font-medium tabular-nums text-[#1c1c26]"
                  aria-live="polite"
                >
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                  className="flex size-7 items-center justify-center rounded-full text-[#1c1c26] hover:bg-[#1c1c26]/5 disabled:opacity-30"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </nav>
            )}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-sm text-[#1c1c26]/70">
          Couldn&apos;t load books. Please try again.
        </p>
      ) : isEmpty ? (
        <p className="rounded-md border border-dashed border-[#1c1c26]/20 px-4 py-8 text-center text-sm text-[#1c1c26]/70">
          No books match this filter yet.
        </p>
      ) : (
        <div
          ref={scrollerRef}
          className={cn(
            "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-2 md:-mx-8 md:scroll-px-8 md:px-8",
            isValidating && !isLoading && "opacity-60 transition-opacity",
          )}
          aria-busy={isLoading}
        >
          {isLoading || !data
            ? Array.from({ length: 8 }, (_, index) => (
                <BookCardSkeleton key={index} className={CARD_WIDTH} />
              ))
            : data.data.map((book) => (
                <BookCard key={book.id} book={book} className={CARD_WIDTH} />
              ))}
        </div>
      )}
    </section>
  );
}
