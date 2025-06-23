import { NextResponse } from 'next/server';
import { ContactUsMessageModel } from '@/models/ContactUsWidget';
import connectToDatabase from '@/lib/mongoose';

export async function POST(request: Request) {
  try {
    const { userId, formData } = await request.json();
    
    if (!userId || !formData) {
      return NextResponse.json({ error: 'User ID and form data are required' }, { status: 400 });
    }

    // Get client IP and user agent
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await connectToDatabase(); // Ensure MongoDB connection
    
    // Create new message
    const message = new ContactUsMessageModel({
      userId,
      widgetId: 'contact-us',
      formData,
      submissionTime: new Date(),
      ipAddress,
      userAgent
    });
    
    await message.save();
    
    return NextResponse.json({ success: true, messageId: message._id }, { status: 201 });
  } catch (error) {
    console.error('Error saving contact message:', error);
    return NextResponse.json({ error: 'Failed to submit message' }, { status: 500 });
  }
} 