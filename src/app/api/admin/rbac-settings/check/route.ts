import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/db';
import RbacSettings from '@/models/RbacSettings';

// GET /api/admin/rbac-settings/check?resource=website-manager&role=devops
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');
    const role = searchParams.get('role');
    
    if (!resource || !role) {
      return NextResponse.json(
        { error: 'Resource and role parameters are required' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectMongoose();
    
    // Initialize default settings if not exists
    await RbacSettings.initializeDefaultSettings();
    
    // Check if role has access to resource
    const hasAccess = await RbacSettings.hasAccess(resource, role);
    
    // Always return a boolean to prevent serialization issues
    return NextResponse.json({ hasAccess: Boolean(hasAccess) }, { status: 200 });
  } catch (error) {
    console.error('Error checking RBAC access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 