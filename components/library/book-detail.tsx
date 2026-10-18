"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import {
  getOfflineBook,
  saveOfflineBook,
  removeOfflineBook,
} from "@/lib/offline-db";
import { ChapterList } from "@/components/library/chapter-list";
import { useDownloadManager } from "@/components/library/download-manager";
import { toast } from "sonner";

export function BookDetail({ book }: { book: Book }) {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loved, setLoved] = useState(false);
  const [review, setReview] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [saveError, setSaveError] = useState("");
  useEffect(() => {
    fetch(`/api/books/${book.id}/ratings`)
      .then((response) => response.json())
      .then((data) => setReviews(data.data ?? []));
    fetch(`/api/saved-books`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) =>
        setSaved(
          Boolean(
            data?.data?.some(
              (row: { book_id: string }) => row.book_id === book.id,
            ),
          ),
        ),
      );
  }, [book.id]);
  const [shared, setShared] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [offlineBusy, setOfflineBusy] = useState(false);
  const {
    downloads,
    start: startDownload,
    pause: pauseDownload,
    resume: resumeDownload,
    cancel: cancelDownload,
  } = useDownloadManager();
  const managerDownload = downloads.find((item) => item.book.id === book.id);
  useEffect(() => {
    void getOfflineBook(book.id).then((cached) => {
      if (cached?.chapters.length) setDownloaded(true);
    });
  }, [book.id]);

  async function toggleOffline() {
    if (!downloaded) {
      startDownload(book);
      return;
    }
    await removeOfflineBook(book.id);
    await fetch(`/api/downloads/${book.id}`, { method: "DELETE" });
    setDownloaded(false);
    return;
  }
  const description =
    book.description?.trim() || "No description is available for this book.";

  async function shareBook() {
    const shareData = {
      title: book.title,
      text: `Read ${book.title} on UsePagely`,
      url: window.location.href,
    };
    if (navigator.share) await navigator.share(shareData);
    else {
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    }
  }

  async function submitReview(event: React.FormEvent) {
    event.preventDefault();
    setRatingError("");
    const response = await fetch(`/api/books/${book.id}/ratings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rating, comment: review }),
    });
    if (response.status === 401) {
      window.location.href = `/auth/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    const data = await response.json();
    if (!response.ok) {
      const message = data.error ?? "Could not save rating";
      setRatingError(message);
      toast.error(message);
      return;
    }
    toast.success("Rating saved.");
    setReviews((current) => [
      data.data,
      ...current.filter((item) => item.user_id !== data.data.user_id),
    ]);
    setReview("");
  }

  return (
    <article className="relative mx-auto max-w-[1180px] pb-20">
      {saveError && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 rounded-xl bg-[#1c1c26] px-4 py-3 text-sm font-semibold text-white shadow-xl"
        >
          {saveError}
        </div>
      )}
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
            <Link
              href={`/library/read/${book.id}`}
              className="rounded-lg bg-[#0da4ed] px-10 py-3 text-base font-semibold text-white shadow-lg shadow-[#0da4ed]/20 transition hover:-translate-y-1 hover:bg-[#078fd2]"
            >
              Read
            </Link>
            <ActionButton
              active={Boolean(managerDownload)}
              label={
                managerDownload?.status === "finished"
                  ? "Downloaded"
                  : "Download for offline"
              }
              onClick={toggleOffline}
            >
              <Bookmark
                className={cn(
                  "size-6",
                  managerDownload?.status === "finished" && "fill-current",
                )}
              />
            </ActionButton>
            {managerDownload && (
              <div className="basis-full text-sm text-[#1c1c26]/70">
                <progress
                  className="mr-2 w-48 align-middle"
                  max={managerDownload.total || 1}
                  value={managerDownload.done}
                />{" "}
                {managerDownload.done}/{managerDownload.total || "…"}{" "}
                <button
                  type="button"
                  className="ml-2 underline"
                  onClick={() =>
                    managerDownload.status === "active"
                      ? pauseDownload(book.id)
                      : resumeDownload(book.id)
                  }
                >
                  {managerDownload.status === "active" ? "Pause" : "Resume"}
                </button>
                <button
                  type="button"
                  className="ml-2 underline"
                  onClick={() => cancelDownload(book.id)}
                >
                  Cancel
                </button>
              </div>
            )}
            {managerDownload?.error && (
              <p role="alert" className="basis-full text-sm text-red-600">
                {managerDownload.error}
              </p>
            )}
            <ActionButton
              active={saved}
              label={saved ? "Saved" : "Save for later"}
              onClick={async () => {
                const previous = saved;
                setSaved(!previous);
                const response = await fetch(`/api/saved-books/${book.id}`, {
                  method: previous ? "DELETE" : "POST",
                });
                if (response.status === 401) {
                  setSaved(previous);
                  toast.info("Log in to save books.");
                  window.location.href = `/auth/login?next=${encodeURIComponent(window.location.pathname)}`;
                } else if (!response.ok) {
                  const data = await response.json().catch(() => ({}));
                  setSaved(previous);
                  const message = data.error ?? "Could not update saved books.";
                  setSaveError(message);
                  toast.error(message);
                  window.setTimeout(() => setSaveError(""), 3500);
                }
              }}
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

          <ChapterList bookId={book.id} />

          <section className="mt-12" aria-labelledby="reviews-heading">
            <h2 id="reviews-heading" className="mb-5 text-2xl font-semibold">
              Comment ({reviews.length})
            </h2>
            <div className="mb-3 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-label={`${value} stars`}
                  onClick={() => setRating(value)}
                >
                  <Star
                    className={cn(
                      "size-6",
                      value <= rating
                        ? "fill-[#ffb400] text-[#ffb400]"
                        : "text-[#1c1c26]/30",
                    )}
                  />
                </button>
              ))}
            </div>
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
                  key={`${item.id}-${index}`}
                  className="rounded-xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-[#1c1c26] text-white">
                      <UserRound className="size-5" />
                    </div>
                    <strong>
                      {item.profiles?.username ||
                        item.profiles?.display_name ||
                        "Reader"}
                    </strong>
                    <span className="ml-auto text-sm text-[#1c1c26]/50">
                      {index === 0 ? "11:22 PM" : "Just now"}
                    </span>
                  </div>
                  <p className="mt-3 pl-13 text-sm">{item.comment}</p>
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
