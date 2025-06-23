import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Check authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production'
    });

    if (!token || !token.mobileNumber) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mobileNumber = token.mobileNumber as string;
    const imagePath = params.path.join('/');
    
    // Verify the path belongs to the user
    if (!imagePath.startsWith(`${mobileNumber}/my-images/`)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Construct S3 URL
    const s3Url = `https://dt-web-sites.s3.ap-south-1.amazonaws.com/sites/${imagePath}`;
    
    console.log('Proxying image request:', s3Url);

    // Fetch from S3
    const response = await fetch(s3Url);
    
    if (!response.ok) {
      console.error('Failed to fetch image from S3:', response.status, response.statusText);
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Get the image data and content type
    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers
    return new NextResponse(imageData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Error in image proxy:', error);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
} 