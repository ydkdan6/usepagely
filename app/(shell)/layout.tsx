import type { Metadata } from "next";
import { LibraryShell } from "@/components/library/library-shell";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Library — UsePagely",
  description: "Browse the latest, recommended, exclusive and top-rated books.",
};

export default async function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) redirect(`/login?returnTo=${encodeURIComponent("/")}`);
  return <LibraryShell>{children}</LibraryShell>;
}
