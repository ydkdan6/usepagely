"use client";
import { useEffect, useState } from "react";

type Day = { date: string; seconds: number; goal: number };

export function ActivitySummary() {
  const [data, setData] = useState<{ weekly: Day[] } | null>(null);

  useEffect(() => {
    fetch("/api/reading-activity")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
  }, []);

  if (!data) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold">Weekly activity</h2>
      <div className="flex h-40 gap-2 rounded-3xl border border-border bg-card p-5">
        {data.weekly.map((day) => {
          const pct = Math.max(
            8,
            Math.min(100, (day.seconds / Math.max(1, day.goal)) * 100),
          );
          return (
            <div
              key={day.date}
              className="flex h-full flex-1 flex-col items-center gap-2"
            >
              <div className="flex min-h-0 w-full flex-1 items-end">
                <div
                  className={`w-full rounded-t-lg ${
                    day.seconds === 0 ? "bg-muted" : "bg-primary/80"
                  }`}
                  style={{ height: `${pct}%` }}
                  title={`${Math.round(day.seconds / 60)} min`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {new Date(`${day.date}T12:00:00Z`).toLocaleDateString("en-US", {
                  weekday: "short",
                  timeZone: "UTC",
                })}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
