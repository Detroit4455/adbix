import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ContactUsMessageModel } from '@/models/ContactUsWidget';
import connectToDatabase from '@/lib/mongoose';

// GET - Fetch messages for a user with pagination and search
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    if (!userId || session.user.mobileNumber !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase(); // Ensure MongoDB connection
    
    // Build search query
    const baseQuery = { userId };
    let searchQuery: any = baseQuery;
    
    if (search) {
      // Search in formData fields (name, email, message, etc.)
      searchQuery = {
        ...baseQuery,
        $or: [
          { 'formData.name': { $regex: search, $options: 'i' } },
          { 'formData.email': { $regex: search, $options: 'i' } },
          { 'formData.message': { $regex: search, $options: 'i' } },
          { 'formData.subject': { $regex: search, $options: 'i' } },
          { 'formData.phone': { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const totalMessages = await ContactUsMessageModel.countDocuments(searchQuery);
    
    // Get messages with pagination
    const messages = await ContactUsMessageModel.find(searchQuery)
      .sort({ submissionTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Remove IP address from response for privacy
    const sanitizedMessages = messages.map(message => ({
      _id: message._id,
      userId: message.userId,
      widgetId: message.widgetId,
      formData: message.formData,
      submissionTime: message.submissionTime,
      userAgent: message.userAgent,
      isRead: message.isRead || false
      // Note: ipAddress is intentionally excluded for privacy
    }));
    
    const totalPages = Math.ceil(totalMessages / limit);
    
    return NextResponse.json({
      messages: sanitizedMessages,
      pagination: {
        page,
        limit,
        totalMessages,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
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