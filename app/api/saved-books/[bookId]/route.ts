import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { error } = await supabase
    .from("saved_books")
    .delete()
    .eq("user_id", user.id)
    .eq("book_id", bookId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
