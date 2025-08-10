import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
// Note: No subscription checks here. Subscription enforcement applies only under /site/[mobileno]

export async function GET(
  request: NextRequest,
  context: { params: { mobileNumber: string } }
) {
  try {
    // Get the mobile number from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    
    // Validate mobile number format (should be numeric)
    const mobileNumber = pathParts[2];
    if (!/^\d+$/.test(mobileNumber)) {
      console.log('Invalid mobile number format:', mobileNumber);
      return new NextResponse(
        JSON.stringify({ error: 'Invalid mobile number format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Request URL:', request.url);
    console.log('Mobile Number:', mobileNumber);
    
    // Get the file path after the mobile number
    let filePath = pathParts.slice(3).join('/');
    if (!filePath) {
      filePath = 'index.html';
    }

    console.log('Requested file path:', filePath);

    // Prevent directory traversal
    if (filePath.includes('..')) {
      console.log('Directory traversal attempt detected');
      return new NextResponse('Not Found', { status: 404 });
    }

    // No subscription check here – always serve requested asset
    const isErrorPage = filePath === 'error.html';

    // First check in the user's directory
    const userDir = join(process.cwd(), 'public', 'sites', mobileNumber);
    if (!existsSync(userDir)) {
      console.log('User directory not found:', userDir);
      return new NextResponse(
        JSON.stringify({ error: 'User website not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fullPath = join(userDir, filePath);
    console.log('Looking for file at:', fullPath);
    
    if (!existsSync(fullPath)) {
      console.log('File not found at path:', fullPath);
      
      // If error.html is requested but doesn't exist, provide a fallback error page
      if (isErrorPage) {
        console.log('error.html not found, providing fallback error page');
        const fallbackErrorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Unavailable</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        h1 { color: #e74c3c; }
        p { color: #666; line-height: 1.6; }
        .contact { margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚫 Service Unavailable</h1>
        <p>Your website service is currently unavailable. This could be due to:</p>
        <ul style="text-align: left; display: inline-block;">
            <li>Subscription needs renewal</li>
            <li>Payment pending</li>
            <li>Account maintenance</li>
        </ul>
        <div class="contact">
            <p><strong>Need help?</strong> Please contact your service provider to restore access.</p>
        </div>
    </div>
</body>
</html>`;
        
        return new NextResponse(fallbackErrorHtml, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        });
      }
      
      return new NextResponse(
        JSON.stringify({ error: 'File not found', path: filePath }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('File found, reading content...');
    const file = await readFile(fullPath);
    const contentType = getContentType(filePath);
    console.log('Content type:', contentType);

    // Set appropriate headers based on file type
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=0, must-revalidate',
    };

    // Add CORS headers to allow loading resources
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';

    // Add security headers
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'DENY';
    headers['X-XSS-Protection'] = '1; mode=block';

    // Special handling for HTML files
    if (contentType === 'text/html') {
      let content = file.toString();
      
      // Add base tag to ensure relative paths work correctly
      if (!content.includes('<base')) {
        const baseTag = `<base href="/sites/${mobileNumber}/">`;
        content = content.replace('</head>', `${baseTag}\n</head>`);
      }

      console.log('Serving HTML file with base tag');
      return new NextResponse(content, { headers });
    }

    console.log('Serving file successfully');
    return new NextResponse(file, { headers });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
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
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function getContentType(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'html':
      return 'text/html; charset=utf-8';
    case 'css':
      return 'text/css; charset=utf-8';
    case 'js':
      return 'application/javascript; charset=utf-8';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'ico':
      return 'image/x-icon';
    case 'json':
      return 'application/json; charset=utf-8';
    case 'txt':
      return 'text/plain; charset=utf-8';
    case 'woff':
      return 'font/woff';
    case 'woff2':
      return 'font/woff2';
    case 'ttf':
      return 'font/ttf';
    case 'eot':
      return 'application/vnd.ms-fontobject';
    case 'otf':
      return 'font/otf';
    default:
      return 'application/octet-stream';
  }
} 