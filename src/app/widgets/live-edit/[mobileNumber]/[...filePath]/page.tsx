'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CodeEditor from '@/components/CodeEditor';
import { createPortal } from 'react-dom';

export default function LiveEditPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const mobileNumber = params.mobileNumber as string;
  const filePath = Array.isArray(params.filePath) ? params.filePath.join('/') : params.filePath;
  
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [isLiveEditing, setIsLiveEditing] = useState(false);
  const [isCodeEditing, setIsCodeEditing] = useState(false);
  const [editableContent, setEditableContent] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingInstructions, setEditingInstructions] = useState(true);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Fetch file content on load
  useEffect(() => {
    if (mobileNumber && filePath && session) {
      // Check if user has access to this mobile number
      if (session.user?.mobileNumber !== mobileNumber) {
        setError('Access denied. You can only edit your own files.');
        return;
      }
      fetchContent();
    }
  }, [mobileNumber, filePath, session]);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
    setEditingInstructions(true);
  };

  // Save changes
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      
      let contentToSave = isLiveEditing ? editableContent : content;
      
      if (isLiveEditing) {
        // Get the current content from the DOM
        if (contentContainerRef.current) {
          contentToSave = contentContainerRef.current.innerHTML;
        }
        
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
      
      // Refresh the page to show updated content
      window.location.reload();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save changes';
      setError(`Save failed: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        return;
      }
    }
    setIsLiveEditing(false);
    setIsCodeEditing(false);
    setEditableContent('');
    setHasChanges(false);
    setEditingInstructions(true);
  };

  // Event listener for content changes - only track changes, don't update state during typing
  useEffect(() => {
    if (isLiveEditing) {
      const handleContentChange = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.getAttribute('data-editable') === 'true') {
          setHasChanges(true);
        }
      };

      const handleBlur = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.getAttribute('data-editable') === 'true') {
          setHasChanges(true);
        }
      };

      document.addEventListener('input', handleContentChange);
      document.addEventListener('blur', handleBlur, true);

      return () => {
        document.removeEventListener('input', handleContentChange);
        document.removeEventListener('blur', handleBlur, true);
      };
    }
  }, [isLiveEditing]);

  // Handle console errors for debugging
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Content error:', event.error);
      // Check for resource loading errors
      if (event.error && event.error.message && 
          (event.error.message.includes('Failed to load resource') || 
           event.error.message.includes('404') ||
           event.error.message.includes('CORS'))) {
        console.warn('Resource loading error detected:', event.error.message);
        // Automatically switch to iframe mode for resource loading issues
        if (!useIframeFallback) {
          console.log('Auto-switching to iframe mode due to resource loading issues');
          setUseIframeFallback(true);
          setIframeKey(prev => prev + 1);
        }
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [useIframeFallback]);

  // Memoize the processed content to prevent unnecessary re-renders
  const processedContent = useMemo(() => {
    const contentToProcess = isLiveEditing ? editableContent : content;
    
    // Get the base URL for assets
    const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://dt-web-sites.s3.ap-south-1.amazonaws.com';
    const siteBaseUrl = `/site/${mobileNumber}`;
    
    let processed = contentToProcess
      // Add base tag to ensure all relative paths are resolved correctly
      .replace(
        /<head([^>]*)>/i,
        (match, attributes) => {
          return `<head${attributes}><base href="${siteBaseUrl}/">`;
        }
      )
      // Fix relative image paths in img tags
      .replace(
        /<img([^>]*)src=["']([^"']*?)["']([^>]*?)>/gi,
        (match, before, src, after) => {
          // Skip if already absolute URL or data URL
          if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('#') || src.startsWith('/site/')) {
            return match;
          }
          
          // Handle relative paths
          if (src.startsWith('./') || src.startsWith('../') || !src.startsWith('/')) {
            // For live editing, use the site route which properly serves from S3
            const cleanSrc = src.replace(/^\.\//, '').replace(/^\.\.\//, '');
            return `<img${before}src="${siteBaseUrl}/${cleanSrc}"${after}>`;
          }
          
          return match;
        }
      )
      // Fix relative paths in CSS background images
      .replace(
        /background(?:-image)?\s*:\s*url\(["']?([^"')]*?)["']?\)/gi,
        (match, url) => {
          // Skip if already absolute URL or data URL
          if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('#') || url.startsWith('/site/')) {
            return match;
          }
          
          // Handle relative paths
          if (url.startsWith('./') || url.startsWith('../') || !url.startsWith('/')) {
            const cleanUrl = url.replace(/^\.\//, '').replace(/^\.\.\//, '');
            return match.replace(url, `${siteBaseUrl}/${cleanUrl}`);
          }
          
          return match;
        }
      )
      // Fix relative paths in link tags (CSS files)
      .replace(
        /<link([^>]*)href=["']([^"']*?)["']([^>]*?)>/gi,
        (match, before, href, after) => {
          // Skip if already absolute URL or external
          if (href.startsWith('http') || href.startsWith('//') || href.startsWith('/site/')) {
            return match;
          }
          
          // Handle relative paths
          if (href.startsWith('./') || href.startsWith('../') || !href.startsWith('/')) {
            const cleanHref = href.replace(/^\.\//, '').replace(/^\.\.\//, '');
            return `<link${before}href="${siteBaseUrl}/${cleanHref}"${after}>`;
          }
          
          return match;
        }
      )
      // Fix relative paths in script tags
      .replace(
        /<script([^>]*)src=["']([^"']*?)["']([^>]*?)>/gi,
        (match, before, src, after) => {
          // Skip if already absolute URL or external
          if (src.startsWith('http') || src.startsWith('//') || src.startsWith('/site/')) {
            return match;
          }
          
          // Handle relative paths
          if (src.startsWith('./') || src.startsWith('../') || !src.startsWith('/')) {
            const cleanSrc = src.replace(/^\.\//, '').replace(/^\.\.\//, '');
            return `<script${before}src="${siteBaseUrl}/${cleanSrc}"${after}>`;
          }
          
          return match;
        }
      )
      // Fix relative paths in other elements with src attributes (video, audio, etc.)
      .replace(
        /<(video|audio|source|track)([^>]*)src=["']([^"']*?)["']([^>]*?)>/gi,
        (match, tag, before, src, after) => {
          // Skip if already absolute URL or data URL
          if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('#') || src.startsWith('/site/')) {
            return match;
          }
          
          // Handle relative paths
          if (src.startsWith('./') || src.startsWith('../') || !src.startsWith('/')) {
            const cleanSrc = src.replace(/^\.\//, '').replace(/^\.\.\//, '');
            return `<${tag}${before}src="${siteBaseUrl}/${cleanSrc}"${after}>`;
          }
          
          return match;
        }
      );
    
    // If no head tag found, add base tag at the beginning
    if (!processed.includes('<base href=')) {
      processed = processed.replace(
        /<html([^>]*)>/i,
        (match, attributes) => {
          return `<html${attributes}><head><base href="${siteBaseUrl}/"></head>`;
        }
      );
    }
    
    return processed;
  }, [isLiveEditing, editableContent, content, mobileNumber]);

  // Only update the content when switching between modes, not during typing
  const displayContent = useMemo(() => {
    if (isLiveEditing) {
      // During live editing, use the initial editable content and let the DOM handle changes
      return processedContent;
    }
    return processedContent;
  }, [isLiveEditing, processedContent]);

  // Fallback to iframe if content loading fails
  const handleContentLoadError = () => {
    console.log('Content loading failed, switching to iframe fallback');
    setUseIframeFallback(true);
    setIframeKey(prev => prev + 1);
  };

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">{!session ? 'Authenticating...' : 'Loading page for editing...'}</p>
        </div>
      </div>
    );
  }

  if (error && !content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error loading page</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Header with Controls */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-900">
              Editing: {filePath}
            </h1>
            {(isLiveEditing || isCodeEditing) && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">
                  {isLiveEditing ? 'Live Editing Mode' : 'Code Editing Mode'}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            {success && (
              <div className="text-green-600 text-sm">{success}</div>
            )}
            
            {!isLiveEditing && !isCodeEditing && (
              <>
                <button
                  onClick={handleStartLiveEdit}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Live Edit
                </button>
                <button
                  onClick={() => setIsCodeEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Edit HTML
                </button>
              </>
            )}
            
            {(isLiveEditing || isCodeEditing) && (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || (!hasChanges && isLiveEditing)}
                  className={`px-4 py-2 rounded transition-colors ${
                    isSaving
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : hasChanges || isCodeEditing
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-green-400 text-white cursor-not-allowed'
                  }`}
                >
                  {isSaving ? 'Saving...' : hasChanges || isCodeEditing ? 'Save Changes' : 'No Changes'}
                </button>
              </>
            )}
            
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
            
            {!isLiveEditing && !isCodeEditing && (
              <button
                onClick={() => setUseIframeFallback(!useIframeFallback)}
                className={`px-3 py-2 text-sm rounded transition-colors ${
                  useIframeFallback 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
                title="Switch between direct content loading and iframe mode for better asset compatibility"
              >
                {useIframeFallback ? 'Direct Mode' : 'Iframe Mode'}
              </button>
            )}
          </div>
        </div>
        
        {/* Instructions */}
        {isLiveEditing && editingInstructions && (
          <div className="bg-green-50 border-t border-green-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-green-700">
                  <strong>Live Editing:</strong> Hover over text to see it highlight, then click to edit directly. Your changes are automatically tracked.
                </span>
              </div>
              <button
                onClick={() => setEditingInstructions(false)}
                className="text-green-500 hover:text-green-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Content Area */}
      <div className="pt-16">
        {isCodeEditing ? (
          <div className="h-screen">
            <CodeEditor
              filePath={`s3/${mobileNumber}/${filePath}`}
              onClose={() => setIsCodeEditing(false)}
              embedded={false}
            />
          </div>
        ) : (
          <>
            {useIframeFallback ? (
              <div className="min-h-screen">
                <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
                  <div className="flex items-center space-x-2">
                    <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-yellow-700">
                      Using fallback mode: Content loaded through site route for proper asset display
                    </span>
                    <button
                      onClick={() => setUseIframeFallback(false)}
                      className="text-yellow-600 hover:text-yellow-800 text-sm underline"
                    >
                      Try direct mode again
                    </button>
                  </div>
                </div>
                <iframe
                  key={iframeKey}
                  src={`/site/${mobileNumber}/${filePath}`}
                  className="w-full h-screen border-0"
                  title="Live Edit Content"
                  onLoad={() => console.log('Iframe content loaded')}
                  onError={() => console.error('Iframe loading failed')}
                />
              </div>
            ) : (
              <div 
                className="min-h-screen"
                ref={contentContainerRef}
                dangerouslySetInnerHTML={{
                  __html: displayContent
                }}
                onLoad={(e) => {
                  console.log('Content loaded successfully');
                }}
                onError={(e) => {
                  console.error('Content loading error:', e);
                  handleContentLoadError();
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
} 