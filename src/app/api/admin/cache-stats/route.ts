import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { subscriptionCache } from '@/lib/subscriptionCache';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';

export async function GET(request: NextRequest) {
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

    const stats = subscriptionCache.getStats();

    return NextResponse.json({
      success: true,
      cache: {
        stats,
        performance: {
          description: 'Cache reduces database queries from 2 per request to 0 (when cached)',
          ttl: '2 minutes',
          maxEntries: 1000,
          benefits: [
            'Faster website loading',
            'Reduced database load',
            'Better user experience',
            'Lower server costs'
          ]
        }
      }
    });

  } catch (error) {
    console.error('Error fetching cache stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cache stats' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // Clear all cache
    subscriptionCache.clearAll();

    return NextResponse.json({
      success: true,
      message: 'Subscription cache cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}