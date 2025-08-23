import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Subscription from '@/models/Subscription';
import RazorpayService, { RAZORPAY_CONFIG, isRazorpayConfigured, getRazorpayInstance } from '@/lib/razorpay';
import { subscriptionCache } from '@/lib/subscriptionCache';

// Simple in-memory cache for webhook replay protection
const webhookCache = new Map<string, number>();
const WEBHOOK_REPLAY_WINDOW = 5 * 60 * 1000; // 5 minutes
const MAX_WEBHOOK_REQUESTS_PER_MINUTE = 100;
const webhookRateLimit = new Map<string, { count: number; resetTime: number }>();

/**
 * Check if webhook is a replay based on event ID and timestamp
 */
function isWebhookReplay(eventId: string, timestamp: number): boolean {
  const now = Date.now();
  const cacheKey = eventId;
  
  // Clean old entries
  for (const [key, time] of webhookCache.entries()) {
    if (now - time > WEBHOOK_REPLAY_WINDOW) {
      webhookCache.delete(key);
    }
  }
  
  // Check if we've seen this event recently
  if (webhookCache.has(cacheKey)) {
    return true; // Replay detected
  }
  
  // Store this event
  webhookCache.set(cacheKey, now);
  return false;
}

/**
 * Simple rate limiting for webhook endpoint
 */
function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const oneMinute = 60 * 1000;
  
  if (!webhookRateLimit.has(clientId)) {
    webhookRateLimit.set(clientId, { count: 1, resetTime: now + oneMinute });
    return false;
  }
  
  const rateData = webhookRateLimit.get(clientId)!;
  
  if (now > rateData.resetTime) {
    // Reset the counter
    rateData.count = 1;
    rateData.resetTime = now + oneMinute;
    return false;
  }
  
  if (rateData.count >= MAX_WEBHOOK_REQUESTS_PER_MINUTE) {
    return true; // Rate limited
  }
  
  rateData.count++;
  return false;
}

/**
 * Helper function to extract minimal, non-sensitive payment method details
 */
function extractMinimalPaymentData(paymentData: any): any {
  if (!paymentData?.method) return null;

  const baseDetails = {
    paymentId: paymentData.id,
    amount: paymentData.amount,
    currency: paymentData.currency,
    status: paymentData.status,
    capturedAt: paymentData.captured_at ? new Date(paymentData.captured_at * 1000) : undefined,
    method: paymentData.method
  };

  // Extract only safe, non-PCI data based on payment method
  switch (paymentData.method) {
    case 'card':
      if (paymentData.card) {
        return {
          type: 'card' as const,
          details: {
            ...baseDetails,
            last4: paymentData.card.last4,
            network: paymentData.card.network,
            issuer: paymentData.card.issuer,
            type: paymentData.card.type // debit/credit
          }
        };
      }
      break;
    
    case 'upi':
      if (paymentData.upi) {
        // Mask UPI VPA for privacy
        const vpa = String(paymentData.upi.vpa || '');
        const maskedVpa = vpa.replace(/^(.).+(@.*)$/, '$1***$2');
        return {
          type: 'upi' as const,
          details: {
            ...baseDetails,
            vpa: maskedVpa
          }
        };
      }
      break;
    
    case 'netbanking':
      if (paymentData.bank) {
        return {
          type: 'netbanking' as const,
          details: {
            ...baseDetails,
            bank: paymentData.bank
          }
        };
      }
      break;
    
    case 'wallet':
      if (paymentData.wallet) {
        return {
          type: 'wallet' as const,
          details: {
            ...baseDetails,
            wallet: paymentData.wallet
          }
        };
      }
      break;
    
    default:
      return {
        type: paymentData.method as 'card' | 'upi' | 'netbanking' | 'wallet',
        details: baseDetails
      };
  }

  // Fallback for unknown payment methods
  return {
    type: paymentData.method as 'card' | 'upi' | 'netbanking' | 'wallet',
    details: baseDetails
  };
}

/**
 * Helper function to save subscription and invalidate cache
 */
async function saveSubscriptionAndInvalidateCache(subscription: any) {
  await subscription.save();
  if (subscription.userId) {
    subscriptionCache.invalidateUser(subscription.userId);
    console.log(`🗑️ Cache invalidated for user ${subscription.userId} due to subscription change`);
  }
}

/**
 * Events that are allowed to change subscription status
 * These are official status change events from Razorpay
 */
const STATUS_CHANGE_EVENTS = [
  'subscription.activated',
  'subscription.pending', 
  'subscription.halted',
  'subscription.cancelled',
  'subscription.completed',
  'subscription.expired',
  'subscription.paused',    // Official status change - subscription paused
  'subscription.resumed'    // Official status change - subscription resumed
];

/**
 * Events that are informational only and should NOT change subscription status
 * These events provide additional data but don't represent status changes
 */
const INFORMATIONAL_EVENTS = [
  'subscription.charged',        // Payment processed - informational
  'subscription.authenticated', // UPI mandate approved - informational
  'payment.authorized',          // Payment authorized - informational
  'payment.failed'               // Payment failed - informational
];

/**
 * Safely update subscription status only for allowed events
 * @param subscription - The subscription document
 * @param newStatus - The new status to set
 * @param eventType - The webhook event type that triggered this
 * @param eventData - Additional event data
 * @returns boolean - True if status was updated, false if not allowed
 */
function updateSubscriptionStatus(subscription: any, newStatus: string, eventType: string, eventData: any = {}): boolean {
  if (!STATUS_CHANGE_EVENTS.includes(eventType)) {
    console.log(`ℹ️  Event '${eventType}' is informational - subscription status remains '${subscription.status}'`);
    
    // Still log the event for tracking, but don't change status
    subscription.webhookEvents.push({
      eventType: eventType,
      eventData: {
        ...eventData,
        note: 'Informational event - status not changed',
        previousStatus: subscription.status,
        statusChangeAttempted: newStatus,
        statusChangeAllowed: false
      },
      processedAt: new Date()
    });
    
    return false;
  }

  // Official status change event - update the status
  const previousStatus = subscription.status;
  subscription.status = newStatus;
  
  console.log(`✅ Status change allowed for '${eventType}': ${previousStatus} → ${newStatus}`);
  
  subscription.webhookEvents.push({
    eventType: eventType,
    eventData: {
      ...eventData,
      previousStatus,
      newStatus,
      statusChangeAllowed: true,
      statusChanged: true
    },
    processedAt: new Date()
  });
  
  return true;
}

/**
 * POST /api/webhooks/razorpay - Handle Razorpay webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Razorpay is properly configured
    if (!isRazorpayConfigured()) {
      console.error('Razorpay webhook received but Razorpay not configured');
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 503 });
    }

    // Rate limiting based on IP address
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(clientIp)) {
      console.warn('Webhook rate limit exceeded for IP:', clientIp);
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('No signature found in webhook request');
      return NextResponse.json({ error: 'No signature found' }, { status: 400 });
    }

    // Verify webhook signature
    const isValid = RazorpayService.verifyWebhookSignature(
      body,
      signature,
      RAZORPAY_CONFIG.webhook_secret
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const webhookData = JSON.parse(body);
    const { event, payload } = webhookData;

    // Replay protection - make eventId unique per event type
    const baseId = payload?.payment?.entity?.id || payload?.subscription?.entity?.id || Date.now().toString();
    const eventId = `${event}_${baseId}`;
    if (isWebhookReplay(eventId, Date.now())) {
      console.warn('Webhook replay detected for event:', eventId);
      return NextResponse.json({ error: 'Duplicate webhook detected' }, { status: 409 });
    }

    // Log webhook securely without sensitive payment data
    console.log('Received Razorpay webhook:', {
      event,
      paymentId: payload?.payment?.entity?.id,
      subscriptionId: payload?.subscription?.entity?.id,
      timestamp: new Date().toISOString()
    });

    await dbConnect();

    // Handle different webhook events
    switch (event) {
      case 'subscription.activated':
        await handleSubscriptionActivated(payload.subscription.entity);
        break;

      case 'subscription.charged':
        await handleSubscriptionCharged(payload.payment.entity, payload.subscription.entity);
        break;

      case 'subscription.completed':
        await handleSubscriptionCompleted(payload.subscription.entity);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload.subscription.entity);
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(payload.subscription.entity);
        break;

      case 'subscription.resumed':
        await handleSubscriptionResumed(payload.subscription.entity);
        break;

      case 'subscription.authenticated':
        await handleSubscriptionAuthenticated(payload.subscription.entity);
        break;

      case 'subscription.pending':
        await handleSubscriptionPending(payload.subscription.entity);
        break;

      case 'subscription.halted':
        await handleSubscriptionHalted(payload.subscription.entity);
        break;

      case 'subscription.expired':
        await handleSubscriptionExpired(payload.subscription.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;

      case 'payment.authorized':
        await handlePaymentAuthorized(payload.payment.entity);
        break;

      case 'payment.downtime.started':
        console.log('Payment downtime started - informational event');
        break;

      case 'payment.downtime.resolved':
        console.log('Payment downtime resolved - informational event');
        break;

      default:
        console.log('Unhandled webhook event:', event);
        break;
    }

    return NextResponse.json({ success: true, event });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle subscription activated event
 * 
 * NOTE: For UPI Autopay subscriptions, this event is NOT sent.
 * UPI Autopay subscriptions go directly from 'authenticated' to 'active' 
 * when the first payment is charged (subscription.charged event).
 * 
 * This event is only sent for regular subscriptions that have a separate activation step.
 */
async function handleSubscriptionActivated(subscriptionData: any) {
  try {
    console.log('🎉 Processing subscription.activated webhook for:', subscriptionData.id);
    console.log('ℹ️  Note: This event is NOT expected for UPI Autopay subscriptions');
    
    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: subscriptionData.id
    });

    if (!subscription) {
      console.error('❌ Subscription not found in database:', subscriptionData.id);
      return;
    }

    const previousStatus = subscription.status;
    
    // Update billing information
    subscription.startDate = new Date(subscriptionData.start_at * 1000);
    subscription.nextBillingDate = subscriptionData.charge_at ? 
      new Date(subscriptionData.charge_at * 1000) : subscription.nextBillingDate;
    subscription.currentPeriodStart = subscriptionData.current_start ? 
      new Date(subscriptionData.current_start * 1000) : subscription.currentPeriodStart;
    subscription.currentPeriodEnd = subscriptionData.current_end ? 
      new Date(subscriptionData.current_end * 1000) : subscription.currentPeriodEnd;
    
    // Update payment counts if available
    if (subscriptionData.paid_count !== undefined) {
      subscription.paidCount = subscriptionData.paid_count;
    }
    if (subscriptionData.remaining_count !== undefined) {
      subscription.remainingCount = subscriptionData.remaining_count;
    }

    // OFFICIAL STATUS CHANGE EVENT - subscription.activated is allowed to change status
    updateSubscriptionStatus(subscription, 'active', 'subscription.activated', {
      subscriptionId: subscriptionData.id,
      startAt: subscriptionData.start_at,
      chargeAt: subscriptionData.charge_at,
      currentStart: subscriptionData.current_start,
      currentEnd: subscriptionData.current_end,
      paidCount: subscriptionData.paid_count,
      remainingCount: subscriptionData.remaining_count,
      note: 'Official status change event - subscription activated'
    });

    await saveSubscriptionAndInvalidateCache(subscription);
    console.log('✅ Subscription activated successfully:', subscription.razorpaySubscriptionId);
    console.log('📊 Status transition:', previousStatus, '→', subscription.status);
    console.log('💰 Paid count:', subscription.paidCount, '| Remaining:', subscription.remainingCount);

  } catch (error) {
    console.error('❌ Error handling subscription activated:', subscriptionData.id, error);
  }
}

/**
 * Handle subscription charged event (successful payment)
 * 
 * This is the PRIMARY activation event for UPI Autopay subscriptions.
 * For UPI Autopay: subscription.authenticated → subscription.charged (activates subscription)
 * For regular subscriptions: subscription.charged → subscription.activated (separate events)
 */
async function handleSubscriptionCharged(paymentData: any, subscriptionData: any) {
  try {
    console.log('💳 Processing subscription.charged webhook for:', subscriptionData.id);
    console.log('💰 Payment amount:', paymentData.amount / 100, 'INR');
    
    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: subscriptionData.id
    });

    if (!subscription) {
      console.error('❌ Subscription not found in database:', subscriptionData.id);
      return;
    }

    const previousStatus = subscription.status;
    const wasFirstPayment = subscription.paidCount === 0 || subscription.status === 'authenticated';
    
    console.log('📊 Previous status:', previousStatus, '| Was first payment:', wasFirstPayment);
    
    // Update billing information (but NOT status - subscription.charged is informational)
    subscription.paidCount = subscriptionData.paid_count;
    subscription.remainingCount = subscriptionData.remaining_count;
    subscription.nextBillingDate = subscriptionData.charge_at ? 
      new Date(subscriptionData.charge_at * 1000) : subscription.nextBillingDate;
    subscription.currentPeriodStart = subscriptionData.current_start ? 
      new Date(subscriptionData.current_start * 1000) : subscription.currentPeriodStart;
    subscription.currentPeriodEnd = subscriptionData.current_end ? 
      new Date(subscriptionData.current_end * 1000) : subscription.currentPeriodEnd;

    // Store minimal, non-sensitive payment method details
    const minimalPaymentData = extractMinimalPaymentData(paymentData);
    if (minimalPaymentData) {
      subscription.paymentMethod = minimalPaymentData;
    }

    // Log the payment event but DO NOT change subscription status
    // subscription.charged is an informational event, not a status change event
    const eventType = wasFirstPayment ? 'subscription.first_payment_charged' : 'subscription.charged';
    updateSubscriptionStatus(subscription, 'active', eventType, {
      paymentId: paymentData.id,
      subscriptionId: subscriptionData.id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: paymentData.status,
      method: paymentData.method,
      wasFirstPayment,
      previousStatus,
      activatedFromAuthenticated: wasFirstPayment && previousStatus === 'authenticated',
      paidCount: subscriptionData.paid_count,
      remainingCount: subscriptionData.remaining_count,
      nextBillingDate: subscriptionData.charge_at ? new Date(subscriptionData.charge_at * 1000) : null,
      note: 'Payment processed - status remains unchanged as this is informational event'
    });

    await saveSubscriptionAndInvalidateCache(subscription);
    
    if (wasFirstPayment) {
      console.log('🎉 First payment charged, subscription activated:', subscription.razorpaySubscriptionId);
      console.log('📊 Status transition:', previousStatus, '→', subscription.status);
      console.log('💰 Payment processed:', paymentData.amount / 100, 'INR');
    } else {
      console.log('✅ Recurring payment charged:', subscription.razorpaySubscriptionId);
      console.log('💰 Payment processed:', paymentData.amount / 100, 'INR');
      console.log('📅 Next billing date:', subscription.nextBillingDate);
    }
    
    console.log('📈 Paid count:', subscription.paidCount, '| Remaining:', subscription.remainingCount);

  } catch (error) {
    console.error('❌ Error handling subscription charged:', subscriptionData.id, error);
  }
}

/**
 * Handle subscription completed event
 */
async function handleSubscriptionCompleted(subscriptionData: any) {
  try {
    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: subscriptionData.id
    });

    if (!subscription) {
      console.error('Subscription not found:', subscriptionData.id);
      return;
    }

    // Update end date
    subscription.endDate = subscriptionData.ended_at ? 
      new Date(subscriptionData.ended_at * 1000) : new Date();

    // OFFICIAL STATUS CHANGE EVENT - subscription.completed is allowed to change status
    updateSubscriptionStatus(subscription, 'completed', 'subscription.completed', {
      endedAt: subscriptionData.ended_at,
      note: 'Official status change event - subscription completed'
    });
    subscription.paidCount = subscriptionData.paid_count;
    subscription.remainingCount = 0;

    subscription.webhookEvents.push({
      eventType: 'subscription.completed',
      eventData: {
        subscriptionId: subscriptionData.id,
        status: subscriptionData.status,
        endedAt: subscriptionData.ended_at,
        paidCount: subscriptionData.paid_count,
        remainingCount: subscriptionData.remaining_count
      },
      processedAt: new Date()
    });

    await saveSubscriptionAndInvalidateCache(subscription);
    console.log('Subscription completed:', subscription.razorpaySubscriptionId);

  } catch (error) {
    console.error('Error handling subscription completed:', error);
  }
}

/**
 * Handle subscription cancelled event
 */
async function handleSubscriptionCancelled(subscriptionData: any) {
  try {
    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: subscriptionData.id
    });

    if (!subscription) {
      console.error('Subscription not found:', subscriptionData.id);
      return;
    }

    // Update end date
    subscription.endDate = subscriptionData.ended_at ? 
      new Date(subscriptionData.ended_at * 1000) : new Date();

    // OFFICIAL STATUS CHANGE EVENT - subscription.cancelled is allowed to change status
    updateSubscriptionStatus(subscription, 'cancelled', 'subscription.cancelled', {
      endedAt: subscriptionData.ended_at,
      note: 'Official status change event - subscription cancelled'
    });

    subscription.webhookEvents.push({
      eventType: 'subscription.cancelled',
      eventData: subscriptionData,
      processedAt: new Date()
    });

    await saveSubscriptionAndInvalidateCache(subscription);
    console.log('Subscription cancelled:', subscription.razorpaySubscriptionId);

  } catch (error) {
    console.error('Error handling subscription cancelled:', error);
  }
}

/**
 * Handle subscription paused event
 */
async function handleSubscriptionPaused(subscriptionData: any) {
  try {
    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: subscriptionData.id
    });

    if (!subscription) {
      console.error('Subscription not found:', subscriptionData.id);
      return;
    }

    // OFFICIAL STATUS CHANGE EVENT - subscription.paused is allowed to change status
    updateSubscriptionStatus(subscription, 'paused', 'subscription.paused', {
      ...subscriptionData,
      note: 'Official status change event - subscription paused'
    });

    await saveSubscriptionAndInvalidateCache(subscription);
    console.log('Subscription paused:', subscription.razorpaySubscriptionId);

  } catch (error) {
    console.error('Error handling subscription paused:', error);
  }
}

/**
 * Handle subscription resumed event
 */
async function handleSubscriptionResumed(subscriptionData: any) {
  try {
    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: subscriptionData.id
    });

    if (!subscription) {
      console.error('Subscription not found:', subscriptionData.id);
      return;
    }

    // OFFICIAL STATUS CHANGE EVENT - subscription.resumed is allowed to change status
    updateSubscriptionStatus(subscription, 'active', 'subscription.resumed', {
      ...subscriptionData,
      note: 'Official status change event - subscription resumed to active'
    });

    await saveSubscriptionAndInvalidateCache(subscription);
    console.log('Subscription resumed:', subscription.razorpaySubscriptionId);

  } catch (error) {
    console.error('Error handling subscription resumed:', error);
  }
}

/**
 * Handle subscription authenticated event (UPI Autopay mandate approved)
 */
async function handleSubscriptionAuthenticated(subscriptionData: any) {
  try {
    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: subscriptionData.id
    });

    if (!subscription) {
      console.error('Subscription not found:', subscriptionData.id);
      return;
    }

    // Update billing information but NOT status - subscription.authenticated is informational
    subscription.nextBillingDate = subscriptionData.charge_at ? 
      new Date(subscriptionData.charge_at * 1000) : subscription.nextBillingDate;

    // Log the authentication event but DO NOT change subscription status
    // subscription.authenticated is an informational event, not a status change event
    updateSubscriptionStatus(subscription, 'authenticated', 'subscription.authenticated', {
      ...subscriptionData,
      message: 'UPI Autopay mandate approved - this is informational, status remains unchanged',
      chargeAt: subscriptionData.charge_at,
      chargeAtDate: new Date(subscriptionData.charge_at * 1000),
      expectedNextEvent: 'subscription.charged',
      note: 'Authentication completed - status remains unchanged as this is informational event'
    });

    await saveSubscriptionAndInvalidateCache(subscription);
    console.log('Subscription authenticated (UPI Autopay approved):', subscription.razorpaySubscriptionId);

    // For UPI Autopay, wait for the subscription.charged event
    // No need to trigger anything - Razorpay will automatically charge at the scheduled time
    console.log('UPI Autopay mandate approved - waiting for automatic charge at:', new Date(subscriptionData.charge_at * 1000));
    console.log(`ℹ️  Subscription status remains '${subscription.status}' - authentication is informational only`);

  } catch (error) {
    console.error('Error handling subscription authenticated:', error);
  }
}

/**
 * Sync subscription status with Razorpay (for manual status checks)
 */
async function syncSubscriptionStatus(subscriptionId: string) {
  try {
    if (!isRazorpayConfigured()) {
      console.error('Razorpay not configured for status sync');
      return;
    }

    const razorpayInstance = getRazorpayInstance();
    const razorpaySubscription = await razorpayInstance.subscriptions.fetch(subscriptionId);
    
    console.log('Syncing subscription status with Razorpay:', subscriptionId, razorpaySubscription.status);

    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: subscriptionId
    });

    if (subscription) {
      const previousStatus = subscription.status;
      
      // Update status based on Razorpay response
      subscription.status = razorpaySubscription.status;
      subscription.startDate = new Date(razorpaySubscription.start_at * 1000);
      subscription.nextBillingDate = razorpaySubscription.charge_at ? 
        new Date(razorpaySubscription.charge_at * 1000) : subscription.nextBillingDate;
      subscription.currentPeriodStart = razorpaySubscription.current_start ? 
        new Date(razorpaySubscription.current_start * 1000) : subscription.currentPeriodStart;
      subscription.currentPeriodEnd = razorpaySubscription.current_end ? 
        new Date(razorpaySubscription.current_end * 1000) : subscription.currentPeriodEnd;
      subscription.paidCount = razorpaySubscription.paid_count || subscription.paidCount;
      subscription.remainingCount = razorpaySubscription.remaining_count || subscription.remainingCount;

      subscription.webhookEvents.push({
        eventType: 'subscription.status_synced',
        eventData: {
          previousStatus,
          currentStatus: razorpaySubscription.status,
          razorpayData: razorpaySubscription,
          syncedAt: new Date()
        },
        processedAt: new Date()
      });

      await saveSubscriptionAndInvalidateCache(subscription);
      console.log('✅ Subscription status synced:', subscriptionId, `${previousStatus} -> ${subscription.status}`);
    }

  } catch (error) {
    console.error('❌ Error syncing subscription status:', subscriptionId, error);
  }
}

/**
 * Handle subscription pending event
 */
async function handleSubscriptionPending(subscriptionData: any) {
  try {
    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: subscriptionData.id
    });

    if (!subscription) {
      console.error('Subscription not found:', subscriptionData.id);
      return;
    }

    // OFFICIAL STATUS CHANGE EVENT - subscription.pending is allowed to change status
    updateSubscriptionStatus(subscription, 'pending', 'subscription.pending', {
      ...subscriptionData,
      note: 'Official status change event - subscription pending'
    });

    await saveSubscriptionAndInvalidateCache(subscription);
    console.log('Subscription pending:', subscription.razorpaySubscriptionId);

  } catch (error) {
    console.error('Error handling subscription pending:', error);
  }
}

/**
 * Handle subscription halted event
 */
async function handleSubscriptionHalted(subscriptionData: any) {
  try {
    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: subscriptionData.id
    });

    if (!subscription) {
      console.error('Subscription not found:', subscriptionData.id);
      return;
    }

    // OFFICIAL STATUS CHANGE EVENT - subscription.halted is allowed to change status
    updateSubscriptionStatus(subscription, 'halted', 'subscription.halted', {
      note: 'Official status change event - subscription halted'
    });
    
    await saveSubscriptionAndInvalidateCache(subscription);
    console.log('Subscription halted:', subscription.razorpaySubscriptionId);

  } catch (error) {
    console.error('Error handling subscription halted:', error);
  }
}

/**
 * Handle subscription expired event
 */
async function handleSubscriptionExpired(subscriptionData: any) {
  try {
    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: subscriptionData.id
    });

    if (!subscription) {
      console.error('Subscription not found:', subscriptionData.id);
      return;
    }

    // Update end date
    subscription.endDate = subscriptionData.ended_at ? 
      new Date(subscriptionData.ended_at * 1000) : new Date();

    // OFFICIAL STATUS CHANGE EVENT - subscription.expired is allowed to change status
    updateSubscriptionStatus(subscription, 'expired', 'subscription.expired', {
      ...subscriptionData,
      note: 'Official status change event - subscription expired'
    });

    await saveSubscriptionAndInvalidateCache(subscription);
    console.log('Subscription expired:', subscription.razorpaySubscriptionId);

  } catch (error) {
    console.error('Error handling subscription expired:', error);
  }
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(paymentData: any) {
  try {
    // Find subscription by order_id or subscription_id in payment notes
    const subscription = await Subscription.findOne({
      $or: [
        { razorpaySubscriptionId: paymentData.order_id },
        { 'notes.subscription_id': paymentData.order_id }
      ]
    });

    if (subscription) {
      subscription.webhookEvents.push({
        eventType: 'payment.failed',
        eventData: paymentData,
        processedAt: new Date()
      });

      await saveSubscriptionAndInvalidateCache(subscription);
      console.log('Payment failed for subscription:', subscription.razorpaySubscriptionId);
    } else {
      console.log('Payment failed for order:', paymentData.order_id);
    }

  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

/**
 * Handle payment authorized event (first authorization payment for UPI Autopay)
 */
async function handlePaymentAuthorized(paymentData: any) {
  try {
    console.log('Payment authorized (UPI Autopay mandate setup):', paymentData.id, 'Amount:', paymentData.amount);
    
    // This is typically the authorization payment for UPI Autopay
    // It's usually a small amount (₹1 or ₹2) to verify the mandate
    // The actual subscription charging will happen later
    
    // Log this event but don't treat it as a subscription payment
    if (paymentData.amount <= 200) { // ≤ ₹2, likely a mandate authorization
      console.log('UPI Autopay mandate authorization payment detected:', paymentData.amount / 100, 'INR');
    } else {
      console.log('Regular payment authorization:', paymentData.amount / 100, 'INR');
    }
    
    // Find associated subscription if any
    const subscription = await Subscription.findOne({
      $or: [
        { razorpaySubscriptionId: paymentData.order_id },
        { 'notes.subscription_id': paymentData.order_id }
      ]
    });

    if (subscription) {
      subscription.webhookEvents.push({
        eventType: 'payment.authorized',
        eventData: {
          paymentId: paymentData.id,
          amount: paymentData.amount,
          method: paymentData.method,
          status: paymentData.status,
          isAuthorization: paymentData.amount <= 200
        },
        processedAt: new Date()
      });

      await saveSubscriptionAndInvalidateCache(subscription);
      console.log('Payment authorization logged for subscription:', subscription.razorpaySubscriptionId);
    }
    
  } catch (error) {
    console.error('Error handling payment authorized:', error);
  }
} 