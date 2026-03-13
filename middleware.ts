import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip public/static/internal routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/subscribe") ||
    pathname.startsWith("/success") ||
    pathname.startsWith("/cancel")
  ) {
    return NextResponse.next();
  }

  // Example values pulled from cookies
  const trialStartedAt = req.cookies.get("trial_started_at")?.value;
  const subscriptionActive = req.cookies.get("subscription_active")?.value === "true";

  if (trialStartedAt) {
    const started = new Date(trialStartedAt).getTime();

    if (!Number.isNaN(started)) {
      const oneHourMs = 60 * 60 * 1000;
      const expired = Date.now() > started + oneHourMs;

      if (expired && !subscriptionActive) {
        const url = req.nextUrl.clone();
        url.pathname = "/subscribe";
        url.searchParams.set("reason", "trial_expired");
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
      Protect app routes, but leave public pages alone.
      Adjust this to your actual protected routes.
    */
    "/dashboard/:path*",
    "/play/:path*",
    "/app/:path*",
  ],
};
