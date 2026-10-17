import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}
export async function GET() {
  const { supabase, user } = await getSession();
  if (!user)
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { data, error } = await supabase
    .from("downloads")
    .select("id, book_id, downloaded_at, books(*)")
    .eq("user_id", user.id)
    .order("downloaded_at", { ascending: false });
  if (error) {
    console.error("[v0] GET /api/downloads failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data: data ?? [] });
}
export async function POST(request: Request) {
  const { supabase, user } = await getSession();
  if (!user)
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await request.json();
  const { error } = await supabase
    .from("downloads")
    .upsert(
      { user_id: user.id, book_id: body.bookId },
      { onConflict: "user_id,book_id" },
    );
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
