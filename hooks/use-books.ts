"use client";

import useSWR from "swr";
import type { Book, BookQuery, Category, Paginated } from "@/lib/books/types";

async function fetcher<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  const response = await fetch(url, {
    cache: "no-store",
    signal: controller.signal,
  });
  window.clearTimeout(timeout);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error ?? `Request failed: ${response.status}`);
  }
  return body;
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
  });
}

export function useCategories() {
  return useSWR<{ data: Category[] }>("/api/categories", fetcher, {
    revalidateOnFocus: false,
  });
}
