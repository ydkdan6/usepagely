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

  const canReadOffline =
    pathname === "/offline" ||
    pathname === "/library/downloads" ||
    pathname.startsWith("/library/read/");

  // Offline downloads must be reachable without asking Supabase for a session.
  // A session lookup requires the network and was sending logged-out users to /login.
  if (canReadOffline) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-offline-access", "1");
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return response;
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
  const authRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/auth/");
  if (user && authRoute && !pathname.startsWith("/auth/callback"))
    return NextResponse.redirect(new URL("/", request.url));
  const canReadOffline =
    pathname === "/offline" ||
    pathname === "/library/downloads" ||
    pathname.startsWith("/library/read/");
  if (canReadOffline) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-offline-access", "1");
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }
  if (!user && !authRoute && !pathname.startsWith("/api/")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("returnTo", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }
  return response;
}
