import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { importBook } from "@/lib/books/import-book";

export async function POST(request: Request) {
  if (
    request.headers.get("authorization") !==
    `Bearer ${process.env.SUPABASE_SECRET_KEY}`
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("books")
    .select("gutenberg_id")
    .not("gutenberg_id", "is", null);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const results = [];
  for (const row of data ?? []) {
    try {
      await importBook({ gutenberg_id: row.gutenberg_id });
      results.push({ gutenberg_id: row.gutenberg_id, ok: true });
    } catch (cause) {
      results.push({
        gutenberg_id: row.gutenberg_id,
        ok: false,
        error: cause instanceof Error ? cause.message : "Reimport failed",
      });
    }
  }
  return NextResponse.json({ data: results });
}
