import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { readdir, stat, unlink, rename, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { authOptions } from '../auth/[...nextauth]/route';
import { existsSync } from 'fs';

// GET /api/files - List files
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
    const path = searchParams.get('path') || '';

    if (!mobileNumber) {
      return NextResponse.json(
        { error: 'Mobile number is required' },
        { status: 400 }
      );
    }

    if (mobileNumber !== session.user.mobileNumber) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userDir = join(process.cwd(), 'public', 'sites', mobileNumber, path);
    
    if (!existsSync(userDir)) {
      return NextResponse.json(
        { error: 'Directory not found' },
        { status: 404 }
      );
    }

    const files = await readdir(userDir);
    const fileDetails = await Promise.all(
      files.map(async (file) => {
        const filePath = join(userDir, file);
        const stats = await stat(filePath);
        const isDirectory = stats.isDirectory();
        
        return {
          name: file,
          type: isDirectory ? 'folder' : getMimeType(file),
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
          isDirectory,
          path: path ? `${path}/${file}` : file
        };
      })
    );

    return NextResponse.json({ files: fileDetails });
  } catch (error) {
    console.error('Error reading files:', error);
    return NextResponse.json(
      { error: 'Failed to read files' },
      { status: 500 }
    );
  }
}

// DELETE /api/files - Delete a file
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.mobileNumber) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { fileName, mobileNumber, path } = await request.json();

    if (!mobileNumber || !fileName) {
      return NextResponse.json(
        { error: 'Mobile number and file name are required' },
        { status: 400 }
      );
    }

    if (mobileNumber !== session.user.mobileNumber) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const filePath = join(process.cwd(), 'public', 'sites', mobileNumber, path || fileName);

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    await unlink(filePath);

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}

// PUT /api/files - Rename a file
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.mobileNumber) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { oldName, newName, mobileNumber } = await request.json();

    if (mobileNumber !== session.user.mobileNumber) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const oldPath = join(process.cwd(), 'public', 'sites', mobileNumber, oldName);
    const newPath = join(process.cwd(), 'public', 'sites', mobileNumber, newName);

    await rename(oldPath, newPath);

    return NextResponse.json({ message: 'File renamed successfully' });
  } catch (error) {
    console.error('Error renaming file:', error);
    return NextResponse.json(
      { error: 'Failed to rename file' },
      { status: 500 }
    );
  }
}

// POST /api/files - Create a folder or upload a file
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.mobileNumber) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const mobileNumber = formData.get('mobileNumber') as string;
    const path = formData.get('path') as string;
    const file = formData.get('file') as File;
    const folderName = formData.get('folderName') as string;

    if (!mobileNumber) {
      return NextResponse.json(
        { error: 'Mobile number is required' },
        { status: 400 }
      );
    }

    if (mobileNumber !== session.user.mobileNumber) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle folder creation
    if (folderName) {
      if (!folderName.trim()) {
        return NextResponse.json(
          { error: 'Folder name cannot be empty' },
          { status: 400 }
        );
      }

      // Validate folder name
      if (!/^[a-zA-Z0-9-_ ]+$/.test(folderName)) {
        return NextResponse.json(
          { error: 'Folder name can only contain letters, numbers, spaces, hyphens, and underscores' },
          { status: 400 }
        );
      }

      const folderPath = join(process.cwd(), 'public', 'sites', mobileNumber, path || '', folderName);

      if (existsSync(folderPath)) {
        return NextResponse.json(
          { error: 'Folder already exists' },
          { status: 400 }
        );
      }

      await mkdir(folderPath);
      return NextResponse.json({ message: 'Folder created successfully' });
    }

    // Handle file upload
    if (file) {
      const fileName = file.name;
      
      // Validate file name
      if (!/^[a-zA-Z0-9-_ .]+$/.test(fileName)) {
        return NextResponse.json(
          { error: 'File name can only contain letters, numbers, spaces, hyphens, underscores, and dots' },
          { status: 400 }
        );
      }

      const filePath = join(process.cwd(), 'public', 'sites', mobileNumber, path || '', fileName);

      if (existsSync(filePath)) {
        return NextResponse.json(
          { error: 'File already exists' },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      return NextResponse.json({ message: 'File uploaded successfully' });
    }

    return NextResponse.json(
      { error: 'No file or folder name provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'pdf': 'application/pdf',
    'zip': 'application/zip',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
} 