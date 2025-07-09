/**
 * AWS URL Utilities
 * 
 * This utility provides functions to generate appropriate URLs for different use cases:
 * - S3 URLs for file operations (upload, delete, management)
 * - CloudFront URLs for website serving to end users
 * - Fallback to S3 when CloudFront is not configured
 */

// Environment variables
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'dt-web-sites';
const S3_BASE_URL = process.env.S3_BASE_URL || `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`;
const CLOUDFRONT_BASE_URL = process.env.CLOUDFRONT_BASE_URL;

/**
 * Get S3 URL for file operations (upload, delete, management)
 * Always returns S3 direct URL for backend operations
 */
export function getS3Url(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${S3_BASE_URL}/${cleanPath}`;
}

/**
 * Get website serving URL (CloudFront if available, S3 as fallback)
 * Used for serving websites to end users
 */
export function getWebsiteUrl(userId: string, filePath: string = 'index.html'): string {
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const fullPath = `sites/${userId}/${cleanPath}`;
  
  // Use CloudFront if configured, otherwise fallback to S3
  if (CLOUDFRONT_BASE_URL) {
    return `${CLOUDFRONT_BASE_URL}/${fullPath}`;
  }
  
  return getS3Url(fullPath);
}

/**
 * Get URL for website assets (images, CSS, JS) served via CloudFront
 * Falls back to S3 if CloudFront not configured
 */
export function getAssetUrl(userId: string, assetPath: string): string {
  const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  const fullPath = `sites/${userId}/${cleanPath}`;
  
  if (CLOUDFRONT_BASE_URL) {
    return `${CLOUDFRONT_BASE_URL}/${fullPath}`;
  }
  
  return getS3Url(fullPath);
}

/**
 * Get S3 URL for direct file access (always S3, never CloudFront)
 * Used for file management operations that need direct S3 access
 */
export function getDirectS3Url(userId: string, filePath: string): string {
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const fullPath = `sites/${userId}/${cleanPath}`;
  return getS3Url(fullPath);
}

/**
 * Check if CloudFront is configured
 */
export function isCloudFrontConfigured(): boolean {
  return !!(CLOUDFRONT_BASE_URL && CLOUDFRONT_BASE_URL.trim());
}

/**
 * Get CloudFront URL for image repository assets
 * Falls back to S3 if CloudFront not configured
 */
export function getImageRepoUrl(imagePath: string): string {
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  // Use CloudFront if configured, otherwise fallback to S3
  if (CLOUDFRONT_BASE_URL) {
    return `${CLOUDFRONT_BASE_URL}/${cleanPath}`;
  }
  
  return getS3Url(cleanPath);
}

/**
 * Get base configuration info for debugging
 */
export function getUrlConfig() {
  return {
    s3BaseUrl: S3_BASE_URL,
    cloudFrontBaseUrl: CLOUDFRONT_BASE_URL || 'Not configured',
    isCloudFrontEnabled: isCloudFrontConfigured(),
    region: AWS_REGION,
    bucketName: S3_BUCKET_NAME
  };
} 