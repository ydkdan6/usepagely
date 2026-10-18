import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function POST(
  _: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  if (!bookId)
    return NextResponse.json(
      { error: "A valid book is required" },
      { status: 400 },
    );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { data, error } = await supabase
    .from("saved_books")
    .upsert(
      { user_id: user.id, book_id: bookId },
      { onConflict: "user_id,book_id", ignoreDuplicates: true },
    )
    .select("user_id,book_id,created_at")
    .single();
  if (error) {
    console.error("[v0] POST /api/saved-books failed", {
      userId: user.id,
      bookId,
      error,
    });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ data });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  if (!bookId)
    return NextResponse.json(
      { error: "A valid book is required" },
      { status: 400 },
    );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { error } = await supabase
    .from("saved_books")
    .delete()
    .eq("user_id", user.id)
    .eq("book_id", bookId);
  if (error) {
    console.error("[v0] DELETE /api/saved-books failed", {
      userId: user.id,
      bookId,
      error,
    });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
