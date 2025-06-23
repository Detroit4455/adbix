import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { checkResourceAccess } from '@/lib/rbac';

// Initialize S3 client
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
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    const { userId, path, content } = body;
    
    // Validate input
    if (!userId || !path || content === undefined) {
      return NextResponse.json({ error: 'User ID, path, and content are required' }, { status: 400 });
    }
    
    // Check permissions - either admin/manager or the user themselves
    const userRole = session.user.role || 'user';
    const isAdmin = await checkResourceAccess('user-management', userRole);
    const isSelf = session.user.mobileNumber === userId;
    
    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Construct the S3 key
    const key = `sites/${userId}/${path}`;
    
    // Get the existing content type
    let contentType = 'text/plain';
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });
      
      const headResponse = await s3Client.send(headCommand);
      if (headResponse.ContentType) {
        contentType = headResponse.ContentType;
      }
    } catch (error) {
      console.warn('Could not retrieve content type:', error);
      
      // Determine content type from file extension
      if (path.endsWith('.html')) contentType = 'text/html';
      else if (path.endsWith('.css')) contentType = 'text/css';
      else if (path.endsWith('.js')) contentType = 'text/javascript';
      else if (path.endsWith('.json')) contentType = 'application/json';
      else if (path.endsWith('.xml')) contentType = 'application/xml';
      else if (path.endsWith('.svg')) contentType = 'image/svg+xml';
      else if (path.endsWith('.md')) contentType = 'text/markdown';
      else if (path.endsWith('.txt')) contentType = 'text/plain';
    }
    
    // Update file in S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: content,
      ContentType: contentType,
      CacheControl: 'max-age=3600',
    });
    
    await s3Client.send(command);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating file:', error);
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
  }
} 