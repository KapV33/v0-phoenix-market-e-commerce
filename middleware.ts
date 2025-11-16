import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin routes
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const adminId = request.cookies.get("phoenix_admin_id")?.value

    if (!adminId) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  // Protect market routes
  if (pathname.startsWith("/market")) {
    const userId = request.cookies.get("phoenix_user_id")?.value

    if (!userId) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/market/:path*"],
}
