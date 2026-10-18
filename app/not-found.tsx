export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-background p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          We couldn&apos;t find that book or page.
        </p>
        <a
          className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2 text-primary-foreground"
          href="/"
        >
          Go home
        </a>
      </div>
    </main>
  );
}
