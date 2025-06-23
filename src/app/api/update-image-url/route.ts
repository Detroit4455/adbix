import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const bucketName = process.env.AWS_S3_BUCKET_NAME || 'dt-web-sites';

export async function POST(request: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.mobileNumber) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to update image URLs' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { oldImagePath, newImageUrl, mobileNumber } = body;

    if (!oldImagePath || !newImageUrl || !mobileNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: oldImagePath, newImageUrl, or mobileNumber' },
        { status: 400 }
      );
    }

    // Verify that the user can only update images in their own directory
    if (mobileNumber !== session.user.mobileNumber) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only update images in your own website' },
        { status: 403 }
      );
    }

    // Validate the URL
    try {
      new URL(newImageUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid image URL provided' },
        { status: 400 }
      );
    }

    // Update image references in HTML files
    const updatedFiles = await updateImageReferencesInHTML(mobileNumber, oldImagePath, newImageUrl);

    return NextResponse.json({
      message: 'Image URL updated successfully in HTML files',
      imageUrl: newImageUrl,
      imagePath: oldImagePath,
      updatedFiles: updatedFiles,
      updatedFilesCount: updatedFiles.length,
      details: updatedFiles.length > 0 
        ? `Successfully updated ${updatedFiles.length} HTML file(s): ${updatedFiles.map(f => f.split('/').pop()).join(', ')}`
        : 'No HTML files needed updates (image path not found in any files)',
      type: 'url'
    });
  } catch (error) {
    console.error('Image URL update error:', error);
    return NextResponse.json(
      { error: 'Failed to update image URL' },
      { status: 500 }
    );
  }
}

// Helper function to update image references in HTML files
async function updateImageReferencesInHTML(mobileNumber: string, oldImagePath: string, newImageUrl: string): Promise<string[]> {
  const updatedFiles: string[] = [];
  let totalReplacements = 0;
  
  try {
    console.log(`Starting image URL update for user ${mobileNumber}`);
    console.log(`Old image path: ${oldImagePath}`);
    console.log(`New image URL: ${newImageUrl}`);
    
    // Get all HTML files in the user's site directory
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: `sites/${mobileNumber}/`,
    });
    
    const listResponse = await s3Client.send(listCommand);
    const htmlFiles = listResponse.Contents?.filter(obj => 
      obj.Key?.endsWith('.html') || obj.Key?.endsWith('.htm')
    ) || [];

    console.log(`Found ${htmlFiles.length} HTML files to process`);

    // Process each HTML file
    for (const file of htmlFiles) {
      if (!file.Key) continue;

      try {
        console.log(`Processing file: ${file.Key}`);
        
        // Get the current content
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: file.Key,
        });
        
        const getResponse = await s3Client.send(getCommand);
        const currentContent = await streamToString(getResponse.Body);
        
        // Replace image references
        const updatedContent = replaceImageReferences(currentContent, oldImagePath, newImageUrl);
        
        // Only update if content changed
        if (updatedContent !== currentContent) {
          console.log(`Content changed in ${file.Key}, updating file`);
          
          const putCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: file.Key,
            Body: updatedContent,
            ContentType: 'text/html',
          });
          
          await s3Client.send(putCommand);
          updatedFiles.push(file.Key);
          
          // Count the number of replacements made
          const oldLines = currentContent.split('\n').length;
          const newLines = updatedContent.split('\n').length;
          console.log(`File ${file.Key} updated successfully (${oldLines} -> ${newLines} lines)`);
        } else {
          console.log(`No changes needed for ${file.Key}`);
        }
      } catch (fileError) {
        console.error(`Error updating file ${file.Key}:`, fileError);
        // Continue with other files even if one fails
      }
    }
    
    console.log(`Image URL update completed. Updated ${updatedFiles.length} files.`);
    
  } catch (error) {
    console.error('Error updating HTML references:', error);
    throw error;
  }
  
  return updatedFiles;
}

// Helper function to replace image references in HTML content
function replaceImageReferences(htmlContent: string, oldImagePath: string, newImageUrl: string): string {
  console.log(`Replacing image references: ${oldImagePath} -> ${newImageUrl}`);
  console.log(`HTML content length: ${htmlContent.length} characters`);
  
  // Log a snippet of the HTML content to see what we're working with
  const snippet = htmlContent.substring(0, 500);
  console.log(`HTML snippet: ${snippet}...`);
  
  // Create regex patterns to match different ways the image might be referenced
  const patterns = [
    // src="imagepath" (exact match)
    new RegExp(`src=["']${escapeRegExp(oldImagePath)}["']`, 'gi'),
    // src="./imagepath" (relative path with ./)
    new RegExp(`src=["']\\.\/${escapeRegExp(oldImagePath)}["']`, 'gi'),
    // src="/imagepath" (absolute path with /)
    new RegExp(`src=["']\/${escapeRegExp(oldImagePath)}["']`, 'gi'),
    // Background images in CSS - different formats
    new RegExp(`background-image:\\s*url\\(["']?${escapeRegExp(oldImagePath)}["']?\\)`, 'gi'),
    new RegExp(`background:\\s*url\\(["']?${escapeRegExp(oldImagePath)}["']?\\)`, 'gi'),
    // CSS background with relative paths
    new RegExp(`background-image:\\s*url\\(["']?\\.\/${escapeRegExp(oldImagePath)}["']?\\)`, 'gi'),
    new RegExp(`background:\\s*url\\(["']?\\.\/${escapeRegExp(oldImagePath)}["']?\\)`, 'gi'),
    // CSS background with absolute paths
    new RegExp(`background-image:\\s*url\\(["']?\/${escapeRegExp(oldImagePath)}["']?\\)`, 'gi'),
    new RegExp(`background:\\s*url\\(["']?\/${escapeRegExp(oldImagePath)}["']?\\)`, 'gi'),
    // Handle srcset attributes for responsive images
    new RegExp(`srcset=["'][^"']*${escapeRegExp(oldImagePath)}[^"']*["']`, 'gi'),
    // Handle data attributes that might contain image paths
    new RegExp(`data-[a-zA-Z-]*=["'][^"']*${escapeRegExp(oldImagePath)}[^"']*["']`, 'gi'),
  ];

  let updatedContent = htmlContent;
  let replacementsMade = 0;
  
  // Replace all patterns
  patterns.forEach((pattern, index) => {
    const patternType = getPatternType(index);
    const matches = updatedContent.match(pattern);
    
    console.log(`Testing pattern ${index} (${patternType}): ${pattern.source}`);
    
    if (matches && matches.length > 0) {
      console.log(`Found ${matches.length} matches for pattern ${index} (${patternType})`);
      console.log(`Matches:`, matches);
      
      if (pattern.source.includes('background')) {
        // For CSS background images
        updatedContent = updatedContent.replace(pattern, (match) => {
          replacementsMade++;
          const replacement = match.includes('background-image:') 
            ? `background-image: url("${newImageUrl}")` 
            : `background: url("${newImageUrl}")`;
          console.log(`Background replacement ${replacementsMade}: ${match} -> ${replacement}`);
          return replacement;
        });
      } else if (pattern.source.includes('srcset')) {
        // For srcset attributes, replace only the specific image path
        updatedContent = updatedContent.replace(pattern, (match) => {
          replacementsMade++;
          const replacement = match.replace(new RegExp(escapeRegExp(oldImagePath), 'g'), newImageUrl);
          console.log(`Srcset replacement ${replacementsMade}: ${match} -> ${replacement}`);
          return replacement;
        });
      } else if (pattern.source.includes('data-')) {
        // For data attributes, replace only the specific image path
        updatedContent = updatedContent.replace(pattern, (match) => {
          replacementsMade++;
          const replacement = match.replace(new RegExp(escapeRegExp(oldImagePath), 'g'), newImageUrl);
          console.log(`Data attribute replacement ${replacementsMade}: ${match} -> ${replacement}`);
          return replacement;
        });
      } else {
        // For img src attributes
        updatedContent = updatedContent.replace(pattern, (match) => {
          replacementsMade++;
          const replacement = `src="${newImageUrl}"`;
          console.log(`Src replacement ${replacementsMade}: ${match} -> ${replacement}`);
          return replacement;
        });
      }
    } else {
      console.log(`No matches found for pattern ${index} (${patternType})`);
    }
  });

  console.log(`Total replacements made: ${replacementsMade}`);
  
  if (replacementsMade > 0) {
    console.log(`Content changed. New length: ${updatedContent.length} characters`);
  } else {
    console.log(`No changes made to content.`);
  }
  
  return updatedContent;
}

// Helper function to get pattern type for logging
function getPatternType(index: number): string {
  const types = [
    'src exact match',
    'src with ./ prefix',
    'src with / prefix',
    'background-image url',
    'background url',
    'background-image url with ./',
    'background url with ./',
    'background-image url with /',
    'background url with /',
    'srcset attribute',
    'data attributes'
  ];
  return types[index] || 'unknown';
}

// Helper function to escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to convert stream to string
async function streamToString(stream: any): Promise<string> {
  const chunks: any[] = [];
  
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
} 