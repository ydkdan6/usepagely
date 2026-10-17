"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Result = {
  id: number;
  title: string;
  authors: { name: string }[];
  formats: Record<string, string>;
};
export function GutenbergSearchResults({ query }: { query: string }) {
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/gutenberg/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((body) => setResults(body.results ?? []))
      .catch(() => undefined);
    return () => controller.abort();
  }, [query]);
  if (!results.length) return null;
  return (
    <div className="absolute left-12 right-4 top-full z-50 mt-2 max-w-lg overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl">
      {results.slice(0, 6).map((book) => (
        <button
          key={book.id}
          type="button"
          disabled={busy === book.id}
          onClick={async () => {
            setBusy(book.id);
            const response = await fetch("/api/gutenberg/import", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ gutenberg_id: book.id }),
            });
            const body = await response.json();
            if (response.ok && body.id) router.push(`/library/book/${body.id}`);
            setBusy(null);
          }}
          className="flex w-full items-center gap-3 border-b border-black/5 p-3 text-left hover:bg-black/5"
        >
          <img
            src={book.formats["image/jpeg"] ?? "/placeholder.svg"}
            alt=""
            className="size-10 rounded object-cover"
          />
          <span className="min-w-0">
            <strong className="block truncate text-sm">
              {busy === book.id ? "Importing…" : book.title}
            </strong>
            <small className="block truncate text-black/60">
              {book.authors[0]?.name ?? "Unknown author"}
            </small>
          </span>
        </button>
      ))}
    </div>
  );
}
