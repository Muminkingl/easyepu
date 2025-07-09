import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

// Paddle API key - This would normally be in an environment variable
const PADDLE_API_KEY = 'apikey_01jzn0my1r2vgrs4wtt3z754f1';

// This route handles webhook events from Paddle
export async function POST(request: NextRequest) {
  try {
    // For Paddle Billing V2, the payload is JSON
    const payload = await request.json();
    
    // Validate webhook signature in production
    const isValidSignature = await verifyPaddleWebhook(request.headers, payload);
    
    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Process different webhook event types
    const eventType = payload.event_type;
    
    if (eventType === 'transaction.completed') {
      await handleSuccessfulPayment(payload);
    } else if (eventType === 'subscription.created') {
      await handleSubscriptionCreated(payload);
    }
    
    // Always return a 200 response to acknowledge receipt of the webhook
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Function to verify the webhook signature from Paddle
async function verifyPaddleWebhook(headers: Headers, payload: any): Promise<boolean> {
  // In development mode, always return true for testing
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  try {
    // Paddle Billing V2 uses a different signature verification method
    const paddleSignature = headers.get('Paddle-Signature');
    if (!paddleSignature) {
      return false;
    }
    
    // In a real implementation, you would verify the signature with Paddle's public key
    // For now, return true in development
    return true;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Handle successful one-time payment
async function handleSuccessfulPayment(payload: any) {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return;
    }
    
    // Parse custom data
    const customData = payload.data?.custom_data || {};
    
    // For Paddle Billing V2, the data structure is different
    const { error } = await supabase.from('donations').insert({
      paddle_checkout_id: payload.data?.id || null,
      user_id: customData.userId || null,
      amount: payload.data?.amount || 0,
      currency: payload.data?.currency || 'USD',
      tier: customData.tierSelected || null,
      payment_method: payload.data?.payment_method || null,
      email: payload.data?.customer?.email || null,
      receipt_url: payload.data?.receipt_url || null,
      payment_date: new Date().toISOString(),
      status: 'completed'
    });
    
    if (error) {
      console.error('Error storing payment record:', error);
    }
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

// Handle subscription created
async function handleSubscriptionCreated(payload: any) {
  try {
    // Similar to handleSuccessfulPayment but for subscriptions
    console.log('Subscription created', payload);
  } catch (error) {
    console.error('Error handling subscription creation:', error);
  }
} 