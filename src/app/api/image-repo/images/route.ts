import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectMongoose } from '@/lib/db';
import Image from '@/models/Image';

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

    // Find images to delete (any user can delete any image)
    const imagesToDelete = await Image.find({
      _id: { $in: imageIds }
    });

    if (imagesToDelete.length === 0) {
      return NextResponse.json({ 
        error: 'No images found to delete' 
      }, { status: 404 });
    }

    // TODO: Delete from S3 as well
    // const { S3Client, DeleteObjectsCommand } = await import('@aws-sdk/client-s3');
    // ... implement S3 deletion

    // Delete from database (any authenticated user can delete any image)
    const deleteResult = await Image.deleteMany({
      _id: { $in: imagesToDelete.map(img => img._id) }
    });

    return NextResponse.json({
      success: true,
      deleted: deleteResult.deletedCount,
      message: `${deleteResult.deletedCount} image(s) deleted successfully`
    });

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