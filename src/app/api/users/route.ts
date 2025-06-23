import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { checkResourceAccess } from '@/lib/rbac';

export async function GET() {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has access to list users
    const userRole = session.user.role || 'user';
    const hasAccess = await checkResourceAccess('user-management', userRole);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Connect to database
    await dbConnect();
    
    // Fetch users from database using Mongoose
    const usersData = await User.find({})
      .sort({ createdAt: -1 })
      .select('name email mobileNumber role createdAt updatedAt')
      .lean();
    
    // Convert MongoDB documents to plain objects with type assertions
    const users = usersData.map((user: any) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
} 