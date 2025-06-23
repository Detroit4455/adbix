import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { mobileNumber, password } = await request.json();

    // Validate input
    if (!mobileNumber || !password) {
      return NextResponse.json(
        { error: 'Mobile number and password are required' },
        { status: 400 }
      );
    }

    // Validate mobile number format
    if (!/^[0-9]{10}$/.test(mobileNumber)) {
      return NextResponse.json(
        { error: 'Invalid mobile number format' },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Find user
    const user = await db.collection('users').findOne({ mobileNumber });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, mobileNumber: user.mobileNumber },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return user data and token
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 