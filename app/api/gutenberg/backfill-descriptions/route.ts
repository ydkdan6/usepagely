import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getGutendexBook } from "@/lib/gutendex";
import { resolveEnglishDescription } from "@/lib/books/descriptions";

export async function POST(request: Request) {
  if (
    request.headers.get("authorization") !==
    `Bearer ${process.env.GUTENBERG_ADMIN_TOKEN}`
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createServiceSupabaseClient();
  const { data: books, error } = await db
    .from("books")
    .select("id,gutenberg_id")
    .or("description.is.null,description.eq.");
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const results = [];
  for (const row of books ?? []) {
    try {
      const book = await getGutendexBook(row.gutenberg_id);
      const description = await resolveEnglishDescription(book);
      await db.from("books").update({ description }).eq("id", row.id);
      results.push({ id: row.gutenberg_id, description: Boolean(description) });
    } catch (error) {
      results.push({
        id: row.gutenberg_id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return NextResponse.json({ results });
}
