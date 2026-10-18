import { revalidatePath, revalidateTag } from "next/cache";
import sanitizeHtml from "sanitize-html";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { fetchBookHtml, fetchBookText, getGutendexBook } from "@/lib/gutendex";
import { z } from "zod";
import { bookCategories } from "@/lib/books/catalog";
import { resolveEnglishDescription } from "@/lib/books/descriptions";

export const importSchema = z.object({
  gutenberg_id: z.coerce.number().int().positive(),
});

export function cleanGutenbergHtml(raw: string) {
  const start = raw.search(
    /\*{3}\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i,
  );
  const end = raw.search(
    /\*{3}\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i,
  );
  const body = raw.slice(
    start >= 0 ? raw.indexOf("\n", start) + 1 : 0,
    end >= 0 ? end : raw.length,
  );
  return sanitizeHtml(body, {
    allowedTags: [
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "em",
      "strong",
      "i",
      "b",
      "blockquote",
      "img",
      "figure",
      "figcaption",
      "br",
      "hr",
      "ul",
      "ol",
      "li",
      "a",
      "span",
    ],
    allowedAttributes: {
      img: ["src", "alt", "width", "height"],
      a: ["href", "title"],
      span: ["title"],
    },
    allowedSchemes: ["http", "https", "data"],
  });
}

export function htmlToPlainText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<\/h[1-6]\s*>/gi, "\n\n")
    .replace(/<\/li\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function cleanGutenbergText(raw: string) {
  const normalized = raw.replace(/\r\n?/g, "\n");
  const start = normalized.search(
    /^\s*\*{3}\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*$/im,
  );
  const end = normalized.search(
    /^\s*\*{3}\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*$/im,
  );
  return normalized
    .slice(
      start >= 0 ? normalized.indexOf("\n", start) + 1 : 0,
      end >= 0 ? end : normalized.length,
    )
    .trim();
}

export function splitText(raw: string) {
  const text = cleanGutenbergText(raw);
  const heading =
    /^(\s*(?:(?:CHAPTER|BOOK|PART|LETTER|STAVE|ACT|SCENE)\b[^\n]*|[IVXLCDM]{1,12}[.)]?\s*[^\n]*))$/gim;
  const matches = [...text.matchAll(heading)];
  if (matches.length < 2)
    return [{ chapterNumber: 1, title: "Chapter 1", content: text }];
  return matches
    .map((match, index) => ({
      chapterNumber: index + 1,
      title: match[1].trim(),
      content: text
        .slice(
          match.index! + match[0].length,
          matches[index + 1]?.index ?? text.length,
        )
        .trim(),
    }))
    .filter((chapter) => chapter.content);
}

function splitHtml(raw: string) {
  const heading = /<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi;
  const matches = [...raw.matchAll(heading)];
  if (matches.length < 2)
    return [{ chapterNumber: 1, title: "Chapter 1", html: raw }];
  return matches
    .map((match, index) => ({
      chapterNumber: index + 1,
      title: match[2].replace(/<[^>]+>/g, "").trim(),
      html: raw.slice(match.index!, matches[index + 1]?.index ?? raw.length),
    }))
    .filter((chapter) => chapter.html.trim());
}

async function storeImages(
  html: string,
  bookId: string,
  baseUrl: string,
  db: ReturnType<typeof createServiceSupabaseClient>,
) {
  let imageBytes = 0;
  const seen = new Map<string, string>();
  const rewritten = await Promise.all(
    [...html.matchAll(/<img\b([^>]*?)\bsrc=["']([^"']+)["']([^>]*)>/gi)].map(
      async (match) => {
        const source = new URL(match[2], baseUrl).href;
        if (seen.has(source)) return [match[0], seen.get(source)!] as const;
        try {
          const response = await fetch(source);
          const bytes = await response.arrayBuffer();
          if (!response.ok || bytes.byteLength > 3 * 1024 * 1024)
            return [match[0], ""] as const;
          const path = `${bookId}/${Buffer.from(source).toString("base64url")}.img`;
          const upload = await db.storage
            .from("book-images")
            .upload(path, bytes, {
              upsert: true,
              contentType: response.headers.get("content-type") ?? "image/jpeg",
            });
          if (upload.error) return [match[0], ""] as const;
          const url = db.storage.from("book-images").getPublicUrl(path)
            .data.publicUrl;
          seen.set(source, url);
          imageBytes += bytes.byteLength;
          return [match[0], match[0].replace(match[2], url)] as const;
        } catch {
          return [match[0], ""] as const;
        }
      },
    ),
  );
  for (const [oldValue, newValue] of rewritten)
    if (newValue) html = html.replace(oldValue, newValue);
  return { html, imageBytes };
}

export async function importBook(input: unknown) {
  const { gutenberg_id } = importSchema.parse(input);
  const book = await getGutendexBook(gutenberg_id);
  const htmlUrl =
    Object.entries(book.formats).find(
      ([type, value]) =>
        /text\/html/i.test(type) &&
        /html\.images/i.test(type + value) &&
        !/zip/i.test(value),
    )?.[1] ??
    Object.entries(book.formats).find(
      ([type, value]) => /text\/html/i.test(type) && !/zip/i.test(value),
    )?.[1];
  const rawHtml = htmlUrl ? await fetchBookHtml(book) : null;
  const rawText = rawHtml ? null : await fetchBookText(book);
  const supabase = createServiceSupabaseClient();
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
  const cleanedHtml = rawHtml && htmlUrl ? cleanGutenbergHtml(rawHtml) : "";
  const imageResult =
    rawHtml && htmlUrl
      ? await storeImages(cleanedHtml, saved.id, htmlUrl, supabase)
      : { html: "", imageBytes: 0 };
  const chapters =
    rawHtml && htmlUrl ? splitHtml(imageResult.html) : splitText(rawText ?? "");
  await supabase.from("chapters").delete().eq("book_id", saved.id);
  const { error } = await supabase
    .from("chapters")
    .insert(
      chapters.map((chapter) => ({
        book_id: saved.id,
        chapter_number: chapter.chapterNumber,
        title: chapter.title,
        content:
          "content" in chapter
            ? chapter.content
            : htmlToPlainText(chapter.html),
        html_content: "html" in chapter ? chapter.html : null,
        content_format: "html" in chapter ? "html" : "text",
        image_bytes: imageResult.imageBytes,
      })),
    );
  if (error) throw error;
  console.log("[v0] imported book images", {
    gutenberg_id,
    imageBytes: imageResult.imageBytes,
  });
  revalidateTag("books", "max");
  revalidatePath("/library");
  return saved.id;
}
