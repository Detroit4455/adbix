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

    // Connect to database
    await connectMongoose();

    // Get basic statistics - Now showing global stats for all images
    const stats = await Image.aggregate([
      {
        $group: {
          _id: null,
          totalImages: { $sum: 1 },
          totalSize: { $sum: '$size' },
          averageSize: { $avg: '$size' },
          typeBreakdown: {
            $push: '$type'
          },
          mimeTypeBreakdown: {
            $push: '$mimeType'
          }
        }
      }
    ]);

    // Get type statistics - Global stats
    const typeStats = await Image.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get recent uploads (last 7 days) - Global stats
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentStats = await Image.aggregate([
      { 
        $match: { 
          createdAt: { $gte: sevenDaysAgo }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          size: { $sum: '$size' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Format the response
    const basicStats = stats[0] || {
      totalImages: 0,
      totalSize: 0,
      averageSize: 0
    };

    const formattedTypeStats = typeStats.map(stat => ({
      type: stat._id,
      count: stat.count,
      totalSize: stat.totalSize,
      formattedSize: formatFileSize(stat.totalSize)
    }));

    const formattedRecentStats = recentStats.map(stat => ({
      date: new Date(stat._id.year, stat._id.month - 1, stat._id.day).toISOString().split('T')[0],
      count: stat.count,
      size: stat.size,
      formattedSize: formatFileSize(stat.size)
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalImages: basicStats.totalImages,
        totalSize: basicStats.totalSize,
        formattedTotalSize: formatFileSize(basicStats.totalSize),
        averageSize: Math.round(basicStats.averageSize || 0),
        formattedAverageSize: formatFileSize(Math.round(basicStats.averageSize || 0)),
        typeBreakdown: formattedTypeStats,
        recentUploads: formattedRecentStats
      }
    });

  } catch (error) {
    console.error('Error fetching image statistics:', error);
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