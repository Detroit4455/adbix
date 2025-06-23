import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Get user's gallery settings
    const user = await db.collection('users').findOne(
      { mobileNumber: userId },
      { projection: { galleryItems: 1, gallerySettings: 1 } }
    );

    // Return new format with settings, or legacy format for backward compatibility
    if (user?.gallerySettings) {
      return NextResponse.json({
        settings: user.gallerySettings
      });
    } else if (user?.galleryItems) {
      // Legacy format - return as old format
      return NextResponse.json({
        items: user.galleryItems
      });
    } else {
      return NextResponse.json({
        settings: {
          view: 'slideshow',
          items: [],
          backgroundColor: 'rgba(245, 247, 250, 1)'
        }
      });
    }
  } catch (error) {
    console.error('Error fetching gallery settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify the user is updating their own gallery
    if (session.user.mobileNumber !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { db } = await connectToDatabase();

    // Support both new settings format and legacy items format
    if (body.settings) {
      // New format with view, items, and backgroundColor
      const { view, items, backgroundColor } = body.settings;
      
      if (!items || !Array.isArray(items)) {
        return NextResponse.json({ error: 'Invalid gallery items' }, { status: 400 });
      }

      if (!view || typeof view !== 'string') {
        return NextResponse.json({ error: 'Invalid view type' }, { status: 400 });
      }

      // Validate backgroundColor if provided
      if (backgroundColor && typeof backgroundColor !== 'string') {
        return NextResponse.json({ error: 'Invalid background color format' }, { status: 400 });
      }

      // Update user's gallery settings
      await db.collection('users').updateOne(
        { mobileNumber: userId },
        { 
          $set: { 
            gallerySettings: { view, items, backgroundColor: backgroundColor || 'rgba(245, 247, 250, 1)' },
            // Keep legacy field for backward compatibility
            galleryItems: items
          } 
        }
      );

      return NextResponse.json({ settings: { view, items, backgroundColor: backgroundColor || 'rgba(245, 247, 250, 1)' } });
    } else if (body.items) {
      // Legacy format - items only
      const { items } = body;
      
      if (!items || !Array.isArray(items)) {
        return NextResponse.json({ error: 'Invalid gallery items' }, { status: 400 });
      }

      // Update both new and legacy format
      await db.collection('users').updateOne(
        { mobileNumber: userId },
        { 
          $set: { 
            gallerySettings: { 
              view: 'slideshow', // Default view for legacy updates
              items,
              backgroundColor: 'rgba(245, 247, 250, 1)' // Default background for legacy
            },
            galleryItems: items // Legacy field
          } 
        }
      );

      return NextResponse.json({ items });
    } else {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating gallery settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 