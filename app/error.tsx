"use client";
import { useEffect } from "react";
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {}, []);
  return (
    <main className="grid min-h-svh place-items-center bg-background p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">
          We couldn&apos;t load this page. Please try again.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            className="rounded-xl bg-primary px-4 py-2 text-primary-foreground"
            onClick={reset}
          >
            Try again
          </button>
          <a className="rounded-xl border px-4 py-2" href="/">
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
