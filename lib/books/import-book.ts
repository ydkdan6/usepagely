import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { fetchBookText, getGutendexBook } from "@/lib/gutendex";
import { z } from "zod";
import { bookCategories } from "@/lib/books/catalog";
export const importSchema = z.object({
  gutenberg_id: z.coerce.number().int().positive(),
});
function splitText(raw: string) {
  const text = raw
    .replace(/\\r/g, "")
    .replace(/^[\\s\\S]*?\\*\\*\\* START OF[^\\n]*\\n/i, "")
    .replace(/\\n\\*\\*\\* END OF[\\s\\S]*$/i, "")
    .trim();
  if (!text) throw new Error("Book text is empty");
  const matches = [
    ...text.matchAll(/(?:^|\\n)\\s*(CHAPTER\\s+(?:[IVXLCDM]+|\\d+)[^\\n]*)/gi),
  ];
  if (!matches.length) {
    const chunks = text.match(/[\s\S]{1,5000}/g) ?? [];
    return chunks
      .map((content, i) => ({
        chapterNumber: i + 1,
        title: `Part ${i + 1}`,
        content: content.trim(),
      }))
      .filter((chapter) => chapter.content);
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
        description:
          book.summaries?.[0] ?? (await openLibraryDescription(book)),
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
