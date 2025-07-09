import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const bucketName = process.env.AWS_S3_BUCKET_NAME!;

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
    const { oldImagePath, newImageUrl, mobileNumber, currentPagePath } = body;

    if (!newImageUrl || !mobileNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: newImageUrl or mobileNumber' },
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

    console.log('=== SINGLE PHASE: Smart Image Replacement ===');
    console.log(`oldImagePath: ${oldImagePath}`);
    console.log(`newImageUrl: ${newImageUrl}`);
    console.log(`mobileNumber: ${mobileNumber}`);
    console.log(`currentPagePath: ${currentPagePath}`);

    // Get available images from current page
    const availableImages = await getAvailableImages(mobileNumber, currentPagePath);
    
    if (availableImages.length === 0) {
      return NextResponse.json({
        error: 'No images found in current page',
        type: 'no_images'
      });
    }

    console.log(`🔍 Found ${availableImages.length} images in current page`);

    // Smart replacement logic
    let targetImageUrl = null;
    let replacedImageInfo = null;

    if (oldImagePath) {
      // Try to find exact match first
      const exactMatch = availableImages.find(img => img.url === oldImagePath);
      if (exactMatch) {
        targetImageUrl = exactMatch.url;
        replacedImageInfo = exactMatch;
        console.log(`✅ Found exact match: ${exactMatch.url}`);
      } else {
        // Try to find partial match (without query parameters)
        const cleanOldPath = oldImagePath.replace(/\?.*$/, '');
        const partialMatch = availableImages.find(img => img.url.replace(/\?.*$/, '') === cleanOldPath);
        if (partialMatch) {
          targetImageUrl = partialMatch.url;
          replacedImageInfo = partialMatch;
          console.log(`✅ Found partial match: ${partialMatch.url}`);
        }
      }
    }

    // If no specific match found, use smart fallback
    if (!targetImageUrl) {
      if (availableImages.length === 1) {
        // Only one image - replace it
        targetImageUrl = availableImages[0].url;
        replacedImageInfo = availableImages[0];
        console.log(`✅ Single image found, replacing: ${availableImages[0].url}`);
      } else {
        // Multiple images - replace the first one
        targetImageUrl = availableImages[0].url;
        replacedImageInfo = availableImages[0];
        console.log(`✅ Multiple images found, replacing first: ${availableImages[0].url}`);
      }
    }

    // Perform the replacement
    const updatedFiles = await updateImageReferencesInHTML(mobileNumber, targetImageUrl, newImageUrl);

    return NextResponse.json({
      message: `Successfully replaced image in ${updatedFiles.length} file(s)`,
      imageUrl: newImageUrl,
      oldImagePath: targetImageUrl,
      updatedFiles: updatedFiles,
      updatedFilesCount: updatedFiles.length,
      replacedImage: replacedImageInfo,
      type: 'direct_replace',
      details: availableImages.length === 1 
        ? 'Replaced the only image on the page'
        : `Replaced ${replacedImageInfo?.alt || 'image'} from ${availableImages.length} available images`
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
  console.log(`\n=== Enhanced image replacement ===`);
  console.log(`Target image: ${oldImagePath}`);
  console.log(`New image URL: ${newImageUrl}`);
  console.log(`HTML content length: ${htmlContent.length} characters`);
  
  let updatedContent = htmlContent;
  let replacementsMade = 0;
  
  // Find all img tags with src attributes
  const imgTagPattern = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  const imgMatches = [...htmlContent.matchAll(imgTagPattern)];
  
  console.log(`Found ${imgMatches.length} img tags in HTML`);
  
  // Clean the old image path to handle cache busting and URL variations
  const cleanOldPath = oldImagePath.replace(/\?v=\d+/, '').replace(/\?.*$/, '');
  const oldImageFileName = cleanOldPath.split('/').pop() || '';
  const oldImageUuid = oldImageFileName.split('.')[0];
  
  console.log(`🔍 Cleaned old path: ${cleanOldPath}`);
  console.log(`🔍 Old image filename: ${oldImageFileName}`);
  console.log(`🔍 Old image UUID: ${oldImageUuid}`);
  
  // If there's exactly one image, replace it regardless of the old URL
  if (imgMatches.length === 1) {
    const fullMatch = imgMatches[0][0];
    const currentSrc = imgMatches[0][1];
    
    console.log(`Single image found with src: ${currentSrc}`);
    console.log(`Replacing with: ${newImageUrl}`);
    
    // Replace the src attribute in this img tag
    const newImgTag = fullMatch.replace(
      /src=["'][^"']+["']/i,
      `src="${newImageUrl}"`
    );
    
    updatedContent = updatedContent.replace(fullMatch, newImgTag);
    replacementsMade = 1;
    
    console.log(`✅ Replaced single image successfully`);
  } else if (imgMatches.length > 1) {
    // Multiple images - try to find a match with enhanced logic
    console.log(`Multiple images found, looking for matches...`);
    
    for (let i = 0; i < imgMatches.length; i++) {
      const fullMatch = imgMatches[i][0];
      const currentSrc = imgMatches[i][1];
      
      console.log(`Image ${i + 1}: ${currentSrc}`);
      
      // Clean current src for comparison
      const cleanCurrentSrc = currentSrc.replace(/\?v=\d+/, '').replace(/\?.*$/, '');
      const currentFileName = cleanCurrentSrc.split('/').pop() || '';
      const currentUuid = currentFileName.split('.')[0];
      
      // Enhanced matching logic
      const isExactMatch = cleanCurrentSrc === cleanOldPath;
      const isImageRepoMatch = currentSrc.includes('imagerepo/') && 
                               oldImagePath.includes('imagerepo/');
      const isFileNameMatch = currentFileName === oldImageFileName;
      const isUuidMatch = currentUuid === oldImageUuid && currentUuid.length > 10;
      const isPartialMatch = currentSrc.includes(oldImageUuid) && oldImageUuid.length > 10;
      
      console.log(`🔍 Matching analysis for image ${i + 1}:`);
      console.log(`  - Exact match: ${isExactMatch}`);
      console.log(`  - ImageRepo match: ${isImageRepoMatch}`);
      console.log(`  - Filename match: ${isFileNameMatch}`);
      console.log(`  - UUID match: ${isUuidMatch}`);
      console.log(`  - Partial match: ${isPartialMatch}`);
      
      if (isExactMatch || isImageRepoMatch || isFileNameMatch || isUuidMatch || isPartialMatch) {
        console.log(`📍 Found matching image: ${currentSrc}`);
        
        const newImgTag = fullMatch.replace(
          /src=["'][^"']+["']/i,
          `src="${newImageUrl}"`
        );
        
        updatedContent = updatedContent.replace(fullMatch, newImgTag);
        replacementsMade++;
        
        console.log(`✅ Replaced matching image`);
        break; // Only replace the first match
      }
    }
    
    // If no match found, but we have imagerepo images, try to replace the first one
    if (replacementsMade === 0 && newImageUrl.includes('imagerepo/')) {
      console.log(`⚠️ No exact match found, checking for any imagerepo images to replace...`);
      
      for (let i = 0; i < imgMatches.length; i++) {
        const fullMatch = imgMatches[i][0];
        const currentSrc = imgMatches[i][1];
        
        if (currentSrc.includes('imagerepo/')) {
          console.log(`🔄 Replacing first imagerepo image found: ${currentSrc}`);
          
          const newImgTag = fullMatch.replace(
            /src=["'][^"']+["']/i,
            `src="${newImageUrl}"`
          );
          
          updatedContent = updatedContent.replace(fullMatch, newImgTag);
          replacementsMade++;
          
          console.log(`✅ Replaced first imagerepo image as fallback`);
          break;
        }
      }
    }
    
    // ULTIMATE FALLBACK: If still no replacements and we have images, ask user to specify
    if (replacementsMade === 0 && imgMatches.length > 0) {
      console.log(`🤔 No imagerepo images found, but ${imgMatches.length} total images exist.`);
      console.log(`Available images:`);
      imgMatches.forEach((match, index) => {
        console.log(`  ${index + 1}. ${match[1]}`);
      });
      
      // For now, we'll inform the user but not make automatic replacements
      // In the future, we could add a user prompt to select which image to replace
      console.log(`💡 Suggestion: If you want to replace one of these images, please select it specifically.`);
    }
  } else {
    console.log(`⚠️ No img tags found in HTML`);
  }

  console.log(`\n=== Replacement Summary ===`);
  console.log(`Total replacements made: ${replacementsMade}`);
  
  if (replacementsMade > 0) {
    console.log(`✅ Content updated successfully`);
  } else {
    console.log(`❌ No changes made to content`);
  }
  
  return updatedContent;
}

// Helper function to extract possible paths from a URL
function extractPossiblePaths(urlPath: string): string[] {
  const paths: string[] = [];
  
  console.log(`Extracting paths from URL: ${urlPath}`);
  
  // Add the original path
  paths.push(urlPath);
  
  // If it's a full URL, extract just the path part
  if (urlPath.startsWith('http')) {
    try {
      const url = new URL(urlPath);
      paths.push(url.pathname);
      paths.push(url.pathname.substring(1)); // Remove leading slash
      console.log(`Extracted URL pathname: ${url.pathname}`);
    } catch (e) {
      console.log('Failed to parse URL:', urlPath);
    }
  }
  
  // If it has query parameters, add version without them
  if (urlPath.includes('?')) {
    const withoutQuery = urlPath.split('?')[0];
    paths.push(withoutQuery);
    console.log(`Extracted path without query: ${withoutQuery}`);
  }
  
  // Add version with and without leading slash
  if (urlPath.startsWith('/')) {
    paths.push(urlPath.substring(1));
  } else {
    paths.push('/' + urlPath);
  }
  
  // Add common prefixes
  if (!urlPath.startsWith('./') && !urlPath.startsWith('/')) {
    paths.push('./' + urlPath);
    paths.push('../' + urlPath);
  }
  
  // Remove duplicates and empty paths
  const uniquePaths = [...new Set(paths)].filter(path => path && path.length > 0);
  console.log(`Final unique paths to search:`, uniquePaths);
  
  return uniquePaths;
}

// Helper function to escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to get all available images from current page only
async function getAvailableImages(mobileNumber: string, currentPagePath?: string): Promise<Array<{url: string, file: string, alt: string}>> {
  const allImages: Array<{url: string, file: string, alt: string}> = [];
  
  try {
    console.log(`🔍 Scanning for available images in current page only...`);
    console.log(`Current page path: ${currentPagePath}`);
    
    // If no current page path provided, default to index.html
    const targetFile = currentPagePath || 'index.html';
    
    // Construct the full S3 key for the current page
    const pageKey = targetFile.startsWith('sites/') 
      ? targetFile 
      : `sites/${mobileNumber}/${targetFile}`;
    
    console.log(`📁 Scanning only file: ${pageKey}`);

    try {
      // Get the current page content
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: pageKey,
      });
      
      const getResponse = await s3Client.send(getCommand);
      const content = await streamToString(getResponse.Body);
      
      // Extract images from this file
      const imgTagPattern = /<img[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi;
      const imgMatches = [...content.matchAll(imgTagPattern)];
      
      for (const match of imgMatches) {
        const url = match[1];
        const alt = match[2] || 'No alt text';
        const fileName = pageKey.split('/').pop() || pageKey;
        
        allImages.push({
          url: url,
          file: fileName,
          alt: alt
        });
      }
      
      console.log(`📷 Found ${imgMatches.length} images in current page: ${pageKey}`);
      
    } catch (fileError) {
      console.error(`❌ Error reading current page ${pageKey}:`, fileError);
      // If the specific page is not found, return empty array
      return [];
    }
    
    console.log(`✅ Total images found in current page: ${allImages.length}`);
    return allImages;
    
  } catch (error) {
    console.error('❌ Error scanning for images:', error);
    throw error;
  }
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