import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';

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