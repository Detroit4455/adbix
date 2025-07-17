import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { S3Client, CopyObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import { connectMongoose } from '@/lib/db';
import WebTemplate from '@/models/WebTemplate';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const bucketName = process.env.AWS_S3_BUCKET_NAME || 'dt-web-sites';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.mobileNumber) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoose();

    const body = await request.json();
    const { templateId, replaceExisting = false } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Find the template
    const template = await WebTemplate.findOne({
      templateId,
      isActive: true,
      $or: [
        { isPublic: true, customMobileNumber: null },
        { isPublic: false, customMobileNumber: session.user.mobileNumber }
      ]
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found or not available' },
        { status: 404 }
      );
    }

    const userId = session.user.mobileNumber;
    const templatePath = `web-templates/${templateId}/`;
    const userSitePath = `sites/${userId}/`;

    // Check if user already has a website
    const existingFiles: ListObjectsV2CommandOutput = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: userSitePath,
        MaxKeys: 1,
      })
    );

    if (existingFiles.Contents && existingFiles.Contents.length > 0 && !replaceExisting) {
      return NextResponse.json({
        error: 'You already have a website. Set replaceExisting to true to replace it.',
        hasExistingWebsite: true
      }, { status: 409 });
    }

    // If replacing existing, delete current website files
    if (replaceExisting && existingFiles.Contents && existingFiles.Contents.length > 0) {
      const objectsToDelete = existingFiles.Contents.map(obj => ({ Key: obj.Key }));
      
      // Get all objects to delete
      let nextToken = existingFiles.NextContinuationToken;
      while (nextToken) {
        const moreFiles: ListObjectsV2CommandOutput = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: userSitePath,
            ContinuationToken: nextToken,
          })
        );
        
        if (moreFiles.Contents) {
          objectsToDelete.push(...moreFiles.Contents.map(obj => ({ Key: obj.Key })));
        }
        
        nextToken = moreFiles.NextContinuationToken;
      }

      // Delete existing files in batches (AWS limit is 1000 per request)
      if (objectsToDelete.length > 0) {
        const batchSize = 1000;
        for (let i = 0; i < objectsToDelete.length; i += batchSize) {
          const batch = objectsToDelete.slice(i, i + batchSize);
          await s3Client.send(
            new DeleteObjectsCommand({
              Bucket: bucketName,
              Delete: {
                Objects: batch.filter(obj => obj.Key) as { Key: string }[],
              },
            })
          );
        }
      }
    }

    // List all files in the template directory
    let templateFiles: any[] = [];
    let nextToken: string | undefined = undefined;

    do {
      const listCommand: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: templatePath,
        ContinuationToken: nextToken,
      });

      const listResponse: ListObjectsV2CommandOutput = await s3Client.send(listCommand);
      
      if (listResponse.Contents) {
        templateFiles.push(...listResponse.Contents);
      }
      
      nextToken = listResponse.NextContinuationToken;
    } while (nextToken);

    if (templateFiles.length === 0) {
      return NextResponse.json(
        { error: 'Template has no files to deploy' },
        { status: 400 }
      );
    }

    // Copy each template file to user's site directory
    let copiedFiles = 0;
    console.log(`Starting to copy ${templateFiles.length} files from template ${templateId} to user ${userId}`);
    
    const copyPromises = templateFiles.map(async (file) => {
      if (!file.Key) return;

      // Extract the relative path within the template
      const relativePath = file.Key.substring(templatePath.length);
      
      // Skip if it's just the directory marker or empty
      if (!relativePath || relativePath.endsWith('/')) {
        console.log(`Skipping directory marker: ${file.Key}`);
        return;
      }

      const sourceKey = file.Key;
      const destinationKey = `${userSitePath}${relativePath}`;
      
      console.log(`Copying: ${sourceKey} -> ${destinationKey}`);

      try {
        await s3Client.send(
          new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${sourceKey}`,
            Key: destinationKey,
          })
        );
        copiedFiles++;
        console.log(`Successfully copied: ${relativePath}`);
      } catch (copyError) {
        console.error(`Error copying ${sourceKey} to ${destinationKey}:`, copyError);
        throw new Error(`Failed to copy file: ${relativePath}`);
      }
    });

    // Wait for all copy operations to complete
    await Promise.all(copyPromises);

    // Generate user's website URL
    const websiteUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${userSitePath}index.html`;

    // CloudFront URL if available
    const cloudFrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_CLOUDFRONT_BASE_URL}/${userSitePath}index.html`
      : null;

    return NextResponse.json({
      message: 'Template deployed successfully to your website',
      templateName: template.name,
      templateId: template.templateId,
      filesDeployed: copiedFiles,
      websiteUrl,
      cloudFrontUrl,
      previewUrl: `/site/${userId}/index.html`
    });

  } catch (error) {
    console.error('Template deployment error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to deploy template'
      },
      { status: 500 }
    );
  }
} 