import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { connectMongoose } from '@/lib/db';
import Image from '@/models/Image';
import { randomUUID } from 'crypto';
import sizeOf from 'image-size';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'dt-web-sites';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const names = formData.getAll('names') as string[];
    const types = formData.getAll('types') as string[];
    const descriptions = formData.getAll('descriptions') as string[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    // Validate that we have corresponding metadata for each file
    if (files.length !== names.length || files.length !== types.length || files.length !== descriptions.length) {
      return NextResponse.json({ 
        error: 'Mismatch between number of files and metadata entries' 
      }, { status: 400 });
    }

    const uploadResults = [];
    const errors = [];

    // Connect to database
    await connectMongoose();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const name = names[i];
      const type = types[i];
      const description = descriptions[i];

      try {
        // Validate file
        if (!file || file.size === 0) {
          errors.push({ file: name, error: 'Invalid file' });
          continue;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          errors.push({ 
            file: name, 
            error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
          });
          continue;
        }

        // Check MIME type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          errors.push({ 
            file: name, 
            error: 'Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG images are allowed' 
          });
          continue;
        }

        // Validate metadata
        if (!name || !type) {
          errors.push({ file: file.name, error: 'Name and type are required' });
          continue;
        }

        // Generate unique file name to prevent collisions
        const fileExtension = file.name.split('.').pop() || '';
        const uniqueFileName = `${randomUUID()}.${fileExtension}`;
        
        // Construct S3 key
        const s3Key = `imagerepo/${uniqueFileName}`;
        
        // Convert file to buffer
        const fileBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(fileBuffer);
        
        // Extract image dimensions
        let width: number | undefined;
        let height: number | undefined;
        
        try {
          if (file.type !== 'image/svg+xml') { // Skip SVG as it might not have fixed dimensions
            const dimensions = sizeOf(buffer);
            width = dimensions.width;
            height = dimensions.height;
          }
        } catch (error) {
          console.warn(`Could not extract dimensions for ${file.name}:`, error);
        }
        
        // Upload to S3
        const uploadCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: buffer,
          ContentType: file.type,
          Metadata: {
            'original-name': file.name,
            'uploaded-by': session.user.mobileNumber || '',
            'upload-timestamp': new Date().toISOString()
          }
        });

        await s3Client.send(uploadCommand);
        
        // Generate S3 URL
        const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${s3Key}`;
        
        // Save metadata to database
        const imageDoc = new Image({
          name: name.trim(),
          type: type,
          description: description?.trim() || '',
          fileName: file.name,
          s3Key: s3Key,
          s3Url: s3Url,
          size: file.size,
          width: width,
          height: height,
          mimeType: file.type,
          uploadedBy: session.user.mobileNumber
        });

        const savedImage = await imageDoc.save();
        
        uploadResults.push({
          id: savedImage._id,
          name: savedImage.name,
          type: savedImage.type,
          description: savedImage.description,
          fileName: savedImage.fileName,
          s3Url: savedImage.s3Url,
          size: savedImage.size,
          formattedSize: savedImage.formattedSize,
          mimeType: savedImage.mimeType,
          createdAt: savedImage.createdAt
        });

      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        errors.push({ 
          file: file.name, 
          error: error instanceof Error ? error.message : 'Upload failed' 
        });
      }
    }

    // Return results
    const response: any = {
      success: uploadResults.length > 0,
      uploaded: uploadResults.length,
      total: files.length,
      results: uploadResults
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    const statusCode = uploadResults.length > 0 ? 200 : 400;
    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 