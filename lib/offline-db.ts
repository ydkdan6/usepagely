import { openDB, type DBSchema } from "idb";
import type { Book, Chapter } from "@/lib/books/types";
interface PagelyDB extends DBSchema {
  dictionary: { key: string; value: unknown };
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
  openDB<PagelyDB>("usepagely", 2, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("dictionary"))
        database.createObjectStore("dictionary");
      if (!database.objectStoreNames.contains("books"))
        database.createObjectStore("books");
      if (!database.objectStoreNames.contains("progress"))
        database.createObjectStore("progress");
    },
  });
export async function getDictionaryCache(word: string) {
  return (await db()).get("dictionary", word);
}
export async function setDictionaryCache(word: string, value: unknown) {
  await (await db()).put("dictionary", value, word);
}
export async function saveOfflineBook(book: Book, chapters: Chapter[]) {
  const value = await db();
  const bookId = String(book.id);
  const existing = await value.get("books", bookId);
  const merged = new Map(
    [...(existing?.chapters ?? []), ...chapters].map((chapter) => [
      chapter.chapterNumber,
      chapter,
    ]),
  );
  await value.put(
    "books",
    {
      book: { ...book, id: bookId },
      chapters: [...merged.values()].sort(
        (a, b) => a.chapterNumber - b.chapterNumber,
      ),
      savedAt: Date.now(),
    },
    bookId,
  );
  window.dispatchEvent(new Event("usepagely:offline-books-changed"));
}
export async function getOfflineChapter(id: string, chapterNumber: number) {
  const cached = await getOfflineBook(id);
  return cached?.chapters.find(
    (chapter) => chapter.chapterNumber === chapterNumber,
  );
}
export async function getOfflineBook(id: string) {
  return (await db()).get("books", String(id));
}
export async function getOfflineBooks() {
  return (await db()).getAll("books");
}
export async function persistOfflineStorage() {
  return navigator.storage?.persist?.() ?? false;
}
export async function removeOfflineBook(id: string) {
  await (await db()).delete("books", String(id));
  window.dispatchEvent(new Event("usepagely:offline-books-changed"));
}
export async function saveProgress(id: string, chapter: number, offset = 0) {
  await (
    await db()
  ).put("progress", { chapter, offset, updatedAt: Date.now() }, id);
}
