"use client";

import Link from "next/link";
import {
  X,
  Clock3,
  Download,
  Heart,
  UserRound,
  CalendarDays,
  Camera,
  LogOut,
} from "lucide-react";
import type { Book } from "@/lib/books/types";

export function ShelfScreen({
  title,
  books,
  kind,
}: {
  title: string;
  books: Book[];
  kind: "history" | "downloads";
}) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-[.2em] text-[#ff6868]">
          Your library
        </p>
        <h1 className="mt-2 text-4xl font-bold">{title}</h1>
        <p className="mt-2 text-black/55">
          {kind === "history"
            ? "Pick up where you left off."
            : "Books saved for offline reading."}
        </p>
      </div>
      <div className="space-y-5">
        {books.map((book, i) => (
          <article
            key={book.id}
            className="group flex flex-col gap-5 rounded-3xl border border-black/10 bg-white/60 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:flex-row sm:p-6"
          >
            <img
              src={book.coverUrl}
              alt={`${book.title} cover`}
              className="h-56 w-36 rounded-xl object-cover shadow-lg sm:h-48 sm:w-32"
            />
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold">{book.title}</h2>
                <p className="mt-1 text-black/55">{book.author}</p>
                <div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <span>
                    <b className="block">Genre</b>
                    {book.category}
                  </span>
                  <span>
                    <b className="block">Rating</b>★ {book.rating}
                  </span>
                  <span>
                    <b className="block">Status</b>
                    {kind === "downloads" ? "Downloaded" : "Reading"}
                  </span>
                  <span>
                    <b className="block">Progress</b>
                    {kind === "history"
                      ? `${Math.min(95, 25 + i * 20)}%`
                      : "Ready"}
                  </span>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3">
                <Link
                  href={`/library/read/${book.id}`}
                  className="rounded-xl bg-[#109fe9] px-6 py-3 text-center font-semibold text-white transition hover:scale-[1.03]"
                >
                  {kind === "history" ? "Continue reading" : "Read book"}
                </Link>
                <button
                  aria-label={`Remove ${book.title}`}
                  className="rounded-xl p-3 text-black/55 transition hover:bg-[#ff6868]/10 hover:text-[#ff6868]"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ProfileScreen() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-[.2em] text-[#ff6868]">
          Account
        </p>
        <h1 className="mt-2 text-4xl font-bold">My profile</h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <form className="space-y-5 rounded-3xl border border-black/10 bg-white/60 p-5 sm:p-8">
          <Field label="Email" value="alma.lawson@example.com" />
          <Field label="Password" value="0000000000" type="password" />
          <Field label="Full name" value="Harleen Quinzel" />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Date of birth" value="01/01/1900" />
            <Field label="Gender" value="Female" />
          </div>
          <button
            type="button"
            className="rounded-xl bg-[#109fe9] px-8 py-3 font-semibold text-white transition hover:scale-[1.03]"
          >
            Confirm changes
          </button>
        </form>
        <div className="flex flex-col items-center rounded-3xl border border-black/10 bg-white/60 p-8">
          <img
            src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80"
            alt="Profile avatar"
            className="size-44 rounded-full object-cover shadow-xl"
          />
          <button className="mt-6 rounded-xl bg-[#109fe9] px-6 py-3 font-semibold text-white">
            <Camera className="mr-2 inline size-4" />
            Change photo
          </button>
          <button className="mt-3 rounded-xl px-6 py-3 font-semibold text-[#ff6868] hover:bg-[#ff6868]/10">
            <LogOut className="mr-2 inline size-4" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
function Field({
  label,
  value,
  type = "text",
}: {
  label: string;
  value: string;
  type?: string;
}) {
  return (
    <label className="block rounded-2xl border-2 border-black/15 px-5 py-3 focus-within:border-[#109fe9]">
      <span className="block font-semibold">{label}</span>
      <input
        type={type}
        defaultValue={value}
        className="w-full bg-transparent outline-none"
      />
    </label>
  );
}
