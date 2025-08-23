import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Subscription from '@/models/Subscription';
import AdbixPlan from '@/models/AdbixPlan';
import AdbixAddon from '@/models/AdbixAddon';
import User from '@/models/User';
import RazorpayService, { isRazorpayConfigured } from '@/lib/razorpay';

/**
 * Get UTC Unix timestamp (seconds since epoch) as required by Razorpay
 * @param offsetSeconds - Optional offset in seconds to add to current time
 * @returns UTC Unix timestamp (10-digit number)
 * 
 * Example: getUtcTimestamp() returns 1724234567 (current time)
 * Example: getUtcTimestamp(300) returns 1724234867 (5 minutes from now)
 */
function getUtcTimestamp(offsetSeconds: number = 0): number {
  return Math.floor(Date.now() / 1000) + offsetSeconds;
}

/**
 * GET /api/subscriptions - Get user's subscriptions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const subscriptions = await Subscription.find({ userId: session.user.mobileNumber })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ 
      success: true, 
      subscriptions: subscriptions.map(sub => ({
        id: sub._id,
        planId: sub.planId,
        razorpaySubscriptionId: sub.razorpaySubscriptionId,
        status: sub.status,
        amount: sub.amount,
        currency: sub.currency,
        startDate: sub.startDate,
        endDate: sub.endDate,
        nextBillingDate: sub.nextBillingDate,
        addons: sub.addons,
        shortUrl: sub.shortUrl,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscriptions - Create a new subscription
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Razorpay is properly configured
    if (!isRazorpayConfigured()) {
      return NextResponse.json({ 
        error: 'Payment service not configured', 
        message: 'Razorpay environment variables are not set. Please contact support.' 
      }, { status: 503 });
    }

    const body = await request.json();
    const { planId, selectedAddons = [], customerInfo, notifyInfo } = body;

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Check for existing active subscription
    const existingSubscription = await Subscription.findOne({
      userId: session.user.mobileNumber,
      status: { $in: ['created', 'authenticated', 'active'] }
    });

    if (existingSubscription) {
      return NextResponse.json({ 
        error: 'You already have an active subscription' 
      }, { status: 400 });
    }

    // Get plan details
    const plan = await AdbixPlan.findOne({ planId, isActive: true });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (!plan.razorpayPlanId) {
      return NextResponse.json({ 
        error: 'Razorpay plan not configured for this plan' 
      }, { status: 400 });
    }

    // Calculate total amount with addons
    let totalAmount = plan.price;
    const addonDetails = [];

    if (selectedAddons.length > 0) {
      const addons = await AdbixAddon.find({ 
        addonId: { $in: selectedAddons }, 
        isActive: true 
      });

      for (const addon of addons) {
        totalAmount += addon.price;
        addonDetails.push({
          addonId: addon.addonId,
          quantity: 1,
          unitAmount: addon.price
        });
      }
    }

    // Create or get Razorpay customer
    let razorpayCustomer;
    try {
      razorpayCustomer = await RazorpayService.findOrCreateCustomer({
        name: customerInfo?.name || session.user.name || 'Customer',
        email: customerInfo?.email || session.user.email || '',
        contact: customerInfo?.phone || session.user.mobileNumber || '',
        notes: {
          userId: session.user.mobileNumber,
          planId: planId
        }
      });
    } catch (error) {
      console.error('Error creating/finding Razorpay customer:', error);
      return NextResponse.json({ 
        error: 'Failed to create or find customer profile' 
      }, { status: 500 });
    }

    // Log subscription timing for debugging
    console.log('Creating subscription with current time:', new Date().toISOString());
    console.log('Current UTC timestamp:', Math.floor(Date.now() / 1000));

    // Prepare subscription data for Razorpay with proper UTC timing for UPI Autopay
    // Razorpay requires Unix timestamp in UTC (seconds since epoch)
    const currentUtcTime = getUtcTimestamp(); // Current UTC timestamp
    const startAtTime = getUtcTimestamp(300); // Start after 5 minutes to allow for authentication
    const expireByTime = getUtcTimestamp(24 * 60 * 60); // Expire in 24 hours
    
    // Validate timestamp format (should be 10-digit Unix timestamp)
    if (startAtTime.toString().length !== 10) {
      console.error('Invalid timestamp format for start_at:', startAtTime);
      return NextResponse.json({ 
        error: 'Invalid timestamp format for subscription start time' 
      }, { status: 500 });
    }
    
    const subscriptionData: any = {
      plan_id: plan.razorpayPlanId,
      customer_notify: true,
      quantity: 1,
      total_count: 12, // 12 months for annual billing
      customer_id: razorpayCustomer.id,
      start_at: startAtTime, // UTC Unix timestamp (seconds since epoch)
      expire_by: expireByTime, // UTC Unix timestamp (seconds since epoch)
      notes: {
        userId: session.user.mobileNumber,
        planId: planId,
        totalAmount: RazorpayService.toPaise(totalAmount),
        addons: JSON.stringify(selectedAddons),
        upiAutopay: 'true' // Flag to indicate UPI Autopay subscription
      },
      notify_info: notifyInfo ? {
        notify_phone: notifyInfo.phone,
        notify_email: notifyInfo.email
      } : undefined
    };

    console.log('🔥 Creating UPI Autopay subscription:');
    console.log('⏰ Current UTC time:', new Date(currentUtcTime * 1000).toISOString());
    console.log('🚀 Start UTC time:', new Date(startAtTime * 1000).toISOString());
    console.log('📅 Start timestamp (UTC):', startAtTime, '(format: Unix timestamp - seconds since epoch)');
    console.log('⏰ Expire timestamp (UTC):', expireByTime, '(24 hours from now)');
    console.log('💳 Note: UPI Autopay will auto-charge after mandate authentication');

    // Add addons to subscription if any
    if (addonDetails.length > 0) {
      subscriptionData.addons = addonDetails.map(addon => ({
        item: {
          name: `Addon: ${addon.addonId}`,
          amount: RazorpayService.toPaise(addon.unitAmount),
          currency: 'INR'
        },
        quantity: addon.quantity
      }));
    }

    // Create Razorpay subscription
    let razorpaySubscription;
    try {
      razorpaySubscription = await RazorpayService.createSubscription(subscriptionData);
    } catch (error: any) {
      console.error('Error creating Razorpay subscription:', error);
      
      // Handle timing-related errors
      if (error.error && (
        error.error.description?.includes('start time is past') ||
        error.error.description?.includes('Cannot do an auth transaction')
      )) {
        // Retry with a later start time
        console.log('Retrying subscription creation with later start time...');
        subscriptionData.start_at = Math.floor(Date.now() / 1000) + 600; // 10 minutes from now
        
        try {
          razorpaySubscription = await RazorpayService.createSubscription(subscriptionData);
          console.log('Subscription created successfully on retry');
        } catch (retryError) {
          console.error('Error on retry:', retryError);
          return NextResponse.json({ 
            error: 'Failed to create subscription due to timing issues. Please try again in a few minutes.' 
          }, { status: 500 });
        }
      } else {
      return NextResponse.json({ 
        error: 'Failed to create subscription' 
      }, { status: 500 });
      }
    }

    // Save subscription to database
    const subscription = new Subscription({
      userId: session.user.mobileNumber,
      planId: planId,
      razorpaySubscriptionId: razorpaySubscription.id,
      razorpayPlanId: plan.razorpayPlanId,
      razorpayCustomerId: razorpayCustomer.id,
      status: razorpaySubscription.status,
      startDate: new Date(razorpaySubscription.start_at * 1000),
      endDate: razorpaySubscription.end_at ? new Date(razorpaySubscription.end_at * 1000) : undefined,
      nextBillingDate: razorpaySubscription.charge_at ? new Date(razorpaySubscription.charge_at * 1000) : undefined,
      totalCount: razorpaySubscription.total_count,
      paidCount: razorpaySubscription.paid_count,
      remainingCount: razorpaySubscription.remaining_count,
      shortUrl: razorpaySubscription.short_url,
      notes: razorpaySubscription.notes,
      addons: addonDetails,
      amount: RazorpayService.toPaise(totalAmount),
      currency: 'INR',
      metadata: {
        customerInfo,
        notifyInfo
      }
    });

    await subscription.save();

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription._id,
        razorpaySubscriptionId: razorpaySubscription.id,
        status: subscription.status,
        shortUrl: razorpaySubscription.short_url,
        amount: subscription.amount,
        currency: subscription.currency,
        startDate: subscription.startDate,
        nextBillingDate: subscription.nextBillingDate
      }
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}