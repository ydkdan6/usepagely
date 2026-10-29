import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { scanAllBookImages, repairBookImages } from "@/lib/books/import-book";

export const runtime = "nodejs";
export const maxDuration = 60;

function hasAdminToken(request: Request) {
  const expected = process.env.GUTENBERG_ADMIN_TOKEN;
  const header = request.headers.get("authorization") ?? "";

  if (!expected || !header.startsWith("Bearer ")) return false;

  const given = Buffer.from(header.slice(7));
  const wanted = Buffer.from(expected);

  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

export async function POST(request: Request) {
  if (!hasAdminToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const mode = body.mode ?? "scan";

    if (mode === "scan") {
      const offset = Number(body.offset ?? 0);

      if (!Number.isInteger(offset) || offset < 0) {
        return NextResponse.json(
          { error: "offset must be a non-negative integer" },
          { status: 400 },
        );
      }

      const result = await scanAllBookImages(offset, 25);

      console.log("[repair] Scan batch completed", {
        offset: result.offset,
        books_scanned: result.books_scanned,
        books_needing_repair: result.books_needing_repair,
        affected_chapters: result.affected_chapters,
        next_offset: result.next_offset,
      });

      return NextResponse.json(result);
    }

    if (mode === "repair") {
      const gutenbergId = Number(body.gutenberg_id);

      if (!Number.isSafeInteger(gutenbergId) || gutenbergId <= 0) {
        return NextResponse.json(
          { error: "A valid gutenberg_id is required" },
          { status: 400 },
        );
      }

      console.log(`[repair] Starting repair for Gutenberg book ${gutenbergId}`);

      const result = await repairBookImages(gutenbergId, false);

      console.log("[repair] Book repair completed", {
        gutenberg_id: gutenbergId,
        repaired: result.repaired,
        failed: result.failed,
      });

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'mode must be "scan" or "repair"' },
      { status: 400 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.error("[repair] Request failed:", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
