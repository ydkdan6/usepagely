import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublicGetRoute =
    request.method === "GET" &&
    (pathname === "/api/books" ||
      pathname.startsWith("/api/books/") ||
      pathname === "/api/categories" ||
      pathname.startsWith("/api/categories/"));
  if (isPublicGetRoute) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && (pathname === "/login" || pathname === "/signup"))
    return NextResponse.redirect(new URL("/", request.url));
  if (!user && pathname.startsWith("/library"))
    return NextResponse.redirect(new URL("/", request.url));
  return response;
}
