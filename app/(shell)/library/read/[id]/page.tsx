"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Reader } from "@/components/library/reader";
import { getOfflineBook } from "@/lib/offline-db";
import type { Book } from "@/lib/books/types";
export default function ReadPage() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    (async () => {
      const cached = await getOfflineBook(id);
      if (cached && active) {
        setBook(cached.book);
        setLoading(false);
        return;
      }
      if (navigator.onLine) {
        try {
          const response = await fetch(`/api/books/${id}`);
          const data = await response.json();
          if (active && response.ok) setBook(data.data);
        } finally {
          if (active) setLoading(false);
        }
      } else if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);
  if (loading)
    return (
      <main className="min-h-svh bg-[#f7f6f2] p-8 text-[#1c1c26]">
        Loading...
      </main>
    );
  if (!book)
    return (
      <main className="min-h-svh bg-[#f7f6f2] p-8 text-[#1c1c26]">
        This book is not available offline.
      </main>
    );
  return <Reader book={book} />;
}
