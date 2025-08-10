import { NextRequest, NextResponse } from 'next/server';
import { checkSubscriptionCached } from '@/lib/subscriptionCache';

export async function GET(
  request: NextRequest,
  { params }: { params: { mobileno: string } }
) {
  // Await the params before destructuring
  const paramValues = await Promise.resolve(params);
  const { mobileno } = paramValues;
  
  // Check subscription status using cache (only for index.html redirect)
  try {
    const { shouldAllowAccess } = await checkSubscriptionCached(mobileno);
    
    if (!shouldAllowAccess) {
      console.log('🚫 Subscription check failed for user:', mobileno);
      // Redirect to error.html instead of index.html
      return NextResponse.redirect(new URL(`/site/${mobileno}/error.html`, request.url));
    } else {
      console.log('✅ Subscription check passed for user:', mobileno);
    }
  } catch (error) {
    console.error('Error checking subscription status:', error);
    // On error, redirect to error.html to be safe
    return NextResponse.redirect(new URL(`/site/${mobileno}/error.html`, request.url));
  }
  
  // Redirect to index.html when no path is specified
  return NextResponse.redirect(new URL(`/site/${mobileno}/index.html`, request.url));
} 