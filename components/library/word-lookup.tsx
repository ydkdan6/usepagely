"use client";
import { useEffect, useRef, useState } from "react";
import { Bookmark, Loader2, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { getDictionaryCache, setDictionaryCache } from "@/lib/offline-db";
type Data = {
  word: string;
  phonetic: string;
  meanings: {
    partOfSpeech: string;
    definitions: { definition: string; example: string }[];
  }[];
};
export function WordLookup({
  bookId,
  children,
}: {
  bookId: string;
  children: React.ReactNode;
}) {
  const [enabled, setEnabled] = useState(true);
  const [data, setData] = useState<Data | null>(null);
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    setEnabled(window.localStorage.getItem("tap-a-word") !== "off");
  }, []);
  async function lookup(raw: string, x: number, y: number) {
    const clean = raw.toLowerCase().replace(/[^a-z'-]/g, "");
    if (!enabled || !clean || clean.length > 64 || raw.trim().includes(" "))
      return;
    setWord(clean);
    setPosition({
      x: Math.min(x, window.innerWidth - 340),
      y: Math.min(y + 12, window.innerHeight - 280),
    });
    setLoading(true);
    const cached = await getDictionaryCache(clean);
    if (cached) {
      setData(cached as Data);
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(
        `/api/dictionary?word=${encodeURIComponent(clean)}`,
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No definition found");
      setData(result.data);
      await setDictionaryCache(clean, result.data);
    } catch (error) {
      setData(null);
      toast.info(
        error instanceof Error ? error.message : "No definition found",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <div
        onDoubleClick={(event) => {
          const selection = window.getSelection()?.toString() ?? "";
          void lookup(
            selection ||
              ((event.target as HTMLElement).textContent?.trim() ?? ""),
            event.clientX,
            event.clientY,
          );
        }}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          timer.current = window.setTimeout(() => {
            const selection = window.getSelection()?.toString() ?? "";
            void lookup(
              selection ||
                ((event.target as HTMLElement).textContent?.trim() ?? ""),
              touch.clientX,
              touch.clientY,
            );
          }, 550);
        }}
        onTouchEnd={() => window.clearTimeout(timer.current)}
      >
        {children}
      </div>
      {(data || loading) && (
        <aside
          className="fixed z-50 w-[320px] rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl"
          style={{ left: position.x, top: position.y }}
        >
          <button
            type="button"
            onClick={() => setData(null)}
            className="absolute right-3 top-3"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
          {loading ? (
            <Loader2 className="mx-auto animate-spin" />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <strong className="text-lg">{word}</strong>
                <button
                  type="button"
                  onClick={() =>
                    window.speechSynthesis?.speak(
                      new SpeechSynthesisUtterance(word),
                    )
                  }
                  aria-label="Play pronunciation"
                >
                  <Volume2 className="size-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{data?.phonetic}</p>
              <div className="mt-3 space-y-3">
                {data?.meanings.map((meaning, index) => (
                  <div key={`${meaning.partOfSpeech}-${index}`}>
                    <p className="text-xs font-semibold uppercase text-primary">
                      {meaning.partOfSpeech}
                    </p>
                    {meaning.definitions.map((definition, item) => (
                      <p key={item} className="mt-1 text-sm">
                        {definition.definition}
                        {definition.example && (
                          <span className="mt-1 block text-xs italic text-muted-foreground">
                            “{definition.example}”
                          </span>
                        )}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                onClick={async () => {
                  const definition =
                    data?.meanings[0]?.definitions[0]?.definition ?? "";
                  const response = await fetch("/api/my-words", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ word, definition, bookId }),
                  });
                  const result = await response.json();
                  if (!response.ok)
                    toast.error(result.error ?? "Could not save word");
                  else toast.success("Word saved.");
                }}
              >
                <Bookmark className="size-4" />
                Save word
              </button>
            </>
          )}
        </aside>
      )}
    </>
  );
}
