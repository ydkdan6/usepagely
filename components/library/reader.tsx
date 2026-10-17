"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowLeftCircle,
  ArrowRightCircle,
  Bookmark,
  BookOpen,
  Download,
  Highlighter,
  List,
  Menu,
  Settings2,
} from "lucide-react";
import { useState } from "react";
import type { Book } from "@/lib/books/types";

const paragraphs = [
  "Chung Thu Yếu muốn đính chính với cậu ta, nhưng mấp máy môi lại không biết nói gì, đành giả vờ như không nghe thấy.",
  "Tống Cạnh Hàm nhắm mắt lại nhưng không hề ngủ, khóe môi hơi cong lên, trên mặt lộ vẻ thỏa mãn.",
  "Cậu ta mệt thật, lúc đầu chỉ muốn dựa vào, nhưng cứ dựa như vậy rồi ngủ thiếp đi.",
  "Nhưng nghe thấy tiếng thở đều đều của cậu ta, biết cậu ta đã ngủ, cô ta chịu đựng không cử động.",
  "Xe dừng ở ngoài khu chung cư cũ của Chung Thu Yếu, cô ta lay vai Tống Cạnh Hàm gọi: Tống Cạnh Hàm.",
  "Tống Cạnh Hàm nheo mắt lại rồi mở mắt ra, ngồi thẳng người nhìn ra bên ngoài.",
];

export function Reader({ book }: { book: Book }) {
  const [chapter, setChapter] = useState(1);
  const [bookmarked, setBookmarked] = useState(false);
  return (
    <main className="min-h-svh bg-[#f7f6f2] text-[#1c1c26]">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#1c1c26]/10 bg-[#f7f6f2]/90 px-5 py-4 backdrop-blur md:px-10">
        <Link
          href={`/library/book/${book.id}`}
          className="flex items-center gap-3 font-semibold"
        >
          <ArrowLeft className="size-6" />{" "}
          <span className="max-w-[240px] truncate">{book.title}</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBookmarked(!bookmarked)}
            aria-label="Save bookmark"
            className={
              bookmarked
                ? "rounded-xl bg-[#ff6868] p-3 text-white"
                : "rounded-xl p-3 hover:bg-black/5"
            }
          >
            <Bookmark
              className="size-5"
              fill={bookmarked ? "currentColor" : "none"}
            />
          </button>
          <button className="rounded-xl p-3 hover:bg-black/5">
            <Settings2 className="size-5" />
          </button>
          <button className="rounded-xl p-3 hover:bg-black/5">
            <Menu className="size-5" />
          </button>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-8 lg:grid-cols-[1fr_280px] lg:px-10">
        <article className="min-w-0">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <p className="text-sm font-medium uppercase tracking-[.2em] text-[#ff6868]">
                Chapter {chapter}
              </p>
              <h1 className="mt-3 text-3xl font-bold md:text-5xl">
                Anh cho em uống thuốc?
              </h1>
            </div>
            <div className="grid gap-8 text-lg leading-8 md:grid-cols-2">
              {paragraphs.concat(paragraphs.slice(2, 5)).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="mt-12 flex items-center justify-between">
              <button
                onClick={() => setChapter(Math.max(1, chapter - 1))}
                className="rounded-full p-3 hover:bg-black/5"
              >
                <ArrowLeftCircle className="size-9" />
              </button>
              <span className="font-semibold">{chapter}/10</span>
              <button
                onClick={() => setChapter(Math.min(10, chapter + 1))}
                className="rounded-full p-3 hover:bg-black/5"
              >
                <ArrowRightCircle className="size-9" />
              </button>
            </div>
          </div>
        </article>
        <aside className="rounded-2xl border border-black/10 bg-white/55 p-5 lg:sticky lg:top-24 lg:h-fit">
          <h2 className="mb-4 font-bold">Chapters</h2>
          <div className="space-y-1">
            {Array.from({ length: 8 }, (_, i) => (
              <button
                key={i}
                onClick={() => setChapter(i + 1)}
                className={`w-full rounded-xl px-3 py-3 text-left text-sm transition ${chapter === i + 1 ? "bg-[#ff6868] font-semibold text-white" : "hover:bg-black/5"}`}
              >
                Chapter {i + 1}:{" "}
                {i === 0 ? "Anh cho em uống thuốc?" : "Chồng yêu, em chờ anh"}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
