import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, isValidAuthToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const password = process.env.APP_PASSWORD;
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const authenticated =
    !password || (await isValidAuthToken(token, password));

  if (pathname === "/login") {
    if (authenticated && password) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (!authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
