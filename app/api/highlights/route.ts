import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Log in to see your highlights" },
      { status: 401 },
    );
  const { data, error } = await supabase
    .from("highlights")
    .select(
      "id,quote,text,note,color,chapter_title,created_at,book:books(id,title,author,cover_url)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    {
      data: (data ?? []).map((item: any) => ({
        ...item,
        quote: item.quote ?? item.text,
      })),
    },
    {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
      },
    },
  );
}
