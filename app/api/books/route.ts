import { NextResponse, type NextRequest } from "next/server";
import { listBooks } from "@/lib/books/repository";
import { getSection } from "@/lib/books/sections";

const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const section = getSection(params.get("section") ?? "latest");

  if (!section) {
    return NextResponse.json({ error: "Unknown section" }, { status: 400 });
  }

  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.parseInt(params.get("limit") ?? "10", 10) || 10),
  );

  const result = await listBooks({
    section: section.slug,
    category: params.get("category") ?? undefined,
    q: params.get("q")?.slice(0, 100) ?? undefined,
    page,
    limit,
  });

  return NextResponse.json(result);
}
