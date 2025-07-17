import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { ContactUsMessageModel } from '@/models/ContactUsWidget';
import connectToDatabase from '@/lib/mongoose';

// PATCH - Mark message as read/unread
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const userId = searchParams.get('userId');
    
    if (!messageId || !userId || session.user.mobileNumber !== userId) {
      return NextResponse.json({ error: 'Unauthorized or invalid parameters' }, { status: 401 });
    }

    const body = await request.json();
    const { isRead } = body;

    if (typeof isRead !== 'boolean') {
      return NextResponse.json({ error: 'isRead must be a boolean' }, { status: 400 });
    }

    await connectToDatabase();
    
    const result = await ContactUsMessageModel.updateOne(
      { _id: messageId, userId },
      { isRead }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, isRead });
  } catch (error) {
    console.error('Error updating message read status:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
} 