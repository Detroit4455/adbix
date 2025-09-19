import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { checkResourceAccess } from '@/lib/rbac';
import { Readable } from 'stream';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'dt-web-sites';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const path = searchParams.get('path');
    
    // Validate input
    if (!userId || !path) {
      return NextResponse.json({ error: 'User ID and path are required' }, { status: 400 });
    }
    
    // Check permissions - either admin/manager or the user themselves with file-manager access
    const userRole = session.user.role || 'user';
    const isAdmin = await checkResourceAccess('user-management', userRole);
    const isSelf = session.user.mobileNumber === userId;
    const hasFileManagerAccess = await checkResourceAccess('file-manager', userRole);
    
    if (!isAdmin && (!isSelf || !hasFileManagerAccess)) {
      return NextResponse.json({ error: 'Access denied. You need file manager permissions to read file content.' }, { status: 403 });
    }
    
    // Construct the S3 key
    const key = `sites/${userId}/${path}`.replace(/\/+/g, '/');
    
    // Get file from S3
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const response = await s3Client.send(command);
    
    if (!response.Body) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Convert the readable stream to a string
    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];
    
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    
    const content = Buffer.concat(chunks).toString('utf-8');
    
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error getting S3 file content:', error);
    return NextResponse.json(
      { error: 'Failed to get file content' },
      { status: 500 }
    );
  }
} 