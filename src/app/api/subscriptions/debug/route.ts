import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Subscription from '@/models/Subscription';
import RazorpayService, { isRazorpayConfigured } from '@/lib/razorpay';

/**
 * POST /api/subscriptions/debug - Debug subscription charging issues
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 });
    }

    if (!isRazorpayConfigured()) {
      return NextResponse.json({ error: 'Razorpay not configured' }, { status: 503 });
    }

    await dbConnect();

    // Get local subscription
    const localSubscription = await Subscription.findOne({
      _id: subscriptionId,
      userId: session.user.id
    });

    if (!localSubscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    console.log('🔍 Debug request for subscription:', localSubscription.razorpaySubscriptionId);

    // Get fresh data from Razorpay
    const razorpayInstance = new (require('razorpay'))({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Fetch subscription details
    const razorpaySubscription = await razorpayInstance.subscriptions.fetch(
      localSubscription.razorpaySubscriptionId
    );

    // Fetch all payments for this subscription
    let payments = [];
    try {
      const allPayments = await razorpayInstance.payments.all({
        count: 100
      });
      
      // Filter payments related to this subscription
      payments = allPayments.items.filter((payment: any) => 
        payment.notes?.subscription_id === localSubscription.razorpaySubscriptionId ||
        payment.order_id === localSubscription.razorpaySubscriptionId
      );
    } catch (error) {
      console.error('Error fetching payments:', error);
    }

    // Get customer details
    let customer = null;
    try {
      customer = await razorpayInstance.customers.fetch(localSubscription.razorpayCustomerId);
    } catch (error) {
      console.error('Error fetching customer:', error);
    }

    // Calculate timing
    const currentTime = new Date();
    const scheduledTime = new Date(razorpaySubscription.charge_at * 1000);
    const timeDiff = currentTime.getTime() - scheduledTime.getTime();
    const minutesOverdue = Math.round(timeDiff / (1000 * 60));

    // Analyze the issue
    let diagnosis = [];
    let recommendations = [];

    if (razorpaySubscription.status === 'authenticated' && minutesOverdue > 0) {
      diagnosis.push('❌ Charge time passed but subscription not charged');
      diagnosis.push('🔍 Possible reasons: UPI mandate issue, insufficient balance, bank problems');
      
      recommendations.push('Check UPI mandate status in your banking app');
      recommendations.push('Verify sufficient balance in UPI account');
      recommendations.push('Contact bank if mandate appears inactive');
      recommendations.push('Consider canceling and creating fresh subscription');
    }

    if (payments.length === 0) {
      diagnosis.push('❌ No payment attempts found for this subscription');
      recommendations.push('Razorpay may not have attempted charging due to mandate issues');
    }

    // Check webhook events
    const webhookEvents = localSubscription.webhookEvents || [];
    const recentEvents = webhookEvents.filter((event: any) => {
      const eventTime = new Date(event.processedAt);
      const timeDiff = currentTime.getTime() - eventTime.getTime();
      return timeDiff < (60 * 60 * 1000); // Last hour
    });

    console.log('📊 Debug results:', {
      status: razorpaySubscription.status,
      minutesOverdue,
      paymentsFound: payments.length,
      recentWebhooks: recentEvents.length
    });

    return NextResponse.json({
      debug: {
        subscriptionId: localSubscription._id,
        razorpaySubscriptionId: localSubscription.razorpaySubscriptionId,
        currentTime: currentTime.toISOString(),
        scheduledTime: scheduledTime.toISOString(),
        minutesOverdue,
        status: razorpaySubscription.status
      },
      razorpayData: {
        subscription: razorpaySubscription,
        customer: customer,
        paymentsCount: payments.length,
        payments: payments.slice(0, 5) // Show last 5 payments
      },
      localData: {
        status: localSubscription.status,
        webhookEventsCount: webhookEvents.length,
        recentWebhookEvents: recentEvents
      },
      diagnosis,
      recommendations,
      nextSteps: [
        'Check your UPI app for any failed transaction notifications',
        'Verify UPI mandate is active in your banking app',
        'Check account balance',
        'If mandate is inactive, create a new subscription',
        'Contact bank support if needed'
      ]
    });

  } catch (error) {
    console.error('Debug API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to debug subscription', details: errorMessage },
      { status: 500 }
    );
  }
} 