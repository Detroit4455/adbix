import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Subscription from '@/models/Subscription';
import RazorpayService, { RAZORPAY_CONFIG, isRazorpayConfigured } from '@/lib/razorpay';
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
    const clientIp = request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
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

    // Replay protection
    const eventId = payload?.payment?.entity?.id || payload?.subscription?.entity?.id || `${event}_${Date.now()}`;
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
 */
async function handleSubscriptionActivated(subscriptionData: any) {
  try {
    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: subscriptionData.id
    });

    if (!subscription) {
      console.error('Subscription not found:', subscriptionData.id);
      return;
    }

    subscription.status = 'active';
    subscription.startDate = new Date(subscriptionData.start_at * 1000);
    subscription.nextBillingDate = subscriptionData.charge_at ? 
      new Date(subscriptionData.charge_at * 1000) : subscription.nextBillingDate;
    subscription.currentPeriodStart = subscriptionData.current_start ? 
      new Date(subscriptionData.current_start * 1000) : subscription.currentPeriodStart;
    subscription.currentPeriodEnd = subscriptionData.current_end ? 
      new Date(subscriptionData.current_end * 1000) : subscription.currentPeriodEnd;

    subscription.webhookEvents.push({
      eventType: 'subscription.activated',
      eventData: {
        subscriptionId: subscriptionData.id,
        status: subscriptionData.status,
        startAt: subscriptionData.start_at,
        chargeAt: subscriptionData.charge_at,
        currentStart: subscriptionData.current_start,
        currentEnd: subscriptionData.current_end
      },
      processedAt: new Date()
    });

    await saveSubscriptionAndInvalidateCache(subscription);
    console.log('Subscription activated:', subscription.razorpaySubscriptionId);

  } catch (error) {
    console.error('Error handling subscription activated:', error);
  }
}

/**
 * Handle subscription charged event (successful payment)
 */
async function handleSubscriptionCharged(paymentData: any, subscriptionData: any) {
  try {
    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: subscriptionData.id
    });

    if (!subscription) {
      console.error('Subscription not found:', subscriptionData.id);
      return;
    }

    const wasFirstPayment = subscription.paidCount === 0 || subscription.status === 'authenticated';
    
    // Update billing information
    subscription.status = 'active'; // Ensure subscription becomes active after payment
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

    subscription.webhookEvents.push({
      eventType: wasFirstPayment ? 'subscription.first_payment_charged' : 'subscription.charged',
      eventData: { 
        paymentId: paymentData.id,
        subscriptionId: subscriptionData.id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: paymentData.status,
        method: paymentData.method,
        wasFirstPayment,
        activatedFromAuthenticated: wasFirstPayment && subscription.status === 'authenticated'
      },
      processedAt: new Date()
    });

    await subscription.save();
    
    if (wasFirstPayment) {
      console.log('First payment charged, subscription activated:', subscription.razorpaySubscriptionId, paymentData.amount);
    } else {
    console.log('Subscription charged:', subscription.razorpaySubscriptionId, paymentData.amount);
    }

  } catch (error) {
    console.error('Error handling subscription charged:', error);
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

    subscription.status = 'completed';
    subscription.endDate = subscriptionData.ended_at ? 
      new Date(subscriptionData.ended_at * 1000) : new Date();
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

    subscription.status = 'cancelled';
    subscription.endDate = subscriptionData.ended_at ? 
      new Date(subscriptionData.ended_at * 1000) : new Date();

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

    subscription.status = 'paused';

    subscription.webhookEvents.push({
      eventType: 'subscription.paused',
      eventData: subscriptionData,
      processedAt: new Date()
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

    subscription.status = 'active';

    subscription.webhookEvents.push({
      eventType: 'subscription.resumed',
      eventData: subscriptionData,
      processedAt: new Date()
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

    subscription.status = 'authenticated';
    subscription.nextBillingDate = subscriptionData.charge_at ? 
      new Date(subscriptionData.charge_at * 1000) : subscription.nextBillingDate;

    subscription.webhookEvents.push({
      eventType: 'subscription.authenticated',
      eventData: subscriptionData,
      processedAt: new Date()
    });

    await saveSubscriptionAndInvalidateCache(subscription);
    console.log('Subscription authenticated (UPI Autopay approved):', subscription.razorpaySubscriptionId);

    // For UPI Autopay, trigger immediate first payment to activate subscription
    console.log('Triggering immediate first payment for UPI Autopay:', subscription.razorpaySubscriptionId);
    
    // Use setTimeout to allow the webhook response to complete first
    setTimeout(async () => {
      try {
        await triggerFirstPayment(subscription.razorpaySubscriptionId);
      } catch (error) {
        console.error('Error in delayed first payment trigger:', error);
      }
    }, 2000); // 2 second delay

  } catch (error) {
    console.error('Error handling subscription authenticated:', error);
  }
}

/**
 * Trigger first payment for UPI Autopay subscription
 */
async function triggerFirstPayment(subscriptionId: string) {
  try {
    if (!isRazorpayConfigured()) {
      console.error('Razorpay not configured for payment triggering');
      return;
    }

    console.log('Attempting to trigger first payment for UPI Autopay:', subscriptionId);
    
    // For UPI Autopay, we don't need to edit the subscription
    // Instead, we should fetch the current status and wait for automatic payment
    const razorpayInstance = RazorpayService.getInstance();
    
    try {
      // Get current subscription status from Razorpay
      const razorpaySubscription = await razorpayInstance.subscriptions.fetch(subscriptionId);
      
      console.log('Current Razorpay subscription status:', subscriptionId, razorpaySubscription.status);
      
      // Update local subscription with latest data
      const subscription = await Subscription.findOne({
        razorpaySubscriptionId: subscriptionId
      });

      if (subscription) {
        // Update with latest Razorpay data
        subscription.status = razorpaySubscription.status;
        subscription.paidCount = razorpaySubscription.paid_count || 0;
        subscription.remainingCount = razorpaySubscription.remaining_count || subscription.remainingCount;
        
        if (razorpaySubscription.charge_at) {
          subscription.nextBillingDate = new Date(razorpaySubscription.charge_at * 1000);
        }
        
        if (razorpaySubscription.start_at) {
          subscription.startDate = new Date(razorpaySubscription.start_at * 1000);
        }

        subscription.webhookEvents.push({
          eventType: 'subscription.status_synced',
          eventData: {
            syncedAt: new Date(),
            razorpayStatus: razorpaySubscription.status,
            localStatus: subscription.status,
            chargeAt: razorpaySubscription.charge_at,
            paidCount: razorpaySubscription.paid_count
          },
          processedAt: new Date()
        });

        await subscription.save();
        console.log('Local subscription status updated:', subscriptionId, subscription.status, '->', razorpaySubscription.status);
        
        // If subscription is still in authenticated status, try to activate it
        if (razorpaySubscription.status === 'authenticated') {
          console.log('Subscription still authenticated, attempting to force activation...');
          await activateUPIAutopaySubscription(subscriptionId);
        }
      }

    } catch (fetchError: any) {
      console.error('Error fetching subscription status:', subscriptionId, fetchError);
      
      // Fallback: Try to activate the subscription
      console.log('Falling back to activation attempt for:', subscriptionId);
      await activateUPIAutopaySubscription(subscriptionId);
    }

  } catch (error) {
    console.error('Error triggering first payment:', subscriptionId, error);
  }
}

/**
 * Activate UPI Autopay subscription manually
 */
async function activateUPIAutopaySubscription(subscriptionId: string) {
  try {
    if (!isRazorpayConfigured()) {
      console.error('Razorpay not configured for subscription activation');
      return;
    }

    const razorpayInstance = RazorpayService.getInstance();

    // Fetch the latest subscription status from Razorpay
    const razorpaySubscription = await razorpayInstance.subscriptions.fetch(subscriptionId);
    
    console.log('Current Razorpay subscription status:', subscriptionId, razorpaySubscription.status);

    // Update local subscription status based on Razorpay status
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

      await subscription.save();
      console.log('Local subscription status updated:', subscriptionId, `${previousStatus} -> ${subscription.status}`);
      
      // If still authenticated, UPI Autopay will auto-charge when the time comes
      if (razorpaySubscription.status === 'authenticated') {
        console.log('Subscription is authenticated - UPI Autopay mandate approved');
        console.log('Subscription will auto-charge at:', new Date(razorpaySubscription.charge_at * 1000));
        
        // For UPI Autopay, we should not force activation
        // The subscription will automatically charge at the scheduled time
        // Just log the status and wait for the charge_at time
        
        subscription.webhookEvents.push({
          eventType: 'subscription.autopay_ready',
          eventData: {
            status: 'authenticated',
            message: 'UPI Autopay mandate approved, waiting for automatic payment',
            chargeAt: razorpaySubscription.charge_at,
            chargeAtDate: new Date(razorpaySubscription.charge_at * 1000)
          },
          processedAt: new Date()
        });
        
        await subscription.save();
        console.log('UPI Autopay is ready, waiting for automatic charge at:', new Date(razorpaySubscription.charge_at * 1000));
      }
    }

  } catch (error) {
    console.error('Error syncing UPI Autopay subscription status:', subscriptionId, error);
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

    subscription.webhookEvents.push({
      eventType: 'subscription.pending',
      eventData: subscriptionData,
      processedAt: new Date()
    });

    await subscription.save();
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

    subscription.status = 'paused'; // Use paused for halted status
    
    subscription.webhookEvents.push({
      eventType: 'subscription.halted',
      eventData: subscriptionData,
      processedAt: new Date()
    });

    await subscription.save();
    console.log('Subscription halted:', subscription.razorpaySubscriptionId);

  } catch (error) {
    console.error('Error handling subscription halted:', error);
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

      await subscription.save();
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

      await subscription.save();
      console.log('Payment authorization logged for subscription:', subscription.razorpaySubscriptionId);
    }
    
  } catch (error) {
    console.error('Error handling payment authorized:', error);
  }
} 