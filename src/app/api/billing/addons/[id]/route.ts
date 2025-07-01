import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import AdbixAddon from '@/models/AdbixAddon';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const addon = await AdbixAddon.findById(params.id);
    
    if (!addon) {
      return NextResponse.json({ error: 'Add-on not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      addon 
    });

  } catch (error) {
    console.error('Error fetching add-on:', error);
    return NextResponse.json(
      { error: 'Failed to fetch add-on' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication - only admin can update add-ons
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

    // Ensure updatedAt is stored as ISODate
    const updatedAddon = await AdbixAddon.findByIdAndUpdate(
      params.id,
      {
        ...addonData,
        updatedAt: new Date().toISOString()
      },
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!updatedAddon) {
      return NextResponse.json({ error: 'Add-on not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Add-on updated successfully',
      addon: updatedAddon
    });

  } catch (error: any) {
    console.error('Error updating add-on:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Add-on ID already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update add-on' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication - only admin can delete add-ons
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const deletedAddon = await AdbixAddon.findByIdAndDelete(params.id);

    if (!deletedAddon) {
      return NextResponse.json({ error: 'Add-on not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Add-on deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting add-on:', error);
    return NextResponse.json(
      { error: 'Failed to delete add-on' },
      { status: 500 }
    );
  }
} 