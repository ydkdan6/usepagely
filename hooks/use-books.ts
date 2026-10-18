"use client";

import useSWR from "swr";
import type { Book, BookQuery, Category, Paginated } from "@/lib/books/types";
import { getFriendlyError } from "@/lib/errors";

async function fetcher<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const friendly = getFriendlyError(
        { status: response.status },
        response.status === 429 ? "importing" : "general",
      );
      const error = new Error(friendly.message);
      Object.assign(error, { status: response.status });
      throw error;
    }
    return body as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function useBooks({
  section,
  category,
  q,
  page = 1,
  limit = 24,
}: BookQuery) {
  const params = new URLSearchParams({
    section,
    page: String(page),
    limit: String(limit),
  });
  if (category && category !== "all") params.set("category", category);
  if (q) params.set("q", q);

  return useSWR<Paginated<Book>>(`/api/books?${params}`, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000,
  });
}

export function useCategories() {
  return useSWR<{ data: Category[] }>("/api/categories", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000,
  });
}
