import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { authOptions } from '../../auth/[...nextauth]/route';
import { existsSync } from 'fs';

// GET /api/files/edit - Get file content
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.mobileNumber) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const mobileNumber = searchParams.get('mobileNumber');
    const filePath = searchParams.get('path');

    if (!mobileNumber || !filePath) {
      return NextResponse.json(
        { error: 'Mobile number and file path are required' },
        { status: 400 }
      );
    }

    if (mobileNumber !== session.user.mobileNumber) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const fullPath = join(process.cwd(), 'public', 'sites', mobileNumber, filePath);
    
    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const content = await readFile(fullPath, 'utf8');
    
    return NextResponse.json({ 
      content,
      filePath,
      fileName: filePath.split('/').pop()
    });
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    );
  }
}

// POST /api/files/edit - Save file content
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.mobileNumber) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { mobileNumber, filePath, content } = await request.json();

    if (!mobileNumber || !filePath || content === undefined) {
      return NextResponse.json(
        { error: 'Mobile number, file path, and content are required' },
        { status: 400 }
      );
    }

    if (mobileNumber !== session.user.mobileNumber) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const fullPath = join(process.cwd(), 'public', 'sites', mobileNumber, filePath);
    
    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    await writeFile(fullPath, content);
    
    return NextResponse.json({ 
      message: 'File saved successfully'
    });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json(
      { error: 'Failed to save file' },
      { status: 500 }
    );
  }
} 