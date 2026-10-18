import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Log in to save highlights" },
      { status: 401 },
    );
  const body = await request.json();
  const quote = typeof body.quote === "string" ? body.quote.trim() : "";
  if (!quote)
    return NextResponse.json(
      { error: "Highlight text is required" },
      { status: 400 },
    );
  const { data, error } = await supabase
    .from("highlights")
    .insert({
      user_id: user.id,
      book_id: body.book_id ?? null,
      chapter_number: Number(body.chapter_number) || 1,
      chapter_name:
        typeof body.chapter_name === "string" ? body.chapter_name : "",
      quote,
      note: typeof body.note === "string" ? body.note : "",
      color: typeof body.color === "string" ? body.color : "yellow",
    })
    .select("id,quote,note,color,chapter_name,chapter_number,created_at")
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Log in to see your highlights" },
      { status: 401 },
    );
  const { data, error } = await supabase
    .from("highlights")
    .select(
      "id,quote,note,color,chapter_name,chapter_number,created_at,book:books(id,title,authors,cover_url)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    {
      data: (data ?? []).map((item: any) => ({
        ...item,
        quote: item.quote,
        chapter_title: item.chapter_name,
        book: item.book
          ? {
              ...item.book,
              author: item.book.authors?.join(", ") ?? "Unknown author",
            }
          : null,
      })),
    },
    {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
      },
    },
  );
}
