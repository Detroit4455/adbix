import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await dbConnect();
    
    // Fetch user profile
    const user = await User.findOne({ mobileNumber: session.user.mobileNumber })
      .select('-password')
      .lean() as any;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Format the response
    const profile = {
      id: user._id.toString(),
      name: user.name || '',
      email: user.email || '',
      mobileNumber: user.mobileNumber,
      role: user.role || 'user',
      businessName: user.businessName || '',
      businessCategory: user.businessCategory || '',
      businessAddress: user.businessAddress || '',
      area: user.area || '',
      pincode: user.pincode || '',
      instagramId: user.instagramId || '',
      instagramUrl: user.instagramUrl || '',
      facebookUrl: user.facebookUrl || '',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { 
      name, 
      email, 
      businessName, 
      businessCategory, 
      businessAddress, 
      area, 
      pincode, 
      instagramId, 
      instagramUrl, 
      facebookUrl 
    } = body;

    // Validate input
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (pincode && !/^[0-9]{6}$/.test(pincode)) {
      return NextResponse.json({ error: 'Pincode must be 6 digits' }, { status: 400 });
    }

    if (instagramUrl && !/^https?:\/\/(www\.)?instagram\.com\//.test(instagramUrl)) {
      return NextResponse.json({ error: 'Invalid Instagram URL' }, { status: 400 });
    }

    if (facebookUrl && !/^https?:\/\/(www\.)?facebook\.com\//.test(facebookUrl)) {
      return NextResponse.json({ error: 'Invalid Facebook URL' }, { status: 400 });
    }

    // Connect to database
    await dbConnect();

    // Update user profile
    const updatedUser = await User.findOneAndUpdate(
      { mobileNumber: session.user.mobileNumber },
      { 
        name: name.trim(), 
        email: email ? email.trim() : undefined,
        businessName: businessName ? businessName.trim() : undefined,
        businessCategory: businessCategory ? businessCategory.trim() : undefined,
        businessAddress: businessAddress ? businessAddress.trim() : undefined,
        area: area ? area.trim() : undefined,
        pincode: pincode ? pincode.trim() : undefined,
        instagramId: instagramId ? instagramId.trim() : undefined,
        instagramUrl: instagramUrl ? instagramUrl.trim() : undefined,
        facebookUrl: facebookUrl ? facebookUrl.trim() : undefined
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password').lean() as any;

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Format the response
    const profile = {
      id: updatedUser._id.toString(),
      name: updatedUser.name || '',
      email: updatedUser.email || '',
      mobileNumber: updatedUser.mobileNumber,
      role: updatedUser.role || 'user',
      businessName: updatedUser.businessName || '',
      businessCategory: updatedUser.businessCategory || '',
      businessAddress: updatedUser.businessAddress || '',
      area: updatedUser.area || '',
      pincode: updatedUser.pincode || '',
      instagramId: updatedUser.instagramId || '',
      instagramUrl: updatedUser.instagramUrl || '',
      facebookUrl: updatedUser.facebookUrl || '',
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    return NextResponse.json({ 
      message: 'Profile updated successfully', 
      profile 
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 