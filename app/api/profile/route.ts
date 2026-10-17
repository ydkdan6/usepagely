import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
const profileSchema = z.object({
  username: z.string().regex(/^[a-zA-Z0-9_]{3,20}$/),
  display_name: z.string().max(80),
  bio: z.string().max(500),
  avatar_url: z.string().url().optional(),
});
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url,bio,updated_at")
    .eq("id", user.id)
    .maybeSingle();
  return NextResponse.json(
    { profile: data, user: { id: user.id, email: user.email } },
    { status: error ? 500 : 200 },
  );
}
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid profile" }, { status: 400 });
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .select("id,username,display_name,avatar_url,bio,updated_at")
    .single();
  if (error?.code === "23505")
    return NextResponse.json(
      { error: "Username is already taken" },
      { status: 409 },
    );
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
