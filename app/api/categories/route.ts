import { NextResponse } from "next/server";
import { listCategories } from "@/lib/books/repository";

export async function GET() {
  try {
    return NextResponse.json({ data: await listCategories() });
  } catch (error) {
    console.error("[v0] GET /api/categories failed", error);
    return NextResponse.json(
      { error: "Unable to load categories" },
      { status: 500 },
    );
  }
}
