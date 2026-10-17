import { BOOKS } from "@/lib/books/mock-data";
import { ShelfScreen } from "@/components/library/shelf-screen";
export default function DownloadsPage() {
  return (
    <ShelfScreen
      title="Downloaded books"
      kind="downloads"
      books={BOOKS.slice(4, 8)}
    />
  );
}
