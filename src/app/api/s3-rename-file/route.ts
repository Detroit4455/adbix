import { NextRequest, NextResponse } from 'next/server';
import { S3Client, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { checkResourceAccess } from '@/lib/rbac';
import path from 'path';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'dt-web-sites';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    const { userId, oldPath, newName } = body;
    
    // Validate input
    if (!userId || !oldPath || !newName) {
      return NextResponse.json({ error: 'User ID, old path, and new name are required' }, { status: 400 });
    }
    
    // Check permissions - either admin/manager or the user themselves
    const userRole = session.user.role || 'user';
    const isAdmin = await checkResourceAccess('user-management', userRole);
    const isSelf = session.user.mobileNumber === userId;
    
    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Construct the S3 keys
    const oldKey = `sites/${userId}/${oldPath}`;
    
    // Get the directory path and create the new file path with the new name
    const directory = path.dirname(oldPath);
    const newPath = directory === '.' ? newName : `${directory}/${newName}`;
    const newKey = `sites/${userId}/${newPath}`;
    
    // Don't allow overwriting existing files
    try {
      // First, copy the object to the new location
      const copyCommand = new CopyObjectCommand({
        Bucket: BUCKET_NAME,
        CopySource: `${BUCKET_NAME}/${oldKey}`,
        Key: newKey,
      });
      
      await s3Client.send(copyCommand);
      
      // Then, delete the original object
      const deleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: oldKey,
      });
      
      await s3Client.send(deleteCommand);
      
      return NextResponse.json({ 
        success: true, 
        oldPath, 
        newPath 
      });
    } catch (error) {
      console.error('Error renaming file:', error);
      return NextResponse.json({ error: 'Failed to rename file' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing rename request:', error);
    return NextResponse.json({ error: 'Failed to process rename request' }, { status: 500 });
  }
} 