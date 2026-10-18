"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Bookmark } from "lucide-react";
import type { Book } from "@/lib/books/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function BookCard({
  book,
  className,
}: {
  book: Book;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  useEffect(() => {
    fetch("/api/saved-books", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) =>
        setSaved(
          Boolean(
            data?.data?.some(
              (row: { book_id: string }) => row.book_id === book.id,
            ),
          ),
        ),
      );
  }, [book.id]);
  async function toggleSaved(event: React.MouseEvent) {
    event.preventDefault();
    const previous = saved;
    setSaved(!previous);
    const response = await fetch(`/api/saved-books/${book.id}`, {
      method: previous ? "DELETE" : "POST",
    });
    if (response.status === 401) {
      setSaved(previous);
      toast.info("Log in to save books.");
      window.location.href = `/auth/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setSaved(previous);
      const message = data.error ?? "Could not update saved books.";
      setSaveError(message);
      toast.error(message);
      window.setTimeout(() => setSaveError(""), 3500);
    } else toast.success(previous ? "Removed from Saved." : "Saved for later.");
  }

  return (
    <article className={cn("group relative flex flex-col", className)}>
      {saveError && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 rounded-xl bg-[#1c1c26] px-4 py-3 text-sm font-semibold text-white shadow-xl"
        >
          {saveError}
        </div>
      )}
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
        <button
          type="button"
          aria-label="Save for later"
          onClick={toggleSaved}
          className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow"
        >
          <Bookmark
            className={cn("size-4", saved && "fill-current text-[#0da4ed]")}
          />
        </button>
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[#1c1c26]">
            {book.title}
          </h3>
          <p className="truncate text-xs text-[#1c1c26]/70">{book.author}</p>
          <p className="text-xs text-[#1c1c26]/70">
            ★ {book.rating.toFixed(1)} ({book.ratingCount ?? 0})
          </p>
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
