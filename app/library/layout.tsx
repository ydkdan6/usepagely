import type { Metadata } from "next";
import { LibraryShell } from "@/components/library/library-shell";

export const metadata: Metadata = {
  title: "Library — BookOnline",
  description: "Browse the latest, recommended, exclusive and top-rated books.",
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LibraryShell>{children}</LibraryShell>;
}
