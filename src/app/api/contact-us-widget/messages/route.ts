import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ContactUsMessageModel } from '@/models/ContactUsWidget';
import connectToDatabase from '@/lib/mongoose';

// GET - Fetch messages for a user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId || session.user.mobileNumber !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase(); // Ensure MongoDB connection
    
    const messages = await ContactUsMessageModel.find({ userId })
      .sort({ submissionTime: -1 })
      .limit(100) // Limit to last 100 messages
      .lean();
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// DELETE - Delete a specific message
export async function DELETE(request: Request) {
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

    await connectToDatabase(); // Ensure MongoDB connection
    
    const result = await ContactUsMessageModel.deleteOne({ 
      _id: messageId, 
      userId 
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
} 