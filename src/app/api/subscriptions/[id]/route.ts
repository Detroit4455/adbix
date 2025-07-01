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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const subscription = await Subscription.findOne({
      _id: params.id,
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...actionData } = body;

    if (!action || !['cancel', 'pause', 'resume'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Supported: cancel, pause, resume' 
      }, { status: 400 });
    }

    await dbConnect();

    const subscription = await Subscription.findOne({
      _id: params.id,
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
  { params }: { params: { id: string } }
) {
  // Redirect to PUT with cancel action
  const cancelRequest = new Request(request.url, {
    method: 'PUT',
    headers: request.headers,
    body: JSON.stringify({ action: 'cancel', cancelAtCycleEnd: false })
  });

  return PUT(cancelRequest as NextRequest, { params });
} 