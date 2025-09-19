import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, DeleteObjectsCommand, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
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
    const path = searchParams.get('path') || '';
    
    // Validate input
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Check permissions - either admin/manager or the user themselves with file-manager access
    const userRole = session.user.role || 'user';
    const isAdmin = await checkResourceAccess('user-management', userRole);
    const isSelf = session.user.mobileNumber === userId;
    const hasFileManagerAccess = await checkResourceAccess('file-manager', userRole);
    
    if (!isAdmin && (!isSelf || !hasFileManagerAccess)) {
      return NextResponse.json({ error: 'Access denied. You need file manager permissions to access files.' }, { status: 403 });
    }
    
    // Construct the S3 prefix
    const prefix = `sites/${userId}/${path}`.replace(/\/+/g, '/');
    
    // List objects from S3
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      Delimiter: '/',
    });
    
    const response = await s3Client.send(command);
    
    // Process and format the response
    const files = [];
    
    // Process common prefixes (directories)
    if (response.CommonPrefixes && response.CommonPrefixes.length > 0) {
      for (const prefix of response.CommonPrefixes) {
        if (prefix.Prefix) {
          const folderPath = prefix.Prefix.replace(`sites/${userId}/`, '');
          files.push({
            name: folderPath.split('/').filter(Boolean).pop() || '',
            type: 'directory',
            size: 0,
            lastModified: new Date().toISOString(),
            isDirectory: true,
            path: folderPath,
          });
        }
      }
    }
    
    // Process objects (files)
    if (response.Contents && response.Contents.length > 0) {
      for (const item of response.Contents) {
        // Skip the directory itself or items that match the prefix exactly
        if (item.Key === prefix || !item.Key) continue;
        
        const name = item.Key.split('/').pop() || '';
        const relativePath = item.Key.replace(`sites/${userId}/`, '');
        
        files.push({
          name,
          size: item.Size || 0,
          lastModified: item.LastModified?.toISOString() || new Date().toISOString(),
          type: 'file',
          path: relativePath,
        });
      }
    }
    
    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error listing S3 files:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const userId = formData.get('userId') as string;
      const path = formData.get('path') as string;

      if (!file || !userId) {
        return NextResponse.json({ error: 'File and user ID are required' }, { status: 400 });
      }

      // Check permissions - either admin/manager or the user themselves with file-manager access
      const userRole = session.user.role || 'user';
      const isAdmin = await checkResourceAccess('user-management', userRole);
      const isSelf = session.user.mobileNumber === userId;
      const hasFileManagerAccess = await checkResourceAccess('file-manager', userRole);
      
      if (!isAdmin && (!isSelf || !hasFileManagerAccess)) {
        return NextResponse.json({ error: 'Access denied. You need file manager permissions to upload files.' }, { status: 403 });
      }

      const fileBuffer = await file.arrayBuffer();
      const key = `sites/${userId}/${path ? path + '/' : ''}${file.name}`.replace(/\/+/g, '/');

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: Buffer.from(fileBuffer),
        ContentType: file.type,
      });

      await s3Client.send(command);
      return NextResponse.json({ success: true });
    } else {
      // Handle folder creation or file content update
      const body = await request.json();
      const { folderName, userId, path, content, fileName, isUpdate } = body;

      if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
      }

      // Check permissions - either admin/manager or the user themselves with file-manager access
      const userRole = session.user.role || 'user';
      const isAdmin = await checkResourceAccess('user-management', userRole);
      const isSelf = session.user.mobileNumber === userId;
      const hasFileManagerAccess = await checkResourceAccess('file-manager', userRole);
      
      if (!isAdmin && (!isSelf || !hasFileManagerAccess)) {
        return NextResponse.json({ error: 'Access denied. You need file manager permissions to create files/folders.' }, { status: 403 });
      }

      if (folderName) {
        // Handle folder creation
        if (!folderName) {
          return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
        }

        const key = `sites/${userId}/${path ? path + '/' : ''}${folderName}/`.replace(/\/+/g, '/');

        const command = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: '',
        });

        await s3Client.send(command);
        return NextResponse.json({ success: true });
      } else if (content !== undefined && fileName) {
        // Handle file content update
        const key = `sites/${userId}/${path ? path + '/' : ''}${fileName}`.replace(/\/+/g, '/');
        const contentType = getContentType(fileName);

        // If this is an update, first check if the file exists
        if (isUpdate) {
          try {
            const headCommand = new HeadObjectCommand({
              Bucket: BUCKET_NAME,
              Key: key,
            });
            await s3Client.send(headCommand);
          } catch (error) {
            // If the file doesn't exist, return an error
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
          }
        }

        const command = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: content,
          ContentType: contentType,
        });

        await s3Client.send(command);
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
      }
    }
  } catch (error) {
    console.error('Error in S3 file operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform file operation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, userId, path, isDirectory } = await request.json();

    console.log('DELETE request received:', { fileName, userId, path, isDirectory });

    if (!fileName || !userId) {
      return NextResponse.json({ error: 'File name and user ID are required' }, { status: 400 });
    }

    // Check permissions - either admin/manager or the user themselves with file-manager access
    const userRole = session.user.role || 'user';
    const isAdmin = await checkResourceAccess('user-management', userRole);
    const isSelf = session.user.mobileNumber === userId;
    const hasFileManagerAccess = await checkResourceAccess('file-manager', userRole);
    
    if (!isAdmin && (!isSelf || !hasFileManagerAccess)) {
      return NextResponse.json({ error: 'Access denied. You need file manager permissions to manage files.' }, { status: 403 });
    }

    // If deleting a folder, recursively delete all objects under the prefix (with pagination and batching)
    if (isDirectory) {
      const prefix = `sites/${userId}/${path ? path + '/' : ''}${fileName}/`.replace(/\/+/g, '/');
      console.log('Deleting directory with prefix:', prefix);
      
      let isTruncated = true;
      let continuationToken: string | undefined = undefined;
      while (isTruncated) {
        const listCommand = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        });
        const listedObjects: ListObjectsV2CommandOutput = await s3Client.send(listCommand);
        console.log('Listed objects in directory:', listedObjects.Contents?.length || 0);
        
        if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
          break;
        }
        // Batch delete up to 1000 objects at a time
        const objectsToDelete = listedObjects.Contents.map((obj: { Key?: string }) => ({ Key: obj.Key! }));
        console.log('Deleting objects:', objectsToDelete.map(obj => obj.Key));
        
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: BUCKET_NAME,
          Delete: { Objects: objectsToDelete },
        });
        await s3Client.send(deleteCommand);
        isTruncated = !!listedObjects.IsTruncated;
        continuationToken = listedObjects.NextContinuationToken;
      }
      // Also attempt to delete the folder placeholder object itself
      const folderKey = prefix.replace(/\/+/g, '/');
      console.log('Deleting folder placeholder:', folderKey);
      
      const folderDeleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: folderKey,
      });
      try {
        await s3Client.send(folderDeleteCommand);
      } catch (e) {
        console.log('Folder placeholder not found or already deleted');
        // Ignore error if the folder key does not exist
      }
      return NextResponse.json({ success: true });
    }

    // Otherwise, delete a single file
    const key = `sites/${userId}/${path ? path + '/' : ''}${fileName}`.replace(/\/+/g, '/');
    console.log('Deleting file with key:', key);
    
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting S3 file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}

function getContentType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const contentTypes: { [key: string]: string } = {
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'xml': 'application/xml',
    'zip': 'application/zip',
  };

  return contentTypes[extension || ''] || 'application/octet-stream';
} 