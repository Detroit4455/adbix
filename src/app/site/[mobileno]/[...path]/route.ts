import { NextRequest, NextResponse } from 'next/server';
import { getWebsiteUrl, getDirectS3Url, isCloudFrontConfigured } from '@/lib/aws-urls';
import { checkSubscriptionCached } from '@/lib/subscriptionCache';

export async function GET(
  request: NextRequest,
  { params }: { params: { mobileno: string, path: string[] } }
) {
  try {
    // Await the params before destructuring
    const paramValues = await Promise.resolve(params);
    const { mobileno, path } = paramValues;
    
        // Construct the path to the resource
    const pathSegments = Array.isArray(path) ? path.join('/') : path;
    
    // Check if requesting error.html
    const isErrorPage = pathSegments === 'error.html';
    
    // Use CloudFront URL for website serving, S3 for internal operations
    const websiteUrl = getWebsiteUrl(mobileno, pathSegments);
    
    console.log(`Proxying request to: ${websiteUrl}`);
    console.log(`CloudFront configured: ${isCloudFrontConfigured()}`);
    
    // Check if this is a preview mode request
    const url = new URL(request.url);
    const isPreviewMode = url.searchParams.get('preview') === 'true';
    
    // For preview mode, use S3 direct URL to avoid CloudFront caching
    // For live/public access, use CloudFront URL for better performance
    const fetchUrl = isPreviewMode ? getDirectS3Url(mobileno, pathSegments) : websiteUrl;
    
    console.log(`Preview mode: ${isPreviewMode}, fetching from: ${fetchUrl}`);
    
    // Check subscription status for non-preview and non-error requests using cache
    if (!isPreviewMode && !isErrorPage) {
      try {
        const { shouldAllowAccess } = await checkSubscriptionCached(mobileno);
        
        if (!shouldAllowAccess) {
          console.log('🚫 Subscription check failed for user:', mobileno);
          // Redirect to error.html in the user's site
          const errorUrl = new URL(request.url);
          errorUrl.pathname = `/site/${mobileno}/error.html`;
          errorUrl.searchParams.delete('preview'); // Remove preview param if any
          return NextResponse.redirect(errorUrl.toString());
        } else {
          console.log('✅ Subscription check passed for user:', mobileno);
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
        // On error, redirect to error.html to be safe
        const errorUrl = new URL(request.url);
        errorUrl.pathname = `/site/${mobileno}/error.html`;
        errorUrl.searchParams.delete('preview');
        return NextResponse.redirect(errorUrl.toString());
      }
    } else if (isErrorPage) {
      console.log('Serving error.html - skipping subscription check');
    }
    
    // Fetch content from the appropriate URL (S3 for preview, CloudFront for live)
    const response = await fetch(fetchUrl);
    
    if (!response.ok) {
      // Handle fallback based on request type
      if (isPreviewMode) {
        // Preview mode already uses S3 direct, so no fallback needed
        // If error.html is requested but doesn't exist, provide fallback error page
        if (isErrorPage) {
          console.log('error.html not found in preview mode, providing fallback error page');
          const fallbackErrorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Unavailable</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        h1 { color: #e74c3c; }
        p { color: #666; line-height: 1.6; }
        .contact { margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚫 Service Unavailable</h1>
        <p>Your website service is currently unavailable. This could be due to:</p>
        <ul style="text-align: left; display: inline-block;">
            <li>Subscription needs renewal</li>
            <li>Payment pending</li>
            <li>Account maintenance</li>
        </ul>
        <div class="contact">
            <p><strong>Need help?</strong> Please contact your service provider to restore access.</p>
        </div>
    </div>
</body>
</html>`;
          
          return new NextResponse(fallbackErrorHtml, {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            }
          });
        }
        
        return new NextResponse(`Failed to fetch content from S3: ${response.statusText}`, {
          status: response.status,
        });
      } else {
        // Live mode: if CloudFront fails, try S3 direct URL as fallback
      if (isCloudFrontConfigured()) {
        console.log('CloudFront request failed, trying S3 fallback...');
        const s3FallbackUrl = getDirectS3Url(mobileno, pathSegments);
        const fallbackResponse = await fetch(s3FallbackUrl);
        
        if (!fallbackResponse.ok) {
          // If error.html is requested but doesn't exist, provide fallback error page
          if (isErrorPage) {
            console.log('error.html not found on S3/CloudFront, providing fallback error page');
            const fallbackErrorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Unavailable</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        h1 { color: #e74c3c; }
        p { color: #666; line-height: 1.6; }
        .contact { margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚫 Service Unavailable</h1>
        <p>Your website service is currently unavailable. This could be due to:</p>
        <ul style="text-align: left; display: inline-block;">
            <li>Subscription needs renewal</li>
            <li>Payment pending</li>
            <li>Account maintenance</li>
        </ul>
        <div class="contact">
            <p><strong>Need help?</strong> Please contact your service provider to restore access.</p>
        </div>
    </div>
</body>
</html>`;
            
            return new NextResponse(fallbackErrorHtml, {
              headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
              }
            });
          }
          
          return new NextResponse(`Failed to fetch from both CloudFront and S3: ${response.statusText}`, {
            status: response.status,
          });
        }
        
        return handleResponse(fallbackResponse, isPreviewMode, mobileno);
      }
      
      // If error.html is requested but doesn't exist, provide fallback error page
      if (isErrorPage) {
        console.log('error.html not found, providing fallback error page');
        const fallbackErrorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Unavailable</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        h1 { color: #e74c3c; }
        p { color: #666; line-height: 1.6; }
        .contact { margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚫 Service Unavailable</h1>
        <p>Your website service is currently unavailable. This could be due to:</p>
        <ul style="text-align: left; display: inline-block;">
            <li>Subscription needs renewal</li>
            <li>Payment pending</li>
            <li>Account maintenance</li>
        </ul>
        <div class="contact">
            <p><strong>Need help?</strong> Please contact your service provider to restore access.</p>
        </div>
    </div>
</body>
</html>`;
        
        return new NextResponse(fallbackErrorHtml, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        });
      }
      
      return new NextResponse(`Failed to fetch content: ${response.statusText}`, {
        status: response.status,
      });
      }
    }
    
    return handleResponse(response, isPreviewMode, mobileno);
  } catch (error) {
    console.error('Error in site proxy:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

async function handleResponse(response: Response, isPreviewMode: boolean, mobileno: string) {
  // Get the content and content-type
  const contentType = response.headers.get('content-type') || 'text/html';
  
  // If it's an HTML file and preview mode is enabled, inject image replacement functionality
  if (isPreviewMode && contentType.includes('text/html')) {
    const htmlContent = await response.text();
    const modifiedContent = injectImageReplaceFeature(htmlContent, mobileno);
    
    return new NextResponse(modifiedContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Prevent all caching for preview mode
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } else {
    // For non-HTML files or non-preview mode, return as-is
    const content = await response.arrayBuffer();
    
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Prevent aggressive caching
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}

/**
 * Inject image replacement functionality for preview mode
 */
function injectImageReplaceFeature(htmlContent: string, mobileno: string): string {
  // New image manager with top-right button and left panel
  const script = `
<script>
(function() {
  console.log('🔄 Image Manager script loading for preview mode...');
  
  let imageManagerPanel = null;
  let isImageManagerOpen = false;
  let currentImages = []; // This will be reassigned completely during scans
  let isScanning = false;
  let lastScanTime = 0;

  // Create the top-right Image Manager button
  function createImageManagerButton() {
    const button = document.createElement('div');
    button.innerHTML = '🖼️ Image Manager';
    button.id = 'image-manager-button';
    button.style.cssText = \`
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      z-index: 999999 !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      padding: 12px 20px !important;
      border-radius: 25px !important;
      cursor: pointer !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3) !important;
      border: 2px solid rgba(255, 255, 255, 0.2) !important;
      transition: all 0.3s ease !important;
      user-select: none !important;
      backdrop-filter: blur(10px) !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      min-width: 140px !important;
    \`;

    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.05)';
      button.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
    });

    // Click handler
    button.addEventListener('click', toggleImageManager);

    return button;
  }

  // Create the left panel for image management
  function createImageManagerPanel() {
    const panel = document.createElement('div');
    panel.id = 'image-manager-panel';
    panel.style.cssText = \`
      position: fixed !important;
      top: 0 !important;
      left: -400px !important;
      width: 400px !important;
      height: 100vh !important;
      background: rgba(255, 255, 255, 0.95) !important;
      backdrop-filter: blur(20px) !important;
      border-right: 1px solid rgba(0, 0, 0, 0.1) !important;
      z-index: 999998 !important;
      overflow-y: auto !important;
      transition: left 0.3s ease !important;
      box-shadow: 2px 0 20px rgba(0, 0, 0, 0.1) !important;
      font-family: system-ui, -apple-system, sans-serif !important;
    \`;

    // Create panel header
    const header = document.createElement('div');
    header.style.cssText = \`
      padding: 20px !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      position: sticky !important;
      top: 0 !important;
      z-index: 10 !important;
    \`;
    header.innerHTML = \`
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Image Manager</h3>
        <div style="display: flex; gap: 8px;">
          <button id="refresh-images" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">🔄 Refresh</button>
          <button id="close-image-manager" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">✕ Close</button>
        </div>
      </div>
      <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">
        Found <span id="image-count">0</span> images on this page
      </p>
    \`;

    // Create images container
    const imagesContainer = document.createElement('div');
    imagesContainer.id = 'images-container';
    imagesContainer.style.cssText = \`
      padding: 20px !important;
    \`;

    panel.appendChild(header);
    panel.appendChild(imagesContainer);

    // Close button handler
    header.querySelector('#close-image-manager').addEventListener('click', toggleImageManager);
    
    // Refresh button handler with debounce protection
    header.querySelector('#refresh-images').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Disable button temporarily to prevent rapid clicks
      const refreshBtn = e.target;
      if (refreshBtn.disabled) return;
      
      refreshBtn.disabled = true;
      refreshBtn.textContent = '🔄 Refreshing...';
      
      console.log('🔄 Manual refresh requested');
      console.log(\`📊 Current images before refresh: \${currentImages.length}\`);
      
      // Scan images with a longer delay to ensure DOM is ready and debounce works
      setTimeout(() => {
        scanPageImages();
        
        // Re-enable button after a bit longer delay
        setTimeout(() => {
          refreshBtn.disabled = false;
          refreshBtn.textContent = '🔄 Refresh';
        }, 200);
      }, 200);
    });

    return panel;
  }

  // Toggle image manager panel
  function toggleImageManager() {
    if (isImageManagerOpen) {
      closeImageManager();
    } else {
      openImageManager();
    }
  }

  // Open image manager
  function openImageManager() {
    if (!imageManagerPanel) {
      imageManagerPanel = createImageManagerPanel();
      document.body.appendChild(imageManagerPanel);
      // Only scan for images when first creating the panel
      scanPageImages();
    }
    
    // Show panel
    imageManagerPanel.style.left = '0px';
    isImageManagerOpen = true;
    
    // Update button text
    const button = document.getElementById('image-manager-button');
    if (button) {
      button.innerHTML = '✕ Close Manager';
    }
  }

  // Close image manager
  function closeImageManager() {
    if (imageManagerPanel) {
      imageManagerPanel.style.left = '-400px';
    }
    isImageManagerOpen = false;
    
    // Update button text
    const button = document.getElementById('image-manager-button');
    if (button) {
      button.innerHTML = '🖼️ Image Manager';
    }
  }

  // Scan page for images
  function scanPageImages() {
    const now = Date.now();
    
    // Prevent rapid successive scans (debounce)
    if (isScanning || (now - lastScanTime) < 100) {
      console.log('⏭️ Scan skipped - too soon or already scanning');
      return;
    }
    
    isScanning = true;
    lastScanTime = now;
    
    console.log('🔍 Starting image scan...');
    console.log(\`📊 Current images array length before clear: \${currentImages.length}\`);
    
    try {
      const images = document.querySelectorAll('img[src]');
      
      // CRITICAL: Completely reset the array - use splice to ensure complete clearing
      currentImages.splice(0, currentImages.length);
      
      console.log(\`📊 Images array length after clear: \${currentImages.length}\`);
      console.log(\`🔍 Found \${images.length} img elements on page\`);
      
      // Create completely new array with no reference to old data
      const scannedImages = [];
      
      images.forEach((img, index) => {
        scannedImages.push({
          element: img,
          src: img.src,
          originalSrc: img.getAttribute('src'), // Store original src attribute
          alt: img.alt || 'Image ' + (index + 1),
          index: index
        });
      });
      
      // Assign completely new array
      currentImages = scannedImages;
      
      console.log(\`✅ Scan complete: \${currentImages.length} images in final array\`);
      console.log('🔍 Images found:', currentImages.map(img => img.src));
      
      updateImagesList();
    } catch (error) {
      console.error('❌ Error during image scan:', error);
    } finally {
      isScanning = false;
    }
  }

  // Update images list in panel
  function updateImagesList() {
    const container = document.getElementById('images-container');
    const countElement = document.getElementById('image-count');
    
    if (!container || !countElement) {
      console.warn('⚠️ Container or count element not found');
      return;
    }

    console.log(\`📊 Updating images list display: \${currentImages.length} images\`);
    console.log(\`📊 Current count element shows: \${countElement.textContent}\`);
    
    // Update count immediately
    countElement.textContent = currentImages.length;
    
    console.log(\`✅ Count updated to: \${countElement.textContent}\`);

    if (currentImages.length === 0) {
      container.innerHTML = \`
        <div style="
          text-align: center;
          padding: 40px 20px;
          color: #666;
          font-style: italic;
        ">
          No images found on this page
        </div>
      \`;
      return;
    }

    container.innerHTML = currentImages.map(img => \`
      <div class="image-item" data-index="\${img.index}" style="
        background: white;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(0, 0, 0, 0.05);
      ">
        <div style="display: flex; gap: 12px; align-items: flex-start;">
          <img src="\${img.src}" alt="\${img.alt}" style="
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 8px;
            border: 1px solid rgba(0, 0, 0, 0.1);
          ">
          <div style="flex: 1; min-width: 0;">
            <h4 style="
              margin: 0 0 6px 0;
              font-size: 14px;
              font-weight: 600;
              color: #333;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            ">\${img.alt}</h4>
            <p style="
              margin: 0 0 12px 0;
              font-size: 12px;
              color: #666;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              font-family: monospace;
            ">\${img.src}</p>
            <div style="display: flex; gap: 8px;">
              <button class="replace-btn" data-index="\${img.index}" style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: background 0.2s;
              ">🔄 Replace</button>
              <button class="highlight-btn" data-index="\${img.index}" style="
                background: #f59e0b;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: background 0.2s;
              ">📍 Highlight</button>
            </div>
          </div>
        </div>
      </div>
    \`).join('');

    // Add event listeners to buttons
    container.querySelectorAll('.replace-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        handleImageReplace(index);
      });
    });

    container.querySelectorAll('.highlight-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        highlightImage(index);
      });
    });
  }

  // Handle image replacement
  function handleImageReplace(index) {
    const imageData = currentImages[index];
    if (!imageData) return;
    
    // Get the original image URL from the HTML source
    const originalImageUrl = getOriginalImageUrl(imageData.element);
    console.log('🔍 Image replacement debug:', {
      currentSrc: imageData.src,
      originalHtmlSrc: originalImageUrl,
      elementSrc: imageData.element.src
    });
    
    // Store the original URL for replacement
    imageData.originalSrc = originalImageUrl || imageData.src;

    const modal = document.createElement('div');
    modal.style.cssText = \`
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: rgba(0, 0, 0, 0.8) !important;
      z-index: 9999999 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      backdrop-filter: blur(5px) !important;
    \`;

    modal.innerHTML = \`
      <div style="
        background: white;
        padding: 30px;
        border-radius: 16px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <h3 style="margin: 0 0 20px 0; font-size: 20px; color: #333;">Replace Image</h3>
        
        <div style="margin-bottom: 20px;">
          <img src="\${imageData.src}" alt="\${imageData.alt}" style="
            width: 100%;
            max-height: 200px;
            object-fit: contain;
            border-radius: 8px;
            border: 1px solid rgba(0, 0, 0, 0.1);
          ">
        </div>
        
        <div style="display: flex; gap: 12px; margin-bottom: 20px;">
          <button id="image-repo-btn" style="
            flex: 1;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          ">🖼️ Image Repository</button>
          <button id="upload-file-btn" style="
            flex: 1;
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">📤 Upload File</button>
          <button id="use-url-btn" style="
            flex: 1;
            background: #10b981;
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">🔗 Use URL</button>
        </div>
        
        <div style="display: flex; gap: 8px;">
          <button id="cancel-btn" style="
            flex: 1;
            background: #6b7280;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">Cancel</button>
        </div>
      </div>
    \`;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('#image-repo-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
      openImageRepository(imageData);
    });

    modal.querySelector('#upload-file-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
      uploadFileReplace(imageData);
    });

    modal.querySelector('#use-url-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
      urlReplace(imageData);
    });

    modal.querySelector('#cancel-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // Open image repository in popup
  function openImageRepository(imageData) {
    // Store the image data globally for the message listener
    window.imageReplaceData = imageData;
    
    // Create popup window
    const popup = window.open(
      '/image_repo?mode=select', 
      'imageRepository', 
      'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
    );
    
    if (!popup) {
      alert('Popup blocked! Please allow popups for this site to use the Image Repository.');
      return;
    }

    // Add message listener to receive selected image
    const messageHandler = (event) => {
      // Verify origin for security (adjust as needed)
      if (event.origin !== window.location.origin) return;
      
      if (event.data && event.data.type === 'IMAGE_SELECTED') {
        const selectedImageUrl = event.data.imageUrl;
        
        console.log('📥 Received selected image URL:', selectedImageUrl);
        
        console.log('🖼️ Image selected from repository, using new user-controlled approach...');
        
        // 🎯 Single phase: Direct image replacement
        fetch('/api/update-image-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            oldImagePath: imageData.originalSrc || imageData.src,
            newImageUrl: selectedImageUrl,
            mobileNumber: '${mobileno}',
            currentPagePath: window.location.pathname.split('/').pop() || 'index.html'
          })
        })
        .then(response => response.json())
        .then(result => {
          if (result.error) {
            throw new Error(result.error);
          }
          
          if (result.type === 'direct_replace') {
            // Update DOM immediately
            imageData.element.src = selectedImageUrl + '?v=' + Date.now();
            showSuccessMessage(\`Successfully replaced \${result.replacedImage?.alt || 'image'} from repository!\`);
            
            // Refresh the list
            setTimeout(() => {
              scanPageImages();
            }, 500);
          } else if (result.type === 'no_images') {
            showErrorMessage('No images found in current page to replace');
          } else {
            // Fallback - update DOM immediately  
            imageData.element.src = selectedImageUrl + '?v=' + Date.now();
            showSuccessMessage('Image replaced successfully with repository image!');
            
            setTimeout(() => {
              scanPageImages();
            }, 500);
          }
        })
        .catch(error => {
          console.error('Repository replacement error:', error);
          showErrorMessage('Repository replacement failed: ' + error.message);
        });
        
        // Close popup and cleanup
        popup.close();
        window.removeEventListener('message', messageHandler);
        delete window.imageReplaceData;
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    // Cleanup if popup is closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        delete window.imageReplaceData;
      }
    }, 1000);
  }

  // Get original image URL from HTML source
  function getOriginalImageUrl(imgElement) {
    try {
      // Try to get the original src attribute from the HTML
      const originalSrc = imgElement.getAttribute('src');
      
      // If the src is relative, convert it to absolute
      if (originalSrc && !originalSrc.startsWith('http')) {
        const baseUrl = window.location.origin;
        return new URL(originalSrc, baseUrl).href;
      }
      
      return originalSrc;
    } catch (error) {
      console.error('Error getting original image URL:', error);
      return null;
    }
  }



  // 🎯 REMOVED: Old updateImageInHtml function - now using new user-controlled approach everywhere

  // File upload replacement
  function uploadFileReplace(imageData) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.style.display = 'none';
            document.body.appendChild(input);
            
            input.addEventListener('change', async (e) => {
              const file = e.target.files[0];
      if (!file) {
        document.body.removeChild(input);
        return;
      }
              
              if (file.size > 10 * 1024 * 1024) {
                alert('File size too large. Please choose a file under 10MB.');
        document.body.removeChild(input);
                return;
              }
              
              try {
                const formData = new FormData();
                formData.append('file', file);
        formData.append('oldImagePath', imageData.src);
                formData.append('mobileNumber', '${mobileno}');
                
                const response = await fetch('/api/replace-image', {
                  method: 'POST',
                  body: formData
                });
                
                const result = await response.json();
                
                if (response.ok) {
                  const newUrl = result.newImageUrl + '?v=' + Date.now();
                  console.log('📁 File uploaded successfully, using new approach for HTML update...');
                  
                  // Single phase: Direct image replacement
                  fetch('/api/update-image-url', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      oldImagePath: imageData.originalSrc || imageData.src,
                      newImageUrl: newUrl,
                      mobileNumber: '${mobileno}',
                      currentPagePath: window.location.pathname.split('/').pop() || 'index.html'
                    })
                  })
                  .then(updateResponse => updateResponse.json())
                  .then(updateResult => {
                    if (updateResult.type === 'direct_replace') {
                      // Update DOM and show success
                      imageData.element.src = newUrl;
                      showSuccessMessage(\`Image uploaded and replaced \${updateResult.replacedImage?.alt || 'image'} successfully!\`);
                      
                      setTimeout(() => {
                        scanPageImages();
                      }, 500);
                    } else if (updateResult.type === 'no_images') {
                      showErrorMessage('No images found in current page to replace');
                    } else {
                      // Fallback - update DOM and show success
                      imageData.element.src = newUrl;
                      showSuccessMessage('Image uploaded and replaced successfully!');
                      
                      setTimeout(() => {
                        scanPageImages();
                      }, 500);
                    }
                  })
                  .catch(updateError => {
                    console.error('HTML update after upload failed:', updateError);
                    // Still update DOM even if HTML update fails
                    imageData.element.src = newUrl;
                    showSuccessMessage('Image uploaded! (HTML update may have failed)');
                    
                    setTimeout(() => {
                      scanPageImages();
                    }, 500);
                  });
                } else {
                  throw new Error(result.error || 'Upload failed');
                }
              } catch (error) {
                console.error('Upload error:', error);
                alert('Upload failed: ' + error.message);
              }
              
              document.body.removeChild(input);
            });
            
            input.click();
  }
            
  // URL replacement
  function urlReplace(imageData) {
            const newUrl = prompt('Enter the new image URL:');
            if (!newUrl) return;
            
            try {
              new URL(newUrl); // Validate URL
              
            // 🎯 NEW APPROACH: Always use the image selection modal for better UX
      console.log('🚀 Using new user-controlled approach - fetching available images...');
      
      fetch('/api/update-image-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldImagePath: imageData.originalSrc || imageData.src,
          newImageUrl: newUrl,
          mobileNumber: '${mobileno}',
          currentPagePath: window.location.pathname.split('/').pop() || 'index.html'
        })
      })
      .then(response => response.json())
      .then(result => {
        if (result.error) {
          throw new Error(result.error);
        }
        
        // Handle response
        if (result.type === 'direct_replace') {
          imageData.element.src = newUrl + '?v=' + Date.now();
          showSuccessMessage(\`Successfully replaced \${result.replacedImage?.alt || 'image'} in \${result.updatedFilesCount} file(s)!\`);
        } else if (result.type === 'no_images') {
          showErrorMessage('No images found in current page to replace');
        } else {
          // Fallback for any other response
          imageData.element.src = newUrl + '?v=' + Date.now();
          showSuccessMessage(\`Image updated! \${result.message || 'Replacement completed.'}\`);
        }
        
        // Refresh the list after successful replacement
        console.log('🔄 Auto-refreshing image list after URL replacement');
        setTimeout(() => {
          scanPageImages();
        }, 500);
      })
      .catch(error => {
        console.error('URL update error:', error);
        showErrorMessage('Update failed: ' + error.message);
      });
            } catch (error) {
                alert('Please enter a valid URL');
    }
  }

  // Highlight image on page
  function highlightImage(index) {
    const imageData = currentImages[index];
    if (!imageData) return;

    // Remove existing highlights
    document.querySelectorAll('.image-highlight').forEach(el => {
      el.classList.remove('image-highlight');
    });

    // Add highlight to target image
    imageData.element.classList.add('image-highlight');
    imageData.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Add highlight styles
    const style = document.createElement('style');
    style.textContent = \`
      .image-highlight {
        outline: 3px solid #f59e0b !important;
        outline-offset: 4px !important;
        box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.3) !important;
        transition: all 0.3s ease !important;
      }
    \`;
    document.head.appendChild(style);

    // Remove highlight after 3 seconds
    setTimeout(() => {
      imageData.element.classList.remove('image-highlight');
    }, 3000);
  }

  // Show success message
  function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = \`
      position: fixed !important;
      top: 80px !important;
      right: 20px !important;
      background: #10b981 !important;
      color: white !important;
      padding: 12px 20px !important;
      border-radius: 8px !important;
      z-index: 9999999 !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
      transform: translateX(400px) !important;
      transition: transform 0.3s ease !important;
    \`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      toast.style.transform = 'translateX(400px)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  // Show error message
  function showErrorMessage(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = \`
      position: fixed !important;
      top: 80px !important;
      right: 20px !important;
      background: #ef4444 !important;
      color: white !important;
      padding: 12px 20px !important;
      border-radius: 8px !important;
      z-index: 9999999 !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
      transform: translateX(400px) !important;
      transition: transform 0.3s ease !important;
    \`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      toast.style.transform = 'translateX(400px)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 7000);
  }

  // Show warning message
  function showWarningMessage(message) {
    const toast = document.createElement('div');
    toast.style.cssText = \`
      position: fixed !important;
      top: 80px !important;
      right: 20px !important;
      background: #f59e0b !important;
      color: white !important;
      padding: 15px 20px !important;
      border-radius: 8px !important;
      z-index: 9999999 !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
      transform: translateX(500px) !important;
      transition: transform 0.3s ease !important;
      max-width: 400px !important;
      white-space: pre-line !important;
      line-height: 1.4 !important;
    \`;
    
    // Add warning icon and message
    toast.innerHTML = \`
      <div style="display: flex; align-items: flex-start; gap: 8px;">
        <div style="font-size: 16px; margin-top: 2px;">⚠️</div>
        <div style="flex: 1;">\${message}</div>
      </div>
    \`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      toast.style.transform = 'translateX(500px)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 10000); // Show warning longer
  }

  // Note: Removed modal selection functions - now using direct single-phase replacement

  // Initialize Image Manager
  function initializeImageManager() {
    const button = createImageManagerButton();
    document.body.appendChild(button);
    console.log('🎯 Image Manager initialized and ready!');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeImageManager);
  } else {
    initializeImageManager();
  }
})();
</script>
`;

  // Find a good place to inject the script - preferably before closing body tag
  const bodyClosingTag = htmlContent.lastIndexOf('</body>');
  if (bodyClosingTag !== -1) {
    return htmlContent.slice(0, bodyClosingTag) + script + htmlContent.slice(bodyClosingTag);
  } else {
    // Fallback: append to end of HTML
    return htmlContent + script;
  }
}