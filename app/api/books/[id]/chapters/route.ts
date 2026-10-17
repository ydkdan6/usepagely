import { NextResponse } from "next/server";
import { getBookById, listChapterTitles } from "@/lib/books/repository";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const book = await getBookById(id);
  if (!book)
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  return NextResponse.json(await listChapterTitles(book.id, page, 20));
}
