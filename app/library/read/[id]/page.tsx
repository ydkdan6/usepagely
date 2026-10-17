import { notFound } from "next/navigation";
import { getBookById } from "@/lib/books/repository";
import { Reader } from "@/components/library/reader";

export default async function ReadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = getBookById(id);
  if (!book) notFound();
  return <Reader book={book} />;
}
