import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Subscription from '@/models/Subscription';
import RazorpayService, { RAZORPAY_CONFIG, isRazorpayConfigured } from '@/lib/razorpay';

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

    console.log('Received Razorpay webhook:', event, payload);

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
      eventData: subscriptionData,
      processedAt: new Date()
    });

    await subscription.save();
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

    // Store payment method details if available
    if (paymentData.method) {
      subscription.paymentMethod = {
        type: paymentData.method as 'card' | 'upi' | 'netbanking' | 'wallet',
        details: {
          paymentId: paymentData.id,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: paymentData.status,
          capturedAt: paymentData.captured_at ? new Date(paymentData.captured_at * 1000) : undefined,
          description: paymentData.description,
          method: paymentData.method,
          methodDetails: paymentData[paymentData.method] || {}
        }
      };
    }

    subscription.webhookEvents.push({
      eventType: wasFirstPayment ? 'subscription.first_payment_charged' : 'subscription.charged',
      eventData: { 
        payment: paymentData, 
        subscription: subscriptionData,
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
      eventData: subscriptionData,
      processedAt: new Date()
    });

    await subscription.save();
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

    await subscription.save();
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

    await subscription.save();
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

    await subscription.save();
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

    await subscription.save();
    console.log('Subscription authenticated (UPI Autopay approved):', subscription.razorpaySubscriptionId);

    // For UPI Autopay, immediately charge the first payment to activate subscription
    console.log('Triggering immediate first payment for UPI Autopay:', subscription.razorpaySubscriptionId);
    await triggerFirstPayment(subscription.razorpaySubscriptionId);

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
        start_at: currentTime, // Start now
        charge_at: currentTime + 60 // Charge in 1 minute
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