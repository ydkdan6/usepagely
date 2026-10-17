import { cache } from "react";

const BASE_URL = "https://gutendex.com/books";
const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const MIN_DELAY_MS = 500;
let lastRequestAt = 0;
let activeRequests = 0;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type GutendexBook = {
  id: number;
  title: string;
  authors: { name: string }[];
  subjects: string[];
  bookshelves?: string[];
  languages: string[];
  download_count?: number;
  formats: Record<string, string>;
  summaries?: string[];
};
export type GutendexResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: GutendexBook[];
};

async function fetchJson<T>(url: string): Promise<T> {
  while (activeRequests >= 2) await wait(50);
  activeRequests += 1;
  try {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      const delay = Math.max(0, MIN_DELAY_MS - (Date.now() - lastRequestAt));
      if (delay) await wait(delay);
      lastRequestAt = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { accept: "application/json" },
          next: { revalidate: 3600 },
        });
        if (response.ok) return (await response.json()) as T;
        if (response.status === 429 || response.status >= 500) {
          const retryAfter = Number(response.headers.get("retry-after"));
          await wait(
            Number.isFinite(retryAfter)
              ? retryAfter * 1000
              : 2 ** attempt * 500,
          );
          continue;
        }
        throw new Error(`Gutendex returned ${response.status}`);
      } catch (error) {
        if (attempt === MAX_RETRIES) throw error;
        await wait(2 ** attempt * 500);
      } finally {
        clearTimeout(timeout);
      }
    }
  } finally {
    activeRequests -= 1;
  }
  throw new Error("Gutendex request failed");
}

export const searchGutendex = cache(async (query: string, page = 1) =>
  fetchJson<GutendexResponse>(
    `${BASE_URL}?search=${encodeURIComponent(query)}&page=${page}`,
  ),
);
export const popularGutendex = cache(async (page = 1) =>
  fetchJson<GutendexResponse>(`${BASE_URL}?sort=popular&page=${page}`),
);
export const getGutendexBook = cache(async (id: number) =>
  fetchJson<GutendexBook>(`${BASE_URL}/${id}`),
);

export async function fetchBookText(book: GutendexBook) {
  const url = Object.entries(book.formats).find(
    ([type, value]) => /text\/plain/i.test(type) && !/zip/i.test(value),
  )?.[1];
  if (!url) throw new Error("Gutendex book has no plain-text format");
  return fetchTextWithRetry(url);
}

async function fetchTextWithRetry(url: string) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (response.ok) return await response.text();
      throw new Error(`Text download returned ${response.status}`);
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      await wait(2 ** attempt * 500);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error("Text download failed");
}
