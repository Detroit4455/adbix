import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectMongoose } from '@/lib/db';
import BusinessCategory, { IBusinessCategory } from '@/models/BusinessCategory';

// GET /api/admin/business-categories - Get all business categories
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    // Connect to database
    await connectMongoose();

    // Initialize default categories if none exist
    await BusinessCategory.initializeDefaultCategories();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Build query
    const query = includeInactive ? {} : { isActive: true };

    // Fetch categories
    const categories = await BusinessCategory.find(query)
      .sort({ name: 1 })
      .lean()
      .exec();

    return NextResponse.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('Error fetching business categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business categories' },
      { status: 500 }
    );
  }
}

// POST /api/admin/business-categories - Create new business category
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    // Connect to database
    await connectMongoose();

    // Get request body
    const body = await request.json();
    const { name, description, isActive = true } = body;

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    // Trim and validate name
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json({ error: 'Category name cannot be empty' }, { status: 400 });
    }

    if (trimmedName.length > 100) {
      return NextResponse.json({ error: 'Category name cannot exceed 100 characters' }, { status: 400 });
    }

    // Check if category already exists
    const existingCategory = await BusinessCategory.findOne({ 
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } 
    });

    if (existingCategory) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 409 });
    }

    // Create new category
    const newCategory = new BusinessCategory({
      name: trimmedName,
      description: description?.trim() || '',
      isActive: Boolean(isActive)
    });

    await newCategory.save();

    return NextResponse.json({
      success: true,
      message: 'Business category created successfully',
      category: newCategory
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating business category:', error);
    
    // Handle validation errors
    if ((error as any).name === 'ValidationError') {
      const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
      return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 });
    }

    // Handle duplicate key error
    if ((error as any).code === 11000) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 409 });
    }

    return NextResponse.json(
      { error: 'Failed to create business category' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/business-categories - Update business category
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    // Connect to database
    await connectMongoose();

    // Get request body
    const body = await request.json();
    const { id, name, description, isActive } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    // Trim and validate name
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json({ error: 'Category name cannot be empty' }, { status: 400 });
    }

    if (trimmedName.length > 100) {
      return NextResponse.json({ error: 'Category name cannot exceed 100 characters' }, { status: 400 });
    }

    // Check if category exists
    const existingCategory = await BusinessCategory.findById(id);
    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if name already exists (excluding current category)
    const duplicateCategory = await BusinessCategory.findOne({ 
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      _id: { $ne: id }
    });

    if (duplicateCategory) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 409 });
    }

    // Update category
    const updatedCategory = await BusinessCategory.findByIdAndUpdate(
      id,
      {
        name: trimmedName,
        description: description?.trim() || '',
        isActive: Boolean(isActive)
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Business category updated successfully',
      category: updatedCategory
    });

  } catch (error) {
    console.error('Error updating business category:', error);
    
    // Handle validation errors
    if ((error as any).name === 'ValidationError') {
      const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
      return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 });
    }

    // Handle duplicate key error
    if ((error as any).code === 11000) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 409 });
    }

    return NextResponse.json(
      { error: 'Failed to update business category' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/business-categories - Delete business category
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    // Connect to database
    await connectMongoose();

    // Get category ID from query params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Check if category exists
    const category = await BusinessCategory.findById(id);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Delete the category
    await BusinessCategory.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Business category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting business category:', error);
    return NextResponse.json(
      { error: 'Failed to delete business category' },
      { status: 500 }
    );
  }
}
