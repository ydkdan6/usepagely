import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const cache = new Map<string, { at: number; value: unknown }>();
const hits = new Map<string, number[]>();
const querySchema = z.string().trim().min(2).max(120);
type GutenbergSuggestion = {
  id: number;
  title: string;
  authors?: { name: string }[];
};
const similarity = (query: string, title: string) => {
  const a = query.toLowerCase().replace(/[^a-z0-9]/g, "");
  const b = title.toLowerCase().replace(/[^a-z0-9]/g, "");
  let score = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++)
    if (a[i] === b[i]) score += 1;
  return score / Math.max(a.length, b.length, 1);
};

async function fetchGutenberg(query: string): Promise<GutenbergSuggestion[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(
      `https://gutendex.com/books/?languages=en&search=${encodeURIComponent(query)}&page=1`,
      {
        signal: controller.signal,
        headers: { accept: "application/json" },
        cache: "no-store",
      },
    );
    if (!response.ok) return [];
    const body = await response.json();
    return body.results ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("q") ?? "";
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success)
    return NextResponse.json({ library: [], gutenberg: [], didYouMean: [] });
  const q = parsed.data;
  const now = Date.now();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
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
  if (cached && now - cached.at < 600000)
    return NextResponse.json(cached.value);
  const db = createServiceSupabaseClient();
  const { data: libraryData } = await db
    .rpc("search_books", { search_query: q })
    .limit(8);
  const library = libraryData ?? [];
  let gutenberg: GutenbergSuggestion[] = [];
  let didYouMean: GutenbergSuggestion[] = [];
  let gutenbergSlow = false;
  if (library.length < 8) {
    try {
      gutenberg = await fetchGutenberg(q);
      if (!gutenberg.length) {
        const longest = q
          .split(/\s+/)
          .sort((a, b) => b.length - a.length)[0]
          ?.slice(0, 6);
        if (longest && longest.length >= 2)
          didYouMean = (await fetchGutenberg(longest))
            .sort((a, b) => similarity(q, b.title) - similarity(q, a.title))
            .slice(0, 8);
      }
    } catch (error) {
      gutenbergSlow = true;
      console.error("[search/suggest] Gutendex failed", {
        error,
        cause: error instanceof Error ? error.cause : undefined,
      });
    }
  }
  const value = {
    library: library.slice(0, 8),
    gutenberg: gutenberg.slice(0, 8),
    didYouMean,
    gutenbergSlow,
  };
  cache.set(key, { at: now, value });
  return NextResponse.json(value);
}
