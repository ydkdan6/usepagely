import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { data, error } = await supabase
    .from("saved_books")
    .select("book_id,created_at,books(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { bookId } = await request.json();
  if (typeof bookId !== "string" || !bookId)
    return NextResponse.json(
      { error: "A valid book is required" },
      { status: 400 },
    );
  const { error } = await supabase
    .from("saved_books")
    .upsert(
      { user_id: user.id, book_id: bookId },
      { onConflict: "user_id,book_id" },
    );
  if (error) {
    console.error("[v0] POST /api/saved-books failed", {
      userId: user.id,
      bookId,
      error,
    });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
