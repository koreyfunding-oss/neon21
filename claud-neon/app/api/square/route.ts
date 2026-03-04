import { NextRequest, NextResponse } from 'next/server';
import { Client, Environment } from 'square';
import { createClient } from '@/lib/supabase';

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.SQUARE_ENV === 'production' ? Environment.Production : Environment.Sandbox,
});

export async function POST(req: NextRequest) {
  try {
    const { sourceId, userId, walletType } = await req.json();

    if (!sourceId || !userId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient();

    // Verify user exists
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
      const { result: customerResult } = await squareClient.customersApi.createCustomer({
        emailAddress: profile.email,
        referenceId: userId,
        note: 'NEON21 subscriber'
      });
      customerId = customerResult.customer?.id;

      await supabase.from('profiles').update({
        square_customer_id: customerId
      }).eq('id', userId);
    }

    // Create subscription via Square
    // NOTE: Payment URLs are NEVER sent to frontend — only success/failure
    const { result: subResult } = await squareClient.subscriptionsApi.createSubscription({
      idempotencyKey: `${userId}-${Date.now()}`,
      locationId: process.env.SQUARE_LOCATION_ID!,
      planVariationId: process.env.SQUARE_PLAN_VARIATION_ID!,
      customerId: customerId!,
      source: { name: walletType || 'card' },
    });

    if (!subResult.subscription) {
      throw new Error('Subscription creation failed');
    }

    const subscriptionId = subResult.subscription.id;

    // Store subscription in Supabase — server side only
    await supabase.from('profiles').update({
      subscription_status: 'active',
      subscription_id: subscriptionId,
      subscription_started_at: new Date().toISOString(),
    }).eq('id', userId);

    // Return ONLY success status — never payment URLs or tokens
    return NextResponse.json({
      success: true,
      status: 'active',
      message: 'Subscription activated successfully'
    });

  } catch (err: unknown) {
    console.error('[NEON21 Square Error]', err);
    // Never leak payment details in error messages
    return NextResponse.json({
      success: false,
      error: 'Payment processing failed. Please try again.'
    }, { status: 500 });
  }
}
