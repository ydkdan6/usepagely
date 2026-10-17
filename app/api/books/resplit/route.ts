import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { importBook } from "@/lib/books/import-book";
export async function POST(request: Request) {
  const expected = process.env.GUTENBERG_ADMIN_TOKEN;
  if (
    !expected ||
    request.headers.get("authorization") !== `Bearer ${expected}`
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createServiceSupabaseClient();
  const { data: books, error } = await db
    .from("books")
    .select("id,gutenberg_id,title")
    .order("created_at");
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const results = [];
  for (const book of books ?? []) {
    try {
      await importBook({ gutenberg_id: book.gutenberg_id });
      const { count } = await db
        .from("chapters")
        .select("id", { count: "exact", head: true })
        .eq("book_id", book.id);
      console.log("[v0] Resplit book", {
        id: book.id,
        title: book.title,
        chapters: count ?? 0,
      });
      results.push({ id: book.id, title: book.title, chapters: count ?? 0 });
    } catch (err) {
      console.error("[v0] Bulk resplit failed", { id: book.id, error: err });
      results.push({
        id: book.id,
        title: book.title,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return NextResponse.json({ results });
}
