'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { createPortal } from 'react-dom';
import ImageManagerPanel from './ImageManagerPanel';
import GlobalToast from './GlobalToast';

interface LiveEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;
  mobileNumber: string;
}

interface Image {
  fileName: string;
  publicUrl: string;
  proxyUrl: string;
  size: number;
  lastModified: string;
  contentType: string;
  key: string;
}

interface AssetInfo {
  type: 'css' | 'js' | 'image' | 'font' | 'other';
  path: string;
  resolvedUrl: string;
  status: 'loading' | 'loaded' | 'error' | 'pending';
  error?: string;
}

interface DiscoveredAssets {
  css: Set<string>;
  js: Set<string>;
  images: Set<string>;
  fonts: Set<string>;
  other: Set<string>;
}

export default function LiveEditModal({ isOpen, onClose, filePath, mobileNumber }: LiveEditModalProps) {
  const { data: session } = useSession();
  const [isLiveEditing, setIsLiveEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [editableContent, setEditableContent] = useState<string>('');
  const [processedContent, setProcessedContent] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  
  // Enhanced Asset Management State
  const [discoveredAssets, setDiscoveredAssets] = useState<DiscoveredAssets>({
    css: new Set(),
    js: new Set(),
    images: new Set(),
    fonts: new Set(),
    other: new Set()
  });
  const [assetStatus, setAssetStatus] = useState<Record<string, AssetInfo>>({});
  const [isProcessingAssets, setIsProcessingAssets] = useState(false);
  const [assetLoadingProgress, setAssetLoadingProgress] = useState(0);
  
  // Widget URL replacement state
  const [originalWidgetUrls, setOriginalWidgetUrls] = useState<Map<string, string>>(new Map());
  
  // Image Manager state
  const [showImageManager, setShowImageManager] = useState(false);
  const [images, setImages] = useState<Image[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedImageForReplacement, setSelectedImageForReplacement] = useState<Image | null>(null);
  const [replacingImage, setReplacingImage] = useState<string | null>(null);
  const [imageTimestamps, setImageTimestamps] = useState<Record<string, number>>({});

  // Enhanced S3 URL resolution - use direct S3 proxy to bypass CDN
  const getS3BaseUrl = () => {
    // Use direct S3 proxy route to bypass CDN for immediate access
    // Use a more reliable way to get the origin
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://192.168.1.201:3000';
    return `${origin}/direct/${mobileNumber}`;
  };

  // Widget URL detection and replacement functions
  const createDummyWidgetContent = (widgetType: string, width: string, height: string): string => {
    const dummyStyles = `
      display: flex; 
      align-items: center; 
      justify-content: center; 
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
      border: 2px dashed #0284c7; 
      border-radius: 8px; 
      color: #0369a1; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      font-size: 14px; 
      text-align: center; 
      position: relative;
      width: ${width}; 
      height: ${height};
      cursor: not-allowed;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    `;

    const getWidgetIcon = (type: string) => {
      switch (type) {
        case 'shop-status':
          return '🏪';
        case 'image-gallery':
          return '🖼️';
        case 'contact-us':
          return '📧';
        default:
          return '🔧';
      }
    };

    const getWidgetName = (type: string) => {
      switch (type) {
        case 'shop-status':
          return 'Shop Status Widget';
        case 'image-gallery':
          return 'Image Gallery Widget';
        case 'contact-us':
          return 'Contact Us Widget';
        default:
          return 'Widget';
      }
    };

    return `
      <div style="${dummyStyles}">
        <div>
          <div style="font-size: 24px; margin-bottom: 8px;">${getWidgetIcon(widgetType)}</div>
          <div style="font-weight: 600; margin-bottom: 4px;">${getWidgetName(widgetType)}</div>
          <div style="font-size: 12px; opacity: 0.7; margin-bottom: 4px;">🔒 Preview Mode - Widget Disabled</div>
          <div style="font-size: 10px; opacity: 0.6; margin-bottom: 4px;">🚫 This area is not editable</div>
          <div style="font-size: 11px; opacity: 0.5;">✅ Actual widget will work normally on your live site</div>
        </div>
      </div>
    `;
  };

  const detectAndReplaceWidgets = (html: string): string => {
    const widgetUrlPattern = /\/widget-preview\/[^\/]+\/(shop-status|image-gallery|contact-us)/g;
    const iframePattern = /<iframe([^>]*?)src=["']([^"']*?)["']([^>]*?)>/gi;
    const newOriginalUrls = new Map(originalWidgetUrls);
    
    let processedHtml = html;
    let replacementId = 0;

    // Replace widget iframes with dummy content
    processedHtml = processedHtml.replace(iframePattern, (match, beforeSrc, src, afterSrc) => {
      const widgetMatch = src.match(widgetUrlPattern);
      
      if (widgetMatch) {
        const widgetType = widgetMatch[0].split('/').pop();
        const uniqueId = `widget-placeholder-${replacementId++}`;
        
        // Store original URL for restoration later
        newOriginalUrls.set(uniqueId, src);
        
        // Extract dimensions from iframe attributes
        const widthMatch = match.match(/width=["']([^"']*?)["']/i);
        const heightMatch = match.match(/height=["']([^"']*?)["']/i);
        
        const width = widthMatch ? widthMatch[1] : '400px';
        const height = heightMatch ? heightMatch[1] : '300px';
        
        // Create dummy content
        const dummyContent = createDummyWidgetContent(widgetType || 'unknown', width, height);
        
        console.log(`Replaced widget ${widgetType} with placeholder ${uniqueId}`);
        
        return `<div data-widget-placeholder="${uniqueId}" data-original-src="${src}" data-non-editable="true" contenteditable="false" style="user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; pointer-events: none;">${dummyContent}</div>`;
      }
      
      return match;
    });

    // Also look for potentially widget-related iframes with empty src or specific IDs
    const potentialWidgetIframePattern = /<iframe([^>]*?)id=["']([^"']*widget[^"']*)["']([^>]*?)>/gi;
    processedHtml = processedHtml.replace(potentialWidgetIframePattern, (match, beforeId, id, afterId) => {
      // Check if this looks like a widget iframe based on ID
      const isContactWidget = id.includes('contact');
      const isGalleryWidget = id.includes('gallery') || id.includes('image');
      const isShopWidget = id.includes('shop') || id.includes('status');
      
      if (isContactWidget || isGalleryWidget || isShopWidget) {
        const widgetType = isContactWidget ? 'contact-us' : 
                          isGalleryWidget ? 'image-gallery' : 
                          'shop-status';
        
        const uniqueId = `widget-placeholder-${replacementId++}`;
        
        // Store a placeholder URL since we don't have the actual URL yet
        const placeholderUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/widget-preview/${mobileNumber}/${widgetType}`;
        newOriginalUrls.set(uniqueId, placeholderUrl);
        
        // Extract dimensions from iframe attributes
        const widthMatch = match.match(/width=["']([^"']*?)["']/i);
        const heightMatch = match.match(/height=["']([^"']*?)["']/i);
        const styleMatch = match.match(/style=["']([^"']*?)["']/i);
        
        let width = widthMatch ? widthMatch[1] : '400px';
        let height = heightMatch ? heightMatch[1] : '500px';
        
        // Try to extract dimensions from style attribute if not found in width/height
        if (styleMatch && styleMatch[1]) {
          const style = styleMatch[1];
          const minHeightMatch = style.match(/min-height:\s*([^;]*)/);
          if (minHeightMatch) {
            height = minHeightMatch[1].trim();
          }
        }
        
        // Create dummy content
        const dummyContent = createDummyWidgetContent(widgetType, width, height);
        
        console.log(`Replaced dynamic widget iframe (${id}) with placeholder ${uniqueId}`);
        
        return `<div data-widget-placeholder="${uniqueId}" data-original-src="${placeholderUrl}" data-original-id="${id}" data-non-editable="true" contenteditable="false" style="user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; pointer-events: none;">${dummyContent}</div>`;
      }
      
      return match;
    });

    setOriginalWidgetUrls(newOriginalUrls);
    return processedHtml;
  };

  const restoreWidgetUrls = (html: string): string => {
    let restoredHtml = html;
    
    // Restore widget iframes from placeholders - match both original placeholders and any modified content
    const placeholderPattern = /<div\s+data-widget-placeholder=["']([^"']*?)["']\s+data-original-src=["']([^"']*?)["']([^>]*?)>[\s\S]*?<\/div>/g;
    
    restoredHtml = restoredHtml.replace(placeholderPattern, (match, placeholderId, originalSrc, additionalAttrs) => {
      console.log(`Restoring widget placeholder ${placeholderId} to ${originalSrc}`);
      
      // Check if this was originally a dynamic iframe (has data-original-id)
      const originalIdMatch = additionalAttrs.match(/data-original-id=["']([^"']*?)["']/);
      
      if (originalIdMatch) {
        // This was originally an iframe with empty src that gets populated dynamically
        // Restore it to the original empty iframe format
        const originalId = originalIdMatch[1];
        
        // Extract original styling from the placeholder div
        let originalStyle = '';
        const styleMatch = match.match(/min-height:\s*([^;]*)/);
        if (styleMatch) {
          originalStyle = `style="aspect-ratio: 4/5; min-height: ${styleMatch[1].trim()};"`;
        }
        
        console.log(`Restoring dynamic widget iframe with id: ${originalId}`);
        
        return `<iframe 
            id="${originalId}"
            src=""
            class="w-full rounded-lg border-0"
            ${originalStyle || 'style="aspect-ratio: 4/5; min-height: 500px;"'}
            frameborder="0"
            allowfullscreen>
        </iframe>`;
      } else {
        // This was a regular widget iframe with a proper src URL
        const widgetType = originalSrc.split('/').pop();
        let width = '400px';
        let height = '300px';
        
        // Set default dimensions based on widget type
        switch (widgetType) {
          case 'shop-status':
            width = '250px';
            height = '150px';
            break;
          case 'image-gallery':
            width = '600px';
            height = '400px';
            break;
          case 'contact-us':
            width = '400px';
            height = '500px';
            break;
        }
        
        // Try to extract original dimensions from the placeholder div style if available
        const styleMatch = match.match(/style=["'][^"']*width:\s*([^;]*?);[^"']*height:\s*([^;]*?);[^"']*["']/);
        if (styleMatch) {
          width = styleMatch[1].trim();
          height = styleMatch[2].trim();
        }
        
        // Return clean iframe with original URL and dimensions - no placeholder content
        return `<iframe src="${originalSrc}" width="${width}" height="${height}" frameborder="0" style="border: none; border-radius: 12px;"></iframe>`;
      }
    });

    // Also handle cases where the placeholder content might have been edited or modified during live editing
    // Look for any remaining widget placeholder divs and clean them up
    const anyPlaceholderPattern = /<div[^>]*data-widget-placeholder[^>]*>[\s\S]*?<\/div>/g;
    restoredHtml = restoredHtml.replace(anyPlaceholderPattern, (match) => {
      // Try to extract the original src from data attributes
      const srcMatch = match.match(/data-original-src=["']([^"']*?)["']/);
      if (srcMatch) {
        const originalSrc = srcMatch[1];
        const widgetType = originalSrc.split('/').pop();
        
        let width = '400px';
        let height = '300px';
        
        switch (widgetType) {
          case 'shop-status':
            width = '250px';
            height = '150px';
            break;
          case 'image-gallery':
            width = '600px';
            height = '400px';
            break;
          case 'contact-us':
            width = '400px';
            height = '500px';
            break;
        }
        
        console.log(`Cleaning up modified widget placeholder for ${widgetType}`);
        return `<iframe src="${originalSrc}" width="${width}" height="${height}" frameborder="0" style="border: none; border-radius: 12px;"></iframe>`;
      }
      
      // If we can't extract the original src, remove the placeholder entirely
      console.warn('Found widget placeholder without original src, removing');
      return '';
    });

    return restoredHtml;
  };

  const getCurrentDirectory = () => {
    return filePath.substring(0, filePath.lastIndexOf('/')) || '';
  };

  // Enhanced relative path resolution for proxy route
  const resolveRelativePath = (path: string, currentDir: string, baseUrl: string): string => {
    // Skip external URLs, data URLs, and already resolved URLs
    if (path.startsWith('http') || path.startsWith('//') || path.startsWith('data:') || path.includes('s3.ap-south-1.amazonaws.com')) {
      return path;
    }

    // Handle absolute paths from site root
    if (path.startsWith('/')) {
      return `${baseUrl}${path}`;
    }

    // Handle current directory reference
    if (path.startsWith('./')) {
      const cleanPath = path.substring(2);
      return currentDir ? `${baseUrl}/${currentDir}/${cleanPath}` : `${baseUrl}/${cleanPath}`;
    }

    // Handle parent directory navigation
    if (path.startsWith('../')) {
      const upLevels = (path.match(/\.\.\//g) || []).length;
      const pathParts = currentDir.split('/').filter(Boolean);
      const remainingParts = pathParts.slice(0, Math.max(0, pathParts.length - upLevels));
      const cleanPath = path.replace(/^(\.\.\/)+/, '');
      const resolvedDir = remainingParts.length > 0 ? remainingParts.join('/') : '';
      return resolvedDir ? `${baseUrl}/${resolvedDir}/${cleanPath}` : `${baseUrl}/${cleanPath}`;
    }

    // Default relative path (same directory)
    // For files in the root directory, ensure we don't add extra slashes
    if (!currentDir) {
      return `${baseUrl}/${path}`;
    }
    return `${baseUrl}/${currentDir}/${path}`;
  };

  // Revert processed URLs back to original relative paths for saving
  const revertProcessedUrls = (html: string): string => {
    const currentDir = getCurrentDirectory();
    const s3BaseUrl = getS3BaseUrl();
    
    let reverted = html;
    
    console.log('Reverting processed URLs - s3BaseUrl:', s3BaseUrl);
    
    // Revert CSS link URLs back to relative paths
    reverted = reverted.replace(
      /<link([^>]*)href=["']([^"']*?)["']([^>]*?)>/gi,
      (match, before, href, after) => {
        // Check if this is a processed URL (contains our proxy route)
        if (href.includes(s3BaseUrl)) {
          console.log('Reverting CSS link:', href);
          // Extract the original relative path
          const relativePath = href.replace(s3BaseUrl, '').replace(/^\/+/, '');
          
          // If it was in a subdirectory, reconstruct the relative path
          if (currentDir && relativePath.startsWith(currentDir + '/')) {
            const fileName = relativePath.substring(currentDir.length + 1);
            return `<link${before}href="${fileName}"${after}>`;
          } else if (currentDir && relativePath === currentDir) {
            // This was a directory reference, keep as is
            return match;
          } else {
            // Root level file, just use the filename
            const fileName = relativePath.split('/').pop() || relativePath;
            return `<link${before}href="${fileName}"${after}>`;
          }
        }
        return match;
      }
    );
    
    // Revert script URLs back to relative paths
    reverted = reverted.replace(
      /<script([^>]*)src=["']([^"']*?)["']([^>]*?)>/gi,
      (match, before, src, after) => {
        if (src.includes(s3BaseUrl)) {
          const relativePath = src.replace(s3BaseUrl, '').replace(/^\/+/, '');
          if (currentDir && relativePath.startsWith(currentDir + '/')) {
            const fileName = relativePath.substring(currentDir.length + 1);
            return `<script${before}src="${fileName}"${after}>`;
          } else {
            const fileName = relativePath.split('/').pop() || relativePath;
            return `<script${before}src="${fileName}"${after}>`;
          }
        }
        return match;
      }
    );
    
    // Revert image URLs back to relative paths
    reverted = reverted.replace(
      /<img([^>]*)src=["']([^"']*?)["']([^>]*?)>/gi,
      (match, before, src, after) => {
        if (src.includes(s3BaseUrl)) {
          const relativePath = src.replace(s3BaseUrl, '').replace(/^\/+/, '');
          if (currentDir && relativePath.startsWith(currentDir + '/')) {
            const fileName = relativePath.substring(currentDir.length + 1);
            return `<img${before}src="${fileName}"${after}>`;
          } else {
            const fileName = relativePath.split('/').pop() || relativePath;
            return `<img${before}src="${fileName}"${after}>`;
          }
        }
        return match;
      }
    );
    
    // Revert CSS url() functions back to relative paths
    reverted = reverted.replace(
      /url\(["']?([^"')]*?)["']?\)/gi,
      (match, url) => {
        if (url.includes(s3BaseUrl)) {
          const relativePath = url.replace(s3BaseUrl, '').replace(/^\/+/, '');
          if (currentDir && relativePath.startsWith(currentDir + '/')) {
            const fileName = relativePath.substring(currentDir.length + 1);
            return `url('${fileName}')`;
          } else {
            const fileName = relativePath.split('/').pop() || relativePath;
            return `url('${fileName}')`;
          }
        }
        return match;
      }
    );
    
    return reverted;
  };

  // Asset discovery function
  const discoverAssets = (html: string): DiscoveredAssets => {
    console.log('discoverAssets called with HTML length:', html.length);
    
    const assets: DiscoveredAssets = {
      css: new Set(),
      js: new Set(),
      images: new Set(),
      fonts: new Set(),
      other: new Set()
    };

    // Discover CSS files
    const cssMatches = html.match(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']*?)["'][^>]*>/gi) || 
                      html.match(/<link[^>]*href=["']([^"']*\.css[^"']*)["'][^>]*rel=["']stylesheet["'][^>]*>/gi) || [];
    
    console.log('CSS matches found:', cssMatches);
    
    cssMatches.forEach(match => {
      const href = match.match(/href=["']([^"']*)["']/)?.[1];
      console.log('CSS href extracted:', href);
      if (href && !href.startsWith('http') && !href.startsWith('data:')) {
        assets.css.add(href);
        console.log('Added CSS asset:', href);
      }
    });

    // Discover JavaScript files
    const jsMatches = html.match(/<script[^>]*src=["']([^"']*?)["'][^>]*>/gi) || [];
    jsMatches.forEach(match => {
      const src = match.match(/src=["']([^"']*)["']/)?.[1];
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        assets.js.add(src);
      }
    });

    // Discover images
    const imgMatches = html.match(/<img[^>]*src=["']([^"']*?)["'][^>]*>/gi) || [];
    imgMatches.forEach(match => {
      const src = match.match(/src=["']([^"']*)["']/)?.[1];
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        assets.images.add(src);
      }
    });

    // Discover background images in inline styles
    const bgMatches = html.match(/background(?:-image)?\s*:\s*url\(["']?([^"')]*?)["']?\)/gi) || [];
    bgMatches.forEach(match => {
      const url = match.match(/url\(["']?([^"')]*?)["']?\)/)?.[1];
      if (url && !url.startsWith('http') && !url.startsWith('data:')) {
        if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
          assets.images.add(url);
        } else {
          assets.other.add(url);
        }
      }
    });

    // Discover fonts
    const fontMatches = html.match(/<link[^>]*href=["']([^"']*?)["'][^>]*>/gi) || [];
    fontMatches.forEach(match => {
      const href = match.match(/href=["']([^"']*)["']/)?.[1];
      if (href && (href.includes('font') || href.match(/\.(woff|woff2|ttf|otf|eot)$/i))) {
        assets.fonts.add(href);
      }
    });

    console.log('Final discovered assets:', {
      css: Array.from(assets.css),
      js: Array.from(assets.js),
      images: Array.from(assets.images),
      fonts: Array.from(assets.fonts),
      other: Array.from(assets.other)
    });

    return assets;
  };

  // Asset validation function
  const validateAsset = async (assetPath: string, resolvedUrl: string): Promise<{ valid: boolean; error?: string }> => {
    try {
      const response = await fetch(resolvedUrl, { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        return { valid: true };
      } else {
        return { 
          valid: false, 
          error: `HTTP ${response.status}: ${response.statusText}` 
        };
      }
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  };

  // Process assets for live editing
  const processAssetsForLiveEdit = async (html: string): Promise<string> => {
    setIsProcessingAssets(true);
    setAssetLoadingProgress(0);

    const currentDir = getCurrentDirectory();
    const s3BaseUrl = getS3BaseUrl();
    const siteBaseUrl = s3BaseUrl; // Already includes the full proxy path
    
    // STEP 1: Replace widget iframes with dummy placeholders to prevent reloading
    console.log('Replacing widget iframes with placeholders...');
    let processed = detectAndReplaceWidgets(html);

    // Discover all assets from processed content (after widget replacement)
    const assets = discoverAssets(processed);
    setDiscoveredAssets(assets);

    // Process and validate all assets
    const allAssets = [...assets.css, ...assets.js, ...assets.images, ...assets.fonts, ...assets.other];
    const assetStatusMap: Record<string, AssetInfo> = {};
    
    let processedCount = 0;
    const totalAssets = allAssets.length;

    for (const assetPath of allAssets) {
      const resolvedUrl = resolveRelativePath(assetPath, currentDir, siteBaseUrl);
      
      // Determine asset type
      let type: AssetInfo['type'] = 'other';
      if (assets.css.has(assetPath)) type = 'css';
      else if (assets.js.has(assetPath)) type = 'js';
      else if (assets.images.has(assetPath)) type = 'image';
      else if (assets.fonts.has(assetPath)) type = 'font';

      assetStatusMap[assetPath] = {
        type,
        path: assetPath,
        resolvedUrl,
        status: 'loading'
      };

      // Validate asset
      const validation = await validateAsset(assetPath, resolvedUrl);
      assetStatusMap[assetPath].status = validation.valid ? 'loaded' : 'error';
      if (!validation.valid) {
        assetStatusMap[assetPath].error = validation.error;
      }

      processedCount++;
      setAssetLoadingProgress((processedCount / totalAssets) * 100);
    }

    setAssetStatus(assetStatusMap);

    // Process HTML with enhanced asset resolution (starting from widget-replaced content)
    // Note: 'processed' already contains widget-replaced content from earlier step

    // Add comprehensive base tag
    if (processed.includes('<head>')) {
      processed = processed.replace(
        /<head([^>]*)>/i,
        (match, attributes) => {
          // For proxy route, the base should point to the current directory
          const baseHref = currentDir ? `${siteBaseUrl}/${currentDir}/` : `${siteBaseUrl}/`;
          console.log('Setting base href to:', baseHref);
          return `<head${attributes}><base href="${baseHref}">`;
        }
      );
    } else if (processed.includes('<html>')) {
      processed = processed.replace(
        /<html([^>]*)>/i,
        (match, attributes) => {
          // For proxy route, the base should point to the current directory
          const baseHref = currentDir ? `${siteBaseUrl}/${currentDir}/` : `${siteBaseUrl}/`;
          console.log('Setting base href to:', baseHref);
          return `${match}<head><base href="${baseHref}"></head>`;
        }
      );
    }

    // Enhanced CSS link processing - directly replace with proxy URL
    processed = processed.replace(
      /<link([^>]*)href=["']([^"']*?)["']([^>]*?)>/gi,
      (match, before, href, after) => {
        if (href.startsWith('http') || href.startsWith('//') || href.startsWith('data:')) {
          return match;
        }
        
        // For CSS files, directly construct the proxy URL
        let resolvedHref;
        if (href.startsWith('/')) {
          // Absolute path from site root
          resolvedHref = `${siteBaseUrl}${href}`;
        } else if (href.startsWith('./')) {
          // Current directory reference
          const cleanPath = href.substring(2);
          resolvedHref = currentDir ? `${siteBaseUrl}/${currentDir}/${cleanPath}` : `${siteBaseUrl}/${cleanPath}`;
        } else if (href.startsWith('../')) {
          // Parent directory navigation
          const upLevels = (href.match(/\.\.\//g) || []).length;
          const pathParts = currentDir.split('/').filter(Boolean);
          const remainingParts = pathParts.slice(0, Math.max(0, pathParts.length - upLevels));
          const cleanPath = href.replace(/^(\.\.\/)+/, '');
          const resolvedDir = remainingParts.length > 0 ? remainingParts.join('/') : '';
          resolvedHref = resolvedDir ? `${siteBaseUrl}/${resolvedDir}/${cleanPath}` : `${siteBaseUrl}/${cleanPath}`;
        } else {
          // Default relative path (same directory)
          resolvedHref = currentDir ? `${siteBaseUrl}/${currentDir}/${href}` : `${siteBaseUrl}/${href}`;
        }
        
        console.log('CSS link resolution:', { original: href, resolved: resolvedHref, currentDir, siteBaseUrl });
        return `<link${before}href="${resolvedHref}"${after}>`;
      }
    );

    // Enhanced script processing
    processed = processed.replace(
      /<script([^>]*)src=["']([^"']*?)["']([^>]*?)>/gi,
      (match, before, src, after) => {
        if (src.startsWith('http') || src.startsWith('//') || src.startsWith('data:')) {
          return match;
        }
        const resolvedSrc = resolveRelativePath(src, currentDir, siteBaseUrl);
        return `<script${before}src="${resolvedSrc}"${after}>`;
      }
    );

    // Enhanced image processing
    processed = processed.replace(
      /<img([^>]*)src=["']([^"']*?)["']([^>]*?)>/gi,
      (match, before, src, after) => {
        if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('#')) {
          return match;
        }
        const resolvedSrc = resolveRelativePath(src, currentDir, siteBaseUrl);
        return `<img${before}src="${resolvedSrc}"${after}>`;
      }
    );

    // Process CSS url() functions in inline styles and style tags
    processed = processed.replace(
      /url\(["']?([^"')]*?)["']?\)/gi,
      (match, url) => {
        if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('#')) {
          return match;
        }
        const resolvedUrl = resolveRelativePath(url, currentDir, siteBaseUrl);
        return `url('${resolvedUrl}')`;
      }
    );

    // Process video, audio, and other media elements
    processed = processed.replace(
      /<(video|audio|source|track)([^>]*)src=["']([^"']*?)["']([^>]*?)>/gi,
      (match, tag, before, src, after) => {
        if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('#')) {
          return match;
        }
        const resolvedSrc = resolveRelativePath(src, currentDir, siteBaseUrl);
        return `<${tag}${before}src="${resolvedSrc}"${after}>`;
      }
    );

    setIsProcessingAssets(false);
    return processed;
  };

  // Fetch file content when modal opens
  useEffect(() => {
    if (isOpen && mobileNumber && filePath && session) {
      // Check if user has access to this mobile number
      if (session.user?.mobileNumber !== mobileNumber) {
        setError('Access denied. You can only edit your own files.');
        return;
      }
      fetchContent();
    }
  }, [isOpen, mobileNumber, filePath, session]);

  // Load images when Image Manager is opened
  useEffect(() => {
    if (showImageManager && session) {
      loadImages();
    }
  }, [showImageManager, session]);

  const fetchContent = async () => {
    try {
      setError('');
      
      console.log(`Fetching content for: ${mobileNumber}/${filePath}`);
      
      const response = await fetch(`/api/s3-file-content?userId=${mobileNumber}&path=${filePath}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch file content');
      }
      
      const data = await response.json();
      console.log('Content fetched successfully, length:', data.content.length);
      
      setContent(data.content);
      setOriginalContent(data.content);
      
      // Process assets immediately after loading content
      const processed = await processAssetsForLiveEdit(data.content);
      setProcessedContent(processed);
      
    } catch (err) {
      console.error('Error fetching content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load file');
    }
  };

  // Load user's images
  const loadImages = async () => {
    try {
      setLoadingImages(true);
      const response = await fetch('/api/my-images/list');
      const data = await response.json();

      if (response.ok) {
        setImages(data.images || []);
      } else {
        setError(data.error || 'Failed to load images');
      }
    } catch (error) {
      console.error('Error loading images:', error);
      setError('Failed to load images');
    } finally {
      setLoadingImages(false);
    }
  };

  // Replace image in the current HTML content
  const replaceImageInContent = async (oldImagePath: string, newImageUrl: string) => {
    try {
      const response = await fetch('/api/update-image-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldImagePath: oldImagePath,
          newImageUrl: newImageUrl,
          mobileNumber: mobileNumber,
          currentPagePath: filePath.split('/').pop() || 'index.html'
        })
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.type === 'direct_replace') {
        // Update the content state with the new image URL
        let updatedContent = content;
        const imgRegex = /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;
        updatedContent = updatedContent.replace(imgRegex, (match, before, src, after) => {
          if (src === oldImagePath || src.includes(oldImagePath.split('/').pop() || '')) {
            return `<img${before}src="${newImageUrl}"${after}>`;
          }
          return match;
        });

        setContent(updatedContent);
        setEditableContent(updatedContent);
        setSuccess(`Successfully replaced image with ${result.replacedImage?.alt || 'image'}!`);
        
        // Refresh the iframe
        setIframeKey(prev => prev + 1);
      } else {
        setError('No images found in current page to replace');
      }
    } catch (error) {
      console.error('Image replacement error:', error);
      setError('Failed to replace image: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Handle image selection for replacement
  const handleImageSelection = (image: Image) => {
    if (selectedImageForReplacement) {
      // Replace the selected image with the chosen image
      replaceImageInContent(selectedImageForReplacement.publicUrl, image.publicUrl);
      setSelectedImageForReplacement(null);
      setShowImageManager(false);
    } else {
      // If no image is selected for replacement, show a message to select an image from the page first
      setError('Please select an image from the webpage first, then choose a replacement image from your gallery.');
    }
  };

  // Get images from the current iframe content
  const getImagesFromContent = () => {
    if (!iframeRef.current) return [];
    
    try {
      const iframeDoc = iframeRef.current.contentDocument;
      if (!iframeDoc) return [];
      
      const imgElements = iframeDoc.querySelectorAll('img');
      return Array.from(imgElements).map((img, index) => ({
        index,
        src: img.src,
        alt: img.alt || `Image ${index + 1}`,
        element: img
      }));
    } catch (error) {
      console.error('Error getting images from iframe:', error);
      return [];
    }
  };

  // Handle image selection from the webpage
  const handleWebpageImageSelection = (imageIndex: number) => {
    const images = getImagesFromContent();
    const selectedImage = images[imageIndex];
    
    if (selectedImage) {
      setSelectedImageForReplacement({
        fileName: selectedImage.alt,
        publicUrl: selectedImage.src,
        proxyUrl: selectedImage.src,
        size: 0,
        lastModified: new Date().toISOString(),
        contentType: 'image/*',
        key: `webpage-${imageIndex}`
      });
      setSuccess(`Selected "${selectedImage.alt}" for replacement. Now choose a new image from your gallery.`);
    }
  };

  // Make content editable for live editing
  const makeContentEditable = (html: string) => {
    let editableHtml = html;
    
    // First, protect widget placeholder content from being processed
    // Replace widget placeholder content temporarily to prevent it from being made editable
    const widgetPlaceholders: Array<{id: string, content: string}> = [];
    let placeholderIndex = 0;
    
    // Extract widget placeholders and replace with safe markers
    editableHtml = editableHtml.replace(
      /<div\s+data-widget-placeholder="[^"]*"[^>]*>[\s\S]*?<\/div>/g, 
      (match) => {
        const id = `WIDGET_PLACEHOLDER_${placeholderIndex++}`;
        widgetPlaceholders.push({id, content: match});
        return `<!--${id}-->`;
      }
    );
    
    // Add contenteditable to common text elements
    const textElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'li', 'td', 'th', 'div'];
    
    textElements.forEach(tag => {
      const regex = new RegExp(`<${tag}([^>]*?)>([^<]+)<\/${tag}>`, 'gi');
      editableHtml = editableHtml.replace(regex, (match, attributes, content) => {
        // Skip if already has contenteditable, if it's an image container, or if it's marked as non-editable
        if (attributes.includes('contenteditable') || 
            attributes.includes('data-non-editable') || 
            content.trim().startsWith('<img') ||
            content.includes('WIDGET_PLACEHOLDER_')) {
          return match;
        }
        
        // Add editing attributes
        const editableAttributes = ` contenteditable="true" data-editable="true" data-original="${content.trim()}" style="border: 2px dashed transparent; padding: 4px; transition: all 0.2s; cursor: text;" onmouseover="this.style.border='2px dashed #3b82f6'; this.style.backgroundColor='#eff6ff';" onmouseout="this.style.border='2px dashed transparent'; this.style.backgroundColor='transparent';" onfocus="this.style.border='2px solid #3b82f6'; this.style.backgroundColor='#eff6ff';" onblur="this.style.border='2px dashed transparent'; this.style.backgroundColor='transparent';"`;
        
        return `<${tag}${attributes}${editableAttributes}>${content}</${tag}>`;
      });
    });
    
    // Restore widget placeholders
    widgetPlaceholders.forEach(({id, content}) => {
      editableHtml = editableHtml.replace(`<!--${id}-->`, content);
    });
    
    return editableHtml;
  };

  // Start live editing
  const handleStartLiveEdit = async () => {
    try {
      setIsProcessingAssets(true);
      
      // Process content with enhanced asset management
      const processedContent = await processAssetsForLiveEdit(content);
      const editable = makeContentEditable(processedContent);
      
      setEditableContent(editable);
      setIsLiveEditing(true);
      setHasChanges(false);
      
      // Refresh iframe with editable content
      setIframeKey(prev => prev + 1);
      
    } catch (error) {
      console.error('Error starting live edit:', error);
      setError('Failed to start live editing: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessingAssets(false);
    }
  };

  // Stop live editing
  const handleStopLiveEdit = () => {
    setIsLiveEditing(false);
    setEditableContent('');
    setHasChanges(false);
    setIframeKey(prev => prev + 1);
  };

  // Save changes
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      
      let contentToSave = isLiveEditing ? editableContent : content;
      
      if (isLiveEditing && iframeRef.current) {
        try {
          // Get the current content from the iframe
          const iframeDoc = iframeRef.current.contentDocument;
          if (iframeDoc) {
            contentToSave = iframeDoc.documentElement.outerHTML;
            
            // Clean up editing attributes
            contentToSave = contentToSave.replace(/\s*contenteditable="[^"]*"/gi, '');
            contentToSave = contentToSave.replace(/\s*data-editable="[^"]*"/gi, '');
            contentToSave = contentToSave.replace(/\s*data-original="[^"]*"/gi, '');
            contentToSave = contentToSave.replace(/\s*data-non-editable="[^"]*"/gi, '');
            contentToSave = contentToSave.replace(/\s*style="[^"]*border[^"]*"/gi, '');
            contentToSave = contentToSave.replace(/\s*style="[^"]*user-select[^"]*"/gi, '');
            contentToSave = contentToSave.replace(/\s*style="[^"]*pointer-events[^"]*"/gi, '');
            contentToSave = contentToSave.replace(/\s*onmouseover="[^"]*"/gi, '');
            contentToSave = contentToSave.replace(/\s*onmouseout="[^"]*"/gi, '');
            contentToSave = contentToSave.replace(/\s*onfocus="[^"]*"/gi, '');
            contentToSave = contentToSave.replace(/\s*onblur="[^"]*"/gi, '');
            contentToSave = contentToSave.replace(/\s*spellcheck="[^"]*"/gi, '');
            
            // Remove base tags that were added for asset resolution
            contentToSave = contentToSave.replace(/<base[^>]*>/gi, '');
            
            // Revert processed URLs back to original relative paths for saving
            contentToSave = revertProcessedUrls(contentToSave);
            
            // Restore widget iframe URLs from placeholders
            contentToSave = restoreWidgetUrls(contentToSave);
            
            // Additional cleanup: Remove any remaining placeholder text that might have been missed
            contentToSave = contentToSave.replace(/🔒\s*Preview Mode - Widget Disabled/g, '');
            contentToSave = contentToSave.replace(/🚫\s*This area is not editable/g, '');
            contentToSave = contentToSave.replace(/✅\s*Actual widget will work normally on your live site/g, '');
            contentToSave = contentToSave.replace(/Image Gallery Widget|Shop Status Widget|Contact Us Widget/g, '');
            contentToSave = contentToSave.replace(/🏪|🖼️|📧|🔧|🔒|🚫|✅/g, '');
            
            console.log('Content reverted for saving - CSS links should be relative paths and widgets restored');
          }
        } catch (err) {
          console.warn('Could not access iframe content, using stored content');
          contentToSave = editableContent;
          
          // Also revert the stored content if it contains processed URLs
          contentToSave = revertProcessedUrls(contentToSave);
          
          // Restore widget URLs from stored content
          contentToSave = restoreWidgetUrls(contentToSave);
          
          // Additional cleanup for stored content as well
          contentToSave = contentToSave.replace(/🔒\s*Preview Mode - Widget Disabled/g, '');
          contentToSave = contentToSave.replace(/🚫\s*This area is not editable/g, '');
          contentToSave = contentToSave.replace(/✅\s*Actual widget will work normally on your live site/g, '');
          contentToSave = contentToSave.replace(/Image Gallery Widget|Shop Status Widget|Contact Us Widget/g, '');
          contentToSave = contentToSave.replace(/🏪|🖼️|📧|🔧|🔒|🚫|✅/g, '');
        }
      }

      if (!filePath) {
        throw new Error('File path is required');
      }

      // Debug: Check what we're about to save
      const cssLinksInSave = contentToSave.match(/<link[^>]*href=["']([^"']*\.css[^"']*)["'][^>]*>/gi);
      console.log('CSS links in content to save:', cssLinksInSave);

      const response = await fetch('/api/s3-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: mobileNumber,
          path: filePath.substring(0, filePath.lastIndexOf('/')),
          content: contentToSave,
          fileName: filePath.split('/').pop() || '',
          isUpdate: true
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save changes');
      }

      setSuccess('Changes saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      setContent(contentToSave);
      setOriginalContent(contentToSave);
      setHasChanges(false);
      
      // Stop live editing after successful save
      setIsLiveEditing(false);
      setEditableContent('');
      
      // Refresh the iframe to show updated content
      setIframeKey(prev => prev + 1);
      
      // Refresh content to show the latest changes without leaving the editor
      setTimeout(() => {
        fetchContent();
      }, 1500); // Wait 1.5 seconds to show success message before refreshing content
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save changes';
      setError(`Save failed: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    setIsLiveEditing(false);
    setEditableContent('');
    setProcessedContent('');
    setHasChanges(false);
    setError('');
    setSuccess('');
    setShowImageManager(false);
    setSelectedImageForReplacement(null);
    setDiscoveredAssets({ css: new Set(), js: new Set(), images: new Set(), fonts: new Set(), other: new Set() });
    setAssetStatus({});
    setOriginalWidgetUrls(new Map()); // Clear widget URL mappings
    onClose();
  };

  // Get the content to display in iframe
  const getIframeContent = () => {
    // Use processed content for better asset resolution
    const contentToShow = isLiveEditing && editableContent ? editableContent : (processedContent || content);
    
    console.log('getIframeContent Debug:', {
      isLiveEditing,
      hasEditableContent: !!editableContent,
      editableContentLength: editableContent?.length || 0,
      contentLength: content?.length || 0,
      processedContentLength: processedContent?.length || 0,
      finalContentLength: contentToShow?.length || 0
    });
    
    // Debug: Check for CSS links in the content
    if (contentToShow) {
      const cssMatches = contentToShow.match(/<link[^>]*href=["']([^"']*\.css[^"']*)["'][^>]*>/gi);
      console.log('CSS links found in content:', cssMatches);
      
      // Also check for any link tags
      const allLinks = contentToShow.match(/<link[^>]*>/gi);
      console.log('All link tags found:', allLinks);
    }
    
    return contentToShow;
  };

  const refreshContent = () => {
    fetchContent();
    setIframeKey(prev => prev + 1);
    // Clear processed content to force reprocessing
    setProcessedContent('');
  };

  // Asset Status Component
  const AssetStatusPanel = () => {
    const totalAssets = Object.keys(assetStatus).length;
    const loadedAssets = Object.values(assetStatus).filter(asset => asset.status === 'loaded').length;
    const errorAssets = Object.values(assetStatus).filter(asset => asset.status === 'error').length;

    if (totalAssets === 0) return null;

    return (
      <div className="bg-gray-50 border-t border-gray-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">Assets Status</h4>
          <div className="text-xs text-gray-500">
            {loadedAssets}/{totalAssets} loaded
            {errorAssets > 0 && (
              <span className="text-red-600 ml-2">({errorAssets} failed)</span>
            )}
          </div>
        </div>
        
        {isProcessingAssets && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Processing assets...</span>
              <span>{Math.round(assetLoadingProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-blue-500 h-1 rounded-full transition-all duration-300" 
                style={{ width: `${assetLoadingProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="space-y-1 max-h-32 overflow-y-auto">
          {Object.entries(assetStatus).map(([path, asset]) => (
            <div key={path} className="flex items-center justify-between text-xs">
              <span className="truncate flex-1 mr-2" title={path}>
                {path.split('/').pop()}
              </span>
              <div className="flex items-center space-x-1">
                <span className={`px-1 py-0.5 rounded text-xs ${
                  asset.type === 'css' ? 'bg-blue-100 text-blue-700' :
                  asset.type === 'js' ? 'bg-yellow-100 text-yellow-700' :
                  asset.type === 'image' ? 'bg-green-100 text-green-700' :
                  asset.type === 'font' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {asset.type}
                </span>
                <span className={`w-2 h-2 rounded-full ${
                  asset.status === 'loaded' ? 'bg-green-500' :
                  asset.status === 'error' ? 'bg-red-500' :
                  asset.status === 'loading' ? 'bg-yellow-500 animate-pulse' :
                  'bg-gray-300'
                }`} title={asset.error || asset.status}></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlobalToast />
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col relative">
        {/* Image Manager Panel (left overlay) */}
        <ImageManagerPanel
          isOpen={showImageManager}
          onClose={() => setShowImageManager(false)}
          iframeRef={iframeRef as React.RefObject<HTMLIFrameElement>}
          onReplace={replaceImageInContent}
          userImages={images}
          loadingUserImages={loadingImages}
          reloadUserImages={loadImages}
          onImageReplaced={refreshContent}
        />
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-800">Enhanced Live Editor</h2>
            {isLiveEditing && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-50 rounded-full">
                  Live Editing Active
                </span>
              </div>
            )}
            {isProcessingAssets && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-600 font-medium px-2 py-1 bg-blue-50 rounded-full">
                  Processing Assets
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshContent}
              title="Refresh"
              className="p-2 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-700 text-white shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 bg-gray-50">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-hidden">
            {content ? (
              <iframe
                key={iframeKey}
                ref={iframeRef}
                srcDoc={getIframeContent()}
                className="w-full h-full border-0"
                title="Enhanced Live Edit Content"
                onLoad={() => {
                  console.log('Iframe content loaded');
                  if (isLiveEditing && iframeRef.current) {
                    // Set up event listeners for content changes
                    const iframeDoc = iframeRef.current.contentDocument;
                    if (iframeDoc) {
                      const handleContentChange = () => {
                        setHasChanges(true);
                      };
                      
                      iframeDoc.addEventListener('input', handleContentChange);
                      iframeDoc.addEventListener('blur', handleContentChange, true);
                    }
                  }
                }}
                onError={() => {
                  console.error('Iframe failed to load');
                  setError('Failed to load content in iframe');
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading content...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Asset Status Panel */}
        <AssetStatusPanel />

        {/* Footer with Controls */}
        <div className="p-4 border-t border-gray-200 bg-white">
          {/* Status Messages */}
          {error && (
            <div className="mb-3 flex items-center space-x-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-3 flex items-center space-x-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          )}

          {/* Instructions */}
          {isLiveEditing && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-blue-700">
                  <strong>Enhanced Live Editing:</strong> All assets are validated and resolved. Hover over text elements to edit directly with full asset support.
                </span>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              File: <span className="font-medium">{filePath}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              {!isLiveEditing ? (
                <button
                  onClick={handleStartLiveEdit}
                  disabled={isProcessingAssets}
                  className={`flex items-center px-6 py-2 rounded-lg transition-all duration-200 shadow-lg ${
                    isProcessingAssets
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                  }`}
                >
                  {isProcessingAssets ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-1.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Live Edit
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleStopLiveEdit}
                  className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Stop Editing
                </button>
              )}
              
              <button
                onClick={() => setShowImageManager(true)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                </svg>
                Image Manager
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving || (!hasChanges && !isLiveEditing)}
                className={`flex items-center px-6 py-2 rounded-lg transition-all duration-200 shadow-lg ${
                  isSaving
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : hasChanges || isLiveEditing
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                    : 'bg-green-300 text-white cursor-not-allowed'
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}