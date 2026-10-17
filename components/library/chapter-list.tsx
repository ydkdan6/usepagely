"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
export function ChapterList({ bookId }: { bookId: string }) {
  const [state, setState] = useState<any>({ data: [], page: 1, totalPages: 1 });
  useEffect(() => {
    void fetch(`/api/books/${bookId}/chapters?page=${state.page}`)
      .then((r) => r.json())
      .then(setState);
  }, [bookId, state.page]);
  return (
    <section className="mt-12" aria-labelledby="chapters-heading">
      <div className="mb-5 flex items-center justify-between">
        <h2 id="chapters-heading" className="text-2xl font-semibold">
          Chapters
        </h2>
        {state.total > 0 && (
          <Link
            href={`/library/read/${bookId}?chapter=1`}
            className="font-semibold text-[#0da4ed]"
          >
            Continue reading
          </Link>
        )}
      </div>
      <ol className="divide-y divide-[#1c1c26]/10 rounded-xl bg-white">
        {state.data.map((chapter: any) => (
          <li key={chapter.id}>
            <Link
              href={`/library/read/${bookId}?chapter=${chapter.chapterNumber}`}
              className="flex min-h-12 items-center justify-between px-4 py-3 hover:bg-black/[.03]"
            >
              <span>{chapter.title}</span>
              <span className="text-sm text-black/50">
                {chapter.chapterNumber}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {state.totalPages > 1 && (
        <div className="mt-4 flex justify-between">
          <button
            disabled={state.page <= 1}
            onClick={() => setState((s: any) => ({ ...s, page: s.page - 1 }))}
          >
            Previous
          </button>
          <span>
            Page {state.page} of {state.totalPages}
          </span>
          <button
            disabled={state.page >= state.totalPages}
            onClick={() => setState((s: any) => ({ ...s, page: s.page + 1 }))}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
