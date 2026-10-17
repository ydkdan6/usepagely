export type Book = {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  category: string;
  rating: number;
  publishedYear: number;
  isExclusive: boolean;
  favorites: number;
};

export type Category = {
  slug: string;
  name: string;
};

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
