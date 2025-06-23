import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { writeFile, mkdir, readdir, unlink } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { existsSync } from 'fs';
import { connectToDatabase } from '@/lib/db';
import { authOptions } from '../auth/[...nextauth]/route';
import AdmZip from 'adm-zip';
import { IZipEntry } from 'adm-zip';

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
    const zipFile = formData.get('zipFile') as File;

    if (!zipFile) {
      return NextResponse.json(
        { error: 'No ZIP file uploaded' },
        { status: 400 }
      );
    }

    // Check if it's a ZIP file
    if (!zipFile.name.endsWith('.zip')) {
      return NextResponse.json(
        { error: 'The uploaded file is not a ZIP archive' },
        { status: 400 }
      );
    }

    // Create user's base directory if it doesn't exist
    const userDir = join(process.cwd(), 'public', 'sites', session.user.mobileNumber);
    await mkdir(userDir, { recursive: true });

    // Create a temporary path to save the uploaded ZIP file
    const tempZipPath = join(userDir, 'temp.zip');
    
    // Save the ZIP file temporarily
    const zipBuffer = Buffer.from(await zipFile.arrayBuffer());
    await writeFile(tempZipPath, zipBuffer);

    // Extract the ZIP file
    const zip = new AdmZip(tempZipPath);
    const zipEntries = zip.getEntries();

    // Check if the ZIP contains index.html (either at root or in a subdirectory)
    const hasIndexHtml = zipEntries.some((entry: IZipEntry) => {
      const entryName = entry.entryName.toLowerCase();
      return entryName === 'index.html' || entryName.endsWith('/index.html');
    });

    if (!hasIndexHtml) {
      // Clean up temp ZIP file
      await unlink(tempZipPath);
      
      return NextResponse.json(
        { error: 'The ZIP must contain an index.html file' },
        { status: 400 }
      );
    }

    // Detect if the ZIP has a single root folder containing all files
    const rootFolders = new Set<string>();
    let hasSingleRootFolder = true;
    
    for (const entry of zipEntries) {
      const pathParts = entry.entryName.split('/');
      
      // Skip empty entries (can happen with some ZIP tools)
      if (pathParts.length === 0 || (pathParts.length === 1 && pathParts[0] === '')) {
        continue;
      }
      
      rootFolders.add(pathParts[0]);
      
      // If we have more than one root folder, or files directly at the root
      if (rootFolders.size > 1 || (pathParts.length === 1 && !entry.isDirectory)) {
        hasSingleRootFolder = false;
        break;
      }
    }
    
    // Extract files to the appropriate directory
    for (const entry of zipEntries) {
      if (entry.isDirectory) {
        continue; // Skip directory entries, we'll create them as needed
      }
      
      let targetEntryPath = entry.entryName;
      
      // If the ZIP has a single root folder, strip it out
      if (hasSingleRootFolder && rootFolders.size === 1) {
        const rootFolder = Array.from(rootFolders)[0];
        if (entry.entryName.startsWith(rootFolder + '/')) {
          targetEntryPath = entry.entryName.substring(rootFolder.length + 1);
        }
      }
      
      // If the path is empty after stripping, skip it
      if (!targetEntryPath) {
        continue;
      }
      
      // Get the file data
      const entryData = entry.getData();
      
      // Determine the target path for this file
      const targetPath = join(userDir, targetEntryPath);
      
      // Create directory if it doesn't exist
      const targetDir = dirname(targetPath);
      await mkdir(targetDir, { recursive: true });
      
      // Write the file
      await writeFile(targetPath, entryData);
    }

    // Clean up temp ZIP file
    await unlink(tempZipPath);

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
      message: 'Website ZIP uploaded and extracted successfully',
      siteUrl: `/sites/${session.user.mobileNumber}`
    });
  } catch (error) {
    console.error('ZIP upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process ZIP file' },
      { status: 500 }
    );
  }
} 