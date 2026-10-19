import { BookRow } from "@/components/library/book-row";
import { CategoryFilter } from "@/components/library/category-filter";
import { PwaRegister } from "@/components/library/pwa-register";
import { StreakWidget } from "@/components/library/streak-widget";
import { SECTIONS } from "@/lib/books/sections";

export default async function Page() {
  return (
    <div className="flex flex-col gap-12">
      <PwaRegister />
      <StreakWidget />
      <h1 className="sr-only">Home</h1>
      <CategoryFilter />
      {SECTIONS.map((section) => (
        <BookRow key={section.slug} slug={section.slug} title={section.title} />
      ))}
    </div>
  );
}
