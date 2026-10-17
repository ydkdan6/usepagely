import { NextResponse } from "next/server";
import { listCategories } from "@/lib/books/repository";

export async function GET() {
  return NextResponse.json({ data: await listCategories() });
}
