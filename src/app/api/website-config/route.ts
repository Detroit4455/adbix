import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.mobileNumber) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to access website configuration' },
        { status: 401 }
      );
    }

    // Get the page parameter from the URL, defaulting to index.html
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || 'index.html';
    
    try {
      // Connect to the database and get the user's website configuration
      const { db } = await connectToDatabase();
      const user = await db.collection('users').findOne(
        { mobileNumber: session.user.mobileNumber },
        { projection: { website_config: 1 } }
      );

      // If no user or no config, return empty (not an error)
      if (!user || !user.website_config) {
        console.log(`No website_config found for user ${session.user.mobileNumber}`);
        return NextResponse.json(null, { status: 204 });
      }

      // Get the configuration for the requested page
      const pageConfig = user.website_config[page];
      
      if (!pageConfig) {
        // If the specific page config doesn't exist, try to use index.html as fallback
        const fallbackConfig = user.website_config['index.html'];
        
        if (!fallbackConfig) {
          console.log(`No config found for page ${page} and no fallback available`);
          return NextResponse.json(null, { status: 204 });
        }
        
        return NextResponse.json(fallbackConfig);
      }

      return NextResponse.json(pageConfig);
    } catch (dbError) {
      console.error('Database error retrieving website configuration:', dbError);
      // Return 204 instead of an error to allow client to try S3 fallback
      return NextResponse.json(null, { status: 204 });
    }
  } catch (error) {
    console.error('Error retrieving website configuration:', error);
    // Return 204 No Content instead of error to allow client to try S3 fallback
    return NextResponse.json(null, { status: 204 });
  }
} 