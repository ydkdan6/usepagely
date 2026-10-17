import type { GutendexBook } from "@/lib/gutendex";

function englishOnly(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (
    !text ||
    /[\u0400-\u04ff\u0600-\u06ff\u4e00-\u9fff\u3040-\u30ff]/.test(text)
  )
    return null;
  const letters = text.match(/[A-Za-z]/g)?.length ?? 0;
  return letters / Math.max(1, text.replace(/\s/g, "").length) > 0.55
    ? text
    : null;
}

export async function resolveEnglishDescription(
  book: GutendexBook,
): Promise<string | null> {
  const summary = book.summaries?.map(englishOnly).find(Boolean);
  if (summary) return summary;
  try {
    const search = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.authors[0]?.name ?? "")}`,
      { next: { revalidate: 86400 } },
    ).then((r) => r.json());
    const workKey = search.docs?.[0]?.key;
    if (workKey) {
      const work = await fetch(`https://openlibrary.org${workKey}.json`, {
        next: { revalidate: 86400 },
      }).then((r) => r.json());
      const description =
        typeof work.description === "string"
          ? work.description
          : work.description?.value;
      const english = englishOnly(description);
      if (english) return english;
    }
  } catch {}
  try {
    const wiki = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(book.title)}`,
      { next: { revalidate: 86400 } },
    ).then((r) => r.json());
    return englishOnly(wiki.extract);
  } catch {
    return null;
  }
}
