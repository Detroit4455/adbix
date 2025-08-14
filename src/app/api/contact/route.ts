import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { name, email, mobile, subject, message } = await request.json();
    
    // Validate input
    if (!name || !mobile || !subject || !message) {
      return NextResponse.json(
        { error: 'Name, mobile number, subject, and message are required' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    
    // Insert the contact form submission
    const result = await db.collection('contacts').insertOne({
      name,
      email: email || null, // Store as null if not provided
      mobile,
      subject,
      message,
      createdAt: new Date(),
    });
    
    return NextResponse.json(
      { success: true, id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    );
  }
} 