import { NextResponse } from "next/server";
import { importBook } from "@/lib/books/import-book";

export async function POST(request: Request) {
  const expected = process.env.GUTENBERG_ADMIN_TOKEN;
  const authorization = request.headers.get("authorization");
  if (!expected || authorization !== `Bearer ${expected}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(
      { id: await importBook(await request.json()) },
      { status: 201 },
    );
  }  catch (error) {
    console.error("IMPORT ERROR:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : JSON.stringify(error);
    return NextResponse.json({ error: message }, { status: 400 });
}
}
