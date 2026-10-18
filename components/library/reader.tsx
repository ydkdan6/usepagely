"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowLeftCircle,
  ArrowRightCircle,
  Bookmark,
  Menu,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Book, Chapter } from "@/lib/books/types";
import {
  getOfflineBook,
  getOfflineChapter,
  saveProgress,
} from "@/lib/offline-db";
import { ChapterSelect } from "@/components/library/chapter-select";
import { WordLookup } from "@/components/library/word-lookup";
import { ReadingActivityTracker } from "@/components/library/reading-activity-tracker";
import { HighlightSelection } from "@/components/library/highlight-selection";

type ChapterListResponse = { data?: Chapter[]; total?: number; error?: string };
type ChapterResponse = { data?: Chapter; error?: string };

export function Reader({ book }: { book: Book }) {
  const searchParams = useSearchParams();
  const initialChapter = Math.max(1, Number(searchParams.get("chapter") ?? 1));
  const [chapter, setChapter] = useState(initialChapter);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [totalChapters, setTotalChapters] = useState(0);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [fontSize, setFontSize] = useState(18);

  const loadChapter = useCallback(async () => {
    setError("");
    const cached = await getOfflineBook(book.id);
    if (typeof navigator !== "undefined" && !navigator.onLine && cached) {
      const cachedChapter = await getOfflineChapter(book.id, chapter);
      if (!cachedChapter) {
        setError("This chapter is not available offline.");
        return;
      }
      setChapters(cached.chapters);
      setTotalChapters(cached.chapters.length);
      setOffline(true);
      return;
    }
    try {
      const [chapterResponse, listResponse] = await Promise.all([
        fetch(`/api/books/${book.id}/chapters/${chapter}`, {
          cache: "no-store",
        }),
        fetch(`/api/books/${book.id}/chapters?page=1`, { cache: "no-store" }),
      ]);
      const chapterData = (await chapterResponse.json()) as ChapterResponse;
      const listData = (await listResponse.json()) as ChapterListResponse;
      if (!chapterResponse.ok)
        throw new Error(
          chapterData.error ??
            `Unable to load chapter (${chapterResponse.status})`,
        );
      if (!listResponse.ok)
        throw new Error(
          listData.error ??
            `Unable to load chapter list (${listResponse.status})`,
        );
      if (!chapterData.data) throw new Error("Chapter content is unavailable.");
      setChapters((current) =>
        [
          ...current.filter((item) => item.chapterNumber !== chapter),
          chapterData.data!,
          ...(listData.data ?? []),
        ]
          .filter(
            (item, index, all) =>
              all.findIndex(
                (candidate) => candidate.chapterNumber === item.chapterNumber,
              ) === index,
          )
          .sort((a, b) => a.chapterNumber - b.chapterNumber),
      );
      setTotalChapters(listData.total ?? 0);
      setOffline(false);
    } catch (cause) {
      if (cached) {
        const cachedChapter = await getOfflineChapter(book.id, chapter);
        if (cachedChapter) {
          setChapters(cached.chapters);
          setTotalChapters(cached.chapters.length);
          setOffline(true);
          return;
        }
      }
      setError(
        cause instanceof Error ? cause.message : "Unable to load chapter.",
      );
    }
  }, [book.id, chapter]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    void loadChapter();
  }, [loadChapter]);
  const current = useMemo(
    () => chapters.find((item) => item.chapterNumber === chapter),
    [chapters, chapter],
  );
  useEffect(() => {
    if (!current) return;
    const progress = totalChapters ? ((chapter - 1) / totalChapters) * 100 : 0;
    void saveProgress(book.id, chapter);
    void fetch("/api/history", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bookId: book.id, chapter, progress }),
    });
  }, [book.id, chapter, current, totalChapters]);
  useEffect(() => {
    let timer: number | undefined;
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const progress = Math.min(
          100,
          Math.max(
            0,
            (window.scrollY /
              Math.max(
                1,
                document.documentElement.scrollHeight - window.innerHeight,
              )) *
              100,
          ),
        );
        void fetch("/api/history", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ bookId: book.id, chapter, progress }),
        });
      }, 5000);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, [book.id, chapter]);

  const total = totalChapters || chapters.length;
  return (
    <WordLookup bookId={book.id}>
      <ReadingActivityTracker />
      <HighlightSelection
        bookId={book.id}
        chapterNumber={chapter}
        chapterName={current?.title ?? ""}
      >
        <main className="min-h-svh bg-[#f7f6f2] pb-20 text-[#1c1c26] [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_img]:object-contain">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#1c1c26]/10 bg-[#f7f6f2]/90 px-5 py-4 backdrop-blur md:px-10">
            <Link
              href={`/library/book/${book.id}`}
              className="flex items-center gap-3 font-semibold"
            >
              <ArrowLeft className="size-6" />
              <span className="max-w-[240px] truncate">{book.title}</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-black/50 sm:inline">
                {offline ? "Offline" : "Synced"}
              </span>
              <button
                onClick={() => setBookmarked(!bookmarked)}
                aria-label="Save bookmark"
                className={
                  bookmarked
                    ? "rounded-xl bg-[#ff6868] p-3 text-white"
                    : "rounded-xl p-3 hover:bg-black/5"
                }
              >
                <Bookmark
                  className="size-5"
                  fill={bookmarked ? "currentColor" : "none"}
                />
              </button>
              <label
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                htmlFor="reader-font-size"
              >
                <span className="sr-only">Font size</span>
                <span aria-hidden="true">A</span>
                <input
                  id="reader-font-size"
                  type="range"
                  min="16"
                  max="24"
                  step="1"
                  value={fontSize}
                  onChange={(event) => setFontSize(Number(event.target.value))}
                  className="w-20"
                />
                <span aria-hidden="true" className="text-lg">
                  A
                </span>
              </label>
              <button className="rounded-xl p-3 hover:bg-black/5">
                <Settings2 className="size-5" />
              </button>
              <button className="rounded-xl p-3 hover:bg-black/5">
                <Menu className="size-5" />
              </button>
            </div>
          </header>
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-8 lg:grid-cols-[1fr_280px] lg:px-10">
            <article className="min-w-0">
              <div className="mx-auto w-full max-w-[1100px] px-1 sm:px-4">
                <div className="mb-12 text-center">
                  <p className="text-sm font-medium uppercase tracking-[.2em] text-[#ff6868]">
                    Chapter {chapter}
                  </p>
                  <h1 className="mt-3 text-3xl font-bold md:text-5xl">
                    {current?.title ??
                      (error ? "Unable to load chapter" : "Loading chapter…")}
                  </h1>
                </div>
                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
                    <p>{error}</p>
                    <button
                      type="button"
                      onClick={() => void loadChapter()}
                      className="mt-3 inline-flex items-center gap-2 font-semibold underline"
                    >
                      <RefreshCw className="size-4" />
                      Retry
                    </button>
                  </div>
                ) : (
                  <div
                    className="prose mx-auto max-w-[72ch] leading-8"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {current?.htmlContent ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: current.htmlContent,
                        }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {current?.htmlContent ??
                          current?.content ??
                          "Loading chapter…"}
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-12 flex items-center justify-between">
                  <button
                    disabled={chapter <= 1}
                    onClick={() =>
                      setChapter((value) => Math.max(1, value - 1))
                    }
                    className="rounded-full p-3 hover:bg-black/5 disabled:opacity-30"
                    aria-label="Previous chapter"
                  >
                    <ArrowLeftCircle className="size-9" />
                  </button>
                  <span className="font-semibold">
                    {chapter}/{Math.max(total, 1)}
                  </span>
                  <button
                    disabled={!total || chapter >= total}
                    onClick={() =>
                      setChapter((value) => Math.min(total, value + 1))
                    }
                    className="rounded-full p-3 hover:bg-black/5 disabled:opacity-30"
                    aria-label="Next chapter"
                  >
                    <ArrowRightCircle className="size-9" />
                  </button>
                </div>
              </div>
            </article>
            <ChapterSelect
              bookId={book.id}
              value={chapter}
              onSelect={(nextChapter) => {
                window.history.pushState(
                  null,
                  "",
                  `/library/read/${book.id}?chapter=${nextChapter}`,
                );
                setChapter(nextChapter);
              }}
            />
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={chapter <= 1}
                onClick={() =>
                  setChapter((currentChapter) =>
                    Math.max(1, currentChapter - 1),
                  )
                }
                className="rounded-xl border px-4 py-2 disabled:opacity-40"
              >
                Previous chapter
              </button>
              <button
                type="button"
                disabled={total <= chapter}
                onClick={() =>
                  setChapter((currentChapter) =>
                    Math.min(total, currentChapter + 1),
                  )
                }
                className="rounded-xl border px-4 py-2 disabled:opacity-40"
              >
                Next chapter
              </button>
            </div>
          </div>
        </main>
      </HighlightSelection>
    </WordLookup>
  );
}
