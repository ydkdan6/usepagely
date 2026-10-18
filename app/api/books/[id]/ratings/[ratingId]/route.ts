import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; ratingId: string }> },
) {
  const { id, ratingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { error } = await supabase
    .from("book_ratings")
    .delete()
    .eq("id", ratingId)
    .eq("book_id", id)
    .eq("user_id", user.id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
