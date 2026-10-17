import { NextResponse } from "next/server";
import { getBookById, getChapters } from "@/lib/books/repository";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const book = await getBookById(id);
  if (!book)
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  return NextResponse.json({
    data: book,
    chapters: await getChapters(book.id),
  });
}
