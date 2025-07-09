import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectMongoose } from '@/lib/db';
import Image from '@/models/Image';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';

    // Connect to database
    await connectMongoose();

    // Build query - Now showing all images to all users
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { fileName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type && type !== 'all') {
      query.type = type;
    }

    // Get total count for pagination
    const total = await Image.countDocuments(query);
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Fetch images
    const images = await Image.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v')
      .lean();

    // Format the response
    const formattedImages = images.map(image => ({
      id: image._id,
      name: image.name,
      type: image.type,
      description: image.description,
      fileName: image.fileName,
      s3Url: image.s3Url,
      size: image.size,
      width: image.width,
      height: image.height,
      formattedSize: formatFileSize(image.size),
      mimeType: image.mimeType,
      uploadedBy: image.uploadedBy,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt
    }));

    return NextResponse.json({
      success: true,
      images: formattedImages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access - only admins can delete images from repository
    const userRole = session.user.role || 'user';
    if (userRole !== 'admin') {
      return NextResponse.json({ 
        error: 'Access denied. Only administrators can delete images from the repository.' 
      }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { imageIds } = body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json({ 
        error: 'Image IDs array is required' 
      }, { status: 400 });
    }

    // Connect to database
    await connectMongoose();

    // Find images to delete
    const imagesToDelete = await Image.find({
      _id: { $in: imageIds }
    });

    if (imagesToDelete.length === 0) {
      return NextResponse.json({ 
        error: 'No images found to delete' 
      }, { status: 404 });
    }

    console.log(`Admin ${session.user.mobileNumber} attempting to delete ${imagesToDelete.length} image(s)`);

    // Track deletion results
    const deletionResults = {
      s3Deleted: 0,
      s3Errors: [] as string[],
      dbDeleted: 0,
      total: imagesToDelete.length
    };

    // Delete from S3 first
    for (const image of imagesToDelete) {
      try {
        if (image.s3Key) {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: image.s3Key,
          });
          
          await s3Client.send(deleteCommand);
          deletionResults.s3Deleted++;
          console.log(`Successfully deleted S3 object: ${image.s3Key}`);
        }
      } catch (s3Error) {
        console.error(`Failed to delete S3 object ${image.s3Key}:`, s3Error);
        deletionResults.s3Errors.push(`${image.name}: ${s3Error instanceof Error ? s3Error.message : 'S3 deletion failed'}`);
      }
    }

    // Delete from database
    const deleteResult = await Image.deleteMany({
      _id: { $in: imagesToDelete.map(img => img._id) }
    });

    deletionResults.dbDeleted = deleteResult.deletedCount;

    // Prepare response
    const responseData: any = {
      success: true,
      deleted: deletionResults.dbDeleted,
      message: `${deletionResults.dbDeleted} image(s) deleted from database`,
      details: {
        s3Deleted: deletionResults.s3Deleted,
        dbDeleted: deletionResults.dbDeleted,
        total: deletionResults.total
      }
    };

    // Include S3 errors if any
    if (deletionResults.s3Errors.length > 0) {
      responseData.warnings = deletionResults.s3Errors;
      responseData.message += `, but some S3 files could not be deleted`;
    }

    console.log(`Deletion completed: ${deletionResults.dbDeleted} DB records, ${deletionResults.s3Deleted} S3 objects`);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error deleting images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 