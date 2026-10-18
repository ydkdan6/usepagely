"use client";
import { useEffect, useState } from "react";
export function ActivitySummary() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/reading-activity")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
  }, []);
  if (!data) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-bold">Weekly activity</h2>
      <div className="flex h-32 items-end gap-2 rounded-3xl border border-border bg-card p-5">
        {data.weekly.map((day: any) => (
          <div
            key={day.date}
            className="flex flex-1 flex-col items-center gap-2"
          >
            <div
              className="w-full rounded-t-lg bg-primary/80"
              style={{
                height: `${Math.max(8, Math.min(100, (day.seconds / Math.max(1, day.goal)) * 100))}%`,
              }}
              title={`${day.seconds} seconds`}
            />
            <span className="text-[10px] text-muted-foreground">
              {new Date(`${day.date}T12:00:00Z`)
                .toLocaleDateString("en-US", {
                  weekday: "short",
                  timeZone: "UTC",
                })
                .slice(0, 2)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
