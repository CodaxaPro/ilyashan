import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const legacyPaths = ["/", "/angebot", "/impressum", "/datenschutz"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/de" || pathname.startsWith("/de/")) {
    const newPath = pathname.replace(/^\/de/, "") || "/";
    return NextResponse.rewrite(new URL(newPath, request.url));
  }

  if (legacyPaths.includes(pathname)) {
    const dePath = pathname === "/" ? "/de" : `/de${pathname}`;
    return NextResponse.redirect(new URL(dePath, request.url));
  }
}

export const config = {
  matcher: ["/", "/de", "/de/:path*", "/angebot", "/impressum", "/datenschutz"],
};
