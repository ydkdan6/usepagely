"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Highlighter,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

type Highlight = {
  id: string;
  quote: string;
  note?: string | null;
  color?: string | null;
  chapter_title?: string | null;
  created_at: string;
  book?: {
    id: string;
    title: string;
    author?: string | null;
    cover_url?: string | null;
  } | null;
};

const colors = ["all", "yellow", "blue", "green", "pink"];

export function HighlightsScreen() {
  const [items, setItems] = useState<Highlight[]>([]);
  const [query, setQuery] = useState("");
  const [color, setColor] = useState("all");
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(20);

  useEffect(() => {
    fetch("/api/highlights")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error ?? "Could not load highlights");
        return body.data ?? [];
      })
      .then(setItems)
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (!query ||
            `${item.quote} ${item.note ?? ""}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (color === "all" || item.color === color),
      ),
    [items, query, color],
  );
  const groups = useMemo(
    () =>
      Object.values(
        filtered
          .slice(0, visible)
          .reduce<
            Record<string, { book: Highlight["book"]; items: Highlight[] }>
          >((result, item) => {
            const key = item.book?.id ?? "unknown";
            result[key] ??= { book: item.book, items: [] };
            result[key].items.push(item);
            return result;
          }, {}),
      ),
    [filtered, visible],
  );

  async function remove(item: Highlight) {
    const previous = items;
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    const response = await fetch(`/api/highlights/${item.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setItems(previous);
      toast.error(
        (await response.json().catch(() => ({}))).error ??
          "Could not delete highlight",
      );
      return;
    }
    toast.success("Highlight deleted.", {
      action: {
        label: "Undo",
        onClick: async () => {
          await fetch(`/api/highlights/${item.id}`, {
            method: "POST",
            body: JSON.stringify(item),
            headers: { "Content-Type": "application/json" },
          });
          setItems((current) => [item, ...current]);
          toast.success("Highlight restored.");
        },
      },
    });
  }

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Your reading notes
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Highlights</h1>
          <p className="mt-2 text-muted-foreground">
            A quiet place for the passages worth keeping.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <label className="flex min-w-56 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm">
            <Search className="size-4 text-muted-foreground" />
            <span className="sr-only">Search highlights</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisible(20);
              }}
              placeholder="Search highlights"
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </label>
          <select
            aria-label="Filter by highlight color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="select-control rounded-xl border border-border bg-card px-3 py-2 pr-9 text-sm shadow-sm outline-none transition focus:border-[#0799ea] focus:ring-2 focus:ring-[#0799ea]/15"
          >
            <option value="all">All colors</option>
            {colors.slice(1).map((value) => (
              <option key={value} value={value}>
                {value[0].toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </header>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-40 animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <Highlighter className="mx-auto mb-4 size-8 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No highlights yet.</h2>
          <p className="mt-2 text-muted-foreground">
            Select text while reading to save it.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(({ book, items: group }) => (
            <section key={book?.id ?? "unknown"} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-12 overflow-hidden rounded-lg bg-muted">
                  {book?.cover_url && (
                    <img
                      src={book.cover_url}
                      alt=""
                      className="size-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold">
                    {book?.title ?? "Untitled book"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {book?.author ?? "Unknown author"} · {group.length}{" "}
                    {group.length === 1 ? "highlight" : "highlights"}
                  </p>
                </div>
              </div>
              {group.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <blockquote
                    className={`border-l-4 pl-4 text-lg leading-8 ${item.color === "blue" ? "border-blue-400" : item.color === "green" ? "border-green-400" : item.color === "pink" ? "border-pink-400" : "border-yellow-400"}`}
                  >
                    “{item.quote}”
                  </blockquote>
                  {item.note && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {item.note}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>
                      {item.chapter_title ?? "Chapter"} ·{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                      }).format(new Date(item.created_at))}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(item.quote);
                          toast.success("Quote copied.");
                        }}
                        className="rounded-lg p-2 hover:bg-accent"
                        aria-label="Copy quote"
                      >
                        <Copy className="size-4" />
                      </button>
                      <button
                        onClick={() => remove(item)}
                        className="rounded-lg p-2 hover:bg-accent"
                        aria-label="Delete highlight"
                      >
                        <Trash2 className="size-4" />
                      </button>
                      <button
                        className="rounded-lg p-2 hover:bg-accent"
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          ))}
        </div>
      )}
      {visible < filtered.length && (
        <button
          onClick={() => setVisible((current) => current + 20)}
          className="mx-auto block rounded-xl border border-border px-5 py-2 text-sm font-medium hover:bg-accent"
        >
          Load more
        </button>
      )}
    </section>
  );
}
