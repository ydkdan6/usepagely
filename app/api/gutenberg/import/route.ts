import { NextResponse } from "next/server";
import { importBook } from "@/lib/books/import-book";
import { createClient } from "@/lib/supabase/server";

const attempts = new Map<string, number[]>();
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  const now = Date.now();
  const recent = (attempts.get(user.id) ?? []).filter(
    (time) => now - time < 3600000,
  );
  if (recent.length >= 5)
    return NextResponse.json(
      { error: "Import limit reached. Try again later." },
      { status: 429 },
    );
  attempts.set(user.id, [...recent, now]);
  try {
    return NextResponse.json(await importBook(await request.json()), {
      status: 201,
    });
  } catch (error) {
    attempts.set(user.id, recent);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 },
    );
  }
}
