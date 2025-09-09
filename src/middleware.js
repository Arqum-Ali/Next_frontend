import { NextResponse } from "next/server";

export async function middleware(req) {
  const url = req.nextUrl.clone();

  // Allow login/signup
  if (url.pathname.startsWith("/login") || url.pathname.startsWith("/signup")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("sb-access-token")?.value;

  if (!token) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
