"use client";

import { Highlighter, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const colors = ["yellow", "green", "blue", "pink"] as const;

export function HighlightSelection({
  bookId,
  chapterNumber,
  chapterName,
  children,
}: {
  bookId: string;
  chapterNumber: number;
  chapterName: string;
  children: React.ReactNode;
}) {
  const [quote, setQuote] = useState("");
  const [color, setColor] = useState<(typeof colors)[number]>("yellow");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const updateSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() ?? "";
      if (
        text &&
        selection?.rangeCount &&
        selection.anchorNode &&
        selection.focusNode
      )
        setQuote(text.slice(0, 2000));
      else setQuote("");
    };
    document.addEventListener("selectionchange", updateSelection);
    return () =>
      document.removeEventListener("selectionchange", updateSelection);
  }, []);

  async function saveHighlight() {
    if (!quote || saving) return;
    setSaving(true);
    const response = await fetch("/api/highlights", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        book_id: bookId,
        chapter_number: chapterNumber,
        chapter_name: chapterName,
        quote,
        color,
      }),
    });
    setSaving(false);
    if (!response.ok) {
      toast.error(
        (await response.json().catch(() => ({}))).error ??
          "Could not save highlight.",
      );
      return;
    }
    toast.success("Highlight saved.");
    setQuote("");
    window.getSelection()?.removeAllRanges();
  }

  return (
    <>
      {children}
      {quote && (
        <div
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-[#1c1c26]/10 bg-white px-3 py-2 shadow-xl"
          role="toolbar"
          aria-label="Save highlight"
        >
          {colors.map((item) => (
            <button
              key={item}
              type="button"
              aria-label={`Use ${item} highlight`}
              onClick={() => setColor(item)}
              className={`size-6 rounded-full border-2 ${item === color ? "border-[#1c1c26]" : "border-transparent"} ${item === "yellow" ? "bg-yellow-300" : item === "green" ? "bg-green-300" : item === "blue" ? "bg-blue-300" : "bg-pink-300"}`}
            />
          ))}
          <button
            type="button"
            onClick={saveHighlight}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#0da4ed] px-3 py-2 text-sm font-semibold text-white"
          >
            <Highlighter className="size-4" aria-hidden="true" />
            {saving ? "Saving…" : "Highlight"}
          </button>
          <button
            type="button"
            aria-label="Dismiss highlight toolbar"
            onClick={() => {
              setQuote("");
              window.getSelection()?.removeAllRanges();
            }}
            className="rounded-lg p-1 hover:bg-black/5"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </>
  );
}
