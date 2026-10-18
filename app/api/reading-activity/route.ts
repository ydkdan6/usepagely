import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  seconds: z.number().int().min(0).max(86400),
  timezone: z.string().min(1).max(100).optional(),
});
function localDate(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid reading activity" },
      { status: 400 },
    );
  const timezone = parsed.data.timezone ?? "UTC";
  const date = localDate(timezone);
  const { data: existing } = await supabase
    .from("reading_activity")
    .select("seconds_read")
    .eq("user_id", user.id)
    .eq("activity_date", date)
    .maybeSingle();
  const { error } = await supabase
    .from("reading_activity")
    .upsert(
      {
        user_id: user.id,
        activity_date: date,
        seconds_read: (existing?.seconds_read ?? 0) + parsed.data.seconds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,activity_date" },
    );
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ date });
}
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_goal_minutes,timezone")
    .eq("id", user.id)
    .maybeSingle();
  const timezone = profile?.timezone || "UTC";
  const today = localDate(timezone);
  const { data: rows, error } = await supabase
    .from("reading_activity")
    .select("activity_date,seconds_read")
    .eq("user_id", user.id)
    .order("activity_date", { ascending: false })
    .limit(370);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const goal = (profile?.daily_goal_minutes ?? 10) * 60;
  const byDate = new Map(
    (rows ?? []).map((row) => [row.activity_date, row.seconds_read]),
  );
  const day = (offset: number) => {
    const date = new Date(`${today}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - offset);
    return date.toISOString().slice(0, 10);
  };
  let current = 0;
  while ((byDate.get(day(current)) ?? 0) >= goal) current += 1;
  let longest = 0;
  let run = 0;
  for (let i = 0; i < 370; i += 1) {
    if ((byDate.get(day(i)) ?? 0) >= goal) {
      run += 1;
      longest = Math.max(longest, run);
    } else run = 0;
  }
  return NextResponse.json(
    {
      today: byDate.get(today) ?? 0,
      goal,
      currentStreak: current,
      longestStreak: longest,
      weekly: Array.from({ length: 7 }, (_, index) => ({
        date: day(6 - index),
        seconds: byDate.get(day(6 - index)) ?? 0,
        goal,
      })),
    },
    {
      headers: {
        "Cache-Control": "private, max-age=20, stale-while-revalidate=60",
      },
    },
  );
}
