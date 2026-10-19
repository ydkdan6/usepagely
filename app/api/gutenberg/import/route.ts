import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { importBook } from "@/lib/books/import-book";
import { createClient } from "@/lib/supabase/server";

const attempts = new Map<string, number[]>();

function hasAdminToken(request: Request) {
  const expected = process.env.GUTENBERG_ADMIN_TOKEN;
  const header = request.headers.get("authorization") ?? "";
  if (!expected || !header.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice(7));
  const wanted = Buffer.from(expected);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

export async function POST(request: Request) {
  const isAdmin = hasAdminToken(request);
  let userId: string | null = null;
  let recent: number[] = [];

  if (!isAdmin) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Login required" }, { status: 401 });

    userId = user.id;
    const now = Date.now();
    recent = (attempts.get(userId) ?? []).filter((t) => now - t < 3600000);
    if (recent.length >= 5)
      return NextResponse.json(
        { error: "Import limit reached. Try again later." },
        { status: 429 },
      );
    attempts.set(userId, [...recent, now]);
  }

  try {
    return NextResponse.json(await importBook(await request.json()), {
      status: 201,
    });
  } catch (error) {
    if (userId) attempts.set(userId, recent);
    console.error("IMPORT ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 },
    );
  }
}
