import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import ServerSettings from '@/models/ServerSettings';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'dt-web-sites';

export async function POST(request: NextRequest) {
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

    // Get server settings to check max images limit
    const settings = await ServerSettings.getSettings();
    const maxImages = settings.maxImagesPerUser;

    // Check current image count
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `sites/${mobileNumber}/my-images/`,
    });

    const listResponse = await s3Client.send(listCommand);
    const currentImageCount = listResponse.Contents?.length || 0;

    if (currentImageCount >= maxImages) {
      return NextResponse.json({ 
        error: `Maximum image limit reached. You can upload up to ${maxImages} images.` 
      }, { status: 400 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;

    // Define the exact S3 path
    const s3Key = `sites/${mobileNumber}/my-images/${fileName}`;
    
    console.log(`Uploading image to S3:`);
    console.log(`  Bucket: ${BUCKET_NAME}`);
    console.log(`  Key: ${s3Key}`);
    console.log(`  Full path: ${BUCKET_NAME}/${s3Key}`);

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: file.type,
    });

    await s3Client.send(uploadCommand);

    // Generate public URL
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${s3Key}`;
    
    console.log(`Generated public URL: ${publicUrl}`);

    return NextResponse.json({
      success: true,
      fileName,
      publicUrl,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ 
      error: 'Failed to upload image. Please try again.' 
    }, { status: 500 });
  }
} 