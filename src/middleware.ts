import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Check if a string looks like a mobile number
function isMobileNumber(str: string): boolean {
  return /^\d{10,15}$/.test(str);
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // For dashboard routes, check authentication
  if (path.startsWith('/dashboard')) {
    try {
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production'
      });
      
      console.log('Middleware - Path:', path);
      console.log('Middleware - Token found:', !!token);
      console.log('Middleware - Token data:', token ? { id: token.id, mobileNumber: token.mobileNumber } : 'No token');
      
      // If the user is not authenticated, redirect to the login page
      if (!token) {
        console.log('Middleware - Redirecting to login');
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', request.url);
        return NextResponse.redirect(url);
      }
      
      console.log('Middleware - Allowing access to dashboard');
      return NextResponse.next();
    } catch (error) {
      console.error('Middleware - Error getting token:', error);
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(url);
    }
  }
  
  // Handle direct requests to /sites/resource.ext (without mobile number)
  if (path.match(/^\/sites\/([\w.-]+\.\w+)$/)) {
    const match = path.match(/^\/sites\/([\w.-]+\.\w+)$/);
    const resourceName = match ? match[1] : '';
    console.log('Detected direct /sites/ resource request for:', resourceName);
    
    const referer = request.headers.get('referer');
    console.log('Referer for sites resource:', referer);
    
    if (referer) {
      const refererUrl = new URL(referer);
      const refererPathParts = refererUrl.pathname.split('/').filter(Boolean);
      
      // Check if the referer is from a mobile number site
      // Case 1: /sites/[mobileNumber]/...
      if (refererPathParts.length > 1 && refererPathParts[0] === 'sites' && isMobileNumber(refererPathParts[1])) {
        const mobileNumber = refererPathParts[1];
        console.log('Found mobile number from /sites/ referer:', mobileNumber);
        
        // Redirect to the correct path
        const redirectUrl = new URL(`/sites/${mobileNumber}/${resourceName}`, request.url);
        console.log('Redirecting /sites/ resource to:', redirectUrl.toString());
        return NextResponse.redirect(redirectUrl);
      }
      
      // Case 2: /[mobileNumber]/...
      if (refererPathParts.length > 0 && isMobileNumber(refererPathParts[0])) {
        const mobileNumber = refererPathParts[0];
        console.log('Found mobile number from root path referer:', mobileNumber);
        
        // Redirect to the correct path
        const redirectUrl = new URL(`/${mobileNumber}/${resourceName}`, request.url);
        console.log('Redirecting /sites/ resource to root path:', redirectUrl.toString());
        return NextResponse.redirect(redirectUrl);
      }
    }
  }
  
  // If this is a direct resource request at the root level, check if it belongs to a mobile site
  if (path.match(/^\/([\w.-]+\.\w+)$/)) {
    const resourceName = path.substring(1); // Remove leading slash
    console.log('Detected root resource request for:', resourceName);
    
    // Get referrer to determine the site context
    const referer = request.headers.get('referer');
    console.log('Referer:', referer);
    
    if (referer) {
      const refererUrl = new URL(referer);
      const refererPathParts = refererUrl.pathname.split('/').filter(Boolean);
      console.log('Referer path parts:', refererPathParts);
      
      // If referer contains a mobile number, use that as context
      if (refererPathParts.length > 0 && isMobileNumber(refererPathParts[0])) {
        const mobileNumber = refererPathParts[0];
        console.log('Found mobile number from referer:', mobileNumber);
        
        // Redirect to the correct path
        const redirectUrl = new URL(`/${mobileNumber}/${resourceName}`, request.url);
        console.log('Redirecting to:', redirectUrl.toString());
        return NextResponse.redirect(redirectUrl);
      }
      
      // If referer path has /sites/mobileNumber pattern
      if (refererPathParts.length > 1 && refererPathParts[0] === 'sites' && isMobileNumber(refererPathParts[1])) {
        const mobileNumber = refererPathParts[1];
        console.log('Found mobile number from sites path:', mobileNumber);
        
        // Redirect to the correct path
        const redirectUrl = new URL(`/sites/${mobileNumber}/${resourceName}`, request.url);
        console.log('Redirecting to:', redirectUrl.toString());
        return NextResponse.redirect(redirectUrl);
      }
    }
  }
  
  return NextResponse.next();
}

// Define paths to match
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/sites/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 