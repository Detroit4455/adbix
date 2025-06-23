import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectMongoose } from '@/lib/db';
import RbacSettings, { IRbacMatrix } from '@/models/RbacSettings';

// Convert plain objects to Map objects for Mongoose
function convertRolesToMap(matrix: IRbacMatrix[]): any[] {
  return matrix.map(item => {
    // Convert plain object to Map if needed
    const roles = new Map<string, boolean>();
    
    // Handle both object and Map cases
    if (item.roles instanceof Map) {
      item.roles.forEach((value, key) => {
        if (value !== undefined) {
          roles.set(key, Boolean(value));
        } else {
          roles.set(key, false); // Default to false if undefined
        }
      });
    } else {
      // Convert plain object to Map
      Object.entries(item.roles).forEach(([key, value]) => {
        roles.set(key, Boolean(value)); // Ensure boolean type
      });
    }
    
    return {
      resource: item.resource,
      roles
    };
  });
}

// GET /api/admin/rbac-settings
export async function GET(request: NextRequest) {
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
        { error: 'Not authorized. Only administrators can access RBAC settings.' },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectMongoose();
    
    // Initialize default settings if not exists
    await RbacSettings.initializeDefaultSettings();
    
    // Get RBAC settings from database
    const settings = await RbacSettings.findOne().maxTimeMS(5000).lean().exec();
    
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error('Error fetching RBAC settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/rbac-settings
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
        { error: 'Not authorized. Only administrators can update RBAC settings.' },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectMongoose();
    
    // Get request body
    const { matrix } = await request.json();
    
    if (!matrix || !Array.isArray(matrix)) {
      return NextResponse.json(
        { error: 'Invalid request body. Matrix array is required.' },
        { status: 400 }
      );
    }
    
    // Initialize default settings if not exists
    await RbacSettings.initializeDefaultSettings();
    
    // Convert roles from plain objects to Maps for Mongoose
    const convertedMatrix = convertRolesToMap(matrix);
    
    // Update RBAC settings in database
    const settings = await RbacSettings.findOneAndUpdate(
      {},
      { matrix: convertedMatrix },
      { new: true, upsert: true }
    ).maxTimeMS(5000).lean().exec();
    
    return NextResponse.json(
      { success: true, message: 'RBAC settings updated successfully', settings },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating RBAC settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// API endpoint to check if a role has access to a resource
// GET /api/admin/rbac-settings/check?resource=website-manager&role=devops
export async function checkAccess(resource: string, role: string): Promise<boolean> {
  try {
    await connectMongoose();
    
    // Initialize default settings if not exists
    await RbacSettings.initializeDefaultSettings();
    
    return await RbacSettings.hasAccess(resource, role);
  } catch (error) {
    console.error('Error checking access:', error);
    // Default to admin only if error
    return role === 'admin';
  }
} 