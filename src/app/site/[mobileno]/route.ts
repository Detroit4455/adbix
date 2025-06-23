import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { mobileno: string } }
) {
  // Await the params before destructuring
  const paramValues = await Promise.resolve(params);
  const { mobileno } = paramValues;
  
  // Redirect to index.html when no path is specified
  return NextResponse.redirect(new URL(`/site/${mobileno}/index.html`, request.url));
} 