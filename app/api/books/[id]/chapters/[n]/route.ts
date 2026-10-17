import { NextResponse } from "next/server";
import { getChapter } from "@/lib/books/repository";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string; n: string }> },
) {
  const { id, n } = await params;
  const chapter = await getChapter(id, Number(n));
  if (!chapter)
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  return NextResponse.json({ data: chapter });
}
