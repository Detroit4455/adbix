import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';

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
    const { roles } = body;

    if (!roles || !Array.isArray(roles)) {
      return NextResponse.json(
        { error: 'Roles must be provided as an array' },
        { status: 400 }
      );
    }

    // Ensure required roles are included
    const requiredRoles = ['admin', 'user'];
    const missingRoles = requiredRoles.filter(role => !roles.includes(role));

    if (missingRoles.length > 0) {
      return NextResponse.json(
        { error: `Required roles are missing: ${missingRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Check if settings already exist
    const existingSettings = await db.collection('settings').findOne({ type: 'roles' });

    if (existingSettings) {
      // Update existing settings
      await db.collection('settings').updateOne(
        { type: 'roles' },
        { $set: { roles: roles, lastUpdated: new Date().toISOString() } }
      );
    } else {
      // Create new settings
      await db.collection('settings').insertOne({
        type: 'roles',
        roles: roles,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }

    return NextResponse.json({
      message: 'Role settings updated successfully',
      roles: roles
    });
  } catch (error) {
    console.error('Error updating role settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 