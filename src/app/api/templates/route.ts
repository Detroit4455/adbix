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
    const templateType = searchParams.get('templateType') || 'public'; // New parameter

    // Build filter object based on template type
    const userMobileNumber = session.user.mobileNumber;
    let filter: any = { isActive: true };

    if (templateType === 'public') {
      // Show only public templates
      filter.isPublic = true;
      filter.customMobileNumber = null;
    } else if (templateType === 'private') {
      // Show only private templates for this user
      filter.isPublic = false;
      filter.customMobileNumber = userMobileNumber;
    } else {
      // Default: show both public and private templates for this user
      filter.$or = [
        { isPublic: true, customMobileNumber: null }, // Public templates
        { isPublic: false, customMobileNumber: userMobileNumber } // Custom templates for this user
      ];
    }
    
    if (category && category !== 'all') {
      filter.businessCategory = category;
    }
    
    if (type && type !== 'all') {
      filter.templateType = type;
    }
    
    if (search) {
      const searchFilter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      };
      
      // Combine search filter with existing filter
      if (filter.$or) {
        // If we already have an $or condition, we need to use $and
        filter = {
          $and: [
            { $or: filter.$or },
            searchFilter
          ]
        };
      } else {
        // Otherwise, we can merge the conditions
        filter = { ...filter, ...searchFilter };
      }
    }

    // Get total count
    const total = await WebTemplate.countDocuments(filter);

    // Get templates with pagination
    const templates = await WebTemplate.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('templateId name description businessCategory templateType tags previewImage isPublic customMobileNumber metadata createdAt')
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
      categories: await getAvailableCategories(userMobileNumber, templateType),
      types: await getAvailableTypes(userMobileNumber, templateType)
    });

  } catch (error) {
    console.error('Templates GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// Helper function to get available categories from existing templates
async function getAvailableCategories(userMobileNumber: string, templateType: string) {
  try {
    let filter: any = { isActive: true };

    if (templateType === 'public') {
      filter.isPublic = true;
      filter.customMobileNumber = null;
    } else if (templateType === 'private') {
      filter.isPublic = false;
      filter.customMobileNumber = userMobileNumber;
    } else {
      filter.$or = [
        { isPublic: true, customMobileNumber: null },
        { isPublic: false, customMobileNumber: userMobileNumber }
      ];
    }

    const categories = await WebTemplate.distinct('businessCategory', filter);
    return categories.sort();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Helper function to get available types from existing templates
async function getAvailableTypes(userMobileNumber: string, templateType: string) {
  try {
    let filter: any = { isActive: true };

    if (templateType === 'public') {
      filter.isPublic = true;
      filter.customMobileNumber = null;
    } else if (templateType === 'private') {
      filter.isPublic = false;
      filter.customMobileNumber = userMobileNumber;
    } else {
      filter.$or = [
        { isPublic: true, customMobileNumber: null },
        { isPublic: false, customMobileNumber: userMobileNumber }
      ];
    }

    const types = await WebTemplate.distinct('templateType', filter);
    return types.sort();
  } catch (error) {
    console.error('Error fetching types:', error);
    return [];
  }
} 