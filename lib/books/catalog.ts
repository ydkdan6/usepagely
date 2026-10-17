import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { importBook } from "@/lib/books/import-book";
import { popularGutendex } from "@/lib/gutendex";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
export function bookCategories(subjects: string[], bookshelves: string[] = []) {
  return [
    ...new Set([...subjects, ...bookshelves].map(slugify).filter(Boolean)),
  ];
}

export async function ensureCatalog() {
  const db = createServiceSupabaseClient();
  const { count, error: countError } = await db
    .from("books")
    .select("id", { count: "exact", head: true });
  if (countError) throw countError;
  if ((count ?? 0) >= 50) return;
  const now = new Date().toISOString();
  const { data: existing } = await db
    .from("import_jobs")
    .select("status, locked_at")
    .eq("job_key", "catalog-seed")
    .maybeSingle();
  if (
    existing?.status === "running" &&
    existing.locked_at &&
    Date.now() - Date.parse(existing.locked_at) < 10 * 60 * 1000
  )
    return;
  const lock = await db
    .from("import_jobs")
    .upsert(
      {
        job_key: "catalog-seed",
        status: "running",
        failures: [],
        locked_at: now,
        updated_at: now,
      },
      { onConflict: "job_key" },
    );
  if (lock.error) throw lock.error;
  try {
    const result = await popularGutendex(1);
    const failures = [];
    for (const book of result.results.slice(0, 10)) {
      try {
        await importBook({ gutenberg_id: book.id });
      } catch (error) {
        failures.push({
          id: book.id,
          message: error instanceof Error ? error.message : "Import failed",
        });
      }
    }
    await db
      .from("import_jobs")
      .update({
        status: failures.length ? "failed" : "idle",
        failures,
        updated_at: new Date().toISOString(),
      })
      .eq("job_key", "catalog-seed");
  } catch (error) {
    await db
      .from("import_jobs")
      .update({
        status: "failed",
        failures: [
          {
            message: error instanceof Error ? error.message : "Gutendex failed",
          },
        ],
        updated_at: new Date().toISOString(),
      })
      .eq("job_key", "catalog-seed");
  }
}
