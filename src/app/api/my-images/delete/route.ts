import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'dt-web-sites';

export async function DELETE(request: NextRequest) {
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
    
    // Get the filename from request body
    const { fileName } = await request.json();

    if (!fileName) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    // Construct the S3 key
    const key = `sites/${mobileNumber}/my-images/${fileName}`;
    
    console.log(`Deleting image from S3:`);
    console.log(`  Bucket: ${BUCKET_NAME}`);
    console.log(`  Key: ${key}`);
    console.log(`  Full path: ${BUCKET_NAME}/${key}`);

    // Delete the object from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(deleteCommand);

    return NextResponse.json({ 
      success: true, 
      message: 'Image deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ 
      error: 'Failed to delete image. Please try again.' 
    }, { status: 500 });
  }
} 