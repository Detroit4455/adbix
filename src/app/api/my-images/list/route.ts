import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getAssetUrl } from '@/lib/aws-urls';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'dt-web-sites';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production'
    });

    if (!token || !token.mobileNumber) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mobileNumber = token.mobileNumber as string;

    // List objects from S3
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `sites/${mobileNumber}/my-images/`,
    });

    const listResponse = await s3Client.send(listCommand);

    if (!listResponse.Contents) {
      return NextResponse.json({ images: [] });
    }

    // Process the images and get additional metadata
    const images = await Promise.all(
      listResponse.Contents
        .filter(item => item.Key && item.Key !== `sites/${mobileNumber}/my-images/`) // Filter out directory entries
        .map(async (item) => {
          if (!item.Key) return null;

          const fileName = item.Key.split('/').pop() || '';
          // Use CloudFront URL if available, otherwise fallback to S3
          const publicUrl = getAssetUrl(mobileNumber, `my-images/${fileName}`);
          const proxyUrl = `/api/my-images/proxy/${mobileNumber}/my-images/${fileName}`;

          try {
            // Get additional metadata
            const headCommand = new HeadObjectCommand({
              Bucket: BUCKET_NAME,
              Key: item.Key,
            });
            const headResponse = await s3Client.send(headCommand);

            return {
              fileName,
              publicUrl,
              proxyUrl,
              size: item.Size || 0,
              lastModified: item.LastModified?.toISOString() || '',
              contentType: headResponse.ContentType || 'image/jpeg',
              key: item.Key
            };
          } catch (error) {
            console.error(`Error getting metadata for ${item.Key}:`, error);
            // Return basic info if metadata fetch fails
            return {
              fileName,
              publicUrl,
              proxyUrl,
              size: item.Size || 0,
              lastModified: item.LastModified?.toISOString() || '',
              contentType: 'image/jpeg',
              key: item.Key
            };
          }
        })
    );

    // Filter out any null values and sort by last modified (newest first)
    const validImages = images
      .filter(img => img !== null)
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    return NextResponse.json({ images: validImages });

  } catch (error) {
    console.error('Error listing images:', error);
    return NextResponse.json({ 
      error: 'Failed to load images. Please try again.' 
    }, { status: 500 });
  }
} 