import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/auth-screen";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (user) redirect("/library");
  return <AuthScreen />;
}
