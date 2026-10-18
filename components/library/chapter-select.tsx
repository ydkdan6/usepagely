"use client";

import { useEffect, useMemo, useState } from "react";
import type { Chapter } from "@/lib/books/types";

type ChapterSelectProps = {
  bookId: string;
  value?: number;
  onSelect: (chapter: number) => void;
  showContinue?: boolean;
};
export function ChapterSelect({
  bookId,
  value,
  onSelect,
  showContinue = false,
}: ChapterSelectProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [lastChapter, setLastChapter] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  async function load(nextPage: number) {
    try {
      const response = await fetch(
        `/api/books/${bookId}/chapters?page=${nextPage}`,
        { cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "Unable to load chapters");
      setChapters((current) =>
        nextPage === 1 ? data.data : [...current, ...data.data],
      );
      setPage(nextPage);
      setTotalPages(data.totalPages ?? 1);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load chapters",
      );
    }
  }
  useEffect(() => {
    void load(1);
    if (showContinue)
      fetch("/api/history")
        .then((response) => (response.ok ? response.json() : null))
        .then((data) =>
          setLastChapter(
            data?.data?.find(
              (row: { book_id: string; last_chapter: number }) =>
                row.book_id === bookId,
            )?.last_chapter ?? null,
          ),
        );
  }, [bookId, showContinue]);
  const filtered = useMemo(
    () =>
      chapters.filter((chapter) =>
        `${chapter.chapterNumber} ${chapter.title}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [chapters, query],
  );
  return (
    <section className="mt-12" aria-labelledby="chapters-heading">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="chapters-heading" className="text-2xl font-semibold">
            Chapters
          </h2>
          {showContinue && lastChapter && (
            <button
              type="button"
              onClick={() => onSelect(lastChapter)}
              className="font-semibold text-[#0da4ed]"
            >
              Continue reading
            </button>
          )}
        </div>
        <div className="relative w-full max-w-md">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="flex w-full items-center justify-between rounded-lg border border-[#1c1c26]/15 bg-white px-4 py-3 text-left"
          >
            {value
              ? `Chapter ${value} - ${chapters.find((chapter) => chapter.chapterNumber === value)?.title ?? ""}`
              : "Select a chapter"}
          </button>
          {open && (
            <div
              role="listbox"
              className="absolute z-20 mt-2 w-full rounded-xl border border-[#1c1c26]/10 bg-white p-2 shadow-xl"
            >
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search chapters"
                aria-label="Search chapters"
                className="mb-2 w-full rounded-lg border border-[#1c1c26]/15 px-3 py-2"
              />{" "}
              <div className="max-h-72 overflow-auto">
                {filtered.map((chapter) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={chapter.chapterNumber === value}
                    key={chapter.id}
                    onClick={() => {
                      onSelect(chapter.chapterNumber);
                      setOpen(false);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left hover:bg-black/[.04]"
                  >
                    Chapter {chapter.chapterNumber} - {chapter.title}
                  </button>
                ))}
                {page < totalPages && (
                  <button
                    type="button"
                    onClick={() => void load(page + 1)}
                    className="w-full border-t border-black/10 px-3 py-2 text-sm font-semibold text-[#0da4ed]"
                  >
                    Load more
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
