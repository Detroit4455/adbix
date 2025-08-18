/** @type {import('next').NextConfig} */
// Derive allowed frame sources for previews (S3/CloudFront)
const S3_BASE_URL = process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://dt-web-sites.s3.ap-south-1.amazonaws.com';
const CLOUDFRONT_BASE_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_BASE_URL || '';

const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers for PCI DSS compliance
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com https://cdnjs.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://cdnjs.cloudflare.com",
              // Allow embedding our S3-hosted sites (and CloudFront if configured) in iframes
              `frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com ${S3_BASE_URL} ${CLOUDFRONT_BASE_URL}`.trim(),
              // Allow Monaco Editor web workers
              "worker-src 'self' blob:",
              // Backward compatibility for older browsers
              "child-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://api.razorpay.com"
            ].join('; ')
          }
        ],
      },
      // Permissive CSP for proxied user sites so their own iframes and assets load
      {
        source: '/site/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              // Allow broad sources for user content (only for /site proxy)
              "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:",
              "script-src * 'unsafe-inline' 'unsafe-eval' data: blob:",
              "style-src * 'unsafe-inline' data:",
              "img-src * data: blob:",
              "font-src * data:",
              "media-src * data: blob:",
              "connect-src * data: blob:",
              "frame-src * data: blob:",
              "object-src * data: blob:",
              "base-uri *"
            ].join('; ')
          }
        ]
      },
      // Allow embedding widget previews in iframes (override stricter defaults)
      {
        source: '/widget-preview/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://cdn.jsdelivr.net",
              // Permit being embedded by our domain and common S3/CF domains
              `frame-ancestors 'self' ${S3_BASE_URL} ${CLOUDFRONT_BASE_URL} https://*.amazonaws.com https://*.cloudfront.net http://localhost:3000`.trim(),
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          }
        ]
      },
      {
        source: '/widgets/preview/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://cdn.jsdelivr.net",
              `frame-ancestors 'self' ${S3_BASE_URL} ${CLOUDFRONT_BASE_URL} https://*.amazonaws.com https://*.cloudfront.net http://localhost:3000`.trim(),
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          }
        ]
      }
    ];
  },
};

module.exports = nextConfig;
