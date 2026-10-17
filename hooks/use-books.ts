"use client";

import useSWR from "swr";
import type { Book, BookQuery, Category, Paginated } from "@/lib/books/types";

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

export function useBooks({
  section,
  category,
  q,
  page = 1,
  limit = 10,
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
