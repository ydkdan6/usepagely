import { BOOKS } from "@/lib/books/mock-data";
import { ShelfScreen } from "@/components/library/shelf-screen";
export default function HistoryPage() {
  return (
    <ShelfScreen title="History" kind="history" books={BOOKS.slice(0, 4)} />
  );
}
