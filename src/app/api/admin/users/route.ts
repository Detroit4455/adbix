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

    // Parse query params for search and pagination
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limitParam = parseInt(searchParams.get('limit') || '100');
    const limit = Number.isNaN(limitParam) ? 100 : Math.min(100, Math.max(1, limitParam));
    const search = (searchParams.get('search') || '').trim();

    // Build filter
    const filter: any = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: { $regex: regex } },
        { email: { $regex: regex } },
        { mobileNumber: { $regex: regex } }
      ];
    }

    // Total count
    const total = await User.countDocuments(filter);

    // Fetch users with pagination
    const users = await User.find(filter)
      .select('_id name email mobileNumber role status requireSubscriptionCheck updatedAt')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
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
      users: formattedUsers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}