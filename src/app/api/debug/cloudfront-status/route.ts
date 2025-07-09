import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getUrlConfig, getWebsiteUrl, getDirectS3Url, isCloudFrontConfigured } from '@/lib/aws-urls';

export async function GET(request: NextRequest) {
  try {
    // Check authentication (optional - you can remove this if you want open access for debugging)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get current configuration
    const config = getUrlConfig();
    
    // Test URLs with a sample user ID
    const sampleUserId = session.user.mobileNumber || '1234567890';
    const websiteUrl = getWebsiteUrl(sampleUserId);
    const s3DirectUrl = getDirectS3Url(sampleUserId, 'index.html');
    
    // Check environment variables
    const envCheck = {
      backend: {
        CLOUDFRONT_BASE_URL: process.env.CLOUDFRONT_BASE_URL || 'NOT SET',
        S3_BASE_URL: process.env.S3_BASE_URL || 'NOT SET',
        AWS_REGION: process.env.AWS_REGION || 'NOT SET',
        AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || 'NOT SET'
      },
      frontend: {
        // Note: These won't be visible in server-side code, but we can check if they exist
        NEXT_PUBLIC_CLOUDFRONT_BASE_URL: 'Check browser console or component UI',
        NEXT_PUBLIC_S3_BASE_URL: 'Check browser console or component UI'
      }
    };

    return NextResponse.json({
      status: 'CloudFront Debug Information',
      timestamp: new Date().toISOString(),
      cloudfront: {
        isConfigured: isCloudFrontConfigured(),
        status: isCloudFrontConfigured() ? '✅ CloudFront is configured' : '❌ CloudFront is not configured'
      },
      config,
      sampleUrls: {
        websiteUrl,
        s3DirectUrl,
        explanation: isCloudFrontConfigured() 
          ? 'Website URL should use CloudFront domain' 
          : 'Website URL should use S3 direct domain'
      },
      environmentVariables: envCheck,
      instructions: {
        toTestCloudFront: [
          '1. Upload a test website via /web_on_s3',
          '2. Check if URLs show CloudFront domain (🌐 icons)',
          '3. Open CloudFront URL in browser',
          '4. Check browser network tab for CloudFront headers'
        ],
        troubleshooting: [
          'If CloudFront not working: Check environment variables above',
          'If frontend not showing CloudFront: Check NEXT_PUBLIC_ variables',
          'Restart development server after adding environment variables'
        ]
      }
    });
  } catch (error) {
    console.error('CloudFront debug error:', error);
    return NextResponse.json({
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 