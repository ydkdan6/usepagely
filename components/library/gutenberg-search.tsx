"use client";
import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";

type Result = {
  id: number;
  title: string;
  authors?: { name: string }[];
  cover_url?: string;
  alreadyImported?: boolean;
};
export function GutenbergSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/gutenberg/search?q=${encodeURIComponent(query)}`,
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Search failed");
      setResults(data.results ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }
  async function add(id: number) {
    setAdding(id);
    try {
      const response = await fetch("/api/gutenberg/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gutenberg_id: id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Import failed");
      setResults((items) =>
        items.map((item) =>
          item.id === id ? { ...item, alreadyImported: true } : item,
        ),
      );
      toast.success("Book added to your library.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setAdding(null);
    }
  }
  return (
    <section className="rounded-3xl border border-border bg-card p-5 text-card-foreground">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Find a book</h2>
        <p className="text-sm text-muted-foreground">
          Search Gutenberg and add books to your library.
        </p>
      </div>
      <form onSubmit={search} className="flex gap-2">
        <label className="sr-only" htmlFor="gutenberg-search">
          Search Gutenberg
        </label>
        <input
          id="gutenberg-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title or author"
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground"
        >
          <Search className="size-4" />
          Search
        </button>
      </form>
      <div className="mt-4 grid gap-3">
        {results.map((book) => (
          <div
            key={book.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{book.title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {book.authors?.map((author) => author.name).join(", ") ||
                  "Unknown author"}
              </p>
            </div>
            <button
              type="button"
              disabled={book.alreadyImported || adding === book.id}
              onClick={() => add(book.id)}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              <Plus className="size-4" />
              {book.alreadyImported
                ? "Added"
                : adding === book.id
                  ? "Adding…"
                  : "Add to library"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
