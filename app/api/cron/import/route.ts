import { NextResponse } from "next/server";
import { popularGutendex } from "@/lib/gutendex";
import { importBook } from "@/lib/books/import-book";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function GET(request: Request) {
  if (
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createServiceSupabaseClient();
  const { data: job } = await db
    .from("import_jobs")
    .select("page")
    .eq("job_key", "catalog-cron")
    .maybeSingle();
  const page = job?.page ?? 1;
  const result = await popularGutendex(page);
  let imported = 0;
  for (const book of result.results.slice(0, 10)) {
    try {
      await importBook({ gutenberg_id: book.id });
      imported += 1;
    } catch (error) {
      await db
        .from("import_jobs")
        .update({
          status: "failed",
          failures: [
            {
              id: book.id,
              message: error instanceof Error ? error.message : "Import failed",
            },
          ],
          updated_at: new Date().toISOString(),
        })
        .eq("job_key", "catalog-cron");
    }
  }
  await db
    .from("import_jobs")
    .upsert(
      {
        job_key: "catalog-cron",
        status: "idle",
        page: page + 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "job_key" },
    );
  return NextResponse.json({ imported, page });
}
