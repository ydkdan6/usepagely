"use client";

import { useState } from "react";
import { useCategories } from "@/hooks/use-books";
import { useLibraryFilters } from "@/hooks/use-library-filters";
import { cn } from "@/lib/utils";

type Category = { slug: string; name: string };

const CATEGORY_GROUPS: { label: string; items: string[] }[] = [
  {
    label: "Romance",
    items: [
      "Contemporary Romance",
      "Dark Romance",
      "Historical Romance",
      "Romantic Comedy (Rom-Com)",
      "Paranormal Romance",
      "Fantasy Romance",
      "Erotic Romance",
      "Sports Romance",
      "Billionaire Romance",
      "Mafia Romance",
      "Enemies to Lovers",
      "Friends to Lovers",
      "Forbidden Love",
      "Second Chance Romance",
      "Slow Burn Romance",
      "Office Romance",
      "Age-Gap Romance",
    ],
  },
  {
    label: "Fantasy",
    items: [
      "High Fantasy",
      "Epic Fantasy",
      "Dark Fantasy",
      "Urban Fantasy",
      "Romantasy",
      "Historical Fantasy",
      "Magical Realism",
      "Fairy Tale Retellings",
      "Sword and Sorcery",
      "Mythological Fantasy",
    ],
  },
  {
    label: "Thriller & Suspense",
    items: [
      "Psychological Thriller",
      "Crime Thriller",
      "Legal Thriller",
      "Medical Thriller",
      "Domestic Thriller",
      "Political Thriller",
      "Mystery Thriller",
      "Techno-Thriller",
      "Action Thriller",
      "Suspense",
    ],
  },
  {
    label: "Mystery & Crime",
    items: [
      "Detective Fiction",
      "Murder Mystery",
      "Cozy Mystery",
      "Police Procedural",
      "True Crime",
      "Serial Killer Fiction",
      "Whodunit",
      "Historical Mystery",
      "Heist Fiction",
    ],
  },
  {
    label: "Horror",
    items: [
      "Psychological Horror",
      "Gothic Horror",
      "Supernatural Horror",
      "Paranormal Horror",
      "Cosmic Horror",
      "Body Horror",
      "Folk Horror",
      "Slasher",
      "Occult Horror",
      "Religious Horror",
    ],
  },
  {
    label: "Science Fiction",
    items: [
      "Dystopian",
      "Post-Apocalyptic",
      "Cyberpunk",
      "Space Opera",
      "Time Travel",
      "Alien Fiction",
      "Military Sci-Fi",
      "Hard Science Fiction",
      "Soft Science Fiction",
      "Biopunk",
    ],
  },
  {
    label: "Literary & General Fiction",
    items: [
      "Contemporary Fiction",
      "Historical Fiction",
      "Women's Fiction",
      "Coming-of-Age",
      "Family Saga",
      "Social Commentary",
      "Psychological Fiction",
      "Tragic Fiction",
      "Philosophical Fiction",
    ],
  },
  {
    label: "Young Adult (YA)",
    items: [
      "YA Romance",
      "YA Fantasy",
      "YA Mystery",
      "YA Contemporary",
      "YA Dystopian",
      "YA Paranormal",
      "YA Coming-of-Age",
    ],
  },
  {
    label: "Non-Fiction",
    items: [
      "Biography",
      "Autobiography",
      "Memoir",
      "Self-Help",
      "Psychology",
      "Philosophy",
      "History",
      "Religion & Spirituality",
      "Personal Development",
      "Business & Finance",
      "Politics",
      "Science",
    ],
  },
  {
    label: "Other Popular Categories",
    items: [
      "Poetry",
      "Drama",
      "Satire",
      "Adventure",
      "Travel Writing",
      "Essays",
      "Short Stories",
      "Graphic Novels",
      "Manga",
      "Children's Literature",
      "Erotica",
      "Western Fiction",
    ],
  },
  {
    label: "Popular Romance Tropes",
    items: [
      "Grumpy x Sunshine",
      "Forced Proximity",
      "Marriage of Convenience",
      "Fake Dating",
      "Forbidden Romance",
      "Touch Her and Die",
      "Who Did This to You?",
      "Possessive Male Lead",
      "Morally Grey Characters",
      "One Bed",
      "He Falls First",
      "She Falls First",
      "Found Family",
      "Secret Relationship",
    ],
  },
];

const KEYWORD_GROUPS: [string, RegExp][] = [
  ["Young Adult (YA)", /^ya-|young-adult/],
  ["Romance", /romance|lovers|love/],
  ["Fantasy", /fantasy|fairy|myth/],
  ["Thriller & Suspense", /thriller|suspense/],
  ["Mystery & Crime", /mystery|crime|detective/],
  ["Horror", /horror/],
  ["Science Fiction", /sci|dystopian|cyberpunk|space/],
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const guessGroup = (slug: string) =>
  KEYWORD_GROUPS.find(([, re]) => re.test(slug))?.[0] ?? "Other";

const scrollRow =
  "no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 md:-mx-8 md:px-8";

const chip = (active: boolean) =>
  cn(
    "shrink-0 snap-start rounded-full border border-[#1c1c26]/20 bg-white px-4 py-2 text-sm font-medium text-[#1c1c26] transition-colors hover:border-[#1c1c26]",
    active && "border-[#1c1c26] bg-[#1c1c26] text-white",
  );

export function CategoryFilter() {
  const { data, error, isLoading, mutate } = useCategories();
  const { category, update } = useLibraryFilters();
  const [open, setOpen] = useState<string | null>(null);

  const apiCategories: Category[] = data?.data ?? [];
  const categories: Category[] = [
    { slug: "all", name: "All" },
    ...apiCategories,
  ];

  // Build groups from API data in your order; each slug appears once.
  const bySlug = new Map(apiCategories.map((c) => [c.slug, c]));
  const used = new Set<string>();
  const merged: { label: string; options: Category[] }[] = [];

  for (const group of CATEGORY_GROUPS) {
    const options: Category[] = [];
    for (const name of group.items) {
      const slug = slugify(name);
      const match = bySlug.get(slug);
      if (match && !used.has(slug)) {
        used.add(slug);
        options.push(match);
      }
    }
    if (options.length > 0) merged.push({ label: group.label, options });
  }

  // Anything not in your list goes to the closest group, else "Other".
  for (const item of apiCategories.filter((c) => !used.has(c.slug))) {
    const label = guessGroup(item.slug);
    let target = merged.find((g) => g.label === label);
    if (!target) {
      target = { label, options: [] };
      merged.push(target);
    }
    target.options.push(item);
  }

  const activeGroup = merged.find((g) =>
    g.options.some((o) => o.slug === category),
  )?.label;
  const shown = merged.find((g) => g.label === (open ?? activeGroup));

  if (error) {
    return (
      <div className={scrollRow}>
        <span className="flex items-center gap-2 text-sm text-[#1c1c26]/70">
          Categories unavailable
          <button type="button" className="underline" onClick={() => mutate()}>
            Retry
          </button>
        </span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={scrollRow}>
        {Array.from({ length: 7 }, (_, index) => (
          <span
            key={index}
            className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-[#1c1c26]/10"
          />
        ))}
      </div>
    );
  }

  // Small list: plain chips
  if (categories.length <= 4) {
    return (
      <div role="group" aria-label="Filter by category" className={scrollRow}>
        {categories.map((item) => (
          <button
            key={item.slug}
            type="button"
            aria-pressed={category === item.slug}
            onClick={() => update({ category: item.slug })}
            className={chip(category === item.slug)}
          >
            {item.name}
          </button>
        ))}
      </div>
    );
  }

  // Large list: group chips on top, subcategories of the open group below
  return (
    <div className="space-y-2">
      <div role="group" aria-label="Category groups" className={scrollRow}>
        <button
          type="button"
          aria-pressed={category === "all"}
          onClick={() => {
            setOpen(null);
            update({ category: "all" });
          }}
          className={chip(category === "all")}
        >
          All
        </button>
        {merged.map((g) => (
          <button
            key={g.label}
            type="button"
            aria-pressed={shown?.label === g.label}
            onClick={() => setOpen(g.label)}
            className={chip(shown?.label === g.label)}
          >
            {g.label}
          </button>
        ))}
      </div>

      {shown && (
        <div
          role="group"
          aria-label={`${shown.label} categories`}
          className={scrollRow}
        >
          {shown.options.map((item) => (
            <button
              key={item.slug}
              type="button"
              aria-pressed={category === item.slug}
              onClick={() => update({ category: item.slug })}
              className={cn(
                chip(category === item.slug),
                "px-3 py-1.5 text-xs",
              )}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
