import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
    
    // Process form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const filePath = formData.get('path') as string;
    const preserveFileName = formData.get('preserveFileName') === 'true';
    
    // Validate input
    if (!file || !userId || !filePath) {
      return NextResponse.json({ error: 'File, user ID, and path are required' }, { status: 400 });
    }
    
    // Check permissions - either admin/manager or the user themselves with file-manager access
    const userRole = session.user.role || 'user';
    const isAdmin = await checkResourceAccess('user-management', userRole);
    const isSelf = session.user.mobileNumber === userId;
    const hasFileManagerAccess = await checkResourceAccess('file-manager', userRole);
    
    if (!isAdmin && (!isSelf || !hasFileManagerAccess)) {
      return NextResponse.json({ error: 'Access denied. You need file manager permissions to replace files.' }, { status: 403 });
    }
    
    // Determine content type
    let contentType = file.type || 'application/octet-stream';
    
    if (!contentType || contentType === 'application/octet-stream') {
      // Try to determine from file extension
      if (filePath.endsWith('.html')) contentType = 'text/html';
      else if (filePath.endsWith('.css')) contentType = 'text/css';
      else if (filePath.endsWith('.js')) contentType = 'text/javascript';
      else if (filePath.endsWith('.json')) contentType = 'application/json';
      else if (filePath.endsWith('.xml')) contentType = 'application/xml';
      else if (filePath.endsWith('.svg')) contentType = 'image/svg+xml';
      else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (filePath.endsWith('.png')) contentType = 'image/png';
      else if (filePath.endsWith('.gif')) contentType = 'image/gif';
      else if (filePath.endsWith('.pdf')) contentType = 'application/pdf';
      else if (filePath.endsWith('.txt') || filePath.endsWith('.md')) contentType = 'text/plain';
    }
    
    // Read file content
    const fileBuffer = await file.arrayBuffer();
    
    // Construct the S3 key using the original path to preserve the original file name
    const key = `sites/${userId}/${filePath}`;
    
    console.log('Replacing file:', key);
    console.log('Original file name:', path.basename(filePath));
    console.log('Uploaded file name:', file.name);
    console.log('Content type:', contentType);
    
    // Upload file to S3 with the original path
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: Buffer.from(fileBuffer),
      ContentType: contentType,
      CacheControl: 'max-age=3600',
    });
    
    await s3Client.send(command);
    
    return NextResponse.json({ 
      success: true,
      originalPath: filePath,
      message: `File replaced successfully. Original name (${path.basename(filePath)}) preserved.`
    });
  } catch (error) {
    console.error('Error replacing file:', error);
    return NextResponse.json({ error: 'Failed to replace file' }, { status: 500 });
  }
} 