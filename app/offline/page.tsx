"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getOfflineBooks } from "@/lib/offline-db";
export default function OfflinePage() {
  const [books, setBooks] = useState<any[]>([]);

  useEffect(() => {
  getOfflineBooks()
    .then(setBooks)
    .catch((e) => console.error("offline read failed", e));
}, []);

  useEffect(() => {
    getOfflineBooks().then(setBooks);
  }, []);
  return (
    <main className="min-h-svh bg-[#f7f6f2] px-5 py-10 text-[#1c1c26]">
      <h1 className="text-3xl font-bold">Downloaded books</h1>
      <p className="mt-2 text-muted-foreground">Available to read offline.</p>
      <div className="mt-8 grid gap-4">
        {books.map(({ book }) => (
          <a
            key={book.id}
            href={`/library/read/${book.id}`}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <strong>{book.title}</strong>
            <span className="mt-1 block text-sm text-muted-foreground">
              {book.author}
            </span>
          </a>
        ))}
        {!books.length && (
          <p className="rounded-2xl border border-border bg-card p-5">
            No downloaded books yet.
          </p>
        )}
      </div>
    </main>
  );
}
