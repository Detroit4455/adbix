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
    const wasTrialSubscription = subscription.isInTrial === true;
    
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

    // If this was a trial subscription and it's the first payment, end the trial
    if (wasTrialSubscription && wasFirstPayment) {
      subscription.isInTrial = false;
      console.log('Trial period ended for subscription:', subscription.razorpaySubscriptionId);
    }

    // Store minimal, non-sensitive payment method details
    const minimalPaymentData = extractMinimalPaymentData(paymentData);
    if (minimalPaymentData) {
      subscription.paymentMethod = minimalPaymentData;
    }

    let eventType = 'subscription.charged';
    if (wasFirstPayment) {
      eventType = wasTrialSubscription ? 'subscription.first_payment_after_trial' : 'subscription.first_payment_charged';
    }

    subscription.webhookEvents.push({
      eventType: eventType,
      eventData: { 
        paymentId: paymentData.id,
        subscriptionId: subscriptionData.id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: paymentData.status,
        method: paymentData.method,
        wasFirstPayment,
        wasTrialSubscription,
        activatedFromAuthenticated: wasFirstPayment && subscription.status === 'authenticated'
      },
      processedAt: new Date()
    });

    await subscription.save();
    
    if (wasFirstPayment) {
      if (wasTrialSubscription) {
        console.log('First payment charged after trial period, subscription activated:', subscription.razorpaySubscriptionId, paymentData.amount);
      } else {
        console.log('First payment charged, subscription activated:', subscription.razorpaySubscriptionId, paymentData.amount);
      }
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

    // Check if this subscription has a trial period
    const hasTrialPeriod = subscription.enableTrialPeriod === true || 
                          subscription.notes?.enableTrialPeriod === 'true';

    if (!hasTrialPeriod) {
      // For non-trial subscriptions, trigger immediate first payment to activate subscription
      console.log('Triggering immediate first payment for UPI Autopay (no trial):', subscription.razorpaySubscriptionId);
      
      // Use setTimeout to allow the webhook response to complete first
      setTimeout(async () => {
        try {
          await triggerFirstPayment(subscription.razorpaySubscriptionId);
        } catch (error) {
          console.error('Error in delayed first payment trigger:', error);
        }
      }, 2000); // 2 second delay
    } else {
      console.log('Trial subscription authenticated - first payment will be charged after trial period:', subscription.razorpaySubscriptionId);
      console.log('Trial period:', subscription.trialPeriodDays || subscription.notes?.trialPeriodDays, 'days');
      
      // For trial subscriptions, the payment will be automatically charged by Razorpay after the trial period
      // We don't need to trigger immediate payment
    }

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

    const razorpayInstance = new (require('razorpay'))({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // First, update the subscription to charge immediately
    const currentTime = Math.floor(Date.now() / 1000);
    console.log('Updating subscription to charge immediately:', subscriptionId);
    
    try {
      const updatedSubscription = await razorpayInstance.subscriptions.edit(subscriptionId, {
        start_at: currentTime + 30, // Start in 30 seconds
        charge_at: currentTime + 90 // Charge in 90 seconds
      });
      
      console.log('Subscription updated for immediate charging:', subscriptionId, {
        status: updatedSubscription.status,
        start_at: updatedSubscription.start_at,
        charge_at: updatedSubscription.charge_at
      });

      // Update local subscription with new timing
      const subscription = await Subscription.findOne({
        razorpaySubscriptionId: subscriptionId
      });

      if (subscription) {
        subscription.startDate = new Date(updatedSubscription.start_at * 1000);
        subscription.nextBillingDate = new Date(updatedSubscription.charge_at * 1000);
        subscription.status = updatedSubscription.status;

        subscription.webhookEvents.push({
          eventType: 'subscription.charge_triggered',
          eventData: {
            originalChargeAt: subscription.nextBillingDate,
            newChargeAt: updatedSubscription.charge_at,
            updatedSubscription
          },
          processedAt: new Date()
        });

        await subscription.save();
        console.log('Local subscription updated for immediate charging:', subscriptionId);
      }

    } catch (updateError: any) {
      console.error('Error updating subscription for immediate charging:', subscriptionId, updateError);
      
      // If update fails, try to sync status instead
      console.log('Falling back to status sync for:', subscriptionId);
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

    const razorpayInstance = new (require('razorpay'))({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

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
      
      // If still authenticated, try to force activation by updating the subscription
      if (razorpaySubscription.status === 'authenticated') {
        console.log('Subscription still authenticated, attempting to force activation...');
        
        try {
          // Try to update the subscription to trigger activation
          const updatedSubscription = await razorpayInstance.subscriptions.edit(subscriptionId, {
            start_at: Math.floor(Date.now() / 1000) + 60, // Start in 1 minute
            charge_at: Math.floor(Date.now() / 1000) + 120 // Charge in 2 minutes
          });
          
          console.log('Subscription updated for activation:', subscriptionId, updatedSubscription.status);
          
          // Update local status again
          subscription.status = updatedSubscription.status;
          subscription.webhookEvents.push({
            eventType: 'subscription.force_activated',
            eventData: updatedSubscription,
            processedAt: new Date()
          });
          
          await subscription.save();
          console.log('Subscription force activated:', subscriptionId, subscription.status);
          
        } catch (updateError) {
          console.error('Error force activating subscription:', subscriptionId, updateError);
        }
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