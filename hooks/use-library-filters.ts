"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type FilterPatch = Partial<Record<"category" | "q" | "page", string | null>>;

export function useLibraryFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const category = searchParams.get("category") ?? "all";
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const update = useCallback(
    (
      patch: FilterPatch,
      options: { pathname?: string; scroll?: boolean } = {},
    ) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (!value || value === "all" || (key === "page" && value === "1")) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      if (!("page" in patch)) next.delete("page");
      const query = next.toString();
      router.push(
        `${options.pathname ?? pathname}${query ? `?${query}` : ""}`,
        {
          scroll: options.scroll ?? false,
        },
      );
    },
    [pathname, router, searchParams],
  );

  const buildHref = useCallback(
    (targetPath: string) => {
      const next = new URLSearchParams();
      if (category !== "all") next.set("category", category);
      if (q) next.set("q", q);
      const query = next.toString();
      return `${targetPath}${query ? `?${query}` : ""}`;
    },
    [category, q],
  );

  return { category, q, page, update, buildHref };
}
