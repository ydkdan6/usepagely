"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, ChevronDown, Monitor, Moon, Sun } from "lucide-react";

const options = [
  { value: "light", label: "Light", description: "Bright and airy", icon: Sun },
  {
    value: "system",
    label: "System",
    description: "Match your device",
    icon: Monitor,
  },
  { value: "dark", label: "Dark", description: "Easy on the eyes", icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current =
    options.find((option) => option.value === (mounted ? theme : "system")) ??
    options[1];
  const CurrentIcon = current.icon;

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground shadow-sm transition-colors hover:bg-accent [&::-webkit-details-marker]:hidden">
        <CurrentIcon className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown
          className="size-4 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
        <span className="sr-only">Choose color theme</span>
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl">
        <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Appearance
        </p>
        {options.map((option) => {
          const Icon = option.icon;
          const selected = mounted && theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  {option.label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {option.description}
                </span>
              </span>
              {selected && (
                <Check className="size-4 text-primary" aria-label="Selected" />
              )}
            </button>
          );
        })}
      </div>
    </details>
  );
}
