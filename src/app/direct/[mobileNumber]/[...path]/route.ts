import { NextRequest, NextResponse } from 'next/server';
import { getDirectS3Url } from '@/lib/aws-urls';

export async function GET(
  request: NextRequest,
  { params }: { params: { mobileNumber: string, path: string[] } }
) {
  try {
    // Await the params before destructuring
    const paramValues = await Promise.resolve(params);
    const { mobileNumber, path } = paramValues;
    
    // Construct the path to the resource
    const pathSegments = Array.isArray(path) ? path.join('/') : path;
    
    // Use direct S3 URL (bypass CDN) for immediate access
    const directS3Url = getDirectS3Url(mobileNumber, pathSegments);
    
    console.log(`Direct S3 proxy - fetching from: ${directS3Url}`);
    
    // Fetch content directly from S3 (bypass CDN)
    const response = await fetch(directS3Url);
    
    if (!response.ok) {
      console.log(`Direct S3 request failed: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: 'File not found', path: pathSegments },
        { status: 404 }
      );
    }
    
    // Get the content and content-type
    const contentType = response.headers.get('content-type') || 'text/plain';
    const content = await response.arrayBuffer();
    
    // Set appropriate headers
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate', // Prevent caching for live editing
      'Pragma': 'no-cache',
      'Expires': '0',
    };
    
    // Add CORS headers to allow loading resources
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    
    // Add security headers
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'SAMEORIGIN';
    headers['X-XSS-Protection'] = '1; mode=block';
    
    console.log(`Direct S3 proxy - serving ${contentType} file: ${pathSegments}`);
    
    return new NextResponse(content, { headers });
    
  } catch (error) {
    console.error('Direct S3 proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
