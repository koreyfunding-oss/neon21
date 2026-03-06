import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

const protectedRoutes = ['/dashboard', '/game', '/engine'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    if (!protectedRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.redirect(new URL('/auth', request.url));
    }

    const { data: profile } = await supabase.from('profiles').select('subscription_status,trial_started_at').eq('id', session.user.id).single();

    if (!profile) {
        return NextResponse.redirect(new URL('/auth', request.url));
    }

    const now = new Date().getTime();
    const trialStartTime = new Date(profile.trial_started_at).getTime();
    const trialExpired = (now - trialStartTime) > 3600000;

    if (profile.subscription_status === 'trial' && trialExpired && !profile.subscription_status === 'active') {
        return NextResponse.redirect(new URL('/trial-expired', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/game/:path*', '/engine/:path*']
};