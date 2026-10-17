import { createPublicSupabaseClient } from "@/lib/supabase/server";
import type {
  Book,
  BookQuery,
  Category,
  Chapter,
  Paginated,
} from "@/lib/books/types";

function mapBook(row: any): Book {
  return {
    id: row.id,
    gutenbergId: row.gutenberg_id,
    title: row.title,
    author: row.authors?.[0] ?? "Unknown author",
    authors: row.authors ?? [],
    subjects: row.subjects ?? [],
    categories: row.categories ?? [],
    language: row.language,
    downloadCount: row.download_count ?? 0,
    coverUrl: row.cover_url ?? "",
    description: row.description ?? "",
    category: row.categories?.[0] ?? "General",
    rating: 0,
    publishedYear: new Date(row.created_at).getFullYear(),
    isExclusive: false,
    favorites: 0,
  };
}

export async function listCategories(): Promise<Category[]> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase.from("books").select("categories");
  if (error) throw error;
  const values = [
    ...new Set((data ?? []).flatMap((row) => row.categories ?? [])),
  ]
    .filter(Boolean)
    .sort();
  return values.map((name) => ({
    name,
    slug: name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
  }));
}

export async function listBooks({
  category,
  q,
  page = 1,
  limit = 24,
}: BookQuery): Promise<Paginated<Book>> {
  const supabase = createPublicSupabaseClient();
  let query = supabase.from("books").select("*", { count: "exact" });
  if (q) query = query.ilike("title", `%${q}%`);
  if (category && category !== "all")
    query = query.contains("categories", [category]);
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * limit;
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  if (error) throw error;
  const total = count ?? 0;
  return {
    data: (data ?? []).map(mapBook),
    page: safePage,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getBookById(id: string): Promise<Book | undefined> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .or(`id.eq.${id},gutenberg_id.eq.${Number(id)}`)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBook(data) : undefined;
}
export async function getChapters(bookId: string): Promise<Chapter[]> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("chapters")
    .select("id,book_id,chapter_number,title")
    .eq("book_id", bookId)
    .order("chapter_number");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    bookId: row.book_id,
    chapterNumber: row.chapter_number,
    title: row.title,
  }));
}
export async function getChapter(bookId: string, number: number) {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("chapters")
    .select("id,book_id,chapter_number,title,content")
    .eq("book_id", bookId)
    .eq("chapter_number", number)
    .maybeSingle();
  if (error) throw error;
  return data
    ? {
        id: data.id,
        bookId: data.book_id,
        chapterNumber: data.chapter_number,
        title: data.title,
        content: data.content,
      }
    : undefined;
}
