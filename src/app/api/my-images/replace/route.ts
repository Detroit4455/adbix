import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getAssetUrl } from '@/lib/aws-urls';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'dt-web-sites';

export async function PUT(request: NextRequest) {
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const originalFileName = formData.get('originalFileName') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!originalFileName) {
      return NextResponse.json({ error: 'Original filename is required' }, { status: 400 });
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

    // Use the same filename but update the extension if needed
    const originalExtension = originalFileName.split('.').pop();
    const newExtension = file.name.split('.').pop();
    const baseFileName = originalFileName.replace(/\.[^/.]+$/, ''); // Remove extension
    const finalFileName = `${baseFileName}.${newExtension}`;

    // Define the exact S3 path
    const s3Key = `sites/${mobileNumber}/my-images/${finalFileName}`;
    
    console.log(`Replacing image on S3:`);
    console.log(`  Bucket: ${BUCKET_NAME}`);
    console.log(`  Original: ${originalFileName}`);
    console.log(`  New Key: ${s3Key}`);
    console.log(`  Full path: ${BUCKET_NAME}/${s3Key}`);

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3 (this will overwrite the existing file)
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: file.type,
    });

    await s3Client.send(uploadCommand);

    // Generate public URL using CloudFront if available, otherwise fallback to S3
    const publicUrl = getAssetUrl(mobileNumber, `my-images/${finalFileName}`);
    
    console.log(`Generated public URL: ${publicUrl}`);

    return NextResponse.json({
      success: true,
      fileName: finalFileName,
      publicUrl,
      size: file.size,
      type: file.type,
      replacedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error replacing image:', error);
    return NextResponse.json({ 
      error: 'Failed to replace image. Please try again.' 
    }, { status: 500 });
  }
} 