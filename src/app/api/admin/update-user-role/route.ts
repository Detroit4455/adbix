import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and has admin role
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Verify the role is valid
    const validRoles = ['admin', 'user', 'devops', 'manager'];
    const roleSettings = await db.collection('settings').findOne({ type: 'roles' });
    
    const allowedRoles = roleSettings?.roles || validRoles;
    
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    try {
      // Update user role
      const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            role: role,
            lastUpdated: new Date().toISOString()
          } 
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'User role updated successfully'
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in update-user-role API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 