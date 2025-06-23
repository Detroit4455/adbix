import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectToDatabase();
    
    const connectionState = mongoose.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return NextResponse.json({
      success: true,
      status: stateMap[connectionState as keyof typeof stateMap] || 'unknown',
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port
    });
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 