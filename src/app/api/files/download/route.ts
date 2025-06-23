import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { join } from 'path';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import archiver from 'archiver';
import { Readable } from 'stream';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting file download process...');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.mobileNumber) {
      console.log('Unauthorized: No session or mobile number');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const mobileNumber = searchParams.get('mobileNumber');

    if (!mobileNumber) {
      console.log('Bad request: No mobile number provided');
      return NextResponse.json(
        { error: 'Mobile number is required' },
        { status: 400 }
      );
    }

    if (mobileNumber !== session.user.mobileNumber) {
      console.log('Unauthorized: Mobile number mismatch');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userDir = join(process.cwd(), 'public', 'sites', mobileNumber);
    console.log('User directory:', userDir);
    
    if (!existsSync(userDir)) {
      console.log('Directory not found:', userDir);
      return NextResponse.json(
        { error: 'No files found' },
        { status: 404 }
      );
    }

    // Verify directory is not empty
    const stats = await stat(userDir);
    if (!stats.isDirectory()) {
      console.log('Not a directory:', userDir);
      return NextResponse.json(
        { error: 'Invalid directory' },
        { status: 400 }
      );
    }

    console.log('Creating ZIP archive...');
    // Create a ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Handle archive warnings
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Archive warning:', err);
      } else {
        throw err;
      }
    });

    // Handle archive errors
    archive.on('error', (err) => {
      throw err;
    });

    // Create response headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="website-${mobileNumber}.zip"`);

    // Create a transform stream
    const chunks: Buffer[] = [];
    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('end', () => {
      console.log('Archive creation completed');
      const buffer = Buffer.concat(chunks);
      return new NextResponse(buffer, { headers });
    });

    // Add the entire directory to the archive
    archive.directory(userDir, false);
    console.log('Adding directory to archive:', userDir);

    // Finalize the archive
    console.log('Finalizing archive...');
    await archive.finalize();

    // Combine all chunks and return
    console.log('Sending response...');
    const buffer = Buffer.concat(chunks);
    return new NextResponse(buffer, { headers });
  } catch (error) {
    console.error('Error in download process:', error);
    return NextResponse.json(
      { 
        error: 'Failed to download files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 