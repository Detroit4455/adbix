import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { connectToDatabase } from '@/lib/db';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    // Get the user's session with authOptions
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.mobileNumber) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to upload files' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    // Check if index.html exists
    const hasIndexHtml = files.some(file => file.name === 'index.html');
    if (!hasIndexHtml) {
      return NextResponse.json(
        { error: 'index.html is required' },
        { status: 400 }
      );
    }

    // Create user's base directory if it doesn't exist
    const userDir = join(process.cwd(), 'public', 'sites', session.user.mobileNumber);
    await mkdir(userDir, { recursive: true });

    // Save all files maintaining directory structure
    const savePromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Get the full path including any subdirectories
      const filePath = join(userDir, file.name);
      
      // Create subdirectories if they don't exist
      const fileDir = dirname(filePath);
      await mkdir(fileDir, { recursive: true });
      
      // Save the file
      await writeFile(filePath, buffer);
    });

    await Promise.all(savePromises);

    // Update user's siteUrl in database
    const { db } = await connectToDatabase();
    await db.collection('users').updateOne(
      { mobileNumber: session.user.mobileNumber },
      {
        $set: {
          siteUrl: `/sites/${session.user.mobileNumber}`,
          lastUpdated: new Date().toISOString()
        }
      }
    );

    return NextResponse.json({
      message: 'Files uploaded successfully',
      siteUrl: `/sites/${session.user.mobileNumber}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
} 