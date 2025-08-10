import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { subscriptionCache } from '@/lib/subscriptionCache';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    await dbConnect();
    const adminUser = await User.findOne({ mobileNumber: session.user.mobileNumber });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, requireSubscriptionCheck } = await request.json();

    if (!userId || typeof requireSubscriptionCheck !== 'boolean') {
      return NextResponse.json({ 
        error: 'userId and requireSubscriptionCheck are required' 
      }, { status: 400 });
    }

    // Update user's subscription check setting
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { requireSubscriptionCheck },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`Subscription check toggled for user ${userId}: ${requireSubscriptionCheck}`);
    
    // Invalidate cache for this user since their settings changed
    subscriptionCache.invalidateUser(updatedUser.mobileNumber);

    return NextResponse.json({
      success: true,
      message: `Subscription check ${requireSubscriptionCheck ? 'enabled' : 'disabled'} for user`,
      user: {
        id: updatedUser._id,
        mobileNumber: updatedUser.mobileNumber,
        name: updatedUser.name,
        requireSubscriptionCheck: updatedUser.requireSubscriptionCheck
      }
    });

  } catch (error) {
    console.error('Error toggling subscription check:', error);
    return NextResponse.json(
      { error: 'Failed to toggle subscription check' },
      { status: 500 }
    );
  }
}