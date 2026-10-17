"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import type { Book } from "@/lib/books/types";
import { cn } from "@/lib/utils";

export function BookCard({
  book,
  className,
}: {
  book: Book;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <article className={cn("group flex flex-col", className)}>
      <Link
        href={`/library/book/${book.id}`}
        className="flex flex-col gap-3 rounded-md outline-offset-4"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-[#e4dfd0] shadow-sm transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
          {failed ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-[#1c1c26]/70">
              <BookOpen className="size-6" aria-hidden="true" />
              <span className="line-clamp-3 text-xs font-semibold">
                {book.title}
              </span>
            </div>
          ) : (
            <img
              src={book.coverUrl}
              alt={`Cover of ${book.title}`}
              loading="lazy"
              onError={() => setFailed(true)}
              className="size-full object-cover"
            />
          )}
          {book.isExclusive && (
            <span className="absolute top-2 left-2 rounded-sm bg-[#f15a3a] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
              Exclusive
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[#1c1c26]">
            {book.title}
          </h3>
          <p className="truncate text-xs text-[#1c1c26]/70">{book.author}</p>
        </div>
      </Link>
    </article>
  );
}

export function BookCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)} aria-hidden="true">
      <div className="aspect-[2/3] w-full animate-pulse rounded-md bg-[#1c1c26]/10" />
      <div className="h-3 w-4/5 animate-pulse rounded bg-[#1c1c26]/10" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-[#1c1c26]/10" />
    </div>
  );
}
