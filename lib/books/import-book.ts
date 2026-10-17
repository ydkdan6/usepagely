import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { fetchBookHtml, fetchBookText, getGutendexBook } from "@/lib/gutendex";
import { z } from "zod";
import { bookCategories } from "@/lib/books/catalog";
import { resolveEnglishDescription } from "@/lib/books/descriptions";
export const importSchema = z.object({
  gutenberg_id: z.coerce.number().int().positive(),
});
export function sanitizeBookHtml(raw: string, baseUrl: string) {
  const allowed = new Set([
    "P",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "EM",
    "STRONG",
    "BLOCKQUOTE",
    "IMG",
    "BR",
    "HR",
    "UL",
    "OL",
    "LI",
    "A",
  ]);
  return raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(
      /<\/?([a-z0-9]+)([^>]*)>/gi,
      (_full, tag: string, attrs: string) => {
        if (!allowed.has(tag.toUpperCase())) return "";
        if (/^\//.test(tag)) return `</${tag.toLowerCase()}>`;
        const safe = attrs
          .replace(
            /\s+(?:on[a-z]+|style|srcdoc)\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)/gi,
            "",
          )
          .replace(
            /\s+(src|href)\s*=\s*([\"'])(.*?)\2/gi,
            (_match, name, quote, value) => {
              try {
                const absolute = new URL(value, baseUrl);
                if (!/^https?:$/i.test(absolute.protocol)) return "";
                return ` ${name}=${quote}${absolute.href}${quote}`;
              } catch {
                return "";
              }
            },
          );
        return tag.toUpperCase() === "IMG"
          ? `<img${safe} loading="lazy" decoding="async">`
          : `<${tag.toLowerCase()}${safe}>`;
      },
    );
}

export function cleanGutenbergText(raw: string) {
  const normalized = raw.replace(/\r\n?/g, "\n");
  const start = normalized.search(
    /^\s*\*{3}\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*\*{3}\s*$/im,
  );
  const end = normalized.search(
    /^\s*\*{3}\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*$/im,
  );
  const body = normalized.slice(
    start >= 0 ? normalized.indexOf("\n", start) + 1 : 0,
    end >= 0 ? end : normalized.length,
  );
  return body
    .replace(
      /^(?:[\s\S]{0,6000}?)(?=^\s*(?:(?:CHAPTER|BOOK|PART|LETTER|STAVE|ACT|SCENE)\b|[IVXLCDM]{1,12}[.)]?\s*$))/im,
      "",
    )
    .trim();
}

export function splitText(raw: string) {
  const text = cleanGutenbergText(raw);
  if (!text) throw new Error("Book text is empty");
  const heading =
    /^(\s*(?:(?:CHAPTER|BOOK|PART|LETTER|STAVE|ACT|SCENE)\b[^\n]*|[IVXLCDM]{1,12}[.)]?\s*[^\n]*))$/gim;
  const matches = [...text.matchAll(heading)].filter(
    (match) => !/^\s*(?:contents|table of contents)\s*$/i.test(match[1]),
  );
  if (matches.length < 2) {
    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length) {
      let end = Math.min(18000, remaining.length);
      if (end < remaining.length) {
        const boundary = remaining.lastIndexOf("\n\n", end);
        if (boundary > 5000) end = boundary;
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
  const rawHtml = await fetchBookHtml(book);
  const chapters = splitText(rawText);
  const safeHtml = rawHtml
    ? sanitizeBookHtml(rawHtml, book.formats["text/html"]!)
    : null;
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
        html_content: safeHtml ? safeHtml : null,
      })),
    );
  if (insertError) throw insertError;
  revalidateTag("books", "max");
  revalidatePath("/library");
  return saved.id;
}
