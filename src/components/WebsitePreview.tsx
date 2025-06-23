'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface WebsitePreviewProps {
  mobileNumber: string;
  initialPath?: string;
}

interface S3File {
  name: string;
  size: number;
  lastModified: string;
  type: 'file' | 'directory';
  path: string;
}

export default function WebsitePreview({ mobileNumber, initialPath = 'index.html' }: WebsitePreviewProps) {
  const { data: session } = useSession();
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [isEditing, setIsEditing] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [mobilePreviewUrl, setMobilePreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableFiles, setAvailableFiles] = useState<S3File[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [mobileRefreshKey, setMobileRefreshKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const mobileIframeRef = useRef<HTMLIFrameElement>(null);

  // Set initial preview URLs
  useEffect(() => {
    if (mobileNumber) {
      setPreviewUrl(`/site/${mobileNumber}/${currentPath}?preview=true`);
      setMobilePreviewUrl(`/site/${mobileNumber}/${currentPath}?v=${Date.now()}`);
    }
  }, [mobileNumber, currentPath, mobileRefreshKey]);

  // Fetch available files on mount
  useEffect(() => {
    if (mobileNumber) {
      fetchAvailableFiles();
    }
  }, [mobileNumber]);

  // Listen for upload events to refresh files
  useEffect(() => {
    const handleFileUpload = () => {
      if (mobileNumber) {
        fetchAvailableFiles();
      }
    };

    // Listen for custom upload events
    window.addEventListener('s3-upload-complete', handleFileUpload);
    
    return () => {
      window.removeEventListener('s3-upload-complete', handleFileUpload);
    };
  }, [mobileNumber]);

  // Fetch available files from S3
  const fetchAvailableFiles = async () => {
    if (!mobileNumber) return;
    
    setIsLoadingFiles(true);
    try {
      const response = await fetch(`/api/s3-files?userId=${mobileNumber}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch files');
      }
      
      // Filter to only show HTML files
      const htmlFiles = data.files?.filter((file: S3File) => 
        file.type === 'file' && file.name.toLowerCase().endsWith('.html')
      ) || [];
      
      setAvailableFiles(htmlFiles);
      
      // If no index.html exists but there are other HTML files, use the first one
      if (htmlFiles.length > 0 && !htmlFiles.some((file: S3File) => file.name === 'index.html')) {
        setCurrentPath(htmlFiles[0].path);
      }
    } catch (error) {
      console.error('Error fetching available files:', error);
      setError('Failed to load available files');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Fetch file content for editing
  const fetchFileContent = async () => {
    if (!mobileNumber || !currentPath) return;
    
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/s3-file-content?userId=${mobileNumber}&path=${currentPath}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch file content');
      }
      
      setHtmlContent(data.content || '');
    } catch (error) {
      console.error('Error fetching file content:', error);
      setError('Failed to load file content');
    } finally {
      setIsLoading(false);
    }
  };

  // Save file content
  const saveFileContent = async () => {
    if (!mobileNumber || !currentPath) return;
    
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/s3-update-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: mobileNumber,
          path: currentPath,
          content: htmlContent,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save file');
      }
      
      setSuccess('File saved successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
      
      // Refresh the iframe to show changes
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src;
      }
      
      // Refresh mobile preview to show changes
      refreshMobilePreview();
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving file:', error);
      setError('Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (!isEditing) {
      fetchFileContent();
    }
    setIsEditing(!isEditing);
    setError('');
    setSuccess('');
  };

  // Handle path change
  const handlePathChange = (newPath: string) => {
    setCurrentPath(newPath);
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  // Function to refresh mobile preview
  const refreshMobilePreview = () => {
    setMobileRefreshKey(prev => prev + 1);
  };

  // Show loading if files are being fetched
  if (isLoadingFiles) {
    return (
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <h2 className="text-lg font-bold text-gray-800">Website Preview & Editor</h2>
          </div>
        </div>
        <div className="p-6 flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">Loading website files...</span>
        </div>
      </div>
    );
  }

  // Show message if no HTML files found
  if (availableFiles.length === 0) {
    return (
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <h2 className="text-lg font-bold text-gray-800">Website Preview & Editor</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-yellow-700">
                <strong>No HTML files found.</strong> Please upload a website first using the upload section above.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <h2 className="text-lg font-bold text-gray-800">Website Preview & Editor</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Path selector */}
            <div className="flex items-center">
              <label htmlFor="path-select" className="text-sm text-gray-600 mr-2">File:</label>
              <select
                id="path-select"
                value={currentPath}
                onChange={(e) => handlePathChange(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {availableFiles.map((file) => (
                  <option key={file.path} value={file.path}>
                    {file.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Refresh files button */}
            <button
              onClick={fetchAvailableFiles}
              className="flex items-center px-2 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              title="Refresh file list"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            {/* Edit toggle button */}
            <button
              onClick={handleEditToggle}
              disabled={isLoading}
              className={`flex items-center px-3 py-1 text-sm rounded-md transition-colors ${
                isEditing
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              }`}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent mr-1"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              )}
              {isEditing ? 'Cancel Edit' : 'Edit HTML'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg flex items-start border border-red-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg flex items-start border border-green-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {isEditing ? (
          /* Edit Mode */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-semibold text-gray-800">
                Editing: {currentPath}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveFileContent}
                  disabled={isSaving}
                  className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  )}
                  Save Changes
                </button>
              </div>
            </div>
            
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              placeholder="HTML content will appear here..."
            />
            
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Changes will be saved directly to your S3 hosted website. 
                Make sure to save your changes before switching files or leaving edit mode.
              </p>
            </div>
          </div>
        ) : (
          /* Preview Mode */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-semibold text-gray-800">
                Live Preview: {currentPath}
              </h3>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in New Tab
              </a>
            </div>
            
            {/* Desktop and Mobile Preview Container */}
            <div className="space-y-6">
              {/* Desktop Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Desktop View
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Full Width</span>
                </div>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <iframe
                    ref={iframeRef}
                    src={previewUrl}
                    className="w-full h-96 md:h-[500px] lg:h-[600px]"
                    title="Desktop Website Preview"
                    onLoad={() => console.log('Desktop preview loaded')}
                  />
                </div>
              </div>

              {/* Mobile Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
                    </svg>
                    Mobile View
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">375px Width</span>
                    <button
                      onClick={refreshMobilePreview}
                      className="flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      title="Refresh mobile preview"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Mobile Frame */}
                    <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-xl">
                      <div className="relative bg-gray-800 rounded-[2rem] p-1">
                        <div className="relative bg-black rounded-[1.5rem] overflow-hidden">
                          {/* Notch */}
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-6 bg-black rounded-b-xl z-10"></div>
                          {/* Screen */}
                          <div className="relative bg-white rounded-[1.5rem] overflow-hidden" style={{ width: '320px', height: '568px' }}>
                            <iframe
                              ref={mobileIframeRef}
                              src={mobilePreviewUrl}
                              className="w-full h-full border-0"
                              title="Mobile Website Preview"
                              style={{ 
                                transform: 'scale(0.85)',
                                transformOrigin: '0 0',
                                width: '375px',
                                height: '667px'
                              }}
                              onLoad={() => console.log('Mobile preview loaded')}
                            />
                          </div>
                        </div>
                      </div>
                      {/* Home indicator */}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-1/3 h-1 bg-gray-300 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600 mb-2">
                This preview shows your live website in both desktop and mobile views with <strong>image replacement functionality</strong>. 
                Click "Edit HTML" to modify the content directly.
                You can switch between different pages using the file selector above.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="text-xs text-blue-700">
                    <strong>Enhanced Image Management:</strong> Hover over any image in either preview to see image information and a "Replace" button. 
                    You can either upload a new file or use an external image URL. For local images, URL changes will be automatically 
                    updated across all HTML files in your website. This feature is only available in preview mode.
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        <span>Upload new image files (JPEG, PNG, GIF, WebP) - replaces the file on S3</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        <span>Use external image URLs - updates all HTML files automatically</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        <span>Saves changes to respective HTML files on S3 (no manual editing needed)</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                        <span>Supports all image reference types: src, background-image, srcset, data attributes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 