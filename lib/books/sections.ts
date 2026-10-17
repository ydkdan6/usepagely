import type { SectionSlug } from "@/lib/books/types";

export const ROW_PAGE_SIZE = 10;
export const GRID_PAGE_SIZE = 18;

export const SECTIONS: { slug: SectionSlug; title: string }[] = [
  { slug: "latest", title: "Latests" },
  { slug: "recommended", title: "Recommended books" },
  { slug: "exclusive", title: "Exclusive books" },
  { slug: "highly-rated", title: "Highly rated books" },
  { slug: "favorite", title: "Favorite books" },
];

export function getSection(slug: string) {
  return SECTIONS.find((section) => section.slug === slug);
}
