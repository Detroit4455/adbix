import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.mobileNumber) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to update website configuration' },
        { status: 401 }
      );
    }

    // Get the website config from the request body
    const data = await request.json();
    const { websiteConfig } = data;

    if (!websiteConfig || typeof websiteConfig !== 'object') {
      return NextResponse.json(
        { error: 'Invalid website configuration data' },
        { status: 400 }
      );
    }

    // Update the database with the website config
    const { db } = await connectToDatabase();
    
    // Check if the user already has a website_config field
    const existingUser = await db.collection('users').findOne(
      { mobileNumber: session.user.mobileNumber },
      { projection: { website_config: 1 } }
    );

    // If there's already a config, only update if it's missing or different
    if (existingUser && existingUser.website_config) {
      // No need to update if the config is the same
      // This prevents unnecessary database writes
      const isEqual = JSON.stringify(existingUser.website_config) === JSON.stringify(websiteConfig);
      
      if (isEqual) {
        return NextResponse.json({ 
          message: 'Website configuration is already up to date',
          updated: false
        });
      }
    }

    // Update the user's website_config
    await db.collection('users').updateOne(
      { mobileNumber: session.user.mobileNumber },
      {
        $set: {
          website_config: websiteConfig,
          lastUpdated: new Date().toISOString()
        }
      }
    );

    return NextResponse.json({
      message: 'Website configuration updated successfully',
      updated: true
    });
  } catch (error) {
    console.error('Error updating website configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update website configuration' },
      { status: 500 }
    );
  }
} 