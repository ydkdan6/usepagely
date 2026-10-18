import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { importBook } from "@/lib/books/import-book";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || token !== process.env.SUPABASE_SECRET_KEY)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = createServiceSupabaseClient();
  const { data, error } = await db
    .from("books")
    .select("gutenberg_id")
    .eq("id", id)
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 404 });
  try {
    await importBook({ gutenberg_id: data.gutenberg_id });
    return NextResponse.json({ ok: true });
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Reimport failed" },
      { status: 500 },
    );
  }
}
