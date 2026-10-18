export const STREAK_THRESHOLD_SECONDS = 30;

export type ReadingDay = { activity_date: string; seconds_read: number };

function shiftDate(date: string, offset: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

export function getLocalDate(timeZone: string, now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}

export function calculateReadingStreak(rows: ReadingDay[], today: string) {
  const byDate = new Map(
    rows.map((row) => [row.activity_date, row.seconds_read]),
  );
  const active = (date: string) =>
    (byDate.get(date) ?? 0) >= STREAK_THRESHOLD_SECONDS;
  const streakStart = active(today)
    ? today
    : active(shiftDate(today, -1))
      ? shiftDate(today, -1)
      : null;
  let currentStreak = 0;
  if (streakStart) {
    let date = streakStart;
    while (active(date)) {
      currentStreak += 1;
      date = shiftDate(date, -1);
    }
  }

  const dates = [...byDate.keys()].sort();
  let longestStreak = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of dates) {
    if (!active(date)) {
      run = 0;
      previous = date;
      continue;
    }
    run = previous && shiftDate(previous, 1) === date ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = date;
  }
  return { currentStreak, longestStreak };
}
