"use client";
import { useRouter } from "next/navigation";
import { ChapterSelect } from "@/components/library/chapter-select";
export function ChapterList({ bookId }: { bookId: string }) {
  const router = useRouter();
  return (
    <ChapterSelect
      bookId={bookId}
      showContinue
      onSelect={(chapter) =>
        router.push(`/library/read/${bookId}?chapter=${chapter}`)
      }
    />
  );
}
