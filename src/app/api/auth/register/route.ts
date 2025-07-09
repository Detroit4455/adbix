import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import ServerSettings from '@/models/ServerSettings';

export async function POST(request: Request) {
  try {
    // Check if new user registration is allowed
    const serverSettings = await ServerSettings.getSettings();
    if (!serverSettings.allowNewUserRegistration) {
      return NextResponse.json(
        { error: 'New user registration is currently disabled' },
        { status: 403 }
      );
    }

    const { name, mobileNumber, password } = await request.json();

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
        { error: 'Invalid mobile number format. Please enter a 10-digit number.' },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ mobileNumber });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this mobile number already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.collection('users').insertOne({
      name: name || '',
      mobileNumber,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return NextResponse.json(
      { message: 'User registered successfully', userId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 