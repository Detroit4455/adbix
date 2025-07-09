import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import RazorpayService, { isRazorpayConfigured } from '@/lib/razorpay';

/**
 * POST /api/subscriptions/verify - Verify payment signature
 * Required by Razorpay Integration Guide for payment verification
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isRazorpayConfigured()) {
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 503 });
    }

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = await request.json();

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json({ 
        error: 'Missing required parameters: razorpay_payment_id, razorpay_subscription_id, razorpay_signature' 
      }, { status: 400 });
    }

    console.log('🔐 Verifying payment signature for subscription:', razorpay_subscription_id);

    // Verify signature as per Razorpay Integration Guide
    // generated_signature = hmac_sha256(razorpay_payment_id + "|" + subscription_id, secret);
    const isValid = RazorpayService.verifyPaymentSignature(
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature
    );

    if (!isValid) {
      console.error('❌ Invalid payment signature for subscription:', razorpay_subscription_id);
      return NextResponse.json({ 
        error: 'Invalid payment signature',
        verified: false 
      }, { status: 400 });
    }

    console.log('✅ Payment signature verified successfully for subscription:', razorpay_subscription_id);

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Payment signature verified successfully'
    });

  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment signature', verified: false },
      { status: 500 }
    );
  }
} 