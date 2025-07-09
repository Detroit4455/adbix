import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { connectMongoose } from '@/lib/db';
import WebTemplate from '@/models/WebTemplate';
import { checkResourceAccess } from '@/lib/rbac';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const bucketName = process.env.AWS_S3_BUCKET_NAME || 'dt-web-sites';

// Helper function to determine content type
function getContentType(extension: string): string {
  const contentTypes: { [key: string]: string } = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'txt': 'text/plain',
    'xml': 'application/xml',
    'svg': 'image/svg+xml',
    'md': 'text/markdown'
  };
  
  return contentTypes[extension] || 'text/plain';
}

// GET - Fetch template file content
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access
    const userRole = session.user.role || 'user';
    const hasAccess = await checkResourceAccess('website-manager', userRole);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get('templateId');
    const fileName = searchParams.get('fileName');

    if (!templateId || !fileName) {
      return NextResponse.json({ error: 'Template ID and file name are required' }, { status: 400 });
    }

    await connectMongoose();

    // Verify template exists
    const template = await WebTemplate.findOne({ templateId });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Construct S3 key for the file
    const s3Key = `web-templates/${templateId}/${fileName}`;

    try {
      // Fetch file content from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
      });

      const response = await s3Client.send(getObjectCommand);
      
      if (!response.Body) {
        return NextResponse.json({ error: 'File content not found' }, { status: 404 });
      }

      // Convert stream to string
      const content = await response.Body.transformToString();

      return NextResponse.json({
        content,
        fileName,
        templateId
      });

    } catch (s3Error: any) {
      if (s3Error.name === 'NoSuchKey') {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      throw s3Error;
    }

  } catch (error) {
    console.error('Template file content GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template file content' },
      { status: 500 }
    );
  }
}

// POST - Save template file content
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access
    const userRole = session.user.role || 'user';
    const hasAccess = await checkResourceAccess('website-manager', userRole);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectMongoose();

    const body = await request.json();
    const { templateId, fileName, content } = body;

    if (!templateId || !fileName || content === undefined) {
      return NextResponse.json({ error: 'Template ID, file name, and content are required' }, { status: 400 });
    }

    // Verify template exists
    const template = await WebTemplate.findOne({ templateId });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Construct S3 key for the file
    const s3Key = `web-templates/${templateId}/${fileName}`;

    // Determine content type based on file extension
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const contentType = getContentType(extension);

    // Save file content to S3
    const putObjectCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: Buffer.from(content, 'utf-8'),
      ContentType: contentType,
    });

    await s3Client.send(putObjectCommand);

    // Update template metadata
    template.metadata.lastModified = new Date();
    
    // Check if index.html was updated
    if (fileName.toLowerCase() === 'index.html' && !fileName.includes('/')) {
      template.metadata.hasIndexHtml = true;
    }

    await template.save();

    return NextResponse.json({
      message: 'Template file saved successfully',
      templateId,
      fileName
    });

  } catch (error) {
    console.error('Template file content POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save template file content' },
      { status: 500 }
    );
  }
} 