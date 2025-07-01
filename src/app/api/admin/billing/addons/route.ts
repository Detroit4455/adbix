import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import AdbixAddon from '@/models/AdbixAddon';

export async function GET(request: NextRequest) {
  try {
    // Check authentication - only admin can view all add-ons
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch ALL add-ons (including inactive ones), sorted by display order
    const addons = await AdbixAddon.find({})
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({ 
      success: true, 
      addons: addons.map(addon => ({
        _id: addon._id,
        addonId: addon.addonId,
        name: addon.name,
        description: addon.description,
        price: addon.price,
        currency: addon.currency,
        billingCycle: addon.billingCycle,
        category: addon.category,
        icon: addon.icon,
        isActive: addon.isActive,
        displayOrder: addon.displayOrder,
        requirements: addon.requirements,
        createdAt: addon.createdAt,
        updatedAt: addon.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching admin add-ons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch add-ons' },
      { status: 500 }
    );
  }
} 