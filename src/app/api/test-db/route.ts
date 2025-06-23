import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // Test database connection
    const result = await db.admin().ping();
    
    // Get user count to verify collection access
    const userCount = await db.collection('users').countDocuments();
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      ping: result,
      userCount: userCount
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 