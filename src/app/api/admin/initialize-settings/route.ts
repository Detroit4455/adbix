import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';

export async function POST() {
  try {
    // Check if user is authenticated and has admin role
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Default roles
    const defaultRoles = ['admin', 'user', 'devops', 'manager'];

    // Check if settings already exist
    const existingSettings = await db.collection('settings').findOne({ type: 'roles' });

    if (existingSettings) {
      // Update existing settings
      await db.collection('settings').updateOne(
        { type: 'roles' },
        { $set: { roles: defaultRoles, lastUpdated: new Date().toISOString() } }
      );
    } else {
      // Create new settings
      await db.collection('settings').insertOne({
        type: 'roles',
        roles: defaultRoles,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }

    return NextResponse.json({
      message: 'Settings initialized successfully',
      roles: defaultRoles
    });
  } catch (error) {
    console.error('Error initializing settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 