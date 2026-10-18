import { notFound } from "next/navigation";
import { SectionGrid } from "@/components/library/section-grid";
import { getSection } from "@/lib/books/sections";

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section: slug } = await params;
  const section = getSection(slug);
  if (!section) notFound();

  return <SectionGrid slug={section.slug} title={section.title} />;
}
