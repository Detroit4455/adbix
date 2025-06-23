import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { S3Client, PutObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import AdmZip from 'adm-zip';
import { IZipEntry } from 'adm-zip';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const bucketName = process.env.AWS_S3_BUCKET_NAME || 'dt-web-sites';

export async function POST(request: NextRequest) {
  try {
    // Get the user's session with authOptions
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.mobileNumber) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to upload files' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const zipFile = formData.get('zipFile') as File;

    if (!zipFile) {
      return NextResponse.json(
        { error: 'No ZIP file uploaded' },
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

    // Path prefix in S3 for this user's files
    const s3PathPrefix = `sites/${session.user.mobileNumber}/`;
    
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
        { error: 'The ZIP must contain an index.html file' },
        { status: 400 }
      );
    }

    // Detect if the ZIP has a single root folder containing all files
    const rootFolders = new Set<string>();
    let hasSingleRootFolder = true;
    
    for (const entry of zipEntries) {
      const pathParts = entry.entryName.split('/');
      
      // Skip empty entries (can happen with some ZIP tools)
      if (pathParts.length === 0 || (pathParts.length === 1 && pathParts[0] === '')) {
        continue;
      }
      
      rootFolders.add(pathParts[0]);
      
      // If we have more than one root folder, or files directly at the root
      if (rootFolders.size > 1 || (pathParts.length === 1 && !entry.isDirectory)) {
        hasSingleRootFolder = false;
        break;
      }
    }

    // Get list of current objects to delete (if any)
    try {
      // First, delete any existing files for this user
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: [{ Key: s3PathPrefix }]
        },
      });
      
      await s3Client.send(deleteCommand);
    } catch (error) {
      // Ignore errors - there might not be any files to delete
      console.log("No previous files to delete or deletion error:", error);
    }

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
      
      // Get the file data (no modification needed)
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
    }

    // Generate S3 website URL
    const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3PathPrefix}index.html`;

    return NextResponse.json({
      message: 'Website ZIP uploaded to S3 successfully',
      s3Url: s3Url
    });
  } catch (error) {
    console.error('S3 ZIP upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process ZIP file for S3 upload' },
      { status: 500 }
    );
  }
}

// Helper function to determine content type based on file extension
function getContentType(extension: string): string {
  const contentTypes: Record<string, string> = {
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
    'ico': 'image/x-icon',
    'txt': 'text/plain',
    'pdf': 'application/pdf',
    'xml': 'application/xml',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'font/eot',
    'otf': 'font/otf'
  };

  return contentTypes[extension] || 'application/octet-stream';
} 