import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectMongoose } from '@/lib/db';
import WebTemplate from '@/models/WebTemplate';
import { checkResourceAccess } from '@/lib/rbac';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const isPublic = searchParams.get('isPublic');

    // Build filter object
    const filter: any = {};
    
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
    
    if (isActive !== null && isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    if (isPublic !== null && isPublic !== undefined) {
      filter.isPublic = isPublic === 'true';
    }

    // Get total count
    const total = await WebTemplate.countDocuments(filter);

    // Get templates with pagination
    const templates = await WebTemplate.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      templates,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Templates GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
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

    const body = await request.json();
    const {
      name,
      description,
      businessCategory,
      templateType,
      tags,
      previewImage,
      isActive = true,
      isPublic = true,
      customMobileNumber = null
    } = body;

    // Validate required fields
    if (!name || !description || !businessCategory || !templateType) {
      return NextResponse.json(
        { error: 'Name, description, business category, and template type are required' },
        { status: 400 }
      );
    }

    // Validate custom template fields
    if (!isPublic && !customMobileNumber) {
      return NextResponse.json(
        { error: 'Mobile number is required for custom templates' },
        { status: 400 }
      );
    }

    // Validate mobile number format if provided
    if (customMobileNumber && !/^\d{10}$/.test(customMobileNumber)) {
      return NextResponse.json(
        { error: 'Mobile number must be 10 digits' },
        { status: 400 }
      );
    }

    // Validate business category and template type
    const validCategories = (WebTemplate as any).getBusinessCategories();
    const validTypes = (WebTemplate as any).getTemplateTypes();
    
    if (!validCategories.includes(businessCategory)) {
      return NextResponse.json(
        { error: 'Invalid business category' },
        { status: 400 }
      );
    }
    
    if (!validTypes.includes(templateType)) {
      return NextResponse.json(
        { error: 'Invalid template type' },
        { status: 400 }
      );
    }

    // Generate template ID and S3 path
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const s3Path = `web-templates/${templateId}`;

    // Create new template
    const template = new WebTemplate({
      templateId,
      name: name.trim(),
      description: description.trim(),
      businessCategory,
      templateType,
      tags: tags || [],
      s3Path,
      previewImage,
      isActive,
      isPublic,
      customMobileNumber: customMobileNumber ? customMobileNumber.trim() : null,
      createdBy: session.user.mobileNumber,
      metadata: {
        hasIndexHtml: false,
        fileCount: 0,
        totalSize: 0,
        lastModified: new Date()
      }
    });

    await template.save();

    return NextResponse.json({
      message: 'Template created successfully',
      template: {
        ...template.toObject(),
        templateId
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Template creation error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Template with this name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const {
      templateId,
      name,
      description,
      businessCategory,
      templateType,
      tags,
      previewImage,
      isActive,
      isPublic,
      customMobileNumber
    } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Validate custom template fields if updating visibility
    if (isPublic === false && !customMobileNumber) {
      return NextResponse.json(
        { error: 'Mobile number is required for custom templates' },
        { status: 400 }
      );
    }

    // Validate mobile number format if provided
    if (customMobileNumber && !/^\d{10}$/.test(customMobileNumber)) {
      return NextResponse.json(
        { error: 'Mobile number must be 10 digits' },
        { status: 400 }
      );
    }

    // Find template
    const template = await WebTemplate.findOne({ templateId });
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (name) template.name = name.trim();
    if (description) template.description = description.trim();
    if (businessCategory) template.businessCategory = businessCategory;
    if (templateType) template.templateType = templateType;
    if (tags !== undefined) template.tags = tags;
    if (previewImage !== undefined) template.previewImage = previewImage;
    if (isActive !== undefined) template.isActive = isActive;
    if (isPublic !== undefined) template.isPublic = isPublic;
    if (customMobileNumber !== undefined) {
      template.customMobileNumber = customMobileNumber ? customMobileNumber.trim() : null;
    }

    await template.save();

    return NextResponse.json({
      message: 'Template updated successfully',
      template
    });

  } catch (error) {
    console.error('Template update error:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
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

    // Check admin access
    const userRole = session.user.role || 'user';
    const hasAccess = await checkResourceAccess('website-manager', userRole);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectMongoose();

    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Find and delete template
    const template = await WebTemplate.findOneAndDelete({ templateId });
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // TODO: Also delete files from S3 bucket at template.s3Path
    // This should be implemented based on your S3 deletion logic

    return NextResponse.json({
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Template deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
} 