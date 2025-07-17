import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectMongoose } from '@/lib/db';
import WebTemplate from '@/models/WebTemplate';

export async function GET(request: NextRequest) {
  try {
    // Check authentication - users need to be logged in to see templates
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoose();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    // Build filter object - show public templates and custom templates for this user
    const userMobileNumber = session.user.mobileNumber;
    const filter: any = {
      isActive: true,
      $or: [
        { isPublic: true, customMobileNumber: null }, // Public templates
        { isPublic: false, customMobileNumber: userMobileNumber } // Custom templates for this user
      ]
    };
    
    if (category && category !== 'all') {
      filter.businessCategory = category;
    }
    
    if (type && type !== 'all') {
      filter.templateType = type;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Get total count
    const total = await WebTemplate.countDocuments(filter);

    // Get templates with pagination
    const templates = await WebTemplate.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('templateId name description businessCategory templateType tags previewImage metadata createdAt')
      .lean();

    // Add template URLs to each template
    const templatesWithUrls = templates.map(template => ({
      ...template,
      previewUrl: template.metadata.hasIndexHtml 
        ? `https://${process.env.AWS_S3_BUCKET_NAME || 'dt-web-sites'}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/web-templates/${template.templateId}/index.html`
        : null
    }));

    return NextResponse.json({
      templates: templatesWithUrls,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      categories: await getAvailableCategories(userMobileNumber),
      types: await getAvailableTypes(userMobileNumber)
    });

  } catch (error) {
    console.error('Public templates GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// Helper function to get available categories from existing templates
async function getAvailableCategories(userMobileNumber: string) {
  try {
    const filter = {
      isActive: true,
      $or: [
        { isPublic: true, customMobileNumber: null }, // Public templates
        { isPublic: false, customMobileNumber: userMobileNumber } // Custom templates for this user
      ]
    };
    const categories = await WebTemplate.distinct('businessCategory', filter);
    return categories.sort();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Helper function to get available types from existing templates
async function getAvailableTypes(userMobileNumber: string) {
  try {
    const filter = {
      isActive: true,
      $or: [
        { isPublic: true, customMobileNumber: null }, // Public templates
        { isPublic: false, customMobileNumber: userMobileNumber } // Custom templates for this user
      ]
    };
    const types = await WebTemplate.distinct('templateType', filter);
    return types.sort();
  } catch (error) {
    console.error('Error fetching types:', error);
    return [];
  }
} 