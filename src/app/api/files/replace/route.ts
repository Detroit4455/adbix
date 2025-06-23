import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { authOptions } from '../../auth/[...nextauth]/route';

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
    const file = formData.get('file') as File;
    const oldName = formData.get('oldName') as string;
    const mobileNumber = formData.get('mobileNumber') as string;

    if (mobileNumber !== session.user.mobileNumber) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!file || !oldName) {
      return NextResponse.json(
        { error: 'File and old name are required' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(process.cwd(), 'public', 'sites', mobileNumber, oldName);

    // Delete the old file
    await unlink(filePath);

    // Write the new file
    await writeFile(filePath, buffer);

    return NextResponse.json({ message: 'File replaced successfully' });
  } catch (error) {
    console.error('Error replacing file:', error);
    return NextResponse.json(
      { error: 'Failed to replace file' },
      { status: 500 }
    );
  }
} 