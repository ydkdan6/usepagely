import { openDB, type DBSchema } from "idb";
import type { Book, Chapter } from "@/lib/books/types";
interface PagelyDB extends DBSchema {
  books: {
    key: string;
    value: { book: Book; chapters: Chapter[]; savedAt: number };
  };
  progress: {
    key: string;
    value: { chapter: number; offset: number; updatedAt: number };
  };
}
const db = () =>
  openDB<PagelyDB>("usepagely", 1, {
    upgrade(database) {
      database.createObjectStore("books");
      database.createObjectStore("progress");
    },
  });
export async function saveOfflineBook(book: Book, chapters: Chapter[]) {
  const value = await db();
  await value.put("books", { book, chapters, savedAt: Date.now() }, book.id);
}
export async function getOfflineBook(id: string) {
  return (await db()).get("books", id);
}
export async function removeOfflineBook(id: string) {
  await (await db()).delete("books", id);
}
export async function saveProgress(id: string, chapter: number, offset = 0) {
  await (
    await db()
  ).put("progress", { chapter, offset, updatedAt: Date.now() }, id);
}
