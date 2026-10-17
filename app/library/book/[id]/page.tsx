import Link from "next/link";
import { notFound } from "next/navigation";
import { BookDetail } from "@/components/library/book-detail";
import { getBookById } from "@/lib/books/repository";

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await getBookById(id);

  if (!book) notFound();

  return <BookDetail book={book} />;
}
