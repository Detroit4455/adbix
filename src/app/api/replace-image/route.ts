import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

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
        { error: 'Unauthorized - Please log in to replace images' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get('imageFile') as File;
    const imageUrl = formData.get('imageUrl') as string;
    const imagePath = formData.get('imagePath') as string;
    const mobileNumber = formData.get('mobileNumber') as string;
    const updateType = formData.get('updateType') as string; // 'file' or 'url'

    if (!imagePath || !mobileNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: imagePath or mobileNumber' },
        { status: 400 }
      );
    }

    // Verify that the user can only replace images in their own directory
    if (mobileNumber !== session.user.mobileNumber) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only replace images in your own website' },
        { status: 403 }
      );
    }

    // Handle file upload
    if (imageFile) {
    // Check if it's an image file
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedImageTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only image files (JPEG, PNG, GIF, WebP) are allowed' },
        { status: 400 }
      );
    }

      // Check file size (10MB limit)
      if (imageFile.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 10MB' },
          { status: 400 }
        );
      }

    // Convert the uploaded file to a buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    
    // Construct the S3 key (path) for the image
    const s3Key = `sites/${mobileNumber}/${imagePath}`;
    
    // Determine content type
    const contentType = imageFile.type;
    
    // Upload the new image to S3, replacing the existing one
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: imageBuffer,
        ContentType: contentType,
      })
    );

    // Generate the new image URL
      const newImageUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;

    return NextResponse.json({
      message: 'Image replaced successfully',
        imageUrl: newImageUrl,
        imagePath: imagePath,
        type: 'file'
      });
    }

    // Handle URL update (for external images or updating HTML references)
    if (imageUrl) {
      // Validate the URL
      try {
        new URL(imageUrl);
      } catch {
        return NextResponse.json(
          { error: 'Invalid image URL provided' },
          { status: 400 }
        );
      }

      // For URL updates, we need to update the HTML files that reference this image
      const updatedFiles = await updateImageReferencesInHTML(mobileNumber, imagePath, imageUrl);

      return NextResponse.json({
        message: 'Image URL updated successfully in HTML files',
        imageUrl: imageUrl,
        imagePath: imagePath,
        updatedFiles: updatedFiles,
        updatedFilesCount: updatedFiles.length,
        details: updatedFiles.length > 0 
          ? `Successfully updated ${updatedFiles.length} HTML file(s): ${updatedFiles.map(f => f.split('/').pop()).join(', ')}`
          : 'No HTML files needed updates (image path not found in any files)',
        type: 'url'
      });
    }

    return NextResponse.json(
      { error: 'Either imageFile or imageUrl must be provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Image replacement error:', error);
    return NextResponse.json(
      { error: 'Failed to replace image' },
      { status: 500 }
    );
  }
}

// Helper function to update image references in HTML files
async function updateImageReferencesInHTML(mobileNumber: string, oldImagePath: string, newImageUrl: string): Promise<string[]> {
  const updatedFiles: string[] = [];
  
  try {
    console.log(`Starting image URL update for user ${mobileNumber}`);
    console.log(`Old image path: ${oldImagePath}`);
    console.log(`New image URL: ${newImageUrl}`);
    
    // Get all HTML files in the user's site directory
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    
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
          
          console.log(`File ${file.Key} updated successfully`);
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
    const matches = updatedContent.match(pattern);
    
    if (matches && matches.length > 0) {
      console.log(`Found ${matches.length} matches for pattern ${index}`);
      
      if (pattern.source.includes('background')) {
        // For CSS background images
        updatedContent = updatedContent.replace(pattern, (match) => {
          replacementsMade++;
          if (match.includes('background-image:')) {
            return `background-image: url("${newImageUrl}")`;
          } else {
            return `background: url("${newImageUrl}")`;
          }
        });
      } else if (pattern.source.includes('srcset')) {
        // For srcset attributes, replace only the specific image path
        updatedContent = updatedContent.replace(pattern, (match) => {
          replacementsMade++;
          return match.replace(new RegExp(escapeRegExp(oldImagePath), 'g'), newImageUrl);
        });
      } else if (pattern.source.includes('data-')) {
        // For data attributes, replace only the specific image path
        updatedContent = updatedContent.replace(pattern, (match) => {
          replacementsMade++;
          return match.replace(new RegExp(escapeRegExp(oldImagePath), 'g'), newImageUrl);
        });
      } else {
        // For img src attributes
        updatedContent = updatedContent.replace(pattern, `src="${newImageUrl}"`);
        replacementsMade++;
      }
    }
  });

  console.log(`Total replacements made: ${replacementsMade}`);
  return updatedContent;
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