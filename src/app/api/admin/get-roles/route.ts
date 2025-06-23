import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';

export async function GET() {
  try {
    // Check if user is authenticated and has admin role
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role) {
      return NextResponse.json(
        { error: 'Unauthorized - Login required' },
        { status: 401 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Default roles if not found in settings
    const defaultRoles = ['admin', 'user', 'devops', 'manager'];

    // Get roles from settings
    const roleSettings = await db.collection('settings').findOne({ type: 'roles' });
    
    const roles = roleSettings?.roles || defaultRoles;

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Internal server error', roles: ['admin', 'user', 'devops', 'manager'] },
      { status: 500 }
    );
  }
} 