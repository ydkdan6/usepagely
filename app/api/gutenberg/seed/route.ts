import { NextResponse } from "next/server";
import { seedPopularBooks } from "@/lib/books/catalog";

export const maxDuration = 60;

export async function POST(request: Request) {
  const expected = process.env.GUTENBERG_ADMIN_TOKEN;
  if (
    !expected ||
    request.headers.get("authorization") !== `Bearer ${expected}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await seedPopularBooks());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        imported: [],
        skipped: [],
        failed: [{ gutenberg_id: 0, error: message }],
      },
      { status: 502 },
    );
  }
}
