import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Get user's shop status
    const user = await db.collection('users').findOne(
      { mobileNumber: userId },
      { projection: { shopStatus: 1 } }
    );

    return NextResponse.json({
      status: user?.shopStatus || 'OFF'
    });
  } catch (error) {
    console.error('Error fetching shop status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, userId } = await request.json();
    
    if (!status || !['ON', 'OFF'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify the user is updating their own status
    if (session.user.mobileNumber !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { db } = await connectToDatabase();

    // Update user's shop status
    await db.collection('users').updateOne(
      { mobileNumber: userId },
      { $set: { shopStatus: status } }
    );

    return NextResponse.json({ status });
  } catch (error) {
    console.error('Error updating shop status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 