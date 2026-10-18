import { NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

type Entry = {
  word?: string;
  phonetic?: string;
  phonetics?: { text?: string; audio?: string }[];
  meanings?: {
    partOfSpeech?: string;
    definitions?: { definition?: string; example?: string }[];
  }[];
};
const limits = new Map<string, { count: number; reset: number }>();
function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, "")
    .trim()
    .split(/\s+/)[0]
    .replace(/^[^a-z]+|[^a-z]+$/g, "");
}
function baseForms(word: string) {
  return [
    ...new Set(
      [
        word,
        word.replace(/ies$/, "y"),
        word.replace(/s$/, ""),
        word.replace(/ed$/, ""),
        word.replace(/ing$/, ""),
      ].filter(Boolean),
    ),
  ];
}
function shape(entries: Entry[], requested: string) {
  return {
    word: entries[0]?.word ?? requested,
    phonetic:
      entries.find((e) => e.phonetic)?.phonetic ??
      entries.flatMap((e) => e.phonetics ?? []).find((p) => p.text)?.text ??
      "",
    audio:
      entries.flatMap((e) => e.phonetics ?? []).find((p) => p.audio)?.audio ??
      "",
    meanings: entries
      .flatMap((e) =>
        (e.meanings ?? []).map((m) => ({
          partOfSpeech: m.partOfSpeech ?? "",
          definitions: (m.definitions ?? [])
            .slice(0, 3)
            .map((d) => ({
              definition: d.definition ?? "",
              example: d.example ?? "",
            })),
        })),
      )
      .filter((m) => m.definitions.length > 0)
      .slice(0, 3),
  };
}
export async function GET(request: Request) {
  const value = new URL(request.url).searchParams.get("word") ?? "";
  const word = normalize(value);
  if (!word || word.length > 64)
    return NextResponse.json(
      { error: "Enter one valid word." },
      { status: 400 },
    );
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const current = limits.get(ip);
  if (!current || current.reset <= now)
    limits.set(ip, { count: 1, reset: now + 60_000 });
  else if (current.count >= 30)
    return NextResponse.json(
      { error: "Too many lookups. Please try again in a minute." },
      { status: 429 },
    );
  else current.count++;
  const supabase = createPublicSupabaseClient();
  const cached = await supabase
    .from("dictionary_cache")
    .select("data")
    .eq("word", word)
    .maybeSingle();
  if (cached.data?.data)
    return NextResponse.json(
      { data: cached.data.data, cached: true },
      {
        headers: {
          "Cache-Control":
            "public, max-age=86400, stale-while-revalidate=604800",
        },
      },
    );
  let data: ReturnType<typeof shape> | null = null;
  for (const candidate of baseForms(word)) {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(candidate)}`,
      { next: { revalidate: 86400 } },
    );
    if (response.ok) {
      data = shape(await response.json(), candidate);
      break;
    }
  }
  if (!data)
    return NextResponse.json(
      { error: "No definition found" },
      { status: 404, headers: { "Cache-Control": "public, max-age=300" } },
    );
  await supabase.from("dictionary_cache").upsert({ word, data });
  return NextResponse.json(
    { data, cached: false },
    {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    },
  );
}
