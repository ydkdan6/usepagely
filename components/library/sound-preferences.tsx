"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { playClickSound } from "@/lib/click-sound";

export function SoundPreferences() {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(
        (result: {
          data: { user: { user_metadata?: Record<string, unknown> } | null };
        }) => {
          const value = result.data.user?.user_metadata?.click_sounds;
          if (typeof value === "boolean") setEnabled(value);
        },
      );
  }, []);
  async function update(value: boolean) {
    setEnabled(value);
    window.localStorage.setItem("click-sounds", value ? "on" : "off");
    await createClient().auth.updateUser({ data: { click_sounds: value } });
    if (value) playClickSound(true);
  }
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border-2 border-black/15 px-5 py-4">
      <span>
        <span className="block font-semibold">Button sounds</span>
        <span className="text-sm text-black/55">
          Play a quiet click when buttons are pressed.
        </span>
      </span>
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => void update(event.target.checked)}
        aria-label="Button sounds"
        className="size-5 accent-[#109fe9]"
      />
    </label>
  );
}
