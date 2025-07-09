import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import ServerSettings from '@/models/ServerSettings';
import RbacSettings from '@/models/RbacSettings';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production'
    });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access
    const hasAccess = await RbacSettings.hasAccess('admin', token.role as string);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const settings = await ServerSettings.getSettings();
    return NextResponse.json(settings);

  } catch (error) {
    console.error('Error fetching server settings:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch server settings' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production'
    });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access
    const hasAccess = await RbacSettings.hasAccess('admin', token.role as string);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { maxImagesPerUser, allowNewUserRegistration } = await request.json();

    // Validate input
    if (maxImagesPerUser !== undefined && (typeof maxImagesPerUser !== 'number' || maxImagesPerUser < 1 || maxImagesPerUser > 1000)) {
      return NextResponse.json({ 
        error: 'Max images per user must be a number between 1 and 1000' 
      }, { status: 400 });
    }

    if (allowNewUserRegistration !== undefined && typeof allowNewUserRegistration !== 'boolean') {
      return NextResponse.json({ 
        error: 'Allow new user registration must be a boolean value' 
      }, { status: 400 });
    }

    const updateData: any = {};
    if (maxImagesPerUser !== undefined) updateData.maxImagesPerUser = maxImagesPerUser;
    if (allowNewUserRegistration !== undefined) updateData.allowNewUserRegistration = allowNewUserRegistration;

    const updatedSettings = await ServerSettings.updateSettings(updateData);
    return NextResponse.json(updatedSettings);

  } catch (error) {
    console.error('Error updating server settings:', error);
    return NextResponse.json({ 
      error: 'Failed to update server settings' 
    }, { status: 500 });
  }
} 