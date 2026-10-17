import { BookRow } from "@/components/library/book-row";
import { CategoryFilter } from "@/components/library/category-filter";
import { SECTIONS } from "@/lib/books/sections";

export default function LibraryPage() {
  return (
    <div className="flex flex-col gap-12">
      <h1 className="sr-only">Library</h1>
      <CategoryFilter />
      {SECTIONS.map((section) => (
        <BookRow key={section.slug} slug={section.slug} title={section.title} />
      ))}
    </div>
  );
}
