"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  Check,
  Heart,
  Share2,
  Star,
  UserRound,
  X,
} from "lucide-react";
import type { Book } from "@/lib/books/types";
import { cn } from "@/lib/utils";

const descriptions: Record<string, string> = {
  "101 cách của đồ đại lão hàng xóm":
    "Tống Thiên Thi nhận ra hàng xóm mới chuyển đến là một người không dễ sống chung. Anh lạnh lùng, sắc bén và dường như luôn nhìn thấu mọi bí mật. Nhưng qua những cuộc gặp gỡ bất ngờ, khoảng cách giữa hai người dần được kéo gần lại bằng những rung động không ai kịp phòng bị.",
};

function getDescription(book: Book) {
  return (
    descriptions[book.title] ??
    `${book.title} là một tác phẩm của ${book.author}, mang đến một hành trình đáng nhớ qua những nhân vật, lựa chọn và cảm xúc sâu sắc. Khám phá câu chuyện đầy cuốn hút và tìm thấy những điều mới mẻ trên từng trang sách.`
  );
}

export function BookDetail({ book }: { book: Book }) {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loved, setLoved] = useState(false);
  const [review, setReview] = useState("");
  const [reviews, setReviews] = useState<string[]>(["AMAZING!!!"]);
  const [shared, setShared] = useState(false);
  const description = getDescription(book);

  async function shareBook() {
    const shareData = {
      title: book.title,
      text: `Read ${book.title} on BookOnline`,
      url: window.location.href,
    };
    if (navigator.share) await navigator.share(shareData);
    else {
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    }
  }

  function submitReview(event: React.FormEvent) {
    event.preventDefault();
    if (!review.trim()) return;
    setReviews((current) => [review.trim(), ...current]);
    setReview("");
  }

  return (
    <article className="mx-auto max-w-[1180px] pb-20">
      <Link
        href="/library"
        className="group mb-10 inline-flex items-center gap-3 text-lg font-medium text-[#1c1c26] transition-transform hover:-translate-x-1"
      >
        <ArrowLeft className="size-6" /> Back
      </Link>

      <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-14">
        <div className="mx-auto w-full max-w-[280px] lg:mx-0">
          <div className="group relative aspect-[2/3] overflow-hidden rounded-xl bg-[#e4dfd0] shadow-[0_20px_45px_-18px_rgba(28,28,38,.45)] transition duration-500 hover:-translate-y-2 hover:shadow-[0_28px_55px_-18px_rgba(28,28,38,.55)]">
            <img
              src={book.coverUrl}
              alt={`Cover of ${book.title}`}
              className="size-full object-cover transition duration-700 group-hover:scale-105"
            />
          </div>
        </div>

        <div className="min-w-0 pt-1">
          <h1 className="text-3xl font-semibold tracking-tight text-[#1c1c26] md:text-4xl">
            {book.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-lg text-[#1c1c26]">
            <span>{book.rating.toFixed(1)}</span>
            {Array.from({ length: 5 }, (_, index) => (
              <Star
                key={index}
                className={cn(
                  "size-5",
                  index < Math.round(book.rating)
                    ? "fill-[#ffb400] text-[#ffb400]"
                    : "text-[#1c1c26]",
                )}
              />
            ))}
            <span className="mx-1">•</span>
            <span>
              {reviews.length} Review{reviews.length !== 1 ? "s" : ""}
            </span>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-5 border-b border-[#1c1c26]/20 pb-5 sm:grid-cols-4">
            <div>
              <dt className="font-semibold">Author</dt>
              <dd>{book.author}</dd>
            </div>
            <div>
              <dt className="font-semibold">Genre</dt>
              <dd className="capitalize">{book.category.replace("-", " ")}</dd>
            </div>
            <div>
              <dt className="font-semibold">Published</dt>
              <dd>{book.publishedYear}</dd>
            </div>
            <div>
              <dt className="font-semibold">Release status</dt>
              <dd>Available</dd>
            </div>
          </dl>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button className="rounded-lg bg-[#0da4ed] px-10 py-3 text-base font-semibold text-white shadow-lg shadow-[#0da4ed]/20 transition hover:-translate-y-1 hover:bg-[#078fd2]">
              Read
            </button>
            <ActionButton
              active={saved}
              label={saved ? "Saved" : "Save"}
              onClick={() => setSaved(!saved)}
            >
              <Bookmark className={cn("size-6", saved && "fill-current")} />
            </ActionButton>
            <ActionButton
              active={loved}
              label={loved ? "Loved" : "Love"}
              onClick={() => setLoved(!loved)}
            >
              <Heart
                className={cn(
                  "size-6",
                  loved && "fill-[#ef5571] text-[#ef5571]",
                )}
              />
            </ActionButton>
            <ActionButton
              active={shared}
              label={shared ? "Copied" : "Share"}
              onClick={shareBook}
            >
              {shared ? (
                <Check className="size-6" />
              ) : (
                <Share2 className="size-6" />
              )}
            </ActionButton>
          </div>

          <div className="mt-10 text-[15px] leading-relaxed text-[#1c1c26] md:text-base">
            <p className={cn(!expanded && "line-clamp-4")}>{description}</p>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 font-semibold text-[#0da4ed] hover:underline"
            >
              {expanded ? "Show less" : "View more"}
            </button>
          </div>

          <section className="mt-12" aria-labelledby="reviews-heading">
            <h2 id="reviews-heading" className="mb-5 text-2xl font-semibold">
              Comment ({reviews.length})
            </h2>
            <form onSubmit={submitReview} className="mb-5 flex gap-3">
              <label htmlFor="review" className="sr-only">
                Write a review
              </label>
              <input
                id="review"
                value={review}
                onChange={(event) => setReview(event.target.value)}
                placeholder="Share your thoughts about this book..."
                className="min-w-0 flex-1 rounded-lg border border-[#1c1c26]/15 bg-white px-4 py-3 outline-none transition focus:border-[#0da4ed] focus:ring-2 focus:ring-[#0da4ed]/20"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#1c1c26] px-5 font-semibold text-white transition hover:bg-[#0da4ed]"
              >
                Post
              </button>
            </form>
            <div className="space-y-3">
              {reviews.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="rounded-xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-[#1c1c26] text-white">
                      <UserRound className="size-5" />
                    </div>
                    <strong>{index === 0 ? "Harleen Quinzel" : "You"}</strong>
                    <span className="ml-auto text-sm text-[#1c1c26]/50">
                      {index === 0 ? "11:22 PM" : "Just now"}
                    </span>
                  </div>
                  <p className="mt-3 pl-13 text-sm">{item}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}

function ActionButton({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg p-2.5 transition hover:-translate-y-1 hover:bg-white",
        active && "bg-white text-[#0da4ed] shadow-sm",
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
