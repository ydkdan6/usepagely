"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
export function SavedScreen() {
  const [rows, setRows] = useState<any[]>([]);
  const [loggedOut, setLoggedOut] = useState(false);
  const [loading, setLoading] = useState(true);
  async function load() {
    const r = await fetch("/api/saved-books", { cache: "no-store" });
    if (r.status === 401) setLoggedOut(true);
    else {
      const d = await r.json();
      setRows(d.data ?? []);
    }
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);
  if (loggedOut)
    return (
      <p className="rounded-3xl border border-black/10 bg-white/60 p-10 text-center">
        Log in to see your saved books.
      </p>
    );
  if (loading) return <p>Loading...</p>;
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-[.2em] text-[#ff6868]">
          Your library
        </p>
        <h1 className="mt-2 text-4xl font-bold">Saved</h1>
      </div>
      {!rows.length ? (
        <p className="rounded-3xl border border-black/10 bg-white/60 p-10 text-center">
          No saved books yet
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {rows.map(({ book_id, books }) => (
            <Link
              key={book_id}
              href={`/library/book/${book_id}`}
              className="flex gap-4 rounded-3xl border border-black/10 bg-white/60 p-4"
            >
              <img
                src={books.cover_url}
                alt={`${books.title} cover`}
                className="h-32 w-20 rounded-xl object-cover"
              />
              <div>
                <h2 className="font-bold">{books.title}</h2>
                <p className="text-sm text-black/55">
                  {books.authors?.[0] ?? "Unknown author"}
                </p>
                <BookOpen className="mt-5 size-5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
