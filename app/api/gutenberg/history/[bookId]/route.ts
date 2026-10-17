import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { bookId } = await params;
  const { error } = await supabase
    .from("reading_history")
    .delete()
    .eq("user_id", user.id)
    .eq("book_id", bookId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
