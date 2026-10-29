"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Suggestion = {
  id: string | number;
  title: string;
  authors?: string[] | string;
};

type SuggestData = {
  library?: Suggestion[];
  gutenberg?: Suggestion[];
  didYouMean?: Suggestion[];
  noResults?: boolean;
};

const SECTIONS = [
  { key: "library", label: "In your library" },
  { key: "gutenberg", label: "From Gutenberg" },
  { key: "didYouMean", label: "Did you mean..." },
] as const;

export function SearchSuggestions({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (value: string) => void;
}) {
  const [data, setData] = useState<SuggestData | null>(null);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(true);
  const suppressed = useRef<string | null>(null);

  // Fetch suggestions (debounced, previous request aborted on every change)
  useEffect(() => {
    const value = query.trim();
    if (value.length < 2 || suppressed.current === value) {
      setData(null);
      setActive(-1);
      return;
    }
    suppressed.current = null;
    setOpen(true);

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(value)}`,
          { signal: controller.signal },
        );
        if (!response.ok)
          throw new Error(`Suggest failed (${response.status})`);
        setData(await response.json());
        setActive(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError")
          setData({ noResults: true });
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // One flat list so keyboard index matches what's on screen
  const items = useMemo(
    () => SECTIONS.flatMap(({ key }) => data?.[key] ?? []),
    [data],
  );

  const select = useCallback(
    (title: string) => {
      suppressed.current = title.trim(); // stop the dropdown reopening for this text
      setData(null);
      setActive(-1);
      onSelect(title);
    },
    [onSelect],
  );

  const visible = open && !!data && query.trim().length >= 2;

  // Keyboard handling: focus lives in the search input, so listen on window
  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" && items.length) {
        event.preventDefault();
        setActive((i) => (i + 1) % items.length);
      } else if (event.key === "ArrowUp" && items.length) {
        event.preventDefault();
        setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
      } else if (event.key === "Escape") {
        setOpen(false);
      } else if (event.key === "Enter" && items[active]) {
        event.preventDefault(); // don't submit the form with the partial query
        select(items[active].title);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, items, active, select]);

  useEffect(() => {
    if (active >= 0)
      document
        .getElementById(`suggestion-${active}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!visible || !data) return null;

  let offset = 0;
  return (
    <div
      role="listbox"
      // keep focus in the input so clicking a suggestion isn't lost to a blur
      onMouseDown={(event) => event.preventDefault()}
      className="absolute left-12 right-20 top-16 z-30 max-h-80 overflow-y-auto rounded-2xl border bg-transparent p-2 text-[#1c1c26]  dark:border-white/10 dark:bg-[#1c1c26] dark:text-white"
    >
      {SECTIONS.map(({ key, label }) => {
        const list = data[key] ?? [];
        const start = offset;
        offset += list.length;
        if (!list.length) return null;
        return (
          <section key={key}>
            <p className="px-3 py-2 text-xs font-bold uppercase opacity-60">
              {label}
            </p>
            {list.map((book, i) => {
              const index = start + i;
              return (
                <button
                  key={`${key}-${book.id}`}
                  id={`suggestion-${index}`}
                  role="option"
                  aria-selected={active === index}
                  type="button"
                  className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${
                    active === index ? "bg-black/10 dark:bg-white/10" : ""
                  }`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => select(book.title)}
                >
                  {book.title}
                  {book.authors && (
                    <span className="block text-xs opacity-60">
                      {Array.isArray(book.authors)
                        ? book.authors.join(", ")
                        : book.authors}
                    </span>
                  )}
                </button>
              );
            })}
          </section>
        );
      })}
      {/* {items.length === 0 && (
        <p className="px-3 py-4 text-sm">
          No books found. Check the spelling or try the author&apos;s name.
        </p>
      )} */}
    </div>
  );
}
