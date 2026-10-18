import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { searchGutendex } from "@/lib/gutendex";

const cache = new Map<string, { at: number; value: unknown }>();
const hits = new Map<string, number[]>();
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ library: [], gutenberg: [] });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < 60000);
  if (recent.length >= 30)
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many searches. Please wait a moment.",
        },
      },
      { status: 429 },
    );
  hits.set(ip, [...recent, now]);
  const key = q.toLowerCase();
  const cached = cache.get(key);
  if (cached && now - cached.at < 300000)
    return NextResponse.json(cached.value);
  try {
    const db = createServiceSupabaseClient();
    const pattern = `%${q.replace(/[%_]/g, "\\$&")} %`.replace(" %", "%");
    const { data: library } = await db
      .from("books")
      .select("id,title,authors,cover_url")
      .or(`title.ilike.${pattern},authors.cs.{${q}}`)
      .limit(8);
    let gutenberg: unknown[] = [];
    if ((library?.length ?? 0) < 5) {
      const result = await searchGutendex(q);
      gutenberg = result.results.slice(0, 8 - (library?.length ?? 0));
    }
    const value = { library: library ?? [], gutenberg };
    cache.set(key, { at: now, value });
    return NextResponse.json(value);
  } catch (error) {
    console.error("[search/suggest] failed", {
      error,
      cause: error instanceof Error ? error.cause : undefined,
    });
    return NextResponse.json(
      {
        error: {
          code: "SEARCH_FAILED",
          message: error instanceof Error ? error.message : "Search failed",
        },
      },
      { status: 503 },
    );
  }
}
