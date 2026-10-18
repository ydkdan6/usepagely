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
    .from("my_words")
    .select("id,word,definition,book_id,created_at")
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
  const body = await request.json().catch(() => ({}));
  const word =
    typeof body.word === "string"
      ? body.word.toLowerCase().trim().slice(0, 64)
      : "";
  const definition =
    typeof body.definition === "string"
      ? body.definition.trim().slice(0, 1000)
      : "";
  if (!word || !definition)
    return NextResponse.json(
      { error: "Word and definition are required." },
      { status: 400 },
    );
  const { data, error } = await supabase
    .from("my_words")
    .upsert(
      {
        user_id: user.id,
        word,
        definition,
        book_id: typeof body.bookId === "string" ? body.bookId : null,
      },
      { onConflict: "user_id,word,book_id" },
    )
    .select("id,word,definition,book_id,created_at")
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
