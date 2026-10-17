export type Book = {
  id: string;
  gutenbergId?: number;
  title: string;
  author: string;
  authors?: string[];
  subjects?: string[];
  categories?: string[];
  language?: string;
  downloadCount?: number;
  coverUrl: string;
  description?: string;
  category: string;
  rating: number;
  publishedYear: number;
  isExclusive: boolean;
  favorites: number;
};
export type Chapter = {
  id: string;
  bookId: string;
  chapterNumber: number;
  title: string;
  content?: string;
};
export type Category = { slug: string; name: string };
export type SectionSlug =
  | "latest"
  | "recommended"
  | "exclusive"
  | "highly-rated"
  | "favorite";
export type BookQuery = {
  section: SectionSlug;
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
};
export type Paginated<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
