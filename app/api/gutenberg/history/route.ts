import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}
export async function GET(request: Request) {
  const { supabase, user } = await getSession();
  if (!user)
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const limit = Math.min(
    50,
    Math.max(1, Number(url.searchParams.get("limit") ?? 20)),
  );
  const from = (page - 1) * limit;
  const { data, error, count } = await supabase
    .from("reading_history")
    .select("id, book_id, last_chapter, progress, last_read_at, books(*)", {
      count: "exact",
    })
    .eq("user_id", user.id)
    .order("last_read_at", { ascending: false })
    .range(from, from + limit - 1);
  if (error) {
    console.error("[v0] GET /api/history failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    data: data ?? [],
    page,
    limit,
    total: count ?? 0,
  });
}
export async function POST(request: Request) {
  const { supabase, user } = await getSession();
  if (!user)
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await request.json();
  const { error } = await supabase
    .from("reading_history")
    .upsert(
      {
        user_id: user.id,
        book_id: body.bookId,
        last_chapter: Math.max(1, Number(body.chapter ?? 1)),
        progress: Math.min(100, Math.max(0, Number(body.progress ?? 0))),
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "user_id,book_id" },
    );
  if (error) {
    console.error("[v0] POST /api/history failed", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
export async function DELETE() {
  const { supabase, user } = await getSession();
  if (!user)
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { error } = await supabase
    .from("reading_history")
    .delete()
    .eq("user_id", user.id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
