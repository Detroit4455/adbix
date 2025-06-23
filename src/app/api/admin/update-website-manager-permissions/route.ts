import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and has admin permissions
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Verify user has admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized. Only administrators can update permissions.' },
        { status: 403 }
      );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Get request body
    const { userId, permissions } = await request.json();
    
    if (!userId || !permissions) {
      return NextResponse.json(
        { error: 'Missing required fields: userId or permissions' },
        { status: 400 }
      );
    }
    
    // Update user permissions in database
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update user permissions
    user.permissions = {
      ...user.permissions,
      ...permissions
    };
    
    await user.save();
    
    return NextResponse.json(
      { success: true, message: 'Permissions updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 