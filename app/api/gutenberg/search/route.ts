import { NextResponse } from "next/server";
import { searchGutendex } from "@/lib/gutendex";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });
  try {
    const result = await searchGutendex(q);
    const db = createServiceSupabaseClient();
    const { data } = await db
      .from("books")
      .select("gutenberg_id")
      .in(
        "gutenberg_id",
        result.results.map((book) => book.id),
      );
    const imported = new Set((data ?? []).map((book) => book.gutenberg_id));
    return NextResponse.json({
      results: result.results.map((book) => ({
        ...book,
        alreadyImported: imported.has(book.id),
      })),
    });
  } catch (error) {
    console.error("[gutendex] search failed", {
      error,
      cause: error instanceof Error ? error.cause : undefined,
    });
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: { code: "GUTENDEX_SEARCH_FAILED", message } },
      { status: 503 },
    );
  }
}
