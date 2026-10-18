"use client";
import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { toast } from "sonner";

type Stats = { today: number; goal: number; currentStreak: number };
export function StreakWidget() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    fetch("/api/reading-activity", {
      cache: "no-store",
      credentials: "include",
    })
      .then(async (r) => {
        if (r.status === 401) return null;
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        return data;
      })
      .then((data) => {
        if (!data) return;
        setStats(data);
        if (data.today >= data.goal)
          toast.success("Daily reading goal reached.");
      })
      .catch(() => {});
    const onActivity = (event: Event) => {
      const data = (event as CustomEvent<Stats>).detail;
      setStats(data);
    };
    window.addEventListener("reading-activity-updated", onActivity);
    return () =>
      window.removeEventListener("reading-activity-updated", onActivity);
  }, []);
  if (!stats) return null;
  const percent = Math.min(
    100,
    Math.round((stats.today / Math.max(1, stats.goal)) * 100),
  );
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4 text-card-foreground">
      <div
        className="relative grid size-16 place-items-center rounded-full"
        style={{
          background: `conic-gradient(var(--primary) ${percent}%, var(--muted) 0)`,
        }}
      >
        <div className="grid size-12 place-items-center rounded-full bg-card">
          <span className="text-xs font-bold">{percent}%</span>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-1 font-semibold">
          <Flame className="size-4 text-orange-500" />
          {stats.currentStreak} day streak
        </div>
        <p className="text-sm text-muted-foreground">
          {Math.floor(stats.today / 60)} of {Math.floor(stats.goal / 60)}{" "}
          minutes today
        </p>
      </div>
    </div>
  );
}
