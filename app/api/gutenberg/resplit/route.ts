import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { splitText } from "@/lib/books/import-book";
export async function POST(request: Request) {
  if (
    request.headers.get("authorization") !==
    `Bearer ${process.env.GUTENBERG_ADMIN_TOKEN}`
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const db = createServiceSupabaseClient();
  const query = body.gutenberg_id
    ? db
        .from("books")
        .select("id,gutenberg_id")
        .eq("gutenberg_id", body.gutenberg_id)
    : db.from("books").select("id,gutenberg_id");
  const { data: books, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const results = [];
  for (const book of books ?? []) {
    try {
      const file = await db.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET ?? "book-raw-text")
        .download(`${book.gutenberg_id}.txt`);
      if (file.error) throw file.error;
      const chapters = splitText(await file.data.text());
      const deleted = await db.from("chapters").delete().eq("book_id", book.id);
      if (deleted.error) throw deleted.error;
      const inserted = await db
        .from("chapters")
        .insert(
          chapters.map((chapter) => ({
            book_id: book.id,
            chapter_number: chapter.chapterNumber,
            title: chapter.title,
            content: chapter.content,
          })),
        );
      if (inserted.error) throw inserted.error;
      results.push({
        gutenberg_id: book.gutenberg_id,
        chapters: chapters.length,
      });
    } catch (error) {
      results.push({
        gutenberg_id: book.gutenberg_id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return NextResponse.json({ results });
}
