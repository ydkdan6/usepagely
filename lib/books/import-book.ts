import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { fetchBookText, getGutendexBook } from "@/lib/gutendex";
import { z } from "zod";
import { bookCategories } from "@/lib/books/catalog";
import { resolveEnglishDescription } from "@/lib/books/descriptions";
export const importSchema = z.object({
  gutenberg_id: z.coerce.number().int().positive(),
});
export function splitText(raw: string) {
  const text = raw
    .replace(/\\r/g, "")
    .replace(/^[\\s\\S]*?\\*\\*\\* START OF[^\\n]*\\n/i, "")
    .replace(/\\n\\*\\*\\* END OF[\\s\\S]*$/i, "")
    .trim();
  if (!text) throw new Error("Book text is empty");
  const heading =
    /(?:^|\\n)\\s*((?:(?:CHAPTER|BOOK|PART|LETTER|STAVE)\\s+[A-Z0-9IVXLCDM][^\\n]*)|(?:CHAPTER|BOOK|PART|LETTER|STAVE)\\s*[^\\n]*)/gi;
  const matches = [...text.matchAll(heading)];
  if (matches.length < 2) {
    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length) {
      let end = Math.min(5000, remaining.length);
      if (end < remaining.length) {
        const boundary = remaining.lastIndexOf("\\n\\n", end);
        if (boundary > 1000) end = boundary;
      }
      chunks.push(remaining.slice(0, end).trim());
      remaining = remaining.slice(end).trim();
    }
    return chunks
      .filter(Boolean)
      .map((content, i) => ({
        chapterNumber: i + 1,
        title: `Part ${i + 1}`,
        content,
      }));
  }
  return matches
    .map((match, i) => ({
      chapterNumber: i + 1,
      title: match[1].trim(),
      content: text
        .slice(
          match.index! + match[0].length,
          matches[i + 1]?.index ?? text.length,
        )
        .trim(),
    }))
    .filter((chapter) => chapter.content.length > 0);
}
async function openLibraryDescription(book: {
  title: string;
  authors: { name: string }[];
}) {
  try {
    const params = new URLSearchParams({
      title: book.title,
      author: book.authors[0]?.name ?? "",
    });
    const response = await fetch(
      `https://openlibrary.org/search.json?${params}`,
      { next: { revalidate: 86400 } },
    );
    const data = await response.json();
    return (
      data.docs?.[0]?.first_sentence?.value ??
      data.docs?.[0]?.description ??
      null
    );
  } catch {
    return null;
  }
}

export async function importBook(input: unknown) {
  const { gutenberg_id } = importSchema.parse(input);
  const book = await getGutendexBook(gutenberg_id);
  const rawText = await fetchBookText(book);
  const chapters = splitText(rawText);
  if (!chapters.length) throw new Error("No chapters found");
  const supabase = createServiceSupabaseClient();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "book-raw-text";
  const rawPath = `${gutenberg_id}.txt`;
  const uploaded = await supabase.storage
    .from(bucket)
    .upload(rawPath, new Blob([rawText], { type: "text/plain" }), {
      upsert: true,
    });
  if (uploaded.error) throw uploaded.error;
  const { data: saved, error: bookError } = await supabase
    .from("books")
    .upsert(
      {
        gutenberg_id,
        title: book.title,
        authors: book.authors.map((author) => author.name),
        subjects: book.subjects,
        language: book.languages[0] ?? "en",
        cover_url: book.formats["image/jpeg"] ?? null,
        categories: bookCategories(book.subjects ?? [], book.bookshelves ?? []),
        download_count: book.download_count ?? 0,
        description: await resolveEnglishDescription(book),
      },
      { onConflict: "gutenberg_id" },
    )
    .select("id")
    .single();
  if (bookError) throw bookError;
  const { error: chapterError } = await supabase
    .from("chapters")
    .delete()
    .eq("book_id", saved.id);
  if (chapterError) throw chapterError;
  const { error: insertError } = await supabase
    .from("chapters")
    .insert(
      chapters.map((chapter) => ({
        book_id: saved.id,
        chapter_number: chapter.chapterNumber,
        title: chapter.title,
        content: chapter.content,
      })),
    );
  if (insertError) throw insertError;
  revalidateTag("books", "max");
  revalidatePath("/library");
  return saved.id;
}
