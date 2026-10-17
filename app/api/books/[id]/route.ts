import { NextResponse } from "next/server";
import { getBookById, getChapter } from "@/lib/books/repository";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const book = await getBookById(id);
  if (!book)
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  const url = new URL(request.url);
  const chapter = Number(url.searchParams.get("chapter") ?? 1);
  const current = await getChapter(book.id, chapter);
  return NextResponse.json({ data: book, chapter: current });
}
