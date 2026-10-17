import { BOOKS, CATEGORIES } from "../books/mock-data";
import type { Book, BookQuery, Category, Paginated } from "../books/types";

export function getBookById(id: string): Book | undefined {
  return BOOKS.find((book) => book.id === id);
}

// Swap point: replace these two functions with calls to the real books API.
// The route handlers and UI only depend on their return shapes.

export async function listCategories(): Promise<Category[]> {
  return CATEGORIES;
}

const stableShuffleKey = (book: Book) =>
  (Number(book.id.slice(-6)) * 7919) % 1009;

export async function listBooks({
  section,
  category,
  q,
  page = 1,
  limit = 10,
}: BookQuery): Promise<Paginated<Book>> {
  let books = [...BOOKS];

  if (category && category !== "all") {
    books = books.filter((book) => book.category === category);
  }

  if (q) {
    const term = q.toLowerCase();
    books = books.filter(
      (book) =>
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term),
    );
  }

  switch (section) {
    case "latest":
      books.sort((a, b) => b.publishedYear - a.publishedYear);
      break;
    case "recommended":
      books.sort((a, b) => stableShuffleKey(a) - stableShuffleKey(b));
      break;
    case "exclusive":
      books = books.filter((book) => book.isExclusive);
      break;
    case "highly-rated":
      books.sort((a, b) => b.rating - a.rating);
      break;
    case "favorite":
      books.sort((a, b) => b.favorites - a.favorites);
      break;
  }

  const total = books.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;

  return {
    data: books.slice(start, start + limit),
    page: safePage,
    limit,
    total,
    totalPages,
  };
}
