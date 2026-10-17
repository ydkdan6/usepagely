"use client";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowLeftCircle,
  ArrowRightCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Menu,
  Settings2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Book, Chapter } from "@/lib/books/types";
import { getOfflineBook, saveProgress } from "@/lib/offline-db";

const PAGE_SIZE = 20;
type ChapterItem = Chapter & { content?: string };

async function getJson(url: string) {
  const res = await fetch(url);
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error ?? `Request failed (${res.status})`);
  return json;
}

export function Reader({ book }: { book: Book }) {
  const searchParams = useSearchParams();
  const initial = Math.max(1, Number(searchParams.get("chapter") ?? 1) || 1);
  const [chapter, setChapter] = useState(initial);
  const [listPage, setListPage] = useState(Math.ceil(initial / PAGE_SIZE));
  const [list, setList] = useState<ChapterItem[]>([]);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState<ChapterItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [jump, setJump] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const lastChapter = Math.max(total, 1);

  function goTo(n: number) {
    const next = Math.min(lastChapter, Math.max(1, n));
    setChapter(next);
    setListPage(Math.ceil(next / PAGE_SIZE));
  }

  // Chapter list (one page at a time)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const json = await getJson(
          `/api/books/${book.id}/chapters?page=${listPage}`,
        );
        if (cancelled) return;
        setList(json.data ?? []);
        setTotal(json.total ?? 0);
        setOffline(false);
      } catch (err) {
        const cached = await getOfflineBook(book.id);
        if (cancelled) return;
        if (cached) {
          const all = cached.chapters as ChapterItem[];
          setList(all.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE));
          setTotal(all.length);
          setOffline(true);
        } else {
          setError(
            err instanceof Error ? err.message : "Could not load chapters",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [book.id, listPage, reloadKey]);

  // Open chapter content
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const json = await getJson(`/api/books/${book.id}/chapters/${chapter}`);
        if (cancelled) return;
        if (!json.data) throw new Error("Chapter not found");
        setCurrent(json.data);
      } catch (err) {
        const cached = await getOfflineBook(book.id);
        if (cancelled) return;
        const hit = (cached?.chapters as ChapterItem[] | undefined)?.find(
          (c) => c.chapterNumber === chapter,
        );
        if (hit) {
          setCurrent(hit);
          setOffline(true);
        } else {
          setCurrent(null);
          setError(
            err instanceof Error ? err.message : "Could not load chapter",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    window.scrollTo({ top: 0 });
    return () => {
      cancelled = true;
    };
  }, [book.id, chapter, reloadKey]);

  // Save progress when the chapter changes
  useEffect(() => {
    const progress = total ? ((chapter - 1) / total) * 100 : 0;
    void saveProgress(book.id, chapter);
    void fetch("/api/history", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bookId: book.id, chapter, progress }),
    });
  }, [book.id, chapter, total]);

  // Save progress while scrolling (debounced)
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

  return (
    <main className="min-h-svh bg-[#f7f6f2] pb-20 text-[#1c1c26] md:pb-0">
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
                {current?.title ??
                  (loading ? "Loading chapter…" : "Chapter unavailable")}
              </h1>
            </div>

            {error && !loading ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                <p>{error}</p>
                <button
                  onClick={() => setReloadKey((k) => k + 1)}
                  className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-white"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-lg leading-8">
                {loading ? "Loading…" : (current?.content ?? "")}
              </div>
            )}

            <div className="mt-12 flex items-center justify-between">
              <button
                onClick={() => goTo(chapter - 1)}
                disabled={chapter <= 1}
                aria-label="Previous chapter"
                className="rounded-full p-3 hover:bg-black/5 disabled:opacity-30"
              >
                <ArrowLeftCircle className="size-9" />
              </button>
              <span className="font-semibold">
                {chapter}/{lastChapter}
              </span>
              <button
                onClick={() => goTo(chapter + 1)}
                disabled={chapter >= lastChapter}
                aria-label="Next chapter"
                className="rounded-full p-3 hover:bg-black/5 disabled:opacity-30"
              >
                <ArrowRightCircle className="size-9" />
              </button>
            </div>
          </div>
        </article>

        <aside className="rounded-2xl border border-black/10 bg-white/55 p-5 lg:sticky lg:top-24 lg:h-fit">
          <h2 className="mb-4 font-bold">Chapters</h2>

          <form
            className="mb-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(jump);
              if (n) goTo(n);
              setJump("");
            }}
          >
            <input
              value={jump}
              onChange={(e) => setJump(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder={`Go to 1–${lastChapter}`}
              className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
            />
            <button className="rounded-lg bg-[#1c1c26] px-3 py-2 text-sm text-white">
              Go
            </button>
          </form>

          <div className="max-h-96 space-y-1 overflow-y-auto">
            {list.map((item) => (
              <button
                key={item.id}
                onClick={() => goTo(item.chapterNumber)}
                className={`w-full rounded-xl px-3 py-3 text-left text-sm transition ${chapter === item.chapterNumber ? "bg-[#ff6868] font-semibold text-white" : "hover:bg-black/5"}`}
              >
                {item.title}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              onClick={() => setListPage((p) => Math.max(1, p - 1))}
              disabled={listPage <= 1}
              aria-label="Previous page"
              className="rounded-lg p-2 hover:bg-black/5 disabled:opacity-30"
            >
              <ChevronLeft className="size-5" />
            </button>
            <span>
              Page {listPage} of {totalPages}
            </span>
            <button
              onClick={() => setListPage((p) => Math.min(totalPages, p + 1))}
              disabled={listPage >= totalPages}
              aria-label="Next page"
              className="rounded-lg p-2 hover:bg-black/5 disabled:opacity-30"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
