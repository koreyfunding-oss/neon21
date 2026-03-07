import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const protectedRoutes = ['/dashboard', '/game', '/engine'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (!protectedRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    const response = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.redirect(new URL('/auth', request.url));
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status,trial_started_at')
        .eq('id', user.id)
        .single();

    if (!profile) {
        return NextResponse.redirect(new URL('/auth', request.url));
    }

    if (profile.subscription_status === 'active') {
        return response;
    }

    if (profile.subscription_status === 'trial' && profile.trial_started_at) {
        const now = Date.now();
        const trialStartTime = new Date(profile.trial_started_at).getTime();
        const trialExpired = (now - trialStartTime) > 3600000;

        if (trialExpired) {
            return NextResponse.redirect(new URL('/trial-expired', request.url));
        }

        return response;
    }

    return NextResponse.redirect(new URL('/trial-expired', request.url));
}

export const config = {
    matcher: ['/dashboard/:path*', '/game/:path*', '/engine/:path*']
};