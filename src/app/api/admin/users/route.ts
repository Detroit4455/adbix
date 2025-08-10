import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Check if user has admin privileges
    const adminUser = await User.findOne({ mobileNumber: session.user.mobileNumber });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all users from database
    const users = await User.find({})
      .select('_id name email mobileNumber role status requireSubscriptionCheck updatedAt')
      .lean();

    // Format users for display
    const formattedUsers = users.map((user: any) => ({
      id: user._id.toString(),
      name: user.name || 'No Name',
      email: user.email || 'No Email',
      mobileNumber: user.mobileNumber || 'No Mobile',
      role: user.role || 'user',
      status: user.status || 'active',
      requireSubscriptionCheck: user.requireSubscriptionCheck !== false, // Default to true if undefined
      lastUpdated: user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Never'
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}