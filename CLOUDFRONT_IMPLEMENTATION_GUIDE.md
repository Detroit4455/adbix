# CloudFront Implementation Guide

This guide documents the CloudFront implementation for serving websites while keeping S3 for file operations.

## Overview

The implementation adds CloudFront support for website serving while maintaining S3 for:
- File uploads and management
- Backend file operations
- Direct file access when needed

## Architecture

```
User Website Access:
- CloudFront URL (if configured) → Fast global delivery
- S3 Direct URL (fallback) → Direct access

File Operations:
- Always use S3 directly for uploads, management, and backend operations
```

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Backend CloudFront Configuration
CLOUDFRONT_BASE_URL=https://your-cloudfront-distribution-domain.cloudfront.net
CLOUDFRONT_DOMAIN=your-cloudfront-distribution-domain.cloudfront.net

# Frontend CloudFront Configuration (NEXT_PUBLIC_ for client-side access)
NEXT_PUBLIC_CLOUDFRONT_BASE_URL=https://your-cloudfront-distribution-domain.cloudfront.net
NEXT_PUBLIC_S3_BASE_URL=https://dt-web-sites.s3.ap-south-1.amazonaws.com
```

## CloudFront Setup Steps

### 1. Create CloudFront Distribution

1. **Log into AWS Console** → CloudFront
2. **Create Distribution**:
   - **Origin Domain**: `dt-web-sites.s3.ap-south-1.amazonaws.com`
   - **Origin Path**: Leave empty (we use `/sites/` in paths)
   - **Origin Access**: Public (since S3 bucket is public)

3. **Configure Distribution Settings**:
   - **Price Class**: Choose based on your needs
   - **Cache Behaviors**: 
     - **Viewer Protocol Policy**: Redirect HTTP to HTTPS
     - **Allowed HTTP Methods**: GET, HEAD
     - **Cache Policy**: Managed-CachingOptimized
   
4. **Add Custom Error Pages** (Optional):
   - 404 → `/error/404.html`
   - 403 → `/error/403.html`

5. **Deploy and Get Domain**: 
   - Note the CloudFront domain (e.g., `d123456789.cloudfront.net`)

### 2. Update Environment Variables

Replace `your-cloudfront-distribution-domain.cloudfront.net` with your actual CloudFront domain in:
- `CLOUDFRONT_BASE_URL`
- `NEXT_PUBLIC_CLOUDFRONT_BASE_URL`

### 3. Test the Implementation

1. **Upload a test website** via the S3 upload feature
2. **Check URLs in the interface**:
   - You should see CloudFront URLs as primary
   - S3 Direct URLs as secondary (technical reference)
3. **Verify performance**: CloudFront should be faster than S3 direct

## Implementation Details

### URL Generation Logic

The system uses utility functions to generate appropriate URLs:

- **`getWebsiteUrl()`**: Returns CloudFront URL if configured, S3 as fallback
- **`getDirectS3Url()`**: Always returns S3 direct URL
- **`getAssetUrl()`**: Returns CloudFront URL for assets if configured
- **`isCloudFrontConfigured()`**: Checks if CloudFront is properly configured

### Components Updated

1. **S3WebsiteUpload**: Shows CloudFront and S3 URLs after upload
2. **WebsiteManager**: Lists websites with CloudFront links
3. **S3SiteTabView**: Uses CloudFront for "View Live Site" buttons
4. **Web_on_S3**: Access tab shows both CloudFront and S3 options
5. **Site Proxy Route**: Uses CloudFront for serving, S3 as fallback

### Fallback Behavior

- **No CloudFront configured**: All website URLs use S3 direct
- **CloudFront configured**: Website serving uses CloudFront, file ops use S3
- **CloudFront fails**: Automatic fallback to S3 direct in proxy route

## Benefits

1. **Faster Loading**: Global edge cache reduces latency
2. **Better Performance**: Optimized content delivery
3. **SSL/HTTPS**: CloudFront provides HTTPS by default  
4. **Global Reach**: Edge locations worldwide
5. **Cost Optimization**: Reduced S3 transfer costs
6. **Backward Compatibility**: Still works without CloudFront

## Troubleshooting

### CloudFront URLs Not Showing
- Check environment variables are set correctly
- Ensure `NEXT_PUBLIC_` prefixed variables for frontend
- Restart development server after adding environment variables

### CloudFront Returns 403/404
- Check S3 bucket public access settings
- Verify CloudFront origin points to correct S3 bucket
- Check CloudFront distribution status (must be "Deployed")

### Mixed Content Warnings
- Ensure CloudFront distribution uses HTTPS
- Check that website assets also use HTTPS URLs

### Cache Issues
- CloudFront caches content for 24 hours by default
- Use AWS Console to create cache invalidations if needed
- For development, consider shorter TTL settings

## Performance Optimization

### Cache Headers
The implementation sets appropriate cache headers:
- **Static assets**: `Cache-Control: public, max-age=300` (5 minutes)
- **Preview mode**: `Cache-Control: no-cache`

### CloudFront Settings
Recommended CloudFront configuration:
- **TTL**: Default 24 hours for static content
- **Compression**: Enable Gzip compression
- **HTTP/2**: Enable for better performance

## Security Considerations

1. **Origin Access**: Uses public S3 access (existing setup)
2. **HTTPS**: CloudFront enforces HTTPS
3. **Access Control**: Same S3 permissions apply
4. **File Operations**: Still protected by authentication

## Monitoring

Monitor CloudFront performance via:
- **AWS CloudWatch**: CloudFront metrics
- **Real User Monitoring**: Page load times
- **Error Rates**: 4xx/5xx responses from CloudFront

## Cost Implications

- **CloudFront**: Pay per data transfer and requests
- **S3**: Reduced transfer costs (traffic via CloudFront)
- **Overall**: Usually cost-neutral or savings for high-traffic sites

## Migration Notes

- **Existing websites**: Continue working via S3 direct URLs
- **New uploads**: Automatically get CloudFront URLs
- **Gradual migration**: Users can switch to CloudFront URLs when ready
- **No downtime**: Implementation is additive, doesn't break existing functionality 