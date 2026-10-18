import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { importBook } from "@/lib/books/import-book";

const schema = z.object({ gutenberg_id: z.coerce.number().int().positive() });
const attempts = new Map<string, number[]>();
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHENTICATED",
          message: "Please log in to continue.",
        },
      },
      { status: 401 },
    );
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Choose a valid Gutenberg book.",
        },
      },
      { status: 400 },
    );
  const now = Date.now();
  const recent = (attempts.get(user.id) ?? []).filter(
    (time) => now - time < 3600000,
  );
  if (recent.length >= 5)
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "You have reached the import limit. Please try again later.",
        },
      },
      { status: 429 },
    );
  try {
    const result = await importBook(parsed.data);
    attempts.set(user.id, [...recent, now]);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[gutenberg/add] import failed", {
      error,
      cause: error instanceof Error ? error.cause : undefined,
    });
    return NextResponse.json(
      {
        error: {
          code: "IMPORT_FAILED",
          message: error instanceof Error ? error.message : "Import failed",
        },
      },
      { status: 500 },
    );
  }
}
