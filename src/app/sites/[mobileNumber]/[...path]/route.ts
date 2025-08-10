import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
// Note: No subscription checks here. Subscription enforcement applies only under /site/[mobileno]

// Helper function to add base path to HTML content and fix relative paths
function processHtml(htmlContent: string, basePath: string): string {
  // Add a base tag in the head to make relative URLs resolve correctly
  if (htmlContent.includes('<head>')) {
    htmlContent = htmlContent.replace(
      /<head>/i,
      `<head>\n  <base href="${basePath}">`
    );
  } else if (htmlContent.includes('<html>')) {
    htmlContent = htmlContent.replace(
      /<html[^>]*>/i,
      `$&\n<head>\n  <base href="${basePath}">\n</head>`
    );
  }
  
  // Fix image paths with backslashes
  htmlContent = htmlContent.replace(
    /(src|href)=["']((?!http)[^"']*?\\[^"']*?)["']/gi,
    (match, attr, url) => {
      // Replace backslashes with forward slashes
      const fixedUrl = url.replace(/\\/g, '/');
      return `${attr}="${fixedUrl}"`;
    }
  );
  
  return htmlContent;
}

export async function GET(
  request: NextRequest,
  context: { params: { mobileNumber: string; path: string[] } }
) {
  try {
    // Get the mobile number and path from context.params
    const { mobileNumber, path: pathSegments } = context.params;
    
    // Join the path segments
    const filePath = pathSegments.join('/');
    
    // Check if requesting error.html (no subscription check here)
    const isErrorPage = filePath === 'error.html';
    if (isErrorPage) {
      console.log('Serving error.html under /sites - no subscription enforcement');
    }
    
    // Construct the full path to the file
    const fullPath = join(process.cwd(), 'public', 'sites', mobileNumber, filePath);

    // Check if file exists
    if (!existsSync(fullPath)) {
      // Try with different path variations
      const pathVariations = [
        fullPath,
        // Try with normalized backslashes in the original path
        join(process.cwd(), 'public', 'sites', mobileNumber, filePath.replace(/\//g, '\\')),
        // Try with .html extension for routes without extension
        fullPath + '.html',
        // Try index.html for directories
        join(fullPath, 'index.html')
      ];
      
      // Find the first path variation that exists
      const existingPath = pathVariations.find(path => existsSync(path));
      
      if (!existingPath) {
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
        
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
      
      const fileBuffer = await readFile(existingPath);
      const ext = existingPath.split('.').pop()?.toLowerCase();
      
      let contentType = 'text/plain';
      // Determine content type based on file extension
      switch (ext) {
        case 'html':
          contentType = 'text/html';
          break;
        case 'css':
          contentType = 'text/css';
          break;
        case 'js':
          contentType = 'application/javascript';
          break;
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg';
          break;
        case 'png':
          contentType = 'image/png';
          break;
        case 'gif':
          contentType = 'image/gif';
          break;
        case 'svg':
          contentType = 'image/svg+xml';
          break;
        case 'json':
          contentType = 'application/json';
          break;
        case 'woff':
          contentType = 'font/woff';
          break;
        case 'woff2':
          contentType = 'font/woff2';
          break;
        case 'ttf':
          contentType = 'font/ttf';
          break;
      }
      
      // For HTML files, add base path to make relative URLs work correctly
      let responseContent = fileBuffer;
      if (ext === 'html') {
        const htmlContent = fileBuffer.toString('utf-8');
        const basePath = `/sites/${mobileNumber}/`;
        const modifiedHtml = processHtml(htmlContent, basePath);
        responseContent = Buffer.from(modifiedHtml, 'utf-8');
      }
      
      return new NextResponse(responseContent, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }

    // Get file stats
    const stats = await stat(fullPath);
    
    // If it's a directory, serve index.html from that directory
    if (stats.isDirectory()) {
      const indexPath = join(fullPath, 'index.html');
      if (existsSync(indexPath)) {
        const fileBuffer = await readFile(indexPath);
        
        // Process HTML content
        const htmlContent = fileBuffer.toString('utf-8');
        const basePath = `/sites/${mobileNumber}/`;
        const processedHtml = processHtml(htmlContent, basePath);
        
        return new NextResponse(Buffer.from(processedHtml, 'utf-8'), {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'public, max-age=31536000',
          },
        });
      } else {
        return NextResponse.json(
          { error: 'Index file not found' },
          { status: 404 }
        );
      }
    }

    // Read the file
    const fileBuffer = await readFile(fullPath);

    // Determine content type based on file extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    let contentType = 'text/plain';
    
    switch (ext) {
      case 'html':
        contentType = 'text/html';
        break;
      case 'css':
        contentType = 'text/css';
        break;
      case 'js':
        contentType = 'application/javascript';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
      case 'json':
        contentType = 'application/json';
        break;
      case 'woff':
        contentType = 'font/woff';
        break;
      case 'woff2':
        contentType = 'font/woff2';
        break;
      case 'ttf':
        contentType = 'font/ttf';
        break;
    }

    // For HTML files, add base path to make relative URLs work correctly
    let responseContent = fileBuffer;
    if (ext === 'html') {
      const htmlContent = fileBuffer.toString('utf-8');
      const basePath = `/sites/${mobileNumber}/`;
      const modifiedHtml = processHtml(htmlContent, basePath);
      responseContent = Buffer.from(modifiedHtml, 'utf-8');
    }

    // Return the file with appropriate content type
    return new NextResponse(responseContent, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
} 