"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { X, Camera, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SoundPreferences } from "@/components/library/sound-preferences";

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
  async function load() {
    setLoading(true);
    const response = await fetch(
      kind === "history" ? "/api/history" : "/api/downloads",
      { cache: "no-store" },
    );
    if (response.status === 401) setLoggedOut(true);
    else {
      const data = await response.json();
      setRows(data.data ?? []);
    }
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, [kind]);
  async function remove(bookId: string) {
    await fetch(
      `/${kind === "history" ? "api/history" : "api/downloads"}/${bookId}`,
      { method: "DELETE" },
    );
    setRows((current) => current.filter((row) => row.book_id !== bookId));
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
      {loggedOut ? (
        <p className="rounded-3xl border border-black/10 bg-white/60 p-10 text-center">
          Log in to see your{" "}
          {kind === "history" ? "reading history" : "downloads"}.
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
                    <p className="mt-1 text-black/55">
                      {book.authors?.[0] ?? "Unknown author"}
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <Link
                      href={`/library/read/${book.id}`}
                      className="rounded-xl bg-[#109fe9] px-6 py-3 text-center font-semibold text-white"
                    >
                      {kind === "history" ? "Continue reading" : "Read book"}
                    </Link>
                    <button
                      aria-label={`Remove ${book.title}`}
                      onClick={() => remove(row.book_id)}
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

export function ProfileScreen() {
  const supabase = createClient();
  const [profile, setProfile] = useState({
    username: "",
    display_name: "",
    bio: "",
    avatar_url: "",
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
            bio: data.profile.bio ?? "",
            avatar_url: data.profile.avatar_url ?? "",
          });
        if (data.user?.email) setEmail(data.user.email);
      });
  }, []);
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
    if (!result.ok) setError(data.error ?? "Could not save profile");
    else setMessage("Profile updated");
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
  async function upload(file: File) {
    if (
      !/^image\/(jpeg|png|webp)$/.test(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError("Avatar must be JPG, PNG, or WEBP and no larger than 2MB.");
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const path = `${user.id}/avatar-${Date.now()}.${file.type.split("/")[1]}`;
    const result = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    const url = supabase.storage.from("avatars").getPublicUrl(path)
      .data.publicUrl;
    setProfile((current) => ({ ...current, avatar_url: url }));
  }
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-[.2em] text-[#ff6868]">
          Account
        </p>
        <h1 className="mt-2 text-4xl font-bold">My profile</h1>
      </div>
      <SoundPreferences />
      <form onSubmit={save} className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5 rounded-3xl border border-black/10 bg-white/60 p-5 sm:p-8">
          <Field label="Email" value={email} onChange={() => {}} disabled />
          <Field
            label="Username"
            value={profile.username}
            onChange={(value) => setProfile({ ...profile, username: value })}
          />
          <Field
            label="Display name"
            value={profile.display_name}
            onChange={(value) =>
              setProfile({ ...profile, display_name: value })
            }
          />
          <label className="block rounded-2xl border-2 border-black/15 px-5 py-3">
            <span className="block font-semibold">Bio</span>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full bg-transparent outline-none"
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
            className="rounded-xl bg-[#109fe9] px-8 py-3 font-semibold text-white"
          >
            {saving ? "Saving..." : "Confirm changes"}
          </button>
        </div>
        <div className="flex flex-col items-center rounded-3xl border border-black/10 bg-white/60 p-8">
          <img
            src={
              profile.avatar_url ||
              "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80"
            }
            alt="Profile avatar"
            className="size-44 rounded-full object-cover shadow-xl"
          />
          <label className="mt-6 cursor-pointer rounded-xl bg-[#109fe9] px-6 py-3 font-semibold text-white">
            <Camera className="mr-2 inline size-4" />
            Change photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
          </label>
          <button
            type="button"
            onClick={() =>
              supabase.auth.signOut().then(() => location.assign("/"))
            }
            className="mt-3 rounded-xl px-6 py-3 font-semibold text-[#ff6868]"
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
    <label className="block rounded-2xl border-2 border-black/15 px-5 py-3 focus-within:border-[#109fe9]">
      <span className="block font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent outline-none"
      />
    </label>
  );
}
