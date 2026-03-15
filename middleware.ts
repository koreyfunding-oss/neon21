import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

const TRIAL_DURATION_MS = 60 * 60 * 1000; // 1 hour — matches useTrialTimer.ts
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

    if (profile.subscription_status === 'active') {
        return NextResponse.next();
    }

    if (profile.subscription_status === 'trial') {
        const trialStartTime = new Date(profile.trial_started_at).getTime();
        const trialExpired = (Date.now() - trialStartTime) > TRIAL_DURATION_MS;
        if (trialExpired) {
            return NextResponse.redirect(new URL('/trial-expired', request.url));
        }
    }
  }

  return NextResponse.next();
}

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/game/:path*', '/engine/:path*']
};
