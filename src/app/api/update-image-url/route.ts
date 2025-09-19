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
    const { oldImagePath, newImageUrl, mobileNumber, currentPagePath, imageIndex } = body;

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

    console.log('=== FIXED IMAGE REPLACEMENT LOGIC ===');
    console.log(`oldImagePath: ${oldImagePath}`);
    console.log(`newImageUrl: ${newImageUrl}`);
    console.log(`mobileNumber: ${mobileNumber}`);
    console.log(`currentPagePath: ${currentPagePath}`);
    console.log(`imageIndex: ${imageIndex}`);

    // Get available images from current page
    const availableImages = await getAvailableImages(mobileNumber, currentPagePath);
    
    if (availableImages.length === 0) {
      return NextResponse.json({
        error: 'No images found in current page',
        type: 'no_images'
      });
    }

    console.log(`🔍 Found ${availableImages.length} images in current page`);
    console.log(`📋 Available images list:`);
    availableImages.forEach((img, idx) => {
      console.log(`  ${idx}: ${img.url} (${img.alt})`);
    });

    // FIXED: More specific matching logic
    let targetImageUrl = null;
    let replacedImageInfo = null;

    // Priority 1: Use imageIndex if provided (most specific)
    if (imageIndex !== undefined && imageIndex >= 0 && imageIndex < availableImages.length) {
      targetImageUrl = availableImages[imageIndex].url;
      replacedImageInfo = availableImages[imageIndex];
      console.log(`✅ Using imageIndex ${imageIndex}: ${availableImages[imageIndex].url}`);
      console.log(`🎯 Target image details: ${replacedImageInfo.alt} from ${replacedImageInfo.file}`);
    } else if (imageIndex !== undefined) {
      console.log(`❌ Invalid imageIndex ${imageIndex}. Available range: 0-${availableImages.length - 1}`);
      return NextResponse.json({
        error: `Invalid image index ${imageIndex}. Please select a valid image.`,
        type: 'invalid_index',
        availableCount: availableImages.length
      });
    }
    // Priority 2: Try exact match with oldImagePath
    else if (oldImagePath) {
      const exactMatch = availableImages.find(img => img.url === oldImagePath);
      if (exactMatch) {
        targetImageUrl = exactMatch.url;
        replacedImageInfo = exactMatch;
        console.log(`✅ Found exact match: ${exactMatch.url}`);
      } else {
        // Try partial match (without query parameters only)
        const cleanOldPath = oldImagePath.split('?')[0]; // Remove only query params
        const partialMatch = availableImages.find(img => {
          const cleanImgUrl = img.url.split('?')[0]; // Remove only query params
          return cleanImgUrl === cleanOldPath;
        });
        if (partialMatch) {
          targetImageUrl = partialMatch.url;
          replacedImageInfo = partialMatch;
          console.log(`✅ Found partial match (without query params): ${partialMatch.url}`);
        }
      }
    }

    // Priority 3: Conservative fallback - only if single image
    if (!targetImageUrl) {
      if (availableImages.length === 1) {
        // Only one image - safe to replace
        targetImageUrl = availableImages[0].url;
        replacedImageInfo = availableImages[0];
        console.log(`✅ Single image found, replacing: ${availableImages[0].url}`);
      } else {
        // Multiple images - return error asking user to specify
        return NextResponse.json({
          error: `Found ${availableImages.length} images. Please specify which image to replace by clicking on it first.`,
          availableImages: availableImages.map((img, index) => ({
            index,
            url: img.url,
            alt: img.alt,
            filename: img.url.split('/').pop()
          })),
          type: 'multiple_images_ambiguous'
        });
      }
    }

    // Perform the replacement
    const updatedFiles = await updateImageReferencesInHTML(mobileNumber, targetImageUrl, newImageUrl, imageIndex);

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
async function updateImageReferencesInHTML(mobileNumber: string, oldImagePath: string, newImageUrl: string, imageIndex?: number): Promise<string[]> {
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
        const updatedContent = replaceImageReferences(currentContent, oldImagePath, newImageUrl, imageIndex);
        
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
function replaceImageReferences(htmlContent: string, oldImagePath: string, newImageUrl: string, imageIndex?: number): string {
  console.log(`\n=== Enhanced image replacement ===`);
  console.log(`Target image: ${oldImagePath}`);
  console.log(`New image URL: ${newImageUrl}`);
  console.log(`Image Index: ${imageIndex !== undefined ? imageIndex : 'Not provided'}`);
  console.log(`HTML content length: ${htmlContent.length} characters`);
  
  let updatedContent = htmlContent;
  let replacementsMade = 0;
  
  // Find all img tags with src attributes
  const imgTagPattern = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  const imgMatches = [...htmlContent.matchAll(imgTagPattern)];
  
  // Find all CSS background images
  const backgroundImagePattern = /background(?:-image)?\s*:\s*[^;]*url\(["']?([^"')]+)["']?\)/gi;
  const backgroundMatches = [...htmlContent.matchAll(backgroundImagePattern)];
  
  // Find all CSS background shorthand with images
  const backgroundShorthandPattern = /background\s*:\s*[^;]*url\(["']?([^"')]+)["']?\)/gi;
  const backgroundShorthandMatches = [...htmlContent.matchAll(backgroundShorthandPattern)];
  
  console.log(`Found ${imgMatches.length} img tags, ${backgroundMatches.length} background-image properties, and ${backgroundShorthandMatches.length} background shorthand properties in HTML`);
  
  // Since we're using imageIndex for exact matching, we don't need complex URL cleaning
  // Just log the original URL for debugging
  console.log(`🔍 Original old path: ${oldImagePath}`);
  
  // Combine all image sources for total count
  const totalImages = imgMatches.length + backgroundMatches.length + backgroundShorthandMatches.length;
  
  // If imageIndex is provided, use it for precise replacement
  if (imageIndex !== undefined && imageIndex >= 0) {
    console.log(`🎯 Using imageIndex ${imageIndex} for precise replacement`);
    
    // Extract images in the same order as frontend (img tags first, then background images)
    const allImagesInOrder: Array<{type: 'img' | 'background', index: number, match: RegExpMatchArray}> = [];
    
    // Add img tags first
    imgMatches.forEach((match, idx) => {
      allImagesInOrder.push({type: 'img', index: idx, match});
    });
    
    // Add background images
    backgroundMatches.forEach((match, idx) => {
      allImagesInOrder.push({type: 'background', index: idx, match});
    });
    
    // Add background shorthand images
    backgroundShorthandMatches.forEach((match, idx) => {
      allImagesInOrder.push({type: 'background', index: idx, match});
    });
    
    console.log(`📋 Total images in order: ${allImagesInOrder.length}`);
    
    if (imageIndex < allImagesInOrder.length) {
      const targetImage = allImagesInOrder[imageIndex];
      console.log(`🎯 Replacing image at index ${imageIndex}: ${targetImage.type} tag`);
      
      if (targetImage.type === 'img') {
        const fullMatch = targetImage.match[0];
        const currentSrc = targetImage.match[1];
        
        console.log(`📍 Found target img tag: ${currentSrc}`);
        console.log(`🔄 Replacing with: ${newImageUrl}`);
        
        // Replace the src attribute in this img tag
        const newImgTag = fullMatch.replace(
          /src=["'][^"']+["']/i,
          `src="${newImageUrl}"`
        );
        
        updatedContent = updatedContent.replace(fullMatch, newImgTag);
        replacementsMade = 1;
        
        console.log(`✅ Replaced img tag at index ${imageIndex} successfully`);
      } else if (targetImage.type === 'background') {
        const fullMatch = targetImage.match[0];
        const currentUrl = targetImage.match[1];
        
        console.log(`📍 Found target background image: ${currentUrl}`);
        console.log(`🔄 Replacing with: ${newImageUrl}`);
        
        // Replace the url in this background property
        const newBackground = fullMatch.replace(
          /url\(["']?[^"')]+["']?\)/i,
          `url("${newImageUrl}")`
        );
        
        updatedContent = updatedContent.replace(fullMatch, newBackground);
        replacementsMade = 1;
        
        console.log(`✅ Replaced background image at index ${imageIndex} successfully`);
      }
    } else {
      console.log(`❌ ImageIndex ${imageIndex} is out of bounds (total images: ${allImagesInOrder.length})`);
    }
  }
  // If there's exactly one image total, replace it regardless of the old URL
  else if (totalImages === 1) {
    if (imgMatches.length === 1) {
      const fullMatch = imgMatches[0][0];
      const currentSrc = imgMatches[0][1];
      
      console.log(`Single img tag found with src: ${currentSrc}`);
      console.log(`Replacing with: ${newImageUrl}`);
      
      // Replace the src attribute in this img tag
      const newImgTag = fullMatch.replace(
        /src=["'][^"']+["']/i,
        `src="${newImageUrl}"`
      );
      
      updatedContent = updatedContent.replace(fullMatch, newImgTag);
      replacementsMade = 1;
      
      console.log(`✅ Replaced single img tag successfully`);
    } else if (backgroundMatches.length === 1) {
      const fullMatch = backgroundMatches[0][0];
      const currentUrl = backgroundMatches[0][1];
      
      console.log(`Single background-image found with url: ${currentUrl}`);
      console.log(`Replacing with: ${newImageUrl}`);
      
      // Replace the url in this background-image property
      const newBackground = fullMatch.replace(
        /url\(["']?[^"')]+["']?\)/i,
        `url("${newImageUrl}")`
      );
      
      updatedContent = updatedContent.replace(fullMatch, newBackground);
      replacementsMade = 1;
      
      console.log(`✅ Replaced single background-image successfully`);
    } else if (backgroundShorthandMatches.length === 1) {
      const fullMatch = backgroundShorthandMatches[0][0];
      const currentUrl = backgroundShorthandMatches[0][1];
      
      console.log(`Single background shorthand found with url: ${currentUrl}`);
      console.log(`Replacing with: ${newImageUrl}`);
      
      // Replace the url in this background shorthand property
      const newBackground = fullMatch.replace(
        /url\(["']?[^"')]+["']?\)/i,
        `url("${newImageUrl}")`
      );
      
      updatedContent = updatedContent.replace(fullMatch, newBackground);
      replacementsMade = 1;
      
      console.log(`✅ Replaced single background shorthand successfully`);
    }
  } else if (totalImages > 1) {
    // Multiple images - try to find a match with enhanced logic
    console.log(`Multiple images found, looking for matches...`);
    
    // Check img tags first
    for (let i = 0; i < imgMatches.length; i++) {
      const fullMatch = imgMatches[i][0];
      const currentSrc = imgMatches[i][1];
      
      console.log(`Img tag ${i + 1}: ${currentSrc}`);
      
      // Simplified matching logic - use exact URL matching
      const isExactMatch = currentSrc === oldImagePath;
      
      // For CDN URLs, also try matching without query parameters
      const currentSrcNoQuery = currentSrc.split('?')[0];
      const oldPathNoQuery = oldImagePath.split('?')[0];
      const isExactMatchNoQuery = currentSrcNoQuery === oldPathNoQuery;
      
      // For imagerepo URLs, try to match the specific image UUID
      const currentImageUuid = currentSrc.match(/imagerepo\/([a-f0-9-]+)\./i)?.[1];
      const oldImageUuid = oldImagePath.match(/imagerepo\/([a-f0-9-]+)\./i)?.[1];
      const isImageRepoMatch = currentImageUuid && oldImageUuid && currentImageUuid === oldImageUuid;
      
      console.log(`🔍 Matching analysis for img tag ${i + 1}:`);
      console.log(`  - Exact match: ${isExactMatch}`);
      console.log(`  - ImageRepo match: ${isImageRepoMatch} (UUID: ${currentImageUuid} vs ${oldImageUuid})`);
      console.log(`  - Exact match (no query): ${isExactMatchNoQuery}`);
      
      if (isExactMatch || isImageRepoMatch || isExactMatchNoQuery) {
        console.log(`📍 Found matching img tag: ${currentSrc}`);
        
        const newImgTag = fullMatch.replace(
          /src=["'][^"']+["']/i,
          `src="${newImageUrl}"`
        );
        
        updatedContent = updatedContent.replace(fullMatch, newImgTag);
        replacementsMade++;
        
        console.log(`✅ Replaced matching img tag`);
        break; // Only replace the first match
      }
    }
    
    // If no img tag match found, check background images
    if (replacementsMade === 0) {
      for (let i = 0; i < backgroundMatches.length; i++) {
        const fullMatch = backgroundMatches[i][0];
        const currentUrl = backgroundMatches[i][1];
        
        console.log(`Background-image ${i + 1}: ${currentUrl}`);
        
        // Simplified matching logic - use exact URL matching
        const isExactMatch = currentUrl === oldImagePath;
        
        // For CDN URLs, also try matching without query parameters
        const currentUrlNoQuery = currentUrl.split('?')[0];
        const oldPathNoQuery = oldImagePath.split('?')[0];
        const isExactMatchNoQuery = currentUrlNoQuery === oldPathNoQuery;
        
        // For imagerepo URLs, try to match the specific image UUID
        const currentImageUuid = currentUrl.match(/imagerepo\/([a-f0-9-]+)\./i)?.[1];
        const oldImageUuid = oldImagePath.match(/imagerepo\/([a-f0-9-]+)\./i)?.[1];
        const isImageRepoMatch = currentImageUuid && oldImageUuid && currentImageUuid === oldImageUuid;
        
        console.log(`🔍 Matching analysis for background-image ${i + 1}:`);
        console.log(`  - Exact match: ${isExactMatch}`);
        console.log(`  - ImageRepo match: ${isImageRepoMatch} (UUID: ${currentImageUuid} vs ${oldImageUuid})`);
        console.log(`  - Exact match (no query): ${isExactMatchNoQuery}`);
        
        if (isExactMatch || isImageRepoMatch || isExactMatchNoQuery) {
          console.log(`📍 Found matching background-image: ${currentUrl}`);
          
          const newBackground = fullMatch.replace(
            /url\(["']?[^"')]+["']?\)/i,
            `url("${newImageUrl}")`
          );
          
          updatedContent = updatedContent.replace(fullMatch, newBackground);
          replacementsMade++;
          
          console.log(`✅ Replaced matching background-image`);
          break; // Only replace the first match
        }
      }
    }
    
    // If still no match found, check background shorthand
    if (replacementsMade === 0) {
      for (let i = 0; i < backgroundShorthandMatches.length; i++) {
        const fullMatch = backgroundShorthandMatches[i][0];
        const currentUrl = backgroundShorthandMatches[i][1];
        
        console.log(`Background shorthand ${i + 1}: ${currentUrl}`);
        
        // Simplified matching logic - use exact URL matching
        const isExactMatch = currentUrl === oldImagePath;
        
        // For CDN URLs, also try matching without query parameters
        const currentUrlNoQuery = currentUrl.split('?')[0];
        const oldPathNoQuery = oldImagePath.split('?')[0];
        const isExactMatchNoQuery = currentUrlNoQuery === oldPathNoQuery;
        
        // For imagerepo URLs, try to match the specific image UUID
        const currentImageUuid = currentUrl.match(/imagerepo\/([a-f0-9-]+)\./i)?.[1];
        const oldImageUuid = oldImagePath.match(/imagerepo\/([a-f0-9-]+)\./i)?.[1];
        const isImageRepoMatch = currentImageUuid && oldImageUuid && currentImageUuid === oldImageUuid;
        
        console.log(`🔍 Matching analysis for background shorthand ${i + 1}:`);
        console.log(`  - Exact match: ${isExactMatch}`);
        console.log(`  - ImageRepo match: ${isImageRepoMatch} (UUID: ${currentImageUuid} vs ${oldImageUuid})`);
        console.log(`  - Exact match (no query): ${isExactMatchNoQuery}`);
        
        if (isExactMatch || isImageRepoMatch || isExactMatchNoQuery) {
          console.log(`📍 Found matching background shorthand: ${currentUrl}`);
          
          const newBackground = fullMatch.replace(
            /url\(["']?[^"')]+["']?\)/i,
            `url("${newImageUrl}")`
          );
          
          updatedContent = updatedContent.replace(fullMatch, newBackground);
          replacementsMade++;
          
          console.log(`✅ Replaced matching background shorthand`);
          break; // Only replace the first match
        }
      }
    }
    
    // If no match found, but we have imagerepo images, try to replace the first one
    if (replacementsMade === 0 && newImageUrl.includes('imagerepo/')) {
      console.log(`⚠️ No exact match found, checking for any imagerepo images to replace...`);
      
      // Check img tags first
      for (let i = 0; i < imgMatches.length; i++) {
        const fullMatch = imgMatches[i][0];
        const currentSrc = imgMatches[i][1];
        
        if (currentSrc.includes('imagerepo/')) {
          console.log(`🔄 Replacing first imagerepo img tag found: ${currentSrc}`);
          
          const newImgTag = fullMatch.replace(
            /src=["'][^"']+["']/i,
            `src="${newImageUrl}"`
          );
          
          updatedContent = updatedContent.replace(fullMatch, newImgTag);
          replacementsMade++;
          
          console.log(`✅ Replaced first imagerepo img tag as fallback`);
          break;
        }
      }
      
      // If no img tag imagerepo found, check background images
      if (replacementsMade === 0) {
        for (let i = 0; i < backgroundMatches.length; i++) {
          const fullMatch = backgroundMatches[i][0];
          const currentUrl = backgroundMatches[i][1];
          
          if (currentUrl.includes('imagerepo/')) {
            console.log(`🔄 Replacing first imagerepo background-image found: ${currentUrl}`);
            
            const newBackground = fullMatch.replace(
              /url\(["']?[^"')]+["']?\)/i,
              `url("${newImageUrl}")`
            );
            
            updatedContent = updatedContent.replace(fullMatch, newBackground);
            replacementsMade++;
            
            console.log(`✅ Replaced first imagerepo background-image as fallback`);
            break;
          }
        }
      }
      
      // If still no match, check background shorthand
      if (replacementsMade === 0) {
        for (let i = 0; i < backgroundShorthandMatches.length; i++) {
          const fullMatch = backgroundShorthandMatches[i][0];
          const currentUrl = backgroundShorthandMatches[i][1];
          
          if (currentUrl.includes('imagerepo/')) {
            console.log(`🔄 Replacing first imagerepo background shorthand found: ${currentUrl}`);
            
            const newBackground = fullMatch.replace(
              /url\(["']?[^"')]+["']?\)/i,
              `url("${newImageUrl}")`
            );
            
            updatedContent = updatedContent.replace(fullMatch, newBackground);
            replacementsMade++;
            
            console.log(`✅ Replaced first imagerepo background shorthand as fallback`);
            break;
          }
        }
      }
    }
    
    // ULTIMATE FALLBACK: If still no replacements and we have images, ask user to specify
    if (replacementsMade === 0 && totalImages > 0) {
      console.log(`🤔 No imagerepo images found, but ${totalImages} total images exist.`);
      console.log(`Available images:`);
      
      imgMatches.forEach((match, index) => {
        console.log(`  Img tag ${index + 1}: ${match[1]}`);
      });
      
      backgroundMatches.forEach((match, index) => {
        console.log(`  Background-image ${index + 1}: ${match[1]}`);
      });
      
      backgroundShorthandMatches.forEach((match, index) => {
        console.log(`  Background shorthand ${index + 1}: ${match[1]}`);
      });
      
      // For now, we'll inform the user but not make automatic replacements
      // In the future, we could add a user prompt to select which image to replace
      console.log(`💡 Suggestion: If you want to replace one of these images, please select it specifically.`);
    }
  } else {
    console.log(`⚠️ No images found in HTML`);
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

// Note: Removed normalizeImageUrl function to preserve actual URLs (especially CDN URLs)
// This prevents issues when CloudFront restarts and URLs change

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
      
      // Extract images in the SAME ORDER as the frontend (ImageManagerPanel)
      // This ensures imageIndex matches between frontend and backend
      
      // Step 1: Extract img tags (in DOM order)
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
      
      // Step 2: Extract background images (in DOM order)
      // Combine both background-image and background shorthand patterns
      const backgroundImagePattern = /background(?:-image)?\s*:\s*[^;]*url\(["']?([^"')]+)["']?\)/gi;
      const backgroundShorthandPattern = /background\s*:\s*[^;]*url\(["']?([^"')]+)["']?\)/gi;
      
      // Find all background image matches
      const allBackgroundMatches = [
        ...content.matchAll(backgroundImagePattern),
        ...content.matchAll(backgroundShorthandPattern)
      ];
      
      // Remove duplicates (same URL might appear in both patterns)
      const uniqueBackgroundUrls = new Set<string>();
      
      for (const match of allBackgroundMatches) {
        const url = match[1];
        if (!uniqueBackgroundUrls.has(url)) {
          uniqueBackgroundUrls.add(url);
          const fileName = pageKey.split('/').pop() || pageKey;
          
          allImages.push({
            url: url,
            file: fileName,
            alt: 'Background image'
          });
        }
      }
      
      console.log(`📷 Found ${imgMatches.length} img tags and ${uniqueBackgroundUrls.size} unique background images in current page: ${pageKey}`);
      
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