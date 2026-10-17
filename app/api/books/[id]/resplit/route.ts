import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { fetchBookText, getGutendexBook } from "@/lib/gutendex";
import { splitText } from "@/lib/books/import-book";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const expected = process.env.GUTENBERG_ADMIN_TOKEN;
  if (
    !expected ||
    request.headers.get("authorization") !== `Bearer ${expected}`
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = createServiceSupabaseClient();
  const { data: book, error } = await db
    .from("books")
    .select("id,gutenberg_id,title")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[v0] resplit lookup failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!book)
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  try {
    const text = await fetchBookText(await getGutendexBook(book.gutenberg_id));
    const chapters = splitText(text);
    await db.from("chapters").delete().eq("book_id", id);
    const inserted = await db
      .from("chapters")
      .insert(
        chapters.map((chapter) => ({
          book_id: id,
          chapter_number: chapter.chapterNumber,
          title: chapter.title,
          content: chapter.content,
        })),
      );
    if (inserted.error) throw inserted.error;
    console.log("[v0] Resplit book", {
      id,
      title: book.title,
      chapters: chapters.length,
    });
    return NextResponse.json({
      id,
      title: book.title,
      chapters: chapters.length,
    });
  } catch (err) {
    console.error("[v0] resplit failed", { id, error: err });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
