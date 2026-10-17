import { NextResponse } from "next/server";
import { gzipSync } from "node:zlib";
import { getBookById, listChapterContent } from "@/lib/books/repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const book = await getBookById(id);
  if (!book)
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  const page = Math.max(
    1,
    Number(new URL(request.url).searchParams.get("page") ?? 1),
  );
  const payload = JSON.stringify(await listChapterContent(book.id, page, 50));
  return new NextResponse(gzipSync(payload), {
    headers: {
      "content-type": "application/json",
      "content-encoding": "gzip",
      "cache-control": "public, max-age=3600",
    },
  });
}
