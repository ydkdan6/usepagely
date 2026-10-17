"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BookCard, BookCardSkeleton } from "@/components/library/book-card";
import { CategoryFilter } from "@/components/library/category-filter";
import { Pagination } from "@/components/library/pagination";
import { useBooks } from "@/hooks/use-books";
import { useLibraryFilters } from "@/hooks/use-library-filters";
import { GRID_PAGE_SIZE } from "@/lib/books/sections";
import type { SectionSlug } from "@/lib/books/types";

export function SectionGrid({
  slug,
  title,
}: {
  slug: SectionSlug;
  title: string;
}) {
  const { category, q, page, update, buildHref } = useLibraryFilters();
  const { data, isLoading, error, mutate } = useBooks({
    section: slug,
    category,
    q,
    page,
    limit: GRID_PAGE_SIZE,
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href={buildHref("/library")}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#1c1c26]/70 hover:text-[#1c1c26]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to library
        </Link>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1c1c26] uppercase md:text-3xl">
            {title}
          </h1>
          {data && (
            <p className="text-sm text-[#1c1c26]/70">
              {data.total} {data.total === 1 ? "book" : "books"}
            </p>
          )}
        </div>
        <CategoryFilter />
      </div>

      {error ? (
        <div className="flex items-center gap-3 text-sm text-[#1c1c26]/70">
          <p>Couldn&apos;t load books. Please try again.</p>
          <button type="button" className="underline" onClick={() => mutate()}>
            Retry
          </button>
        </div>
      ) : data && data.total === 0 ? (
        <p className="rounded-md border border-dashed border-[#1c1c26]/20 px-4 py-16 text-center text-sm text-[#1c1c26]/70">
          No books are available yet. Import a Gutenberg book to start your
          library.
        </p>
      ) : !isLoading && !data ? (
        <p className="rounded-md border border-dashed border-[#1c1c26]/20 px-4 py-16 text-center text-sm text-[#1c1c26]/70">
          No books are available yet. Seed the catalog to start your library.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {isLoading || !data
            ? Array.from({ length: 12 }, (_, index) => (
                <BookCardSkeleton key={index} />
              ))
            : data.data.map((book) => <BookCard key={book.id} book={book} />)}
        </div>
      )}

      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={(next) =>
            update({ page: String(next) }, { scroll: true })
          }
        />
      )}
    </div>
  );
}
