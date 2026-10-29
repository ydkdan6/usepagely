"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { X, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SoundPreferences } from "@/components/library/sound-preferences";
import { avatarDataUri } from "@/lib/avatar";
import { useDownloadManager } from "@/components/library/download-manager";
import { toast } from "sonner";
import { ActivitySummary } from "@/components/library/activity-summary";

export function ShelfScreen({
  title,
  kind,
}: {
  title: string;
  kind: "history" | "downloads";
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedOut, setLoggedOut] = useState(false);
  const [storageError, setStorageError] = useState("");
  const { downloads, pause, resume, cancel } = useDownloadManager();
  async function load() {
    if (kind === "downloads") {
      setLoading(true);
      setStorageError("");
      try {
        const { getOfflineBooks } = await import("@/lib/offline-db");
        const localBooks = await getOfflineBooks();
        setRows(
          localBooks.map(({ book, chapters }) => ({
            book_id: String(book.id),
            books: book,
            chapterCount: chapters.length,
          })),
        );
      } catch {
        setRows([]);
        setStorageError("Downloaded books could not be opened on this device.");
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/history", { cache: "no-store" });
      if (response.status === 401) setLoggedOut(true);
      else {
        const data = await response.json();
        setRows(data.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    if (kind !== "downloads") return;
    const refresh = () => void load();
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("usepagely:offline-books-changed", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("usepagely:offline-books-changed", refresh);
    };
  }, [kind]);
  async function remove(bookId: string) {
    if (kind === "downloads") {
      const { removeOfflineBook } = await import("@/lib/offline-db");
      await removeOfflineBook(bookId);
    } else {
      await fetch(`/api/history/${bookId}`, { method: "DELETE" });
    }
    setRows((current) => current.filter((row) => String(row.book_id) !== String(bookId)));
  }
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
      {kind === "downloads" && downloads.length > 0 && (
        <div className="space-y-4">
          {downloads.map((item) => (
            <article
              key={item.book.id}
              className="flex items-center gap-4 rounded-3xl border border-black/10 bg-white/60 p-4"
            >
              <img
                src={item.book.coverUrl}
                alt={`${item.book.title} cover`}
                className="size-20 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-bold">{item.book.title}</h2>
                <progress
                  className="mt-2 w-full"
                  max={item.total || 1}
                  value={item.done}
                />
                <p className="text-sm text-black/55">
                  {item.status === "finished"
                    ? "Ready for offline reading"
                    : `${item.done}/${item.total || "…"} chapters`}
                </p>
              </div>
              {item.status !== "finished" && (
                <button
                  type="button"
                  onClick={() =>
                    item.status === "active"
                      ? pause(item.book.id)
                      : resume(item.book.id)
                  }
                  className="rounded-xl px-3 py-2 text-sm font-semibold"
                >
                  {item.status === "active" ? "Pause" : "Resume"}
                </button>
              )}
              <button
                type="button"
                onClick={() => cancel(item.book.id)}
                className="rounded-xl px-3 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
            </article>
          ))}
        </div>
      )}
      {kind === "history" && loggedOut ? (
        <p className="rounded-3xl border border-black/10 bg-white/60 p-10 text-center">
          Log in to see your{" "}
          {kind === "history" ? "reading history" : "downloads"}.
        </p>
      ) : storageError ? (
        <p role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-red-800">
          {storageError}
        </p>
      ) : loading ? (
        <p className="rounded-3xl border border-black/10 bg-white/60 p-10 text-center">
          Loading...
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-3xl border border-black/10 bg-white/60 p-10 text-center">
          {kind === "history"
            ? "No reading history yet"
            : "No downloaded books yet"}
        </p>
      ) : (
        <div className="space-y-5">
          {rows.map((row) => {
            const book = row.books;
            return (
              <article
                key={row.book_id}
                className="group flex flex-col gap-5 rounded-3xl border border-black/10 bg-white/60 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:flex-row sm:p-6"
              >
                <img
                  src={book.cover_url}
                  alt={`${book.title} cover`}
                  className="h-56 w-36 rounded-xl object-cover shadow-lg sm:h-48 sm:w-32"
                />
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{book.title}</h2>
                    <p className="mt-1 text-base text-black/55">
                      {book.authors?.[0] ?? book.author ?? "Unknown author"}
                    </p>
                    {kind === "downloads" && (
                      <p className="mt-2 text-sm text-black/55">
                        {row.chapterCount} chapter{row.chapterCount === 1 ? "" : "s"} saved locally
                      </p>
                    )}
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <Link
                      href={`/library/read/${book.id}`}
                      className="rounded-xl bg-[#109fe9] px-6 py-3 text-center text-base font-semibold text-white"
                    >
                      {kind === "history" ? "Continue reading" : "Read book offline"}
                    </Link>
                    <button
                      aria-label={`Remove ${book.title}`}
                      onClick={() => {
                        void remove(row.book_id);
                      }}
                      className="rounded-xl p-3"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MyWords() {
  const [words, setWords] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/my-words")
      .then((response) => response.json())
      .then((result) => setWords(result.data ?? []));
  }, []);
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold">My words</h2>
      {words.length === 0 ? (
        <p className="text-sm text-black/55">
          Saved definitions will appear here.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {words.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-black/10 bg-white/60 p-4"
            >
              <strong>{item.word}</strong>
              <p className="mt-1 text-sm text-black/65">{item.definition}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function ProfileScreen() {
  const supabase = createClient();
  const [profile, setProfile] = useState({
    username: "",
    display_name: "",
    phone: "",
    bio: "",
    avatar_seed: "",
    daily_goal_minutes: 10,
    timezone: "UTC",
  });
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile)
          setProfile({
            username: data.profile.username ?? "",
            display_name: data.profile.display_name ?? "",
            phone: data.profile.phone ?? "",
            bio: data.profile.bio ?? "",
            avatar_seed: data.profile.avatar_seed ?? "",
            daily_goal_minutes: data.profile.daily_goal_minutes ?? 10,
            timezone:
              data.profile.timezone ??
              Intl.DateTimeFormat().resolvedOptions().timeZone,
          });
        if (data.user?.email) setEmail(data.user.email);
      });
  }, []);
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error("Could not log out.");
    else {
      toast.success("Logged out.");
      window.location.href = "/login";
    }
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const result = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await result.json();
    if (!result.ok) {
      const message = data.error ?? "Could not save profile";
      setError(message);
      toast.error(message);
    } else {
      const currentUser = await supabase.auth.getUser();
      if (currentUser.data.user?.email !== email) {
        const emailResult = await supabase.auth.updateUser({ email });
        if (emailResult.error) setError(emailResult.error.message);
        else
          setMessage(
            "Profile updated. Check your email to confirm the new address.",
          );
      } else {
        setMessage("Profile updated");
        toast.success("Profile updated.");
      }
    }
    if (newPassword) {
      if (!currentPassword)
        setError("Enter your current password to change it.");
      else {
        const auth = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        });
        if (auth.error) setError("Current password is incorrect.");
        else {
          const updated = await supabase.auth.updateUser({
            password: newPassword,
          });
          if (updated.error) setError(updated.error.message);
        }
      }
    }
    setSaving(false);
  }
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-[.2em] text-[#ff6868]">
          Account
        </p>
        <h1 className="mt-2 text-4xl font-bold">My profile</h1>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          title="Log out"
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/60 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Log out
        </button>
      </div>
      <SoundPreferences />
      <ActivitySummary />
      <label className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        <span>
          <strong className="text-base">Daily reading goal</strong>
          <span className="block text-sm text-muted-foreground">
            Choose how much you want to read each day.
          </span>
        </span>
        <select
          aria-label="Daily reading goal"
          value={profile.daily_goal_minutes}
          onChange={(event) =>
            setProfile({
              ...profile,
              daily_goal_minutes: Number(event.target.value),
            })
          }
          className="select-control w-[40%] rounded-xl border border-border bg-background px-3 py-2 pr-8 shadow-sm outline-none transition focus:border-[#0799ea] focus:ring-2 focus:ring-[#0799ea]/15"
        >
          <option value={5} className="text-sm">
            5 minutes
          </option>
          <option value={10} className="text-sm">
            10 minutes
          </option>
          <option value={20} className="text-sm">
            20 minutes
          </option>
          <option value={30} className="text-sm">
            30 minutes
          </option>
        </select>
      </label>
      <MyWords />
      <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/60 p-4">
        <input
          type="checkbox"
          defaultChecked={
            typeof window === "undefined" ||
            window.localStorage.getItem("tap-a-word") !== "off"
          }
          onChange={(event) =>
            window.localStorage.setItem(
              "tap-a-word",
              event.target.checked ? "on" : "off",
            )
          }
          className="accent-[#c74f55]"
        />
        <span>
          <strong className="text-base">Tap-a-word meanings</strong>
          <span className="block text-sm text-black/55">
            Show definitions when you double-click or long-press a word.
          </span>
        </span>
      </label>
      <form onSubmit={save} className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5 rounded-3xl border border-black/10 bg-white/60 p-5 sm:p-8">
          <Field label="Email" value={email} onChange={setEmail} type="email"/>
          <Field
            label="Username"
            value={profile.username}
            onChange={(value) => setProfile({ ...profile, username: value })}
          />
          <Field
            label="Full name"
            value={profile.display_name}
            onChange={(value) =>
              setProfile({ ...profile, display_name: value })
            }
          />
          <Field
            label="Phone"
            value={profile.phone}
            onChange={(value) => setProfile({ ...profile, phone: value })}
          />
          <label className="block rounded-2xl border-2 border-black/15 px-5 py-3">
            <span className="block font-semibold text-base">Bio</span>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full bg-transparent outline-none text-base"
              rows={3}
            />
          </label>
          <Field
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
          />
          <Field
            label="New password"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
          />
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          {message && <p className="text-sm text-green-700">{message}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#109fe9] px-8 py-3 font-semibold text-white text-base"
          >
            {saving ? "Saving..." : "Confirm changes"}
          </button>
        </div>
        <div className="flex flex-col items-center rounded-3xl border border-black/10 bg-white/60 p-8">
          <img
            src={avatarDataUri(
              profile.avatar_seed || profile.username || profile.display_name,
            )}
            alt="Profile avatar"
            className="size-40 rounded-full object-cover shadow-xl"
          />
          <button
            type="button"
            className="mt-6 rounded-xl bg-[#109fe9] px-6 py-3 font-semibold text-white text-base"
            onClick={() =>
              setProfile((current) => ({
                ...current,
                avatar_seed: crypto.randomUUID(),
              }))
            }
          >
            Shuffle avatar
          </button>
          <button
            type="button"
            onClick={() =>
              supabase.auth.signOut().then(() => location.assign("/"))
            }
            className="mt-3 rounded-xl px-6 py-3 font-semibold text-[#ff6868] text-base"
          >
            <LogOut className="mr-2 inline size-4" />
            Log out
          </button>
        </div>
      </form>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="text-base block rounded-2xl border-2 border-black/15 px-5 py-3 focus-within:border-[#109fe9]">
      <span className="block font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent outline-none text-base"
      />
    </label>
  );
}
