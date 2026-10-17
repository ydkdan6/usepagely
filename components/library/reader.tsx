"use client";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowLeftCircle,
  ArrowRightCircle,
  Bookmark,
  Menu,
  Settings2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Book, Chapter } from "@/lib/books/types";
import { getOfflineBook, saveProgress } from "@/lib/offline-db";

export function Reader({ book }: { book: Book }) {
  const [chapter, setChapter] = useState(1);
  const [bookmarked, setBookmarked] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await getOfflineBook(book.id);
      if (typeof navigator !== "undefined" && !navigator.onLine && cached) {
        if (!cancelled) {
          setChapters(cached.chapters);
          setOffline(true);
        }
        return;
      }
      try {
        const response = await fetch(`/api/books/${book.id}`);
        const data = await response.json();
        if (!cancelled) setChapters(data.chapters ?? []);
      } catch {
        if (cached && !cancelled) {
          setChapters(cached.chapters);
          setOffline(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [book.id]);
  const current = useMemo(
    () =>
      chapters.find((item) => item.chapterNumber === chapter) ??
      chapters[chapter - 1],
    [chapters, chapter],
  );
  useEffect(() => {
    void saveProgress(book.id, chapter);
  }, [book.id, chapter]);
  return (
    <main className="min-h-svh bg-[#f7f6f2] text-[#1c1c26]">
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
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <p className="text-sm font-medium uppercase tracking-[.2em] text-[#ff6868]">
                Chapter {chapter}
              </p>
              <h1 className="mt-3 text-3xl font-bold md:text-5xl">
                {current?.title ?? "Loading chapter…"}
              </h1>
            </div>
            <div className="whitespace-pre-wrap text-lg leading-8">
              {current?.content ?? "This chapter is not available yet."}
            </div>
            <div className="mt-12 flex items-center justify-between">
              <button
                onClick={() => setChapter(Math.max(1, chapter - 1))}
                className="rounded-full p-3 hover:bg-black/5"
              >
                <ArrowLeftCircle className="size-9" />
              </button>
              <span className="font-semibold">
                {chapter}/{Math.max(chapters.length, 1)}
              </span>
              <button
                onClick={() =>
                  setChapter(
                    Math.min(Math.max(chapters.length, 1), chapter + 1),
                  )
                }
                className="rounded-full p-3 hover:bg-black/5"
              >
                <ArrowRightCircle className="size-9" />
              </button>
            </div>
          </div>
        </article>
        <aside className="rounded-2xl border border-black/10 bg-white/55 p-5 lg:sticky lg:top-24 lg:h-fit">
          <h2 className="mb-4 font-bold">Chapters</h2>
          <div className="space-y-1">
            {chapters.map((item) => (
              <button
                key={item.id}
                onClick={() => setChapter(item.chapterNumber)}
                className={`w-full rounded-xl px-3 py-3 text-left text-sm transition ${chapter === item.chapterNumber ? "bg-[#ff6868] font-semibold text-white" : "hover:bg-black/5"}`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
