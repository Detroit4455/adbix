import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { mobileno: string, path: string[] } }
) {
  try {
    // Await the params before destructuring
    const paramValues = await Promise.resolve(params);
    const { mobileno, path } = paramValues;
    
    const s3BaseUrl = process.env.S3_BASE_URL || 'https://dt-web-sites.s3.ap-south-1.amazonaws.com';
    
    // Construct the path to the S3 resource
    const pathSegments = Array.isArray(path) ? path.join('/') : path;
    const s3Url = `${s3BaseUrl}/sites/${mobileno}/${pathSegments}`;
    
    console.log(`Proxying request to: ${s3Url}`);
    
    // Check if this is a preview mode request
    const url = new URL(request.url);
    const isPreviewMode = url.searchParams.get('preview') === 'true';
    
    // Fetch content from S3
    const response = await fetch(s3Url);
    
    if (!response.ok) {
      return new NextResponse(`Failed to fetch from S3: ${response.statusText}`, {
        status: response.status,
      });
    }
    
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
          'Cache-Control': 'no-cache', // Don't cache preview mode
        },
      });
    } else {
      // For non-HTML files or non-preview mode, return as-is
      const content = await response.arrayBuffer();
      
      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        },
      });
    }
  } catch (error) {
    console.error('Error proxying to S3:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

function injectImageReplaceFeature(htmlContent: string, mobileNumber: string): string {
  // Enhanced CSS for the replace buttons and image management UI
  const previewCSS = `
    <style id="preview-mode-styles">
      .image-replace-container {
        position: relative;
        display: inline-block;
        /* Ensure container inherits the image's display properties */
        max-width: 100%;
      }
      
      /* Handle different image display modes */
      .image-replace-container.block-image {
        display: block;
      }
      
      .image-replace-container.flex-image {
        display: flex;
      }
      
      .image-replace-container img {
        /* Ensure image maintains its original styling */
        position: relative;
        z-index: 1;
      }
      
      .image-replace-overlay {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(59, 130, 246, 0.95);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 8px 14px;
        font-size: 12px;
        cursor: pointer;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        transition: all 0.3s ease;
        z-index: 99999; /* Very high z-index to ensure it's always visible */
        display: block !important; /* Always show, not just on hover */
        opacity: 0.8; /* Slightly transparent when not hovered */
        min-width: 70px;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        user-select: none;
        pointer-events: auto;
        backdrop-filter: blur(4px);
      }
      
      .image-replace-overlay:hover {
        background: rgba(37, 99, 235, 1);
        opacity: 1;
        transform: scale(1.1) translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.5);
      }
      
      .image-replace-overlay:active {
        transform: scale(0.95);
      }
      
      /* Remove the hover-only display rule */
      .image-replace-container:hover .image-replace-overlay {
        opacity: 1;
        animation: slideInReplace 0.3s ease-out;
      }
      
      .image-info-overlay {
        position: absolute;
        bottom: 8px;
        left: 8px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        border: none;
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 11px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
        z-index: 99998;
        display: block !important; /* Always show, not just on hover */
        opacity: 0.7; /* Slightly transparent when not hovered */
        max-width: calc(100% - 100px);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        backdrop-filter: blur(4px);
        user-select: none;
        pointer-events: auto;
      }
      
      .image-info-overlay:hover {
        background: rgba(0, 0, 0, 1);
        opacity: 1;
        transform: translateY(-2px);
      }
      
      .image-replace-container:hover .image-info-overlay {
        opacity: 1;
        animation: slideInInfo 0.3s ease-out;
      }
      
      @keyframes slideInInfo {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* Special handling for hero images and full-width images */
      .image-replace-container.hero-image {
        width: 100%;
        height: auto;
        position: relative !important; /* Force relative positioning */
      }
      
      .image-replace-container.hero-image .image-replace-overlay {
        top: 15px !important;
        right: 15px !important;
        padding: 12px 18px !important;
        font-size: 14px !important;
        font-weight: 700 !important;
        min-width: 90px !important;
        background: rgba(239, 68, 68, 0.95) !important; /* Red color for hero images */
        border: 2px solid rgba(255, 255, 255, 0.3) !important;
        opacity: 0.9 !important;
      }
      
      .image-replace-container.hero-image .image-replace-overlay:hover {
        background: rgba(220, 38, 38, 1) !important;
        opacity: 1 !important;
        transform: scale(1.15) translateY(-3px) !important;
      }
      
      .image-replace-container.hero-image .image-info-overlay {
        bottom: 15px !important;
        left: 15px !important;
        padding: 8px 12px !important;
        font-size: 12px !important;
        background: rgba(0, 0, 0, 0.95) !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        opacity: 0.8 !important;
      }
      
      /* Handle images with complex parent structures */
      .image-replace-container.forced-visibility .image-replace-overlay,
      .image-replace-container.forced-visibility .image-info-overlay {
        display: block !important;
        opacity: 0.9 !important;
        position: fixed !important; /* Use fixed positioning for complex layouts */
      }
      
      .image-replace-container.forced-visibility:hover .image-replace-overlay,
      .image-replace-container.forced-visibility:hover .image-info-overlay {
        opacity: 1 !important;
      }
      
      .image-replace-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 100000;
        backdrop-filter: blur(8px);
      }
      .image-replace-modal-content {
        background: white;
        padding: 32px;
        border-radius: 16px;
        max-width: 520px;
        width: 90%;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        max-height: 90vh;
        overflow-y: auto;
      }
      .image-replace-modal h3 {
        margin: 0 0 20px 0;
        color: #1f2937;
        font-size: 20px;
        font-weight: 600;
        display: flex;
        align-items: center;
      }
      .image-replace-modal h3 svg {
        margin-right: 8px;
      }
      .image-current-info {
        background: #f3f4f6;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        border-left: 4px solid #6366f1;
      }
      .image-current-info p {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #374151;
      }
      .image-current-info .current-url {
        font-family: monospace;
        background: white;
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #d1d5db;
        font-size: 12px;
        word-break: break-all;
        color: #1f2937;
      }
      .image-preview {
        text-align: center;
        margin-bottom: 20px;
      }
      .image-preview img {
        max-width: 100%;
        max-height: 200px;
        border-radius: 8px;
        border: 2px solid #e5e7eb;
      }
      .upload-section {
        margin-bottom: 20px;
      }
      .upload-section h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 500;
        color: #374151;
      }
      .upload-tabs {
        display: flex;
        border-bottom: 2px solid #e5e7eb;
        margin-bottom: 16px;
      }
      .upload-tab {
        padding: 8px 16px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
      }
      .upload-tab.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
        background: #eff6ff;
      }
      .upload-tab:not(.active) {
        color: #6b7280;
      }
      .upload-tab:not(.active):hover {
        color: #374151;
      }
      .tab-content {
        display: none;
      }
      .tab-content.active {
        display: block;
      }
      .image-replace-modal input[type="file"] {
        width: 100%;
        padding: 12px;
        border: 2px dashed #d1d5db;
        border-radius: 8px;
        margin-bottom: 16px;
        background: #fafafa;
        cursor: pointer;
        transition: all 0.2s;
      }
      .image-replace-modal input[type="file"]:hover {
        border-color: #3b82f6;
        background: #eff6ff;
      }
      .image-replace-modal input[type="url"] {
        width: 100%;
        padding: 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        margin-bottom: 16px;
        font-size: 14px;
      }
      .image-replace-modal input[type="url"]:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      .url-preview {
        margin-top: 12px;
        text-align: center;
      }
      .url-preview img {
        max-width: 100%;
        max-height: 150px;
        border-radius: 6px;
        border: 1px solid #e5e7eb;
      }
      .image-replace-modal-buttons {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 24px;
      }
      .image-replace-modal button {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        transition: all 0.2s;
      }
      .image-replace-cancel {
        background: #f3f4f6;
        color: #374151;
      }
      .image-replace-cancel:hover {
        background: #e5e7eb;
      }
      .image-replace-upload {
        background: #3b82f6;
        color: white;
      }
      .image-replace-upload:hover {
        background: #2563eb;
      }
      .image-replace-upload:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }
      .image-replace-preview-badge {
        position: fixed;
        top: 15px;
        left: 15px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        padding: 10px 16px;
        border-radius: 25px;
        font-size: 12px;
        font-weight: 700;
        z-index: 99999;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        display: flex;
        align-items: center;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .image-replace-preview-badge::before {
        content: '●';
        margin-right: 8px;
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .success-message {
        position: fixed;
        top: 70px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 100001;
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
        display: flex;
        align-items: center;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
      }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .error-message {
        position: fixed;
        top: 70px;
        right: 20px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 100001;
        box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
        display: flex;
        align-items: center;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
      }
      
      /* Image Gallery Panel */
      .image-gallery-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 350px;
        height: 100vh;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(10px);
        border-left: 1px solid #e5e7eb;
        z-index: 99990;
        overflow-y: auto;
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
        transform: translateX(100%);
        transition: transform 0.3s ease-out;
      }
      
      .image-gallery-panel.open {
        transform: translateX(0);
      }
      
      .image-gallery-header {
        position: sticky;
        top: 0;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .image-gallery-title {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
      }
      
      .image-gallery-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6b7280;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s;
      }
      
      .image-gallery-close:hover {
        background: #f3f4f6;
        color: #374151;
      }
      
      .image-gallery-content {
        padding: 20px;
      }
      
      .image-gallery-stats {
        background: #f8fafc;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-size: 14px;
        color: #475569;
        border-left: 4px solid #3b82f6;
      }
      
      .image-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      
      .image-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: #3b82f6;
      }
      
      .image-card-preview {
        width: 100%;
        height: 120px;
        background: #f3f4f6;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
        overflow: hidden;
      }
      
      .image-card-preview img {
        max-width: 100%;
        max-height: 100%;
        object-fit: cover;
        border-radius: 6px;
      }
      
      .image-card-info {
        margin-bottom: 12px;
      }
      
      .image-card-path {
        font-family: monospace;
        font-size: 11px;
        color: #6b7280;
        background: #f8fafc;
        padding: 6px 8px;
        border-radius: 4px;
        word-break: break-all;
        margin-bottom: 8px;
        border: 1px solid #e5e7eb;
      }
      
      .image-card-details {
        display: flex;
        gap: 12px;
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 12px;
      }
      
      .image-card-detail {
        background: #eff6ff;
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid #dbeafe;
      }
      
      .image-card-actions {
        display: flex;
        gap: 8px;
      }
      
      .image-card-replace-btn {
        flex: 1;
        background: #3b82f6;
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .image-card-replace-btn:hover {
        background: #2563eb;
        transform: translateY(-1px);
      }
      
      .image-card-replace-btn.hero {
        background: #ef4444;
      }
      
      .image-card-replace-btn.hero:hover {
        background: #dc2626;
      }
      
      .image-gallery-toggle {
        position: fixed;
        top: 70px;
        right: 20px;
        background: #3b82f6;
        color: white;
        border: none;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        z-index: 99991;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .image-gallery-toggle:hover {
        background: #2563eb;
        transform: translateY(-1px);
      }
      
      .image-gallery-toggle.open {
        right: 370px;
      }
      
      /* Background image specific styling */
      .has-bg-image-controls {
        position: relative !important;
      }
      
      .bg-image-overlay {
        background: rgba(139, 92, 246, 0.95) !important; /* Purple for background images */
      }
      
      .bg-image-overlay:hover {
        background: rgba(109, 40, 217, 1) !important;
      }
      
      .bg-image-overlay.hero-bg {
        background: rgba(239, 68, 68, 0.95) !important; /* Red for hero backgrounds */
      }
      
      .bg-image-overlay.hero-bg:hover {
        background: rgba(220, 38, 38, 1) !important;
      }
      
      .image-card.bg-image {
        border-left: 4px solid #8b5cf6 !important;
        background: linear-gradient(135deg, #f9fafb, #f3e8ff) !important;
      }
      
      .image-card.bg-image .image-card-replace-btn {
        background: #8b5cf6 !important;
      }
      
      .image-card.bg-image .image-card-replace-btn:hover {
        background: #7c3aed !important;
      }
    </style>
  `;

  // Enhanced JavaScript for handling image replacement with URL support
  const previewJS = `
    <script id="preview-mode-script">
      (function() {
        'use strict';
        
        console.log('Preview mode script loaded for mobile number: ${mobileNumber}');
        
        const mobileNumber = '${mobileNumber}';
        let currentImagePath = '';
        let currentImageElement = null;
        let currentImageType = '';
        let activeTab = 'file';
        
        // Add preview mode badge
        function addPreviewBadge() {
          try {
            const badge = document.createElement('div');
            badge.className = 'image-replace-preview-badge';
            badge.innerHTML = '● Preview Mode';
            document.body.appendChild(badge);
            console.log('Preview badge added');
          } catch (error) {
            console.error('Error adding preview badge:', error);
          }
        }
        
        // Add image gallery panel and toggle button
        function addImageGallery() {
          try {
            // Create toggle button
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'image-gallery-toggle';
            toggleBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>Images';
            toggleBtn.onclick = toggleImageGallery;
            document.body.appendChild(toggleBtn);
            
            // Create gallery panel
            const panel = document.createElement('div');
            panel.className = 'image-gallery-panel';
            panel.id = 'image-gallery-panel';
            panel.innerHTML = 
              '<div class="image-gallery-header">' +
                '<h3 class="image-gallery-title">Page Images</h3>' +
                '<div style="display: flex; gap: 8px; align-items: center;">' +
                  '<button onclick="refreshImageGallery()" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">Refresh</button>' +
                  '<button class="image-gallery-close" onclick="toggleImageGallery()">×</button>' +
                '</div>' +
              '</div>' +
              '<div class="image-gallery-content">' +
                '<div class="image-gallery-stats" id="image-gallery-stats">Loading images...</div>' +
                '<div id="image-gallery-list"></div>' +
              '</div>';
            
            document.body.appendChild(panel);
            
            // Populate gallery with images
            populateImageGallery();
            
            console.log('Image gallery added');
          } catch (error) {
            console.error('Error adding image gallery:', error);
          }
        }
        
        // Get image path relative to the site root
        function getImagePath(img) {
          try {
            const imgSrc = img.getAttribute('src');
            console.log('Original image src:', imgSrc);
            
            // Handle missing or empty src
            if (!imgSrc || imgSrc.trim() === '') {
              console.log('Image has no src attribute, skipping');
              return null;
            }
            
            // Handle data URLs - allow them for external URL replacement
            if (imgSrc.startsWith('data:')) {
              console.log('Detected data URL image');
              return imgSrc; // Return the data URL itself for replacement
            }
            
            // Handle blob URLs - allow them for external URL replacement
            if (imgSrc.startsWith('blob:')) {
              console.log('Detected blob URL image');
              return imgSrc; // Return the blob URL itself for replacement
            }
            
            // Handle relative paths
            if (!imgSrc.startsWith('http') && !imgSrc.startsWith('//')) {
              // Remove leading slash and ./
              let path = imgSrc;
              if (path.startsWith('./')) {
                path = path.slice(2);
              } else if (path.startsWith('/')) {
                path = path.slice(1);
              }
              console.log('Detected local image path:', path);
              return path;
            }
            
            // Handle protocol-relative URLs
            if (imgSrc.startsWith('//')) {
              console.log('Detected protocol-relative URL:', imgSrc);
              return 'https:' + imgSrc; // Convert to absolute URL
            }
            
            // Handle absolute URLs pointing to the same S3 bucket
            const s3BaseUrl = 'https://dt-web-sites.s3.ap-south-1.amazonaws.com/sites/' + mobileNumber + '/';
            if (imgSrc.startsWith(s3BaseUrl)) {
              const path = imgSrc.replace(s3BaseUrl, '');
              console.log('Detected S3 image path:', path);
              return path;
            }
            
            // Handle other S3 URL formats
            const s3AltFormats = [
              'https://s3.ap-south-1.amazonaws.com/dt-web-sites/sites/' + mobileNumber + '/',
              'https://dt-web-sites.s3.amazonaws.com/sites/' + mobileNumber + '/',
            ];
            
            for (const altFormat of s3AltFormats) {
              if (imgSrc.startsWith(altFormat)) {
                const path = imgSrc.replace(altFormat, '');
                console.log('Detected S3 image path (alt format):', path);
                return path;
              }
            }
            
            // Return the full URL for external images
            console.log('Detected external image URL:', imgSrc);
            return imgSrc;
          } catch (error) {
            console.error('Error getting image path:', error);
            // Don't return null on error - try to return something usable
            return img.getAttribute('src') || null;
          }
        }
        
        // Wrap images with replace functionality
        function wrapImages() {
          try {
            // Use a more specific selector and also check for our processing flag
            const images = document.querySelectorAll('img:not([data-image-processed]):not(.image-replace-container img)');
            console.log('Found ' + images.length + ' unprocessed images to wrap');
            
            // If no new images to wrap, return early
            if (images.length === 0) {
              console.log('No unprocessed images found, skipping wrap');
              return;
            }
            
            images.forEach((img, index) => {
              // Triple-check: mark as processed immediately to prevent re-processing
              if (img.getAttribute('data-image-processed') === 'true') {
                console.log('Image ' + (index + 1) + ' already marked as processed, skipping');
                return;
              }
              
              // Mark image as being processed
              img.setAttribute('data-image-processed', 'true');
              
              // Final safety check - if already wrapped, just mark and skip
              if (img.parentElement && img.parentElement.classList.contains('image-replace-container')) {
                console.log('Image ' + (index + 1) + ' already wrapped, marking and skipping');
                return;
              }
              
              const imagePath = getImagePath(img);
              if (!imagePath) {
                console.log('Image ' + (index + 1) + ' has no valid path, skipping');
                return;
              }
              
              console.log('Wrapping image ' + (index + 1) + ': ' + imagePath);
              
              // Create wrapper container
              const container = document.createElement('div');
              container.className = 'image-replace-container';
              container.setAttribute('data-image-container', 'true'); // Mark our containers
              
              // Detect image characteristics and apply appropriate classes
              const imgStyle = window.getComputedStyle(img);
              const imgRect = img.getBoundingClientRect();
              
              console.log('Image ' + (index + 1) + ' dimensions: ' + imgRect.width + 'x' + imgRect.height);
              
              // Enhanced hero/banner image detection
              const isLargeWidth = imgRect.width > window.innerWidth * 0.6;
              const isLargeHeight = imgRect.height > 200;
              const isBlockDisplay = imgStyle.display === 'block';
              const hasHeroClass = img.closest('.hero, .banner, .jumbotron, [class*="hero"], [class*="banner"], [class*="Hero"], [class*="Banner"]');
              const isFullWidth = imgRect.width >= (window.innerWidth - 100);
              const hasHeroSrc = /hero|banner|header|main|featured|cover|bg|background/i.test(imagePath);
              
              if (isLargeWidth || isLargeHeight || isBlockDisplay || hasHeroClass || isFullWidth || hasHeroSrc) {
                container.classList.add('hero-image');
                console.log('Image ' + (index + 1) + ' detected as HERO image');
              } else {
                console.log('Image ' + (index + 1) + ' detected as regular image');
              }
              
              // Handle different display modes
              if (imgStyle.display === 'block') {
                container.classList.add('block-image');
              } else if (imgStyle.display === 'flex') {
                container.classList.add('flex-image');
              }
              
              // Check for complex parent structures that might hide overlays
              const parentHasHighZIndex = checkParentZIndex(img);
              const parentHasComplexPosition = checkParentPositioning(img);
              
              if (parentHasHighZIndex || parentHasComplexPosition) {
                container.classList.add('forced-visibility');
                console.log('Image ' + (index + 1) + ' has complex parent structure');
              }
              
              // Create replace button
              const replaceBtn = document.createElement('button');
              replaceBtn.className = 'image-replace-overlay';
              replaceBtn.textContent = 'Replace';
              replaceBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Replace button clicked for image: ' + imagePath);
                openReplaceModal(imagePath, img, 'image');
              };
              
              // Create info overlay
              const infoBtn = document.createElement('div');
              infoBtn.className = 'image-info-overlay';
              infoBtn.textContent = imagePath.length > 30 ? '...' + imagePath.slice(-30) : imagePath;
              infoBtn.title = imagePath;
              
              // Wrap the image
              try {
                img.parentNode.insertBefore(container, img);
                container.appendChild(img);
                container.appendChild(replaceBtn);
                container.appendChild(infoBtn);
                console.log('Successfully wrapped image ' + (index + 1));
              } catch (wrapError) {
                console.error('Error wrapping image ' + (index + 1) + ':', wrapError);
                // Remove the processed flag if wrapping failed
                img.removeAttribute('data-image-processed');
              }
            });
            
            const totalWrapped = document.querySelectorAll('.image-replace-container').length;
            const totalProcessed = document.querySelectorAll('img[data-image-processed="true"]').length;
            console.log('Wrapping complete - Total containers: ' + totalWrapped + ', Total processed: ' + totalProcessed);
          } catch (error) {
            console.error('Error wrapping images:', error);
          }
        }
        
        // Helper function to check if parent elements have high z-index
        function checkParentZIndex(element) {
          let parent = element.parentElement;
          while (parent && parent !== document.body) {
            const style = window.getComputedStyle(parent);
            const zIndex = parseInt(style.zIndex);
            if (!isNaN(zIndex) && zIndex > 1000) {
              return true;
            }
            parent = parent.parentElement;
          }
          return false;
        }
        
        // Helper function to check if parent has complex positioning
        function checkParentPositioning(element) {
          let parent = element.parentElement;
          while (parent && parent !== document.body) {
            const style = window.getComputedStyle(parent);
            if (style.position === 'fixed' || 
                style.position === 'sticky' ||
                style.overflow === 'hidden' ||
                style.transform !== 'none') {
              return true;
            }
            parent = parent.parentElement;
          }
          return false;
        }
        
        // Create and show replace modal
        function openReplaceModal(imagePath, imgElement, imageType) {
          try {
            imageType = imageType || 'image'; // Default to regular image
            console.log('Opening replace modal for ' + imageType + ':', imagePath);
            
            currentImagePath = imagePath;
            currentImageElement = imgElement;
            currentImageType = imageType; // Store the image type
            
            // Remove existing modal
            const existingModal = document.getElementById('image-replace-modal');
            if (existingModal) {
              existingModal.remove();
            }
            
            // Determine if this is an external URL or local image
            const isExternalUrl = imagePath.startsWith('http');
            const isLocalImage = !isExternalUrl;
            
            // Get current image URL for preview
            let currentImageUrl;
            if (isExternalUrl) {
              currentImageUrl = imagePath;
            } else if (imageType === 'background') {
              currentImageUrl = 'https://dt-web-sites.s3.ap-south-1.amazonaws.com/sites/' + mobileNumber + '/' + imagePath;
            } else {
              currentImageUrl = 'https://dt-web-sites.s3.ap-south-1.amazonaws.com/sites/' + mobileNumber + '/' + imagePath;
            }
            
            const modalTitle = imageType === 'background' ? 'Replace Background Image' : 'Replace Image';
            const imageTypeLabel = imageType === 'background' ? 'Background Image' : 'Image';
            
            // Create modal
            const modal = document.createElement('div');
            modal.id = 'image-replace-modal';
            modal.className = 'image-replace-modal';
            modal.style.display = 'flex';
            
            modal.innerHTML = '<div class="image-replace-modal-content">' +
              '<h3>' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
                  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />' +
                '</svg>' +
                modalTitle +
              '</h3>' +
              '<div class="image-current-info">' +
                '<p><strong>Current ' + imageTypeLabel + ':</strong></p>' +
                '<div class="current-url">' + imagePath + '</div>' +
                '<div class="image-preview">' +
                  '<img src="' + currentImageUrl + '" alt="Current ' + imageTypeLabel.toLowerCase() + '" onerror="this.style.display=' + "'none'" + '">' +
                '</div>' +
              '</div>' +
              '<div class="upload-section">' +
                '<h4>Choose replacement method:</h4>' +
                '<div class="upload-tabs">' +
                  '<div class="upload-tab active" onclick="switchTab(' + "'file'" + ')">Upload File</div>' +
                  '<div class="upload-tab" onclick="switchTab(' + "'url'" + ')">Use URL</div>' +
                '</div>' +
                '<div id="file-tab" class="tab-content active">' +
                  '<input type="file" id="new-image-input" accept="image/*" onchange="handleFileSelect(this)">' +
                  '<p style="font-size: 12px; color: #6b7280; margin: 0;">' +
                    'Supported formats: JPEG, PNG, GIF, WebP. Max size: 10MB' +
                  '</p>' +
                '</div>' +
                '<div id="url-tab" class="tab-content">' +
                  '<input type="url" id="new-image-url" placeholder="https://example.com/image.jpg" oninput="handleUrlInput(this.value)">' +
                  '<p style="font-size: 12px; color: #6b7280; margin: 0 0 12px 0;">' +
                    'Enter the URL of an image you want to use' +
                  '</p>' +
                  '<div id="url-preview" class="url-preview" style="display: none;">' +
                    '<img id="url-preview-img" alt="URL preview">' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="image-replace-modal-buttons">' +
                '<button type="button" class="image-replace-cancel" onclick="closeReplaceModal()">Cancel</button>' +
                '<button type="button" class="image-replace-upload" onclick="replaceImage()" disabled>Replace ' + imageTypeLabel + '</button>' +
              '</div>' +
            '</div>';
            
            document.body.appendChild(modal);
            
            // Close modal when clicking outside
            modal.onclick = (e) => {
              if (e.target === modal) {
                closeReplaceModal();
              }
            };
          } catch (error) {
            console.error('Error opening replace modal:', error);
          }
        }
        
        // Switch between upload tabs
        window.switchTab = function(tabName) {
          try {
            activeTab = tabName;
            
            // Update tab buttons
            document.querySelectorAll('.upload-tab').forEach(tab => {
              tab.classList.remove('active');
            });
            const activeTabElement = document.querySelector('.upload-tab[onclick*="' + tabName + '"]');
            if (activeTabElement) {
              activeTabElement.classList.add('active');
            }
            
            // Update tab content
            document.querySelectorAll('.tab-content').forEach(content => {
              content.classList.remove('active');
            });
            const activeContent = document.getElementById(tabName + '-tab');
            if (activeContent) {
              activeContent.classList.add('active');
            }
            
            // Reset upload button state
            const uploadBtn = document.querySelector('.image-replace-upload');
            if (uploadBtn) {
              uploadBtn.disabled = true;
              uploadBtn.textContent = 'Replace Image';
            }
          } catch (error) {
            console.error('Error switching tab:', error);
          }
        };
        
        // Handle file selection
        window.handleFileSelect = function(input) {
          try {
            const uploadBtn = document.querySelector('.image-replace-upload');
            if (uploadBtn) {
              uploadBtn.disabled = !input.files[0];
              uploadBtn.textContent = input.files[0] ? 'Replace with File' : 'Replace Image';
            }
          } catch (error) {
            console.error('Error handling file select:', error);
          }
        };
        
        // Handle URL input
        window.handleUrlInput = function(url) {
          try {
            const uploadBtn = document.querySelector('.image-replace-upload');
            const urlPreview = document.getElementById('url-preview');
            const urlPreviewImg = document.getElementById('url-preview-img');
            
            if (url && isValidImageUrl(url)) {
              if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Replace with URL';
              }
              
              // Show preview
              if (urlPreviewImg) {
                urlPreviewImg.src = url;
                urlPreviewImg.onload = () => {
                  if (urlPreview) urlPreview.style.display = 'block';
                };
                urlPreviewImg.onerror = () => {
                  if (urlPreview) urlPreview.style.display = 'none';
                };
              }
            } else {
              if (uploadBtn) {
                uploadBtn.disabled = true;
                uploadBtn.textContent = 'Replace Image';
              }
              if (urlPreview) urlPreview.style.display = 'none';
            }
          } catch (error) {
            console.error('Error handling URL input:', error);
          }
        };
        
        // Validate image URL
        function isValidImageUrl(url) {
          try {
            new URL(url);
            return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.includes('image');
          } catch {
            return false;
          }
        }
        
        // Close modal
        window.closeReplaceModal = function() {
          try {
            const modal = document.getElementById('image-replace-modal');
            if (modal) {
              modal.remove();
            }
          } catch (error) {
            console.error('Error closing modal:', error);
          }
        };
        
        // Replace image (unified function for both file and URL)
        window.replaceImage = function() {
          try {
            const uploadBtn = document.querySelector('.image-replace-upload');
            if (uploadBtn) {
              uploadBtn.textContent = 'Replacing...';
              uploadBtn.disabled = true;
            }
            
            if (activeTab === 'file') {
              uploadImageFile();
            } else {
              updateImageUrl();
            }
          } catch (error) {
            console.error('Error replacing image:', error);
            resetUploadButton();
          }
        };
        
        // Upload new image file
        function uploadImageFile() {
          try {
            const fileInput = document.getElementById('new-image-input');
            const file = fileInput ? fileInput.files[0] : null;
            
            if (!file) {
              showErrorMessage('Please select an image file');
              resetUploadButton();
              return;
            }
            
            const formData = new FormData();
            formData.append('imageFile', file);
            formData.append('imagePath', currentImagePath);
            formData.append('mobileNumber', mobileNumber);
            
            fetch('/api/replace-image', {
              method: 'POST',
              body: formData
            })
            .then(response => response.json())
            .then(data => {
              if (data.error) {
                throw new Error(data.error);
              }
              
              updateImageSources();
              closeReplaceModal();
              showSuccessMessage('Image replaced successfully!');
            })
            .catch(error => {
              console.error('Error replacing image:', error);
              showErrorMessage('Failed to replace image: ' + error.message);
              resetUploadButton();
            });
          } catch (error) {
            console.error('Error in uploadImageFile:', error);
            resetUploadButton();
          }
        }
        
        // Update image URL (for external URLs)
        function updateImageUrl() {
          try {
            const urlInput = document.getElementById('new-image-url');
            const newUrl = urlInput ? urlInput.value.trim() : '';
            
            console.log('updateImageUrl called:');
            console.log('- currentImagePath:', currentImagePath);
            console.log('- newUrl:', newUrl);
            
            if (!newUrl || !isValidImageUrl(newUrl)) {
              showErrorMessage('Please enter a valid image URL');
              resetUploadButton();
              return;
            }
            
            // IMPORTANT: ALL URL changes should be saved to HTML files on S3
            // so they persist after page refresh, regardless of local or external URLs
            console.log('Sending API request to update HTML files (save all URL changes to S3)...');
            fetch('/api/update-image-url', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                oldImagePath: currentImagePath,
                newImageUrl: newUrl,
                mobileNumber: mobileNumber
              })
            })
            .then(response => {
              console.log('API response status:', response.status);
              return response.json();
            })
            .then(data => {
              console.log('API response data:', data);
              if (data.error) {
                throw new Error(data.error);
              }
              
              // Update images in current page immediately
              updateImageSources(newUrl);
              closeReplaceModal();
              
              // Show detailed success message
              const filesCount = data.updatedFiles ? data.updatedFiles.length : 0;
              let successMessage = 'Image URL updated successfully!';
              if (filesCount > 0) {
                const fileNames = data.updatedFiles.map(function(f) { return f.split('/').pop(); }).join(', ');
                successMessage = 'Image URL updated in ' + filesCount + ' HTML file(s): ' + fileNames + ' and saved to S3';
              } else {
                successMessage = 'Image URL updated in current page (no HTML files found with this image reference)';
              }
              showSuccessMessage(successMessage);
              
              // Force page refresh after a short delay to show the saved changes
              if (filesCount > 0) {
                setTimeout(function() {
                  console.log('Refreshing page to show saved changes...');
                  window.location.reload();
                }, 2000);
              }
            })
            .catch(error => {
              console.error('Error updating image URL:', error);
              showErrorMessage('Failed to update image URL: ' + error.message);
              resetUploadButton();
            });
          } catch (error) {
            console.error('Error in updateImageUrl:', error);
            resetUploadButton();
          }
        }
        
        // Update image sources after file upload or URL change
        function updateImageSources(newUrl) {
          try {
            console.log('updateImageSources called:');
            console.log('- currentImagePath:', currentImagePath);
            console.log('- currentImageType:', currentImageType);
            console.log('- newUrl:', newUrl);
            
            if (currentImageType === 'background') {
              // Handle background image replacement
              if (currentImageElement) {
                const oldBgImage = currentImageElement.style.backgroundImage;
                if (newUrl) {
                  // Use the new URL for background image
                  currentImageElement.style.backgroundImage = 'url("' + newUrl + '")';
                  console.log('- updated background image:', oldBgImage, '->', 'url("' + newUrl + '")');
                } else {
                  // For file uploads, add cache busting parameter
                  const newBgUrl = 'url("' + currentImagePath + '?t=' + Date.now() + '")';
                  currentImageElement.style.backgroundImage = newBgUrl;
                  console.log('- updated background image with cache bust:', oldBgImage, '->', newBgUrl);
                }
              }
              
              // Also update any other elements with the same background image
              const allElements = document.querySelectorAll('*');
              let updatedCount = 0;
              allElements.forEach((element) => {
                const bgImage = window.getComputedStyle(element).backgroundImage;
                if (bgImage && bgImage.includes(currentImagePath)) {
                  if (newUrl) {
                    element.style.backgroundImage = 'url("' + newUrl + '")';
                  } else {
                    element.style.backgroundImage = 'url("' + currentImagePath + '?t=' + Date.now() + '")';
                  }
                  updatedCount++;
                }
              });
              console.log('- updated ' + updatedCount + ' background images total');
            } else {
              // Handle regular img element replacement (existing logic)
              const selector = 'img[src="' + currentImagePath + '"]';
              console.log('- searching for images with selector:', selector);
              
              const images = document.querySelectorAll(selector);
              console.log('- found', images.length, 'images to update');
              
              images.forEach((img, index) => {
                const oldSrc = img.src;
                if (newUrl) {
                  // Use the new URL directly
                  img.src = newUrl;
                  console.log('- updated image', index + 1, ':', oldSrc, '->', newUrl);
                } else {
                  // For file uploads, add cache busting parameter
                  const newSrc = currentImagePath + '?t=' + Date.now();
                  img.src = newSrc;
                  console.log('- updated image', index + 1, 'with cache bust:', oldSrc, '->', newSrc);
                }
              });
              
              // Also update the current element if it exists
              if (currentImageElement && newUrl) {
                console.log('- updating currentImageElement directly');
                currentImageElement.src = newUrl;
              }
            }
            
            console.log('Image sources update completed');
          } catch (error) {
            console.error('Error updating image sources:', error);
          }
        }
        
        // Reset upload button
        function resetUploadButton() {
          try {
            const uploadBtn = document.querySelector('.image-replace-upload');
            if (uploadBtn) {
              uploadBtn.textContent = 'Replace Image';
              uploadBtn.disabled = false;
            }
          } catch (error) {
            console.error('Error resetting upload button:', error);
          }
        }
        
        // Show success message
        function showSuccessMessage(message) {
          try {
            const successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            successMsg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="margin-right: 8px;">' +
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />' +
              '</svg>' + message;
            document.body.appendChild(successMsg);
            
            setTimeout(() => {
              if (successMsg && successMsg.parentNode) {
                successMsg.remove();
              }
            }, 4000);
          } catch (error) {
            console.error('Error showing success message:', error);
          }
        }
        
        // Show error message
        function showErrorMessage(message) {
          try {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="margin-right: 8px;">' +
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />' +
              '</svg>' + message;
            document.body.appendChild(errorMsg);
            
            setTimeout(() => {
              if (errorMsg && errorMsg.parentNode) {
                errorMsg.remove();
              }
            }, 5000);
          } catch (error) {
            console.error('Error showing error message:', error);
          }
        }
        
        // Initialize when DOM is ready
        function initialize() {
          try {
            console.log('Initializing image replacement functionality...');
            addPreviewBadge();
            addImageGallery();
            
            // Initial wrap of images and background images
            wrapImages();
            wrapBackgroundImages();
            
            // Disabled retry mechanism to prevent loops
            // Users can manually refresh the gallery if needed
            console.log('Auto-retry mechanism disabled to prevent loops');
            
            // Disabled mutation observer to prevent loops
            // Manual refresh option available in gallery
            console.log('Mutation observer disabled to prevent loops');
            
            // Listen for image load events to catch lazy-loaded images (with safety checks)
            document.addEventListener('load', function(event) {
              if (event.target.tagName === 'IMG' && !event.target.getAttribute('data-image-processed')) {
                console.log('New image loaded:', event.target.src);
                setTimeout(function() {
                  // Only process this specific image if not already processed
                  if (!event.target.getAttribute('data-image-processed')) {
                    console.log('Processing newly loaded image...');
                    wrapImages();
                    wrapBackgroundImages(); // Also check for new background images
                  }
                }, 500);
              }
            }, true);
            
            // Add manual refresh option for gallery
            window.refreshImageGallery = function() {
              console.log('Manual gallery refresh triggered');
              // Also refresh background image processing
              wrapBackgroundImages();
              populateImageGallery();
            };
            
            // Force gallery refresh on window resize (but don't re-wrap images)
            let resizeTimeout;
            window.addEventListener('resize', function() {
              clearTimeout(resizeTimeout);
              resizeTimeout = setTimeout(function() {
                console.log('Window resized, refreshing gallery only...');
                // Only refresh gallery if it's open, don't re-wrap images
                const panel = document.getElementById('image-gallery-panel');
                if (panel && panel.classList.contains('open')) {
                  populateImageGallery();
                }
              }, 1000);
            });
            
            console.log('Image replacement functionality initialized successfully');
          } catch (error) {
            console.error('Error during initialization:', error);
          }
        }
        
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initialize);
        } else {
          initialize();
        }
        
        // Toggle image gallery panel
        window.toggleImageGallery = function() {
          try {
            const panel = document.getElementById('image-gallery-panel');
            const toggleBtn = document.querySelector('.image-gallery-toggle');
            
            if (panel && toggleBtn) {
              const isOpen = panel.classList.contains('open');
              
              if (isOpen) {
                panel.classList.remove('open');
                toggleBtn.classList.remove('open');
              } else {
                panel.classList.add('open');
                toggleBtn.classList.add('open');
                // Refresh gallery when opened
                populateImageGallery();
              }
            }
          } catch (error) {
            console.error('Error toggling image gallery:', error);
          }
        };
        
        // Populate image gallery with current page images
        function populateImageGallery() {
          try {
            // Debounce to prevent excessive calls
            if (window.galleryPopulateInProgress) {
              console.log('Gallery populate already in progress, skipping...');
              return;
            }
            
            window.galleryPopulateInProgress = true;
            
            const galleryList = document.getElementById('image-gallery-list');
            const galleryStats = document.getElementById('image-gallery-stats');
            
            if (!galleryList || !galleryStats) {
              window.galleryPopulateInProgress = false;
              return;
            }
            
            // Get all images from the page (only unwrapped ones to count accurately)
            const allImages = document.querySelectorAll('img');
            const wrappedImages = document.querySelectorAll('.image-replace-container img');
            const bgImageElements = document.querySelectorAll('[data-bg-processed="true"]');
            const imageData = [];
            
            console.log('Gallery: Found', allImages.length, 'total images,', wrappedImages.length, 'wrapped images,', bgImageElements.length, 'background images');
            
            // Use wrapped images for the gallery (they have proper containers)
            wrappedImages.forEach((img, index) => {
              const imagePath = getImagePath(img);
              if (!imagePath) return;
              
              const imgRect = img.getBoundingClientRect();
              const imgStyle = window.getComputedStyle(img);
              
              // Check if parent container has hero class
              const isHero = img.closest('.image-replace-container').classList.contains('hero-image');
              
              // Get public URL specific to this page
              const isExternalUrl = imagePath.startsWith('http');
              let publicUrl, displayPath;
              
              if (isExternalUrl) {
                publicUrl = imagePath;
                displayPath = imagePath;
              } else {
                // Create public URL for this specific page
                const currentPagePath = window.location.pathname;
                publicUrl = window.location.origin + currentPagePath.replace(/\\/[^/]*$/, '/') + imagePath;
                displayPath = imagePath;
              }
              
              imageData.push({
                index: index + 1,
                element: img,
                path: imagePath,
                publicUrl: publicUrl,
                displayPath: displayPath,
                isExternal: isExternalUrl,
                isHero: isHero,
                imageType: 'image',
                width: Math.round(imgRect.width),
                height: Math.round(imgRect.height)
              });
            });
            
            // Add background images to the gallery
            bgImageElements.forEach((element, index) => {
              const computedStyle = window.getComputedStyle(element);
              const bgImage = computedStyle.backgroundImage;
              
              if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
                const urlMatch = bgImage.match(/url\(['"]?([^'"]*?)['"]?\)/);
                if (urlMatch && urlMatch[1]) {
                  const imageUrl = urlMatch[1];
                  const rect = element.getBoundingClientRect();
                  
                  // Check if it's a hero background
                  const isHero = element.classList.contains('hero-bg-image');
                  
                  // Get public URL
                  const isExternalUrl = imageUrl.startsWith('http');
                  let publicUrl, displayPath;
                  
                  if (isExternalUrl) {
                    publicUrl = imageUrl;
                    displayPath = imageUrl;
                  } else {
                    const currentPagePath = window.location.pathname;
                    publicUrl = window.location.origin + currentPagePath.replace(/\\/[^/]*$/, '/') + imageUrl;
                    displayPath = imageUrl;
                  }
                  
                  imageData.push({
                    index: wrappedImages.length + index + 1,
                    element: element,
                    path: imageUrl,
                    publicUrl: publicUrl,
                    displayPath: displayPath,
                    isExternal: isExternalUrl,
                    isHero: isHero,
                    imageType: 'background',
                    width: Math.round(rect.width),
                    height: Math.round(rect.height)
                  });
                }
              }
            });
            
            // Update stats
            const heroCount = imageData.filter(img => img.isHero).length;
            const externalCount = imageData.filter(img => img.isExternal).length;
            const localCount = imageData.length - externalCount;
            const bgImageCount = imageData.filter(img => img.imageType === 'background').length;
            const regularImageCount = imageData.length - bgImageCount;
            
            galleryStats.innerHTML = 
              'Found <strong>' + imageData.length + '</strong> images: ' +
              '<strong>' + heroCount + '</strong> hero, ' +
              '<strong>' + localCount + '</strong> local, ' +
              '<strong>' + externalCount + '</strong> external, ' +
              '<strong>' + regularImageCount + '</strong> img tags, ' +
              '<strong>' + bgImageCount + '</strong> backgrounds';
            
            // Clear and populate gallery
            galleryList.innerHTML = '';
            
            imageData.forEach((imgData) => {
              const card = document.createElement('div');
              card.className = 'image-card';
              
              // Add special styling for background images
              if (imgData.imageType === 'background') {
                card.classList.add('bg-image');
              }
              
              // Create a unique function name for this card's click handler
              const handlerName = 'replaceImage_' + imgData.index + '_' + Date.now();
              window[handlerName] = function() {
                openReplaceModal(imgData.path, imgData.element, imgData.imageType);
              };
              
              const imageTypeLabel = imgData.imageType === 'background' ? 'Background' : 'Image';
              const imageTypeIcon = imgData.imageType === 'background' ? '🎨' : '🖼️';
              
              card.innerHTML = 
                '<div class="image-card-preview">' +
                  '<img src="' + imgData.publicUrl + '" alt="' + imageTypeLabel + ' ' + imgData.index + '" onerror="this.style.display=' + "'none'" + '">' +
                '</div>' +
                '<div class="image-card-info">' +
                  '<div class="image-card-path" title="' + imgData.publicUrl + '">' + imageTypeIcon + ' ' + imgData.displayPath + '</div>' +
                  '<div class="image-card-details">' +
                    '<span class="image-card-detail">' + imgData.width + '×' + imgData.height + '</span>' +
                    '<span class="image-card-detail">' + (imgData.isExternal ? 'External' : 'Local') + '</span>' +
                    '<span class="image-card-detail" style="background: ' + (imgData.imageType === 'background' ? '#f3e8ff; border-color: #d8b4fe; color: #7c3aed' : '#eff6ff; border-color: #dbeafe; color: #3b82f6') + ';">' + imageTypeLabel + '</span>' +
                    (imgData.isHero ? '<span class="image-card-detail" style="background: #fef2f2; border-color: #fecaca; color: #dc2626;">Hero</span>' : '') +
                  '</div>' +
                  '<div class="image-card-path" style="font-size: 10px; margin-top: 4px; color: #9ca3af;">Public URL: ' + imgData.publicUrl + '</div>' +
                '</div>' +
                '<div class="image-card-actions">' +
                  '<button class="image-card-replace-btn' + (imgData.isHero ? ' hero' : '') + '" onclick="' + handlerName + '()">' +
                    'Replace' + (imgData.isHero ? ' Hero' : '') + (imgData.imageType === 'background' ? ' BG' : '') +
                  '</button>' +
                '</div>';
              
              galleryList.appendChild(card);
            });
            
            console.log('Image gallery populated with ' + imageData.length + ' images');
            
            // Clear the in-progress flag after a short delay
            setTimeout(function() {
              window.galleryPopulateInProgress = false;
            }, 500);
          } catch (error) {
            console.error('Error populating image gallery:', error);
            window.galleryPopulateInProgress = false;
          }
        }
        
        // Wrap elements with background images
        function wrapBackgroundImages() {
          try {
            // Find all elements with background images that aren't already processed
            const allElements = document.querySelectorAll('*:not([data-bg-processed]):not(.image-replace-container):not(.image-replace-container *)');
            const bgImageElements = [];
            
            allElements.forEach((element) => {
              const computedStyle = window.getComputedStyle(element);
              const bgImage = computedStyle.backgroundImage;
              
              // Check if element has a background image
              if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
                // Extract URL from background-image CSS property
                const urlMatch = bgImage.match(/url\(['"]?([^'"]*?)['"]?\)/);
                if (urlMatch && urlMatch[1]) {
                  bgImageElements.push({
                    element: element,
                    originalBgImage: bgImage,
                    imageUrl: urlMatch[1]
                  });
                }
              }
            });
            
            console.log('Found ' + bgImageElements.length + ' elements with background images');
            
            if (bgImageElements.length === 0) {
              console.log('No unprocessed background images found, skipping wrap');
              return;
            }
            
            bgImageElements.forEach((bgData, index) => {
              const element = bgData.element;
              const imageUrl = bgData.imageUrl;
              
              // Mark as processed to prevent re-processing
              element.setAttribute('data-bg-processed', 'true');
              
              console.log('Processing background image ' + (index + 1) + ': ' + imageUrl);
              
              // Get element dimensions and characteristics
              const rect = element.getBoundingClientRect();
              const style = window.getComputedStyle(element);
              
              // Skip very small elements (likely not main images)
              if (rect.width < 50 || rect.height < 50) {
                console.log('Background image ' + (index + 1) + ' too small, skipping');
                return;
              }
              
              console.log('Background image ' + (index + 1) + ' dimensions: ' + rect.width + 'x' + rect.height);
              
              // Determine if it's a hero/banner background
              const isLargeWidth = rect.width > window.innerWidth * 0.6;
              const isLargeHeight = rect.height > 200;
              const hasHeroClass = element.closest('.hero, .banner, .jumbotron, [class*="hero"], [class*="banner"], [class*="Hero"], [class*="Banner"]') || 
                                 element.classList.contains('hero') || element.classList.contains('banner') || 
                                 element.className.toLowerCase().includes('hero') || element.className.toLowerCase().includes('banner');
              const isFullWidth = rect.width >= (window.innerWidth - 100);
              const hasHeroUrl = /hero|banner|header|main|featured|cover|bg|background/i.test(imageUrl);
              
              const isHero = isLargeWidth || isLargeHeight || hasHeroClass || isFullWidth || hasHeroUrl;
              
              // Make element relatively positioned if needed
              if (style.position === 'static') {
                element.style.position = 'relative';
              }
              
              // Create replace button for background image
              const replaceBtn = document.createElement('button');
              replaceBtn.className = 'image-replace-overlay bg-image-overlay';
              replaceBtn.textContent = 'Replace BG';
              replaceBtn.style.top = '8px';
              replaceBtn.style.left = '8px'; // Position on left for background images
              replaceBtn.style.right = 'auto';
              
              if (isHero) {
                replaceBtn.classList.add('hero-bg');
                replaceBtn.style.background = 'rgba(239, 68, 68, 0.95)';
                replaceBtn.style.padding = '12px 18px';
                replaceBtn.style.fontSize = '14px';
                replaceBtn.textContent = 'Replace Hero BG';
                console.log('Background image ' + (index + 1) + ' detected as HERO background');
              } else {
                console.log('Background image ' + (index + 1) + ' detected as regular background');
              }
              
              replaceBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Background replace button clicked for: ' + imageUrl);
                openReplaceModal(imageUrl, element, 'background');
              };
              
              // Create info overlay for background image
              const infoBtn = document.createElement('div');
              infoBtn.className = 'image-info-overlay bg-image-info';
              infoBtn.style.bottom = '8px';
              infoBtn.style.left = '8px';
              infoBtn.style.right = 'auto';
              infoBtn.style.maxWidth = 'calc(100% - 16px)';
              infoBtn.textContent = 'BG: ' + (imageUrl.length > 25 ? '...' + imageUrl.slice(-25) : imageUrl);
              infoBtn.title = 'Background Image: ' + imageUrl;
              
              // Add background image marker class to element
              element.classList.add('has-bg-image-controls');
              if (isHero) {
                element.classList.add('hero-bg-image');
              }
              
              // Add overlays to the element
              element.appendChild(replaceBtn);
              element.appendChild(infoBtn);
              
              console.log('Successfully added background image controls to element ' + (index + 1));
            });
            
            const totalBgProcessed = document.querySelectorAll('[data-bg-processed="true"]').length;
            console.log('Background image processing complete - Total processed: ' + totalBgProcessed);
          } catch (error) {
            console.error('Error wrapping background images:', error);
          }
        }
      })();
    </script>
  `;

  // Inject CSS and JS before closing head tag, or before closing body tag if no head
  let modifiedContent = htmlContent;
  
  if (modifiedContent.includes('</head>')) {
    modifiedContent = modifiedContent.replace('</head>', `${previewCSS}</head>`);
  } else if (modifiedContent.includes('</body>')) {
    modifiedContent = modifiedContent.replace('</body>', `${previewCSS}</body>`);
  }
  
  if (modifiedContent.includes('</body>')) {
    modifiedContent = modifiedContent.replace('</body>', `${previewJS}</body>`);
  } else {
    modifiedContent += previewJS;
  }
  
  return modifiedContent;
}