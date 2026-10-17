import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export async function signIn(input: unknown) {
  const data = credentials.parse(input);
  return createClient().auth.signInWithPassword(data);
}
export async function signUp(input: unknown) {
  const data = z
    .object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1),
      username: z.string().regex(/^[a-zA-Z0-9_]{3,20}$/),
      phone: z.string().max(30).optional(),
    })
    .parse(input);
  return createClient().auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        display_name: data.name,
        username: data.username,
        phone: data.phone ?? "",
        avatar_seed: crypto.randomUUID(),
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}
export async function signOut() {
  return createClient().auth.signOut();
}
