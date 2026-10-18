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
    downloadSize: row.download_size ?? 0,
    isExclusive: row.featured === true,
    coverUrl: row.cover_url ?? "",
    description: row.description ?? "",
    category: row.categories?.[0] ?? "General",
    rating: row.avg_rating ?? 0,
    ratingCount: row.rating_count ?? 0,
    publishedYear: new Date(row.created_at).getFullYear(),
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
  section = "latest",
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
  if (section === "exclusive") query = query.eq("featured", true);
  if (section === "highly-rated")
    query = query.order("download_count", { ascending: false });
  else if (section !== "recommended")
    query = query.order("created_at", { ascending: false });
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * limit;
  const { data, count, error } = await query.range(from, from + limit - 1);
  if (error) {
    console.error("[v0] listBooks failed", { section, error });
    throw error;
  }
  const total = count ?? 0;
  const rows = [...(data ?? [])];
  if (section === "recommended") rows.sort(() => Math.random() - 0.5);
  return {
    data: rows.map(mapBook),
    page: safePage,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function getBookById(id: string): Promise<Book | undefined> {
  const supabase = createPublicSupabaseClient();
  const query = uuidPattern.test(id)
    ? supabase.from("books").select("*").eq("id", id).maybeSingle()
    : /^\d+$/.test(id)
      ? supabase
          .from("books")
          .select("*")
          .eq("gutenberg_id", Number(id))
          .maybeSingle()
      : null;
  if (!query) return undefined;
  const { data, error } = await query;
  if (error) {
    console.error("[v0] getBookById failed", { id, error });
    throw error;
  }
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
export async function listChapterTitles(bookId: string, page = 1, limit = 20) {
  const supabase = createPublicSupabaseClient();
  const from = (page - 1) * limit;
  const { data, count, error } = await supabase
    .from("chapters")
    .select("id,chapter_number,title", { count: "exact" })
    .eq("book_id", bookId)
    .order("chapter_number")
    .range(from, from + limit - 1);
  if (error) throw error;
  return {
    data: (data ?? []).map((row) => ({
      id: row.id,
      chapterNumber: row.chapter_number,
      title: row.title,
    })),
    page,
    limit,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}

export async function listChapterContent(bookId: string, page = 1, limit = 50) {
  const supabase = createPublicSupabaseClient();
  const from = (page - 1) * limit;
  const { data, count, error } = await supabase
    .from("chapters")
    .select(
      "id,book_id,chapter_number,title,content,html_content,content_format",
      { count: "exact" },
    )
    .eq("book_id", bookId)
    .order("chapter_number")
    .range(from, from + limit - 1);
  if (error) throw error;
  return {
    data: (data ?? []).map((row) => ({
      id: row.id,
      bookId: row.book_id,
      chapterNumber: row.chapter_number,
      title: row.title,
      content: row.content,
      contentFormat: row.content_format,
      htmlContent: row.html_content ?? undefined,
    })),
    page,
    limit,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}

export async function getChapter(bookId: string, number: number) {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("chapters")
    .select(
      "id,book_id,chapter_number,title,content,html_content,content_format",
    )
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
        contentFormat: data.content_format,
        htmlContent: data.html_content ?? undefined,
      }
    : undefined;
}
