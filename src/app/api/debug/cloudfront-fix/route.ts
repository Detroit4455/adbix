import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getWebsiteUrl, getDirectS3Url, isCloudFrontConfigured } from '@/lib/aws-urls';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.mobileNumber || '1234567890';
    const cloudFrontUrl = getWebsiteUrl(userId, 'index.html');
    const s3DirectUrl = getDirectS3Url(userId, 'index.html');

    // Test both URLs
    const testResults = await Promise.allSettled([
      testUrl(cloudFrontUrl, 'CloudFront'),
      testUrl(s3DirectUrl, 'S3 Direct')
    ]);

    return NextResponse.json({
      status: 'CloudFront Diagnostics',
      timestamp: new Date().toISOString(),
      configuration: {
        isConfigured: isCloudFrontConfigured(),
        cloudFrontUrl,
        s3DirectUrl
      },
      testResults: testResults.map((result, index) => 
        result.status === 'fulfilled' ? result.value : { 
          source: index === 0 ? 'CloudFront' : 'S3 Direct',
          error: result.reason.message 
        }
      ),
      troubleshooting: {
        commonIssues: [
          'CloudFront origin not pointing to correct S3 bucket',
          'S3 bucket block public access settings',
          'CloudFront distribution not fully deployed',
          'Wrong CloudFront origin path configuration'
        ],
        fixSteps: [
          '1. Check S3 bucket public access settings',
          '2. Verify CloudFront origin configuration',
          '3. Check CloudFront distribution status',
          '4. Test with a simple index.html file'
        ]
      },
      nextSteps: isCloudFrontConfigured() 
        ? s3DirectUrl.includes('200') || cloudFrontUrl.includes('403')
          ? 'CloudFront access issue - check S3 permissions'
          : 'Upload test content to verify'
        : 'CloudFront not configured'
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Diagnostic failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testUrl(url: string, source: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    return {
      source,
      url,
      status: response.status,
      statusText: response.statusText,
      headers: {
        'content-type': response.headers.get('content-type'),
        'cache-control': response.headers.get('cache-control'),
        'x-cache': response.headers.get('x-cache'),
        'x-amz-cf-id': response.headers.get('x-amz-cf-id'),
        'server': response.headers.get('server')
      },
      isCloudFront: !!(response.headers.get('x-amz-cf-id') || response.headers.get('x-cache')),
      success: response.ok
    };
  } catch (error) {
    return {
      source,
      url,
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    };
  }
} 