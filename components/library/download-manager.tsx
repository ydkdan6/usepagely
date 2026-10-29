"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Book, Chapter } from "@/lib/books/types";
import {
  getOfflineBook,
  saveOfflineBook,
  removeOfflineBook,
  persistOfflineStorage,
} from "@/lib/offline-db";
import { toast } from "sonner";

type DownloadItem = {
  book: Book;
  done: number;
  total: number;
  status: "active" | "paused" | "finished" | "error";
  error?: string;
};
type DownloadContextValue = {
  downloads: DownloadItem[];
  start: (book: Book) => void;
  pause: (bookId: string) => void;
  resume: (bookId: string) => void;
  cancel: (bookId: string) => void;
};
const DownloadContext = createContext<DownloadContextValue | null>(null);

export function DownloadManagerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const paused = useRef(new Set<string>());
  const cancelled = useRef(new Set<string>());
  const running = useRef(new Set<string>());

  useEffect(() => {
    const saved = sessionStorage.getItem("usepagely-downloads");
    if (saved) setDownloads(JSON.parse(saved));
  }, []);
  useEffect(() => {
    sessionStorage.setItem("usepagely-downloads", JSON.stringify(downloads));
  }, [downloads]);
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (downloads.some((item) => item.status === "active")) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [downloads]);

  async function start(book: Book) {
    await persistOfflineStorage();
    if (running.current.has(book.id)) return;
    running.current.add(book.id);
    paused.current.delete(book.id);
    cancelled.current.delete(book.id);
    const cached = await getOfflineBook(String(book.id));
    const savedChapterNumbers = new Set(
      cached?.chapters.map((chapter) => chapter.chapterNumber) ?? [],
    );
    const initial = savedChapterNumbers.size;
    setDownloads((current) => [
      ...current.filter((item) => item.book.id !== book.id),
      { book, done: initial, total: 0, status: "active" },
    ]);
    try {
      const titleResponse = await fetch(
        `/api/books/${book.id}/chapters?page=1`,
      );
      const titleData = await titleResponse.json();
      const total = titleData.total ?? 0;
      setDownloads((current) =>
        current.map((item) =>
          item.book.id === book.id ? { ...item, total } : item,
        ),
      );
      let done = initial;
      for (let startAt = 1; startAt <= total; startAt += 10) {
        while (paused.current.has(book.id) && !cancelled.current.has(book.id))
          await new Promise((resolve) => setTimeout(resolve, 250));
        if (cancelled.current.has(book.id)) return;
        const numbers = Array.from(
          { length: Math.min(10, total - startAt + 1) },
          (_, index) => startAt + index,
        ).filter((number) => !savedChapterNumbers.has(number));
        const chapters = await Promise.all(
          numbers.map(async (number) => {
            const response = await fetch(
              `/api/books/${book.id}/chapters/${number}`,
            );
            if (!response.ok)
              throw new Error(`Chapter ${number} could not be downloaded`);
            return (await response.json()).data as Chapter;
          }),
        );
        if (chapters.length > 0) {
          await saveOfflineBook(book, chapters);
          chapters.forEach((chapter) => savedChapterNumbers.add(chapter.chapterNumber));
          done = savedChapterNumbers.size;
        }
        setDownloads((current) =>
          current.map((item) =>
            item.book.id === book.id
              ? { ...item, done: Math.max(item.done, done), status: "active" }
              : item,
          ),
        );
      }
      if (!cancelled.current.has(book.id)) {
        const response = await fetch("/api/downloads", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ bookId: book.id }),
        });
        if (!response.ok) throw new Error("Could not save download status");
        setDownloads((current) =>
          current.map((item) =>
            item.book.id === book.id
              ? { ...item, done: total, status: "finished" }
              : item,
          ),
        );
        toast.success(`${book.title} is ready offline.`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Download failed";
      setDownloads((current) =>
        current.map((item) =>
          item.book.id === book.id
            ? { ...item, status: "error", error: message }
            : item,
        ),
      );
      toast.error(message);
    } finally {
      running.current.delete(book.id);
    }
  }
  const value = useMemo(
    () => ({
      downloads,
      start,
      pause: (id: string) => {
        paused.current.add(id);
        setDownloads((current) =>
          current.map((item) =>
            item.book.id === id ? { ...item, status: "paused" } : item,
          ),
        );
        toast.info("Download paused.");
      },
      resume: (id: string) => {
        paused.current.delete(id);
        setDownloads((current) =>
          current.map((item) =>
            item.book.id === id ? { ...item, status: "active" } : item,
          ),
        );
      },
      cancel: async (id: string) => {
        cancelled.current.add(id);
        paused.current.delete(id);
        await removeOfflineBook(id);
        setDownloads((current) =>
          current.filter((item) => item.book.id !== id),
        );
        toast.info("Download canceled.");
      },
    }),
    [downloads],
  );
  return (
    <DownloadContext.Provider value={value}>
      {children}
    </DownloadContext.Provider>
  );
}
export function useDownloadManager() {
  const value = useContext(DownloadContext);
  if (!value)
    throw new Error(
      "useDownloadManager must be used inside DownloadManagerProvider",
    );
  return value;
}
