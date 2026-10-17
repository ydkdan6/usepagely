import { NextResponse } from "next/server";
import { getBookById, getChapter } from "@/lib/books/repository";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string; number: string }> },
) {
  const { id, number } = await params;
  const book = await getBookById(id);
  if (!book)
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  const chapter = await getChapter(book.id, Number(number));
  if (!chapter)
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  return NextResponse.json({ data: chapter });
}
