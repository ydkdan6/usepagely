import { NextResponse, type NextRequest } from "next/server";
import { listBooks } from "@/lib/books/repository";
import { getSection } from "@/lib/books/sections";
import { apiError } from "@/lib/api-error";

const MAX_LIMIT = 24;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const section = getSection(params.get("section") ?? "latest");

  if (!section) {
    return apiError(new Error("Unknown section"), 404, "general");
  }

  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.min(
      24,
      Math.max(1, Number.parseInt(params.get("limit") ?? "24", 10) || 24),
    ),
  );

  try {
    const result = await listBooks({
      section: section.slug,
      category: params.get("category") ?? undefined,
      q: params.get("q")?.slice(0, 100) ?? undefined,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[v0] Failed to load books", error);
    return apiError(error, 503, "general");
  }
}
