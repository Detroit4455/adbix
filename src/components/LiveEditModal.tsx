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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  
  // Image Manager state
  const [showImageManager, setShowImageManager] = useState(false);
  const [images, setImages] = useState<Image[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedImageForReplacement, setSelectedImageForReplacement] = useState<Image | null>(null);
  const [replacingImage, setReplacingImage] = useState<string | null>(null);
  const [imageTimestamps, setImageTimestamps] = useState<Record<string, number>>({});

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
    
    // Add contenteditable to common text elements
    const textElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'li', 'td', 'th', 'div'];
    
    textElements.forEach(tag => {
      const regex = new RegExp(`<${tag}([^>]*?)>([^<]+)<\/${tag}>`, 'gi');
      editableHtml = editableHtml.replace(regex, (match, attributes, content) => {
        // Skip if already has contenteditable or if it's an image container
        if (attributes.includes('contenteditable') || content.trim().startsWith('<img')) {
          return match;
        }
        
        // Add editing attributes
        const editableAttributes = ` contenteditable="true" data-editable="true" data-original="${content.trim()}" style="border: 2px dashed transparent; padding: 4px; transition: all 0.2s; cursor: text;" onmouseover="this.style.border='2px dashed #3b82f6'; this.style.backgroundColor='#eff6ff';" onmouseout="this.style.border='2px dashed transparent'; this.style.backgroundColor='transparent';" onfocus="this.style.border='2px solid #3b82f6'; this.style.backgroundColor='#eff6ff';" onblur="this.style.border='2px dashed transparent'; this.style.backgroundColor='transparent';"`;
        
        return `<${tag}${attributes}${editableAttributes}>${content}</${tag}>`;
      });
    });
    
    return editableHtml;
  };

  // Start live editing
  const handleStartLiveEdit = () => {
    const editable = makeContentEditable(content);
    setEditableContent(editable);
    setIsLiveEditing(true);
    setHasChanges(false);
    
    // Refresh iframe with editable content
    setIframeKey(prev => prev + 1);
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
            contentToSave = contentToSave.replace(/\s*style="[^"]*border[^"]*"/gi, '');
            contentToSave = contentToSave.replace(/\s*onmouseover="[^"]*"/gi, '');
            contentToSave = contentToSave.replace(/\s*onmouseout="[^"]*"/gi, '');
            contentToSave = contentToSave.replace(/\s*onfocus="[^"]*"/gi, '');
            contentToSave = contentToSave.replace(/\s*onblur="[^"]*"/gi, '');
            contentToSave = contentToSave.replace(/\s*spellcheck="[^"]*"/gi, '');
          }
        } catch (err) {
          console.warn('Could not access iframe content, using stored content');
          contentToSave = editableContent;
        }
      }

      if (!filePath) {
        throw new Error('File path is required');
      }

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
      
      // Refresh the iframe to show updated content
      setIframeKey(prev => prev + 1);
      
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
    setHasChanges(false);
    setError('');
    setSuccess('');
    setShowImageManager(false);
    setSelectedImageForReplacement(null);
    onClose();
  };

  // Utility to rewrite relative URLs to S3 absolute URLs
  function rewriteRelativeUrlsToS3(html: string, mobileNumber: string) {
    if (!mobileNumber) return html;
    const s3Base = process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://dt-web-sites.s3.ap-south-1.amazonaws.com';
    const siteBase = `${s3Base}/sites/${mobileNumber}`;

    // <link href="...">
    html = html.replace(/<link([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi, (match, before, href, after) => {
      if (/^(https?:)?\/\//.test(href) || href.startsWith('data:') || href.startsWith(siteBase)) return match;
      let newHref = href;
      if (href.startsWith('/')) {
        newHref = `${siteBase}${href}`;
      } else {
        newHref = `${siteBase}/${href}`;
      }
      return `<link${before}href="${newHref}"${after}>`;
    });

    // <script src="...">
    html = html.replace(/<script([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi, (match, before, src, after) => {
      if (/^(https?:)?\/\//.test(src) || src.startsWith('data:') || src.startsWith(siteBase)) return match;
      let newSrc = src;
      if (src.startsWith('/')) {
        newSrc = `${siteBase}${src}`;
      } else {
        newSrc = `${siteBase}/${src}`;
      }
      return `<script${before}src="${newSrc}"${after}>`;
    });

    // <img src="...">
    html = html.replace(/<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi, (match, before, src, after) => {
      if (/^(https?:)?\/\//.test(src) || src.startsWith('data:') || src.startsWith(siteBase)) return match;
      let newSrc = src;
      if (src.startsWith('/')) {
        newSrc = `${siteBase}${src}`;
      } else {
        newSrc = `${siteBase}/${src}`;
      }
      return `<img${before}src="${newSrc}"${after}>`;
    });

    // CSS url(...) in <style> and inline styles
    html = html.replace(/url\(["']?([^"')]+)["']?\)/gi, (match, url) => {
      if (/^(https?:)?\/\//.test(url) || url.startsWith('data:') || url.startsWith(siteBase)) return match;
      let newUrl = url;
      if (url.startsWith('/')) {
        newUrl = `${siteBase}${url}`;
      } else {
        newUrl = `${siteBase}/${url}`;
      }
      return `url('${newUrl}')`;
    });

    return html;
  }

  // Get the content to display in iframe
  const getIframeContent = () => {
    let html = isLiveEditing && editableContent ? editableContent : content;
    html = rewriteRelativeUrlsToS3(html, mobileNumber);
    return html;
  };

  // Create blob URL for iframe content
  const createContentUrl = () => {
    const contentToShow = getIframeContent();
    const blob = new Blob([contentToShow], { type: 'text/html' });
    return URL.createObjectURL(blob);
  };

  const refreshContent = () => {
    fetchContent();
    setIframeKey(prev => prev + 1);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlobalToast />
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col relative">
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
            <h2 className="text-xl font-semibold text-gray-800">Live Edit Webpage Content</h2>
            {isLiveEditing && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-50 rounded-full">
                  Live Editing Active
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
                title="Live Edit Content"
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
                  <strong>Live Editing:</strong> Hover over text elements in the webpage above to see them highlight, then click to edit directly. Your changes are automatically tracked.
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
                  className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-1.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Live Edit
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