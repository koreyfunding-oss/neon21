// app/api/subscribe/route.ts
// Handles plan-based subscription via Square
import { NextRequest, NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';
import { createClient } from '@/lib/supabase';

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.SQUARE_ENV === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

const PLAN_PRICES: Record<string, string> = {
  basic: process.env.SQUARE_PLAN_VARIATION_ID || '',
  premium: process.env.SQUARE_PREMIUM_PLAN_VARIATION_ID || process.env.SQUARE_PLAN_VARIATION_ID || '',
};

export async function POST(req: NextRequest) {
  try {
    const { userId, plan } = await req.json();

    if (!userId || !plan) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const planVariationId = PLAN_PRICES[plan as string];
    if (!planVariationId) {
      return NextResponse.json({ success: false, error: 'Invalid plan' }, { status: 400 });
    }

    const supabase = createClient();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Create Square customer if not exists
    let customerId = profile.square_customer_id;
    if (!customerId) {
      const { customer } = await squareClient.customers.create({
        emailAddress: profile.email,
        referenceId: userId,
        note: 'NEON21 subscriber',
      });
      customerId = customer?.id;
      await supabase.from('profiles').update({ square_customer_id: customerId }).eq('id', userId);
    }

    // Create subscription
    const { subscription } = await squareClient.subscriptions.create({
      idempotencyKey: `${userId}-${plan}-${Date.now()}`,
      locationId: process.env.SQUARE_LOCATION_ID!,
      planVariationId,
      customerId: customerId!,
      source: { name: plan },
    });

    if (!subscription) {
      throw new Error('Subscription creation failed');
    }

    await supabase.from('profiles').update({
      subscription_status: 'active',
      subscription_id: subscription.id,
      subscription_started_at: new Date().toISOString(),
    }).eq('id', userId);

    return NextResponse.json({
      success: true,
      status: 'active',
      message: 'Subscription activated successfully',
    });
  } catch (err: unknown) {
    console.error('[NEON21 Subscribe Error]', err);
    return NextResponse.json({
      success: false,
      error: 'Payment processing failed. Please try again.',
    }, { status: 500 });
  }
}
