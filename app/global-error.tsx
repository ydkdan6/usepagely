"use client";
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="grid min-h-svh place-items-center p-6 text-center">
          <div>
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="mt-2">Please try again.</p>
            <button
              className="mt-6 rounded-xl bg-black px-4 py-2 text-white"
              onClick={reset}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
