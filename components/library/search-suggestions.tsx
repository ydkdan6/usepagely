"use client";

import { useEffect, useRef, useState } from "react";

export function SearchSuggestions({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (value: string) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [active, setActive] = useState(-1);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setData(null);
      setActive(-1);
      return;
    }
    const timer = setTimeout(async () => {
      controller.current?.abort();
      controller.current = new AbortController();
      try {
        const response = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(value)}`,
          { signal: controller.current.signal },
        );
        setData(await response.json());
      } catch (error) {
        if ((error as Error).name !== "AbortError")
          setData({ library: [], gutenberg: [], noResults: true });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);
  const items = [
    ...(data?.library ?? []),
    ...(data?.gutenberg ?? []),
    ...(data?.didYouMean ?? []),
  ];
  if (!data || query.trim().length < 2) return null;
  return (
    <div
      className="absolute left-12 right-20 top-16 z-30 overflow-hidden rounded-2xl border border-[#1c1c26]/10 bg-white p-2 text-[#1c1c26] shadow-xl dark:border-white/10 dark:bg-[#1c1c26] dark:text-white"
      onKeyDown={(event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setActive((index) => Math.min(index + 1, items.length - 1));
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setActive((index) => Math.max(index - 1, 0));
        }
        if (event.key === "Escape") setData(null);
        if (event.key === "Enter" && items[active])
          onSelect(items[active].title);
      }}
      tabIndex={0}
    >
      {data.library?.length > 0 && (
        <section>
          <p className="px-3 py-2 text-xs font-bold uppercase opacity-60">
            In your library
          </p>
          {data.library.map((book: any, index: number) => (
            <button
              key={book.id}
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${active === index ? "bg-black/10 dark:bg-white/10" : ""}`}
              onClick={() => onSelect(book.title)}
            >
              {book.title}
              <span className="block text-xs opacity-60">
                {Array.isArray(book.authors)
                  ? book.authors.join(", ")
                  : book.authors}
              </span>
            </button>
          ))}
        </section>
      )}
      {data.gutenberg?.length > 0 && (
        <section>
          <p className="px-3 py-2 text-xs font-bold uppercase opacity-60">
            From Gutenberg
          </p>
          {data.gutenberg.map((book: any, index: number) => (
            <button
              key={book.id}
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${active === (data.library?.length ?? 0) + index ? "bg-black/10 dark:bg-white/10" : ""}`}
              onClick={() => onSelect(book.title)}
            >
              {book.title}
            </button>
          ))}
        </section>
      )}
      {data.didYouMean?.length > 0 && (
        <section>
          <p className="px-3 py-2 text-xs font-bold uppercase opacity-60">
            Did you mean...
          </p>
          {data.didYouMean.map((book: any, index: number) => (
            <button
              key={book.id}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm"
              onClick={() => onSelect(book.title)}
            >
              {book.title}
            </button>
          ))}
        </section>
      )}
      {/* {items.length === 0 && (
        <p className="px-3 py-4 text-sm">
          No books found. Check the spelling or try the author&apos;s name
        </p>
      )} */}
    </div>
  );
}
