import { NextResponse } from "next/server";
import { ensureCatalog } from "@/lib/books/catalog";

export const maxDuration = 60;

export async function POST() {
  try {
    await ensureCatalog();
    return NextResponse.json({ started: true, completed: true });
  } catch (error) {
    console.error("[v0] Catalog seed failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Catalog seed failed" },
      { status: 503 },
    );
  }
}
