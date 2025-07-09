'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

// Client-side URL utility functions
function getWebsiteUrl(userId: string, filePath: string = 'index.html'): string {
  const cloudFrontBaseUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_BASE_URL;
  if (cloudFrontBaseUrl) {
    return `${cloudFrontBaseUrl}/sites/${userId}/${filePath}`;
  }
  const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://dt-web-sites.s3.ap-south-1.amazonaws.com';
  return `${s3BaseUrl}/sites/${userId}/${filePath}`;
}

function getDirectS3Url(userId: string, filePath: string = 'index.html'): string {
  const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://dt-web-sites.s3.ap-south-1.amazonaws.com';
  return `${s3BaseUrl}/sites/${userId}/${filePath}`;
}

function isCloudFrontConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_CLOUDFRONT_BASE_URL && process.env.NEXT_PUBLIC_CLOUDFRONT_BASE_URL.trim());
}

export default function CloudFrontDebugPage() {
  const { data: session, status } = useSession();
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchServerInfo();
    }
  }, [status]);

  const fetchServerInfo = async () => {
    try {
      const response = await fetch('/api/debug/cloudfront-status');
      const data = await response.json();
      setServerInfo(data);
    } catch (error) {
      setServerInfo({ error: 'Failed to fetch server info' });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading debug information...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please log in to access the debug page.</p>
        </div>
      </div>
    );
  }

  const userId = session?.user?.mobileNumber || '1234567890';
  const clientWebsiteUrl = getWebsiteUrl(userId);
  const clientS3Url = getDirectS3Url(userId);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔍 CloudFront Debug Dashboard</h1>
          
          {/* Configuration Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">🖥️ Client-Side Status</h2>
              
              <div className="space-y-3">
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm font-medium text-gray-700 mb-1">CloudFront Status:</div>
                  <div className={`text-lg font-bold ${isCloudFrontConfigured() ? 'text-green-600' : 'text-red-600'}`}>
                    {isCloudFrontConfigured() ? '✅ Configured' : '❌ Not Configured'}
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm font-medium text-gray-700 mb-1">CloudFront URL:</div>
                  <div className="font-mono text-sm break-all">
                    {process.env.NEXT_PUBLIC_CLOUDFRONT_BASE_URL || '❌ Not set'}
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm font-medium text-gray-700 mb-1">S3 Base URL:</div>
                  <div className="font-mono text-sm break-all">
                    {process.env.NEXT_PUBLIC_S3_BASE_URL || '❌ Not set'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-green-800 mb-4">🖥️ Server-Side Status</h2>
              
              {serverInfo && !serverInfo.error ? (
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border">
                    <div className="text-sm font-medium text-gray-700 mb-1">CloudFront Status:</div>
                    <div className={`text-lg font-bold ${serverInfo.cloudfront?.isConfigured ? 'text-green-600' : 'text-red-600'}`}>
                      {serverInfo.cloudfront?.status}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <div className="text-sm font-medium text-gray-700 mb-1">Backend Config:</div>
                    <div className="text-xs font-mono">
                      CloudFront: {serverInfo.environmentVariables?.backend?.CLOUDFRONT_BASE_URL}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-red-600">
                  {serverInfo?.error || 'Failed to load server configuration'}
                </div>
              )}
            </div>
          </div>

          {/* Generated URLs */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">🔗 Generated URLs</h2>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Website URL {isCloudFrontConfigured() ? '(CloudFront)' : '(S3 Fallback)'}:
                </div>
                <div className="font-mono text-sm break-all mb-3 p-2 bg-gray-50 rounded">
                  {clientWebsiteUrl}
                </div>
                <a 
                  href={clientWebsiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Open in New Tab
                </a>
              </div>
              
              <div className="bg-white p-4 rounded border">
                <div className="text-sm font-medium text-gray-700 mb-2">S3 Direct URL:</div>
                <div className="font-mono text-sm break-all mb-3 p-2 bg-gray-50 rounded">
                  {clientS3Url}
                </div>
                <a 
                  href={clientS3Url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors text-sm"
                >
                  Open S3 Direct
                </a>
              </div>
            </div>
          </div>

          {/* CloudFront Fix Section */}
          {isCloudFrontConfigured() && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <h2 className="text-xl font-semibold text-orange-800 mb-4">🔧 CloudFront Troubleshooting</h2>
              
              <div className="bg-white p-4 rounded border mb-4">
                <h3 className="font-semibold text-gray-800 mb-3">Common "Access Denied" Fixes:</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <h4 className="font-semibold text-red-800 mb-2">🚨 If you see "Access Denied" from CloudFront:</h4>
                    <ol className="list-decimal list-inside text-red-700 space-y-1">
                      <li>Go to AWS Console → CloudFront → Your Distribution</li>
                      <li>Check <strong>Origins</strong> tab: Origin should be <code>dt-web-sites.s3.ap-south-1.amazonaws.com</code></li>
                      <li>Check <strong>Origin Path</strong>: Should be empty (not /sites/)</li>
                      <li>Go to S3 Console → dt-web-sites bucket → Permissions</li>
                      <li>Ensure "Block public access" allows public read access</li>
                      <li>Check bucket policy allows CloudFront access</li>
                    </ol>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <h4 className="font-semibold text-blue-800 mb-2">💡 Quick Test:</h4>
                    <p className="text-blue-700">
                      Try accessing your S3 URL directly first: <a href={getDirectS3Url(userId)} target="_blank" className="underline">Test S3 Direct Access</a>
                    </p>
                    <p className="text-blue-700 text-xs mt-1">
                      If S3 works but CloudFront doesn't, it's a CloudFront configuration issue.
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <a 
                    href="/api/debug/cloudfront-fix"
                    target="_blank"
                    className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors text-sm"
                  >
                    Run Detailed Diagnostics
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 Next Steps</h2>
            
            <div className="space-y-4">
              {isCloudFrontConfigured() ? (
                <div className="bg-green-100 border border-green-300 rounded p-4">
                  <h3 className="font-semibold text-green-800 mb-2">✅ CloudFront is configured!</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Upload a test website via <a href="/web_on_s3" className="underline">S3 Upload page</a></li>
                    <li>• Check if URLs show 🌐 CloudFront icons</li>
                    <li>• Test website loading speed</li>
                    <li>• Check browser network tab for CloudFront headers</li>
                  </ul>
                </div>
              ) : (
                <div className="bg-red-100 border border-red-300 rounded p-4">
                  <h3 className="font-semibold text-red-800 mb-2">❌ CloudFront is not configured</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Check your .env.local file</li>
                    <li>• Ensure NEXT_PUBLIC_CLOUDFRONT_BASE_URL is set</li>
                    <li>• Restart your development server</li>
                    <li>• Verify CloudFront distribution is deployed</li>
                  </ul>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a 
                  href="/web_on_s3" 
                  className="bg-indigo-600 text-white p-4 rounded-lg hover:bg-indigo-700 transition-colors text-center"
                >
                  <div className="font-semibold">Upload Test Website</div>
                  <div className="text-sm opacity-90">Test CloudFront functionality</div>
                </a>
                
                <a 
                  href="/api/debug/cloudfront-fix"
                  target="_blank"
                  className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition-colors text-center"
                >
                  <div className="font-semibold">Run Diagnostics</div>
                  <div className="text-sm opacity-90">Detailed troubleshooting</div>
                </a>
                
                <button 
                  onClick={() => window.location.reload()} 
                  className="bg-gray-600 text-white p-4 rounded-lg hover:bg-gray-700 transition-colors text-center"
                >
                  <div className="font-semibold">Refresh Debug Info</div>
                  <div className="text-sm opacity-90">Reload configuration</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 