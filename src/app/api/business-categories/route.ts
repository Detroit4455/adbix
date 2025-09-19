import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectMongoose } from '@/lib/db';
import BusinessCategory from '@/models/BusinessCategory';

// GET /api/business-categories - Get active business categories for public use
export async function GET(request: NextRequest) {
  try {
    // Check authentication (user must be logged in)
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectMongoose();

    // Initialize default categories if none exist
    await BusinessCategory.initializeDefaultCategories();

    // Fetch only active categories for dropdown
    const categories = await BusinessCategory.find({ isActive: true })
      .select('name description')
      .sort({ name: 1 })
      .lean()
      .exec();

    return NextResponse.json({
      success: true,
      categories: categories.map(cat => ({
        id: cat._id,
        name: cat.name,
        description: cat.description
      }))
    });

  } catch (error) {
    console.error('Error fetching business categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business categories' },
      { status: 500 }
    );
  }
}
