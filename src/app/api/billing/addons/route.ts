import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import AdbixAddon from '@/models/AdbixAddon';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch active add-ons, sorted by display order
    const addons = await AdbixAddon.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({ 
      success: true, 
      addons: addons.map(addon => ({
        id: addon._id,
        addonId: addon.addonId,
        name: addon.name,
        description: addon.description,
        price: addon.price,
        currency: addon.currency,
        billingCycle: addon.billingCycle,
        category: addon.category,
        icon: addon.icon,
        requirements: addon.requirements,
        displayOrder: addon.displayOrder
      }))
    });

  } catch (error) {
    console.error('Error fetching add-ons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch add-ons' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication - only admin can create add-ons
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const addonData = await request.json();
    
    // Validate required fields
    const { addonId, name, description, price } = addonData;
    if (!addonId || !name || !description || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: addonId, name, description, price' },
        { status: 400 }
      );
    }

    // Ensure dates are stored as ISODate
    const newAddon = new AdbixAddon({
      ...addonData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await newAddon.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Add-on created successfully',
      addon: newAddon
    });

  } catch (error: any) {
    console.error('Error creating add-on:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Add-on ID already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create add-on' },
      { status: 500 }
    );
  }
} 