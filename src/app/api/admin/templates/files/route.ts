import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand } from '@aws-sdk/client-s3';
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

interface S3FileInfo {
  name: string;
  type: string;
  size: number;
  lastModified: string;
  isDirectory?: boolean;
  path: string;
}

// Helper function to determine content type
function getContentType(extension: string): string {
  const contentTypes: { [key: string]: string } = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'xml': 'application/xml',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject',
    'webp': 'image/webp',
    'md': 'text/markdown'
  };
  
  return contentTypes[extension] || 'application/octet-stream';
}

// GET - List template files
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
    const path = searchParams.get('path') || '';

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    await connectMongoose();

    // Verify template exists
    const template = await WebTemplate.findOne({ templateId });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Construct S3 prefix for template files
    const s3Prefix = `web-templates/${templateId}/`;
    const fullPrefix = path ? `${s3Prefix}${path}/` : s3Prefix;

    // List files from S3
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: fullPrefix,
      Delimiter: '/',
    });

    const response = await s3Client.send(listCommand);
    const files: S3FileInfo[] = [];

    // Process directories (common prefixes)
    if (response.CommonPrefixes) {
      for (const prefix of response.CommonPrefixes) {
        if (prefix.Prefix) {
          const dirName = prefix.Prefix.replace(fullPrefix, '').replace('/', '');
          if (dirName) {
            files.push({
              name: dirName,
              type: 'folder',
              size: 0,
              lastModified: new Date().toISOString(),
              isDirectory: true,
              path: path ? `${path}/${dirName}` : dirName
            });
          }
        }
      }
    }

    // Process files
    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.Key && object.Key !== fullPrefix) {
          const fileName = object.Key.replace(fullPrefix, '');
          if (fileName && !fileName.endsWith('/')) {
            const extension = fileName.split('.').pop()?.toLowerCase() || '';
            files.push({
              name: fileName,
              type: extension || 'file',
              size: object.Size || 0,
              lastModified: object.LastModified?.toISOString() || new Date().toISOString(),
              isDirectory: false,
              path: path ? `${path}/${fileName}` : fileName
            });
          }
        }
      }
    }

    return NextResponse.json({ files });

  } catch (error) {
    console.error('Template files GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template files' },
      { status: 500 }
    );
  }
}

// POST - Create folder, upload file, or create new file
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

    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const templateId = formData.get('templateId') as string;
      const path = formData.get('path') as string || '';

      if (!file || !templateId) {
        return NextResponse.json({ error: 'File and template ID are required' }, { status: 400 });
      }

      // Verify template exists
      const template = await WebTemplate.findOne({ templateId });
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      // Upload file to S3
      const s3Key = `web-templates/${templateId}/${path ? `${path}/` : ''}${file.name}`;
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const contentType = getContentType(extension);

      const uploadCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: contentType,
      });

      await s3Client.send(uploadCommand);

      // Update template metadata
      template.metadata.fileCount = (template.metadata.fileCount || 0) + 1;
      template.metadata.totalSize = (template.metadata.totalSize || 0) + file.size;
      template.metadata.lastModified = new Date();
      
      // Check if index.html was uploaded
      if (file.name.toLowerCase() === 'index.html' && !path) {
        template.metadata.hasIndexHtml = true;
      }

      await template.save();

      return NextResponse.json({ message: 'File uploaded successfully' });

    } else {
      // Handle JSON requests (create folder or create file)
      const body = await request.json();
      const { templateId, folderName, fileName, content, path, isNewFile } = body;

      if (!templateId) {
        return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
      }

      // Verify template exists
      const template = await WebTemplate.findOne({ templateId });
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      if (folderName) {
        // Create folder by uploading a placeholder object
        const s3Key = `web-templates/${templateId}/${path ? `${path}/` : ''}${folderName}/.placeholder`;
        
        const uploadCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          Body: Buffer.from(''),
          ContentType: 'text/plain',
        });

        await s3Client.send(uploadCommand);
        return NextResponse.json({ message: 'Folder created successfully' });

      } else if (fileName && content !== undefined) {
        // Create new file
        const s3Key = `web-templates/${templateId}/${path ? `${path}/` : ''}${fileName}`;
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        const contentType = getContentType(extension);

        const uploadCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          Body: Buffer.from(content, 'utf-8'),
          ContentType: contentType,
        });

        await s3Client.send(uploadCommand);

        // Update template metadata
        template.metadata.fileCount = (template.metadata.fileCount || 0) + 1;
        template.metadata.totalSize = (template.metadata.totalSize || 0) + Buffer.byteLength(content, 'utf-8');
        template.metadata.lastModified = new Date();
        
        // Check if index.html was created
        if (fileName.toLowerCase() === 'index.html' && !path) {
          template.metadata.hasIndexHtml = true;
        }

        await template.save();

        return NextResponse.json({ message: 'File created successfully' });

      } else {
        return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
      }
    }

  } catch (error) {
    console.error('Template files POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// DELETE - Delete file or folder
export async function DELETE(request: NextRequest) {
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
    const { templateId, fileName, filePath, isDirectory } = body;

    if (!templateId || !fileName) {
      return NextResponse.json({ error: 'Template ID and file name are required' }, { status: 400 });
    }

    // Verify template exists
    const template = await WebTemplate.findOne({ templateId });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const s3Prefix = `web-templates/${templateId}/`;

    if (isDirectory) {
      // Delete all files in directory
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: `${s3Prefix}${filePath}/`,
      });

      const response = await s3Client.send(listCommand);
      
      if (response.Contents && response.Contents.length > 0) {
        const objectsToDelete = response.Contents.map(obj => ({ Key: obj.Key }));
        
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: objectsToDelete.filter(obj => obj.Key) as { Key: string }[],
          },
        });

        await s3Client.send(deleteCommand);
      }
    } else {
      // Delete single file
      const s3Key = `${s3Prefix}${filePath}`;
      
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
      });

      await s3Client.send(deleteCommand);
    }

    // Update template metadata
    template.metadata.lastModified = new Date();
    
    // Check if index.html was deleted
    if (fileName.toLowerCase() === 'index.html' && !filePath.includes('/')) {
      template.metadata.hasIndexHtml = false;
    }

    await template.save();

    return NextResponse.json({ message: `${isDirectory ? 'Folder' : 'File'} deleted successfully` });

  } catch (error) {
    console.error('Template files DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
} 