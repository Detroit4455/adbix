import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { connectMongoose } from '@/lib/db';
import WebTemplate from '@/models/WebTemplate';
import { checkResourceAccess } from '@/lib/rbac';
import AdmZip from 'adm-zip';
import { IZipEntry } from 'adm-zip';

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
    'webp': 'image/webp'
  };
  
  return contentTypes[extension] || 'application/octet-stream';
}

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

    const formData = await request.formData();
    const zipFile = formData.get('zipFile') as File;
    const templateId = formData.get('templateId') as string;

    if (!zipFile) {
      return NextResponse.json(
        { error: 'No ZIP file uploaded' },
        { status: 400 }
      );
    }

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Check if it's a ZIP file
    if (!zipFile.name.endsWith('.zip')) {
      return NextResponse.json(
        { error: 'The uploaded file is not a ZIP archive' },
        { status: 400 }
      );
    }

    // Find the template in database
    const template = await WebTemplate.findOne({ templateId });
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Path prefix in S3 for this template's files
    const s3PathPrefix = `web-templates/${templateId}/`;
    
    // Convert the uploaded file to a buffer
    const zipBuffer = Buffer.from(await zipFile.arrayBuffer());
    
    // Extract contents of the ZIP file
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    // Check if the ZIP contains index.html (either at root or in a subdirectory)
    const hasIndexHtml = zipEntries.some((entry: IZipEntry) => {
      const entryName = entry.entryName.toLowerCase();
      return entryName === 'index.html' || entryName.endsWith('/index.html');
    });

    if (!hasIndexHtml) {
      return NextResponse.json(
        { error: 'The ZIP file must contain an index.html file' },
        { status: 400 }
      );
    }

    // Check if ZIP has a single root folder that we should strip
    const rootFolders = new Set<string>();
    zipEntries.forEach((entry: IZipEntry) => {
      if (!entry.isDirectory) {
        const parts = entry.entryName.split('/');
        if (parts.length > 1) {
          rootFolders.add(parts[0]);
        }
      }
    });

    const hasSingleRootFolder = rootFolders.size === 1;

    // Track uploaded files for metadata
    let fileCount = 0;
    let totalSize = 0;

    // Process and upload all files to S3
    for (const entry of zipEntries) {
      if (entry.isDirectory) {
        continue; // Skip directory entries
      }
      
      let targetEntryPath = entry.entryName;
      
      // If the ZIP has a single root folder, strip it out
      if (hasSingleRootFolder && rootFolders.size === 1) {
        const rootFolder = Array.from(rootFolders)[0];
        if (entry.entryName.startsWith(rootFolder + '/')) {
          targetEntryPath = entry.entryName.substring(rootFolder.length + 1);
        }
      }
      
      // If the path is empty after stripping, skip it
      if (!targetEntryPath) {
        continue;
      }
      
      // Get the file data
      const entryData = entry.getData();
      
      // Upload to S3
      const s3Key = s3PathPrefix + targetEntryPath;
      
      // Determine content type based on file extension
      const extension = targetEntryPath.split('.').pop()?.toLowerCase() || '';
      const contentType = getContentType(extension);
      
      // Upload the file
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          Body: entryData,
          ContentType: contentType,
        })
      );

      fileCount++;
      totalSize += entryData.length;
    }

    // Update template metadata
    template.metadata.hasIndexHtml = true;
    template.metadata.fileCount = fileCount;
    template.metadata.totalSize = totalSize;
    template.metadata.lastModified = new Date();
    
    await template.save();

    // Generate template preview URL
    const templateUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${s3PathPrefix}index.html`;

    return NextResponse.json({
      message: 'Template uploaded successfully',
      template: {
        templateId,
        templateUrl,
        fileCount,
        totalSize
      }
    });

  } catch (error) {
    console.error('Template upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload template' },
      { status: 500 }
    );
  }
} 