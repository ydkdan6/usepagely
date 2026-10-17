import { createClient } from "@supabase/supabase-js";

function getUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  return value;
}

export function createPublicSupabaseClient() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key)
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not configured");
  return createClient(getUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createServiceSupabaseClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return createClient(getUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
