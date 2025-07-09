import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Subscription from '@/models/Subscription';
import RazorpayService, { isRazorpayConfigured } from '@/lib/razorpay';

/**
 * GET /api/subscriptions/[id] - Get specific subscription details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const subscription = await Subscription.findOne({
      _id: id,
      userId: session.user.id
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Sync with Razorpay to get latest status
    let razorpaySubscription;
    try {
      razorpaySubscription = await RazorpayService.getSubscription(subscription.razorpaySubscriptionId);
      
      // Update local subscription with latest data from Razorpay
      subscription.status = razorpaySubscription.status;
      subscription.paidCount = razorpaySubscription.paid_count;
      subscription.remainingCount = razorpaySubscription.remaining_count;
      subscription.nextBillingDate = razorpaySubscription.charge_at ? 
        new Date(razorpaySubscription.charge_at * 1000) : subscription.nextBillingDate;
      subscription.currentPeriodStart = razorpaySubscription.current_start ? 
        new Date(razorpaySubscription.current_start * 1000) : subscription.currentPeriodStart;
      subscription.currentPeriodEnd = razorpaySubscription.current_end ? 
        new Date(razorpaySubscription.current_end * 1000) : subscription.currentPeriodEnd;
      
      await subscription.save();
    } catch (error) {
      console.error('Error syncing with Razorpay:', error);
      // Continue with local data if Razorpay sync fails
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription._id,
        planId: subscription.planId,
        razorpaySubscriptionId: subscription.razorpaySubscriptionId,
        status: subscription.status,
        amount: subscription.amount,
        currency: subscription.currency,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        nextBillingDate: subscription.nextBillingDate,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        totalCount: subscription.totalCount,
        paidCount: subscription.paidCount,
        remainingCount: subscription.remainingCount,
        addons: subscription.addons,
        shortUrl: subscription.shortUrl,
        canBeCancelled: subscription.canBeCancelled(),
        isActive: subscription.isActive(),
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt
      },
      razorpayData: razorpaySubscription
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/subscriptions/[id] - Update subscription (cancel, pause, resume)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...actionData } = body;

    if (!action || !['cancel', 'pause', 'resume', 'activate'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Supported: cancel, pause, resume, activate' 
      }, { status: 400 });
    }

    await dbConnect();
    const { id } = await params;

    const subscription = await Subscription.findOne({
      _id: id,
      userId: session.user.id
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    let updatedRazorpaySubscription;

    try {
      switch (action) {
        case 'cancel':
          if (!subscription.canBeCancelled()) {
            return NextResponse.json({ 
              error: 'Subscription cannot be cancelled in current state' 
            }, { status: 400 });
          }
          
          updatedRazorpaySubscription = await RazorpayService.cancelSubscription(
            subscription.razorpaySubscriptionId,
            actionData.cancelAtCycleEnd || false
          );
          break;

        case 'pause':
          if (!['authenticated', 'active'].includes(subscription.status)) {
            return NextResponse.json({ 
              error: 'Can only pause active subscriptions' 
            }, { status: 400 });
          }
          
          updatedRazorpaySubscription = await RazorpayService.pauseSubscription(
            subscription.razorpaySubscriptionId,
            actionData.pauseAt || 'now'
          );
          break;

        case 'resume':
          if (subscription.status !== 'paused') {
            return NextResponse.json({ 
              error: 'Can only resume paused subscriptions' 
            }, { status: 400 });
          }
          
          updatedRazorpaySubscription = await RazorpayService.resumeSubscription(
            subscription.razorpaySubscriptionId,
            actionData.resumeAt || 'now'
          );
          break;

        case 'activate':
          if (subscription.status !== 'authenticated') {
            return NextResponse.json({ 
              error: 'Can only activate authenticated UPI Autopay subscriptions' 
            }, { status: 400 });
          }
          
          // Manual activation for UPI Autopay subscriptions
          try {
            console.log('Manual activation triggered for:', subscription.razorpaySubscriptionId);
            
            // Get current subscription details from Razorpay
            updatedRazorpaySubscription = await RazorpayService.getSubscription(
              subscription.razorpaySubscriptionId
            );
            
            const currentTime = new Date();
            const scheduledChargeTime = new Date(updatedRazorpaySubscription.charge_at * 1000);
            const timeDiff = scheduledChargeTime.getTime() - currentTime.getTime();
            
            console.log('Current time:', currentTime);
            console.log('Scheduled charge time:', scheduledChargeTime);
            console.log('Time difference (minutes):', Math.round(timeDiff / (1000 * 60)));
            
            // Check if the charge time has passed or is very close
            if (timeDiff <= 0) {
              // Charge time has passed - subscription should have been charged
              return NextResponse.json({
                success: false,
                message: '⏰ Subscription charge time has passed!\n\nYour subscription was scheduled to charge at ' + scheduledChargeTime.toLocaleString() + ', but no payment was processed. This could be due to:\n\n• Insufficient balance in UPI account\n• Bank/UPI service temporarily down\n• Mandate not properly activated\n\nPlease check with your bank or try creating a fresh subscription.',
                timing: {
                  scheduled: scheduledChargeTime,
                  current: currentTime,
                  timePassedMinutes: Math.abs(Math.round(timeDiff / (1000 * 60))),
                  status: 'overdue'
                },
                subscription: {
                  id: subscription._id,
                  status: updatedRazorpaySubscription.status,
                  razorpayStatus: updatedRazorpaySubscription.status
                },
                suggestions: [
                  'Check your bank account balance',
                  'Verify UPI mandate is active in your banking app',
                  'Contact your bank if mandate seems inactive',
                  'Consider creating a fresh subscription'
                ]
              });
            } else if (timeDiff <= 10 * 60 * 1000) {
              // Charge time is within 10 minutes - should charge soon
              return NextResponse.json({
                success: true,
                message: '🕐 Subscription will charge very soon!\n\nYour UPI Autopay subscription is scheduled to charge in the next ' + Math.round(timeDiff / (1000 * 60)) + ' minutes. Please ensure:\n\n• Your UPI account has sufficient balance\n• Your phone is connected to receive payment notifications\n\nThe payment will process automatically.',
                timing: {
                  scheduled: scheduledChargeTime,
                  current: currentTime,
                  minutesRemaining: Math.round(timeDiff / (1000 * 60)),
                  status: 'imminent'
                },
                subscription: {
                  id: subscription._id,
                  status: 'authenticated',
                  readyForCharge: true
                }
              });
            } else {
              // Charge time is still in the future
              return NextResponse.json({
                success: true,
                message: '📅 Subscription is scheduled for automatic charging\n\nYour UPI Autopay subscription will charge automatically at ' + scheduledChargeTime.toLocaleString() + '. No action needed from your side.\n\nTime remaining: ' + Math.round(timeDiff / (1000 * 60 * 60)) + ' hours and ' + Math.round((timeDiff % (1000 * 60 * 60)) / (1000 * 60)) + ' minutes.',
                timing: {
                  scheduled: scheduledChargeTime,
                  current: currentTime,
                  hoursRemaining: Math.round(timeDiff / (1000 * 60 * 60)),
                  minutesRemaining: Math.round((timeDiff % (1000 * 60 * 60)) / (1000 * 60)),
                  status: 'scheduled'
                },
                subscription: {
                  id: subscription._id,
                  status: 'authenticated',
                  autoChargeScheduled: true
                }
              });
            }
            
          } catch (error) {
            console.error('Error in manual activation:', error);
            return NextResponse.json({ 
              error: 'Failed to check subscription status. Please try again.' 
            }, { status: 500 });
          }
          break;
      }

      // Update local subscription with new status
      subscription.status = updatedRazorpaySubscription.status;
      subscription.paidCount = updatedRazorpaySubscription.paid_count;
      subscription.remainingCount = updatedRazorpaySubscription.remaining_count;
      
      if (updatedRazorpaySubscription.ended_at) {
        subscription.endDate = new Date(updatedRazorpaySubscription.ended_at * 1000);
      }
      
      if (updatedRazorpaySubscription.charge_at) {
        subscription.nextBillingDate = new Date(updatedRazorpaySubscription.charge_at * 1000);
      }

      // Add webhook event to subscription
      subscription.webhookEvents.push({
        eventType: `subscription.${action}`,
        eventData: {
          action,
          actionData,
          razorpayData: updatedRazorpaySubscription,
          performedBy: session.user.id
        },
        processedAt: new Date()
      });

      await subscription.save();

      return NextResponse.json({
        success: true,
        message: `Subscription ${action}ed successfully`,
        subscription: {
          id: subscription._id,
          status: subscription.status,
          endDate: subscription.endDate,
          nextBillingDate: subscription.nextBillingDate,
          canBeCancelled: subscription.canBeCancelled(),
          isActive: subscription.isActive()
        }
      });

    } catch (error) {
      console.error(`Error ${action}ing subscription:`, error);
      return NextResponse.json({ 
        error: `Failed to ${action} subscription` 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subscriptions/[id] - Cancel subscription (alias for PUT with cancel action)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Redirect to PUT with cancel action
  const cancelRequest = new Request(request.url, {
    method: 'PUT',
    headers: request.headers,
    body: JSON.stringify({ action: 'cancel', cancelAtCycleEnd: false })
  });

  return PUT(cancelRequest as NextRequest, { params });
} 