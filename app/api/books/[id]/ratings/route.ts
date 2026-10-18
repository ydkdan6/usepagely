import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const page = Math.max(
    1,
    Number(new URL(request.url).searchParams.get("page") ?? 1),
  );
  const supabase = await createClient();
  const { data, error, count } = await supabase
    .from("book_ratings")
    .select(
      "id,user_id,book_id,rating,comment,created_at,profiles(username,display_name,avatar_seed)",
      { count: "exact" },
    )
    .eq("book_id", id)
    .order("created_at", { ascending: false })
    .range((page - 1) * 10, page * 10 - 1);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    data: data ?? [],
    page,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / 10)),
  });
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await request.json();
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return NextResponse.json(
      { error: "Rating must be between 1 and 5" },
      { status: 400 },
    );
  const { data, error } = await supabase
    .from("book_ratings")
    .upsert(
      {
        user_id: user.id,
        book_id: id,
        rating,
        comment: String(body.comment ?? "").trim(),
      },
      { onConflict: "user_id,book_id" },
    )
    .select(
      "id,user_id,book_id,rating,comment,created_at,profiles(username,display_name,avatar_seed)",
    )
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
