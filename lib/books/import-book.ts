import { revalidatePath, revalidateTag } from "next/cache";
import { createHash } from "node:crypto";
import sanitizeHtml from "sanitize-html";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { fetchBookText, getGutendexBook } from "@/lib/gutendex";
import { z } from "zod";
import { bookCategories } from "@/lib/books/catalog";
import { resolveEnglishDescription } from "@/lib/books/descriptions";

export const importSchema = z.object({
  gutenberg_id: z.coerce.number().int().positive(),
  force: z.boolean().optional().default(false),
});

function resolveImageSources(raw: string, baseUrl: string) {
  return raw.replace(
    /(<img\b[^>]*\bsrc=["'])([^"']+)(["'])/gi,
    (_, prefix, src, suffix) =>
      `${prefix}${new URL(src, baseUrl).href}${suffix}`,
  );
}

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

  if (matches.length < 2) {
    return [{ chapterNumber: 1, title: "Chapter 1", content: text }];
  }

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

  if (matches.length < 2) {
    return [{ chapterNumber: 1, title: "Chapter 1", html: raw }];
  }

  return matches
    .map((match, index) => ({
      chapterNumber: index + 1,
      title: match[2].replace(/<[^>]+>/g, "").trim(),
      html: raw.slice(match.index!, matches[index + 1]?.index ?? raw.length),
    }))
    .filter((chapter) => chapter.html.trim());
}

export async function storeImages(
  html: string,
  bookId: string,
  db: ReturnType<typeof createServiceSupabaseClient>,
) {
  const sources = [
    ...new Set(
      [
        ...html.matchAll(
          /<img\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["'][^>]*>/gi,
        ),
      ].map((match) => match[1]),
    ),
  ];

  const urls = new Map<string, string>();
  let imageBytes = 0;
  let uploaded = 0;
  let failed = 0;
  const failedSources: string[] = [];
  let cursor = 0;

  const worker = async () => {
    while (cursor < sources.length) {
      const source = sources[cursor++];

      if (source.includes("/storage/v1/object/public/book-images/")) {
        continue;
      }

      try {
        const response = await fetch(source, {
          headers: {
            "User-Agent": "UsePagely/1.0",
          },
          signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
          failed++;
          failedSources.push(source);
          console.warn(`[images] fetch ${response.status} ${source}`);
          continue;
        }

        const contentType =
          response.headers.get("content-type")?.split(";")[0] ?? "";

        const bytes = await response.arrayBuffer();

        if (bytes.byteLength > 3 * 1024 * 1024) {
          failed++;
          failedSources.push(source);
          console.warn(`[images] too-large ${source}`);
          continue;
        }

        const ext =
          (
            {
              "image/jpeg": "jpg",
              "image/png": "png",
              "image/gif": "gif",
              "image/webp": "webp",
              "image/svg+xml": "svg",
            } as Record<string, string>
          )[contentType] ?? "img";

        const path = `${bookId}/${createHash("sha1")
          .update(source)
          .digest("hex")}.${ext}`;

        const upload = await db.storage
          .from("book-images")
          .upload(path, bytes, { upsert: true, contentType });

        if (upload.error) {
          failed++;
          failedSources.push(source);
          console.warn(`[images] upload ${upload.error.message}`);
          continue;
        }

        urls.set(
          source,
          db.storage.from("book-images").getPublicUrl(path).data.publicUrl,
        );

        imageBytes += bytes.byteLength;
        uploaded++;
      } catch (error) {
        failed++;
        failedSources.push(source);
        console.warn(
          `[images] exception ${
            error instanceof Error ? error.message : String(error)
          } ${source}`,
        );
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(4, sources.length) }, worker),
  );

  const rewritten = html.replace(
    /(<img\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi,
    (tag, prefix, source, suffix) =>
      `${prefix}${urls.get(source) ?? source}${suffix}`,
  );

  console.log(
    `[images] found=${sources.length} uploaded=${uploaded} failed=${failed}`,
  );

  return {
    html: rewritten,
    imageBytes,
    uploaded,
    failed,
    failedSources,
  };
}

export async function importBook(input: unknown) {
  const { gutenberg_id, force } = importSchema.parse(input);
  const supabase = createServiceSupabaseClient();

  if (!force) {
    const { data: existing } = await supabase
      .from("books")
      .select("id")
      .eq("gutenberg_id", gutenberg_id)
      .maybeSingle();

    if (existing) {
      const { count } = await supabase
        .from("chapters")
        .select("id", { count: "exact", head: true })
        .eq("book_id", existing.id);

      if ((count ?? 0) > 0) {
        return { id: existing.id, skipped: true };
      }
    }
  }

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

  let rawHtml: string | null = null;
  let baseUrl = htmlUrl;

  if (htmlUrl) {
    try {
      const response = await fetch(htmlUrl, {
        redirect: "follow",
        headers: { "User-Agent": "UsePagely/1.0" },
        signal: AbortSignal.timeout(15_000),
      });

      if (response.ok) {
        baseUrl = response.url;
        rawHtml = await response.text();
      }
    } catch (error) {
      console.warn(
        `[images] html fetch ${
          error instanceof Error ? error.message : String(error)
        } ${htmlUrl}`,
      );
    }
  }

  const rawText = rawHtml ? null : await fetchBookText(book);

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
        image_bytes: 0,
      },
      { onConflict: "gutenberg_id" },
    )
    .select("id")
    .single();

  if (bookError) throw bookError;

  const cleanedHtml =
    rawHtml && baseUrl
      ? cleanGutenbergHtml(resolveImageSources(rawHtml, baseUrl))
      : "";

  const imageResult = rawHtml
    ? await storeImages(cleanedHtml, saved.id, supabase)
    : { html: "", imageBytes: 0 };

  const chapters =
    rawHtml && htmlUrl ? splitHtml(imageResult.html) : splitText(rawText ?? "");

  await supabase
    .from("books")
    .update({ image_bytes: imageResult.imageBytes })
    .eq("id", saved.id);

  await supabase.from("chapters").delete().eq("book_id", saved.id);

  const { error } = await supabase.from("chapters").insert(
    chapters.map((chapter) => ({
      book_id: saved.id,
      chapter_number: chapter.chapterNumber,
      title: chapter.title,
      content:
        "content" in chapter ? chapter.content : htmlToPlainText(chapter.html),
      html_content: "html" in chapter ? chapter.html : null,
      content_format: "html" in chapter ? "html" : "text",
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

/**
 * Bounds how long we wait for a promise.
 * Note: this wrapper does not cancel an already-running Supabase request.
 */
async function withTimeout<T>(
  operation: PromiseLike<T>,
  label: string,
  timeoutMs = 10_000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}


export async function repairBookImages(gutenbergId: number, dryRun = true) {
  const db = createServiceSupabaseClient();

  console.log("[repair] 1. Looking up existing book", gutenbergId);

  const { data: book, error: bookError } = await withTimeout(
    db
      .from("books")
      .select("id, gutenberg_id, title")
      .eq("gutenberg_id", gutenbergId)
      .single(),
    "Supabase book lookup",
  );

  if (bookError) throw bookError;
  if (!book) throw new Error(`Book ${gutenbergId} was not found`);

  console.log("[repair] 2. Book found:", book.title);

  console.log("[repair] 3. Opening Gutenberg HTML directly");

  const htmlUrl = `https://www.gutenberg.org/ebooks/${gutenbergId}.html.images`;

  const response = await fetch(htmlUrl, {
    redirect: "follow",
    headers: { "User-Agent": "UsePagely/1.0" },
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Gutenberg returned HTTP ${response.status} for book ${gutenbergId}`,
    );
  }

  const baseUrl = response.url || htmlUrl;

  if (response.body) {
    void response.body.cancel().catch(() => {});
  }

  console.log("[repair] 4. HTML source confirmed:", baseUrl);

  console.log("[repair] 7. Loading existing chapters");

  const { data: chapters, error: chaptersError } = await withTimeout(
    db
      .from("chapters")
      .select("id, chapter_number, title, html_content")
      .eq("book_id", book.id)
      .order("chapter_number", { ascending: true }),
    "Supabase chapter lookup",
  );

  if (chaptersError) throw chaptersError;

  console.log(`[repair] 8. Loaded ${chapters?.length ?? 0} chapters`);

  const affected = (chapters ?? []).filter((chapter) => {
    const html = chapter.html_content ?? "";

    return [...html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)].some(
      ([, src]) => {
        const value = src.trim();

        return (
          !/^(https?:\/\/|data:|\/\/)/i.test(value) &&
          !value.startsWith("/storage/v1/object/public/book-images/")
        );
      },
    );
  });

  console.log(
    `[repair] 9. Found ${affected.length} chapters with relative image paths`,
  );

  if (dryRun) {
    console.log("[repair] 10. Dry run complete; no changes made");

    return {
      dry_run: true,
      gutenberg_id: gutenbergId,
      title: book.title,
      base_url: baseUrl,
      chapters_to_repair: affected.length,
      chapters: affected.map((chapter) => ({
        id: chapter.id,
        chapter_number: chapter.chapter_number,
        title: chapter.title,
      })),
    };
  }

  console.log("[repair] 10. Starting image repair");

  const results: Array<{
    chapter_number: number;
    status: "repaired" | "failed";
    uploaded_images?: number;
    failed_images?: string[];
    error?: string;
  }> = [];

  for (const chapter of affected) {
    console.log(
      `[repair] Processing chapter ${chapter.chapter_number}: ${chapter.title}`,
    );

    try {
      const absoluteHtml = resolveImageSources(
        chapter.html_content ?? "",
        baseUrl,
      );

      const imageResult = await storeImages(absoluteHtml, book.id, db);

      if (imageResult.failed > 0) {
        results.push({
          chapter_number: chapter.chapter_number,
          status: "failed",
          failed_images: imageResult.failedSources,
        });

        console.warn(
          `[repair] Chapter ${chapter.chapter_number} has failed images; leaving chapter unchanged`,
        );

        continue;
      }

      const { error: updateError } = await withTimeout(
        db
          .from("chapters")
          .update({ html_content: imageResult.html })
          .eq("id", chapter.id)
          .eq("book_id", book.id),
        `Updating chapter ${chapter.chapter_number}`,
      );

      if (updateError) throw updateError;

      results.push({
        chapter_number: chapter.chapter_number,
        status: "repaired",
        uploaded_images: imageResult.uploaded,
      });

      console.log(`[repair] Chapter ${chapter.chapter_number} repaired`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      console.error(
        `[repair] Chapter ${chapter.chapter_number} failed:`,
        message,
      );

      results.push({
        chapter_number: chapter.chapter_number,
        status: "failed",
        error: message,
      });
    }
  }

  console.log("[repair] 11. Repair loop completed");

  revalidateTag("books", "max");
  revalidatePath("/library");

  return {
    dry_run: false,
    gutenberg_id: gutenbergId,
    title: book.title,
    chapters_found: affected.length,
    repaired: results.filter((result) => result.status === "repaired").length,
    failed: results.filter((result) => result.status === "failed").length,
    results,
  };
}

 

export async function scanAllBookImages(offset = 0, batchSize = 25) {
  const db = createServiceSupabaseClient();

  const { data: books, error: booksError } = await db
    .from("books")
    .select("id, gutenberg_id, title")
    .order("id")
    .range(offset, offset + batchSize - 1);

  if (booksError) throw booksError;

  const currentBooks = books ?? [];

  if (currentBooks.length === 0) {
    return {
      scan_only: true,
      offset,
      books_scanned: 0,
      books_needing_repair: 0,
      affected_chapters: 0,
      books: [],
      next_offset: null,
    };
  }

  const bookIds = currentBooks.map((book) => book.id);

  const { data: chapters, error: chaptersError } = await db
    .from("chapters")
    .select("book_id, chapter_number, title, html_content")
    .in("book_id", bookIds);

  if (chaptersError) throw chaptersError;

  const bookById = new Map(currentBooks.map((book) => [book.id, book]));

  const results = new Map<
    string,
    {
      gutenberg_id: number;
      title: string;
      affected_chapters: Array<{
        chapter_number: number;
        title: string;
        relative_image_paths: string[];
      }>;
    }
  >();

  for (const chapter of chapters ?? []) {
    const html = chapter.html_content ?? "";

    const paths = [
      ...new Set(
        [...html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)]
          .map((match) => match[1].trim())
          .filter(
            (src) =>
              !/^(https?:\/\/|data:|\/\/)/i.test(src) &&
              !src.includes("/storage/v1/object/public/book-images/"),
          ),
      ),
    ];

    if (paths.length === 0) continue;

    const book = bookById.get(chapter.book_id);
    if (!book) continue;

    let result = results.get(book.id);

    if (!result) {
      result = {
        gutenberg_id: book.gutenberg_id,
        title: book.title,
        affected_chapters: [],
      };

      results.set(book.id, result);
    }

    result.affected_chapters.push({
      chapter_number: chapter.chapter_number,
      title: chapter.title,
      relative_image_paths: paths,
    });
  }

  const affectedBooks = [...results.values()];

  return {
    scan_only: true,
    offset,
    books_scanned: currentBooks.length,
    books_needing_repair: affectedBooks.length,
    affected_chapters: affectedBooks.reduce(
      (total, book) => total + book.affected_chapters.length,
      0,
    ),
    books: affectedBooks,
    next_offset: currentBooks.length === batchSize ? offset + batchSize : null,
  };
}
