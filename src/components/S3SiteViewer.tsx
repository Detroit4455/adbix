'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import CodeEditor from './CodeEditor';

interface S3File {
  name: string;
  size: number;
  lastModified: string;
  type: 'file' | 'directory';
  path: string;
  contentType?: string;
}

export default function S3SiteViewer({ userId, initialPath = '' }: { userId: string, initialPath?: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [files, setFiles] = useState<S3File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<S3File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [showImageReplaceModal, setShowImageReplaceModal] = useState(false);
  const [imageReplaceMethod, setImageReplaceMethod] = useState<'file' | 'url'>('file');
  const [imageUrlInput, setImageUrlInput] = useState('');
  
  // Fetch S3 files/directories
  useEffect(() => {
    async function fetchFiles() {
      setLoading(true);
      setError('');
      
      try {
        const response = await fetch(`/api/s3-files?userId=${userId}&path=${encodeURIComponent(currentPath)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch files');
        }
        
        const data = await response.json();
        setFiles(data.files || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch files');
      } finally {
        setLoading(false);
      }
    }
    
    fetchFiles();
  }, [userId, currentPath]);
  
  // Navigate to directory
  const navigateToDirectory = (dirPath: string) => {
    setCurrentPath(dirPath);
    setIsEditing(false);
    setSelectedFile(null);
    setFileContent('');
  };
  
  // Navigate up one level
  const navigateUp = () => {
    if (currentPath) {
      const pathParts = currentPath.split('/');
      pathParts.pop();
      setCurrentPath(pathParts.join('/'));
      setIsEditing(false);
      setSelectedFile(null);
      setFileContent('');
    }
  };
  
  // View file
  const viewFile = (file: S3File) => {
    if (file.type === 'directory') {
      navigateToDirectory(file.path);
    } else {
      setSelectedFile(file);
      
      if (isImageFile(file.name)) {
        // For images, open the image viewer
        setSelectedImage(`https://dt-web-sites.s3.ap-south-1.amazonaws.com/sites/${userId}/${file.path}`);
        setImageViewerOpen(true);
      } else {
        // For text files, we could offer editing
        const editableExtensions = ['.html', '.css', '.js', '.json', '.txt', '.md', '.xml', '.svg'];
        const isEditable = editableExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        
        if (isEditable) {
          fetchFileContent(file);
        } else {
          window.open(`https://dt-web-sites.s3.ap-south-1.amazonaws.com/sites/${userId}/${file.path}`, '_blank');
        }
      }
    }
  };
  
  // Add a direct edit file function to be used by the edit button
  const editFile = (file: S3File, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (file.type !== 'file') return;
    
    const editableExtensions = ['.html', '.css', '.js', '.json', '.txt', '.md', '.xml', '.svg'];
    const isEditable = editableExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (isEditable) {
      setSelectedFile(file);
      fetchFileContent(file);
    } else {
      setError('This file type cannot be edited');
    }
  };
  
  // Fetch file content for editing
  const fetchFileContent = async (file: S3File) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching content for:', file.path);
      const response = await fetch(`/api/s3-file-content?userId=${userId}&path=${encodeURIComponent(file.path)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch file content');
      }
      
      const data = await response.json();
      setFileContent(data.content || '');
      setSelectedFile(file);
      setIsEditing(true);
      console.log('Editor opened for:', file.name);
    } catch (err) {
      console.error('Error fetching file content:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch file content');
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Save edited file content
  const saveFileContent = async () => {
    if (!selectedFile) return;
    
    try {
      setIsSaving(true);
      const response = await fetch('/api/s3-update-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          path: selectedFile.path,
          content: fileContent,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save file');
      }
      
      // Refresh the file list
      const filesResponse = await fetch(`/api/s3-files?userId=${userId}&path=${encodeURIComponent(currentPath)}`);
      const data = await filesResponse.json();
      setFiles(data.files || []);
      
      // Exit edit mode
      setIsEditing(false);
      setSelectedFile(null);
      setFileContent('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setSelectedFile(null);
    setFileContent('');
  };
  
  // Open replace file modal
  const openReplaceModal = (file: S3File) => {
    setSelectedFile(file);
    setShowReplaceModal(true);
  };
  
  // Modify the replaceFile function to preserve the original file name
  const replaceFile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !fileInputRef.current?.files?.[0]) return;
    
    const newFile = fileInputRef.current.files[0];
    
    // Create a new File object with the original name but new content
    // This ensures the file name stays the same on S3
    const originalFileName = selectedFile.name;
    const contentType = newFile.type || 'application/octet-stream';
    
    // Create form data for the API call
    const formData = new FormData();
    
    // Read the file content
    const fileContent = await newFile.arrayBuffer();
    
    // Create a new file with the original name but new content
    const fileToUpload = new File([fileContent], originalFileName, { 
      type: contentType,
      lastModified: new Date().getTime()
    });
    
    formData.append('file', fileToUpload);
    formData.append('userId', userId);
    formData.append('path', selectedFile.path);
    formData.append('preserveFileName', 'true'); // Flag to ensure original name is preserved
    
    try {
      setIsSaving(true);
      const response = await fetch('/api/s3-replace-file', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to replace file');
      }
      
      // Refresh the file list
      const filesResponse = await fetch(`/api/s3-files?userId=${userId}&path=${encodeURIComponent(currentPath)}`);
      const data = await filesResponse.json();
      setFiles(data.files || []);
      
      // Close modal and reset
      setShowReplaceModal(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to replace file');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Generate breadcrumbs
  const getBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    return [
      { name: 'Root', path: '' },
      ...parts.map((part, index) => {
        const path = parts.slice(0, index + 1).join('/');
        return { name: part, path };
      })
    ];
  };
  
  // Custom close handler for CodeEditor
  const handleEditorClose = () => {
    setIsEditing(false);
    setSelectedFile(null);
    setFileContent('');
  };
  
  // Modify the isImageFile function to separate SVG files (which may be better treated as code)
  const isImageFile = (fileName: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };
  
  // Add a function to get image file type icon
  const getFileIcon = (fileName: string) => {
    if (fileName.toLowerCase().endsWith('.svg')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (fileName.toLowerCase().endsWith('.html')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    } else if (fileName.toLowerCase().endsWith('.css')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else if (fileName.toLowerCase().endsWith('.js')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
  };
  
  // Open rename modal
  const openRenameModal = (file: S3File, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFile(file);
    setNewFileName(file.name);
    setShowRenameModal(true);
  };

  // Rename file
  const renameFile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !newFileName.trim()) return;
    
    try {
      setIsRenaming(true);
      setError('');
      
      const response = await fetch('/api/s3-rename-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          oldPath: selectedFile.path,
          newName: newFileName,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rename file');
      }
      
      // Refresh the file list
      const filesResponse = await fetch(`/api/s3-files?userId=${userId}&path=${encodeURIComponent(currentPath)}`);
      const data = await filesResponse.json();
      setFiles(data.files || []);
      
      // Close modal and reset
      setShowRenameModal(false);
      setSelectedFile(null);
      setNewFileName('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename file');
    } finally {
      setIsRenaming(false);
    }
  };

  // Close rename modal
  const closeRenameModal = () => {
    setShowRenameModal(false);
    setSelectedFile(null);
    setNewFileName('');
  };

  // Open image replace modal
  const openImageReplaceModal = (file: S3File) => {
    setSelectedFile(file);
    setShowImageReplaceModal(true);
    setImageReplaceMethod('file');
    setImageUrlInput('');
  };

  // Replace image with file or URL
  const replaceImageFile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) return;
    
    try {
      setIsSaving(true);
      
      if (imageReplaceMethod === 'file') {
        // Handle file upload
        const fileInput = document.querySelector('#image-file-input') as HTMLInputElement;
        const newFile = fileInput?.files?.[0];
        
        if (!newFile) {
          setError('Please select an image file');
          return;
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(newFile.type)) {
          setError('Please select a valid image file (JPEG, PNG, GIF, WebP)');
          return;
        }
        
        const formData = new FormData();
        formData.append('imageFile', newFile);
        formData.append('imagePath', selectedFile.path);
        formData.append('mobileNumber', userId);
        
        const response = await fetch('/api/replace-image', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to replace image');
        }
        
      } else {
        // Handle URL update
        if (!imageUrlInput.trim()) {
          setError('Please enter a valid image URL');
          return;
        }
        
        const response = await fetch('/api/update-image-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            oldImagePath: selectedFile.path,
            newImageUrl: imageUrlInput.trim(),
            mobileNumber: userId
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update image URL');
        }
        
        const data = await response.json();
        
        // Show detailed success message
        const filesCount = data.updatedFiles ? data.updatedFiles.length : 0;
        let successMessage = 'Image URL updated successfully!';
        if (filesCount > 0) {
          const fileNames = data.updatedFiles.map((f: string) => f.split('/').pop()).join(', ');
          successMessage = `Image URL updated in ${filesCount} HTML file(s): ${fileNames}`;
        } else {
          successMessage = 'Image URL updated (no HTML files needed changes)';
        }
        
        // You can add a toast notification here if you have one implemented
        console.log(successMessage);
      }
      
      // Close modal and refresh files
      setShowImageReplaceModal(false);
      setSelectedFile(null);
      setImageUrlInput('');
      
      // Refresh the file list
      const filesResponse = await fetch(`/api/s3-files?userId=${userId}&path=${encodeURIComponent(currentPath)}`);
      const data = await filesResponse.json();
      setFiles(data.files || []);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to replace image');
    } finally {
      setIsSaving(false);
    }
  };

  // Close image replace modal
  const closeImageReplaceModal = () => {
    setShowImageReplaceModal(false);
    setSelectedFile(null);
    setImageUrlInput('');
    setImageReplaceMethod('file');
  };
  
  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }
  
  // If we're in edit mode with a selected file, render the CodeEditor component
  if (isEditing && selectedFile) {
    // Create a virtual file path for the CodeEditor component to use
    const virtualFilePath = `s3/${userId}/${selectedFile.path}`;
    
    // Pass our existing content and save function to a custom CodeEditor wrapper
    return (
      <S3CodeEditorWrapper
        filePath={virtualFilePath}
        initialContent={fileContent}
        fileName={selectedFile.name}
        onClose={handleEditorClose}
        onSave={async (content) => {
          setIsSaving(true);
          try {
            const response = await fetch('/api/s3-update-file', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId,
                path: selectedFile.path,
                content,
              }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to save file');
            }
            
            // Refresh the file list
            const filesResponse = await fetch(`/api/s3-files?userId=${userId}&path=${encodeURIComponent(currentPath)}`);
            const data = await filesResponse.json();
            setFiles(data.files || []);
            
            // Exit edit mode
            setTimeout(() => {
              setIsEditing(false);
              setSelectedFile(null);
              setFileContent('');
            }, 1500); // Show success message for 1.5 seconds
            
            return true;
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save file');
            return false;
          } finally {
            setIsSaving(false);
          }
        }}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Breadcrumb navigation */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2 text-sm">
          {currentPath && (
            <button
              onClick={navigateUp}
              className="text-gray-600 hover:text-gray-800 mr-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {getBreadcrumbs().map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <span className="mx-2 text-gray-400">/</span>}
              <button
                onClick={() => navigateToDirectory(crumb.path)}
                className="text-indigo-600 hover:text-indigo-800"
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* File listing */}
      <div className="divide-y">
        {error && (
          <div className="p-4 bg-red-50 text-red-700">
            {error}
          </div>
        )}
        
        {files.length === 0 && !error ? (
          <div className="p-6 text-center text-gray-500">
            No files found in this location
          </div>
        ) : (
          files.map((file) => (
            <div 
              key={file.name}
              className="p-3 hover:bg-gray-50 flex items-center group"
            >
              <div 
                className="flex-1 flex items-center cursor-pointer" 
                onClick={() => viewFile(file)}
              >
                {file.type === 'directory' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                ) : isImageFile(file.name) ? (
                  <div className="w-12 h-12 mr-3 rounded border border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50 shadow-sm hover:shadow transition-shadow">
                    <img 
                      src={`https://dt-web-sites.s3.ap-south-1.amazonaws.com/sites/${userId}/${file.path}`}
                      alt={file.name}
                      className="max-w-full max-h-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        // If image fails to load, replace with a placeholder
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSI+SW1hZ2U8L3RleHQ+PC9zdmc+';
                      }}
                    />
                  </div>
                ) : (
                  getFileIcon(file.name)
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {file.type === 'file' ? `${(file.size / 1024).toFixed(2)} KB` : 'Folder'}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(file.lastModified).toLocaleDateString()}
                </div>
              </div>
              
              {/* File actions */}
              {file.type === 'file' && (
                <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent the row click from triggering
                        editFile(file, e);
                      }}
                      className="p-1 text-indigo-600 hover:text-indigo-800"
                      title="Edit file"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {isImageFile(file.name) ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageReplaceModal(file);
                        }}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Replace image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                    ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent the row click from triggering
                        openReplaceModal(file);
                      }}
                      className="p-1 text-green-600 hover:text-green-800"
                      title="Replace file"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent the row click from triggering
                        openRenameModal(file, e);
                      }}
                      className="p-1 text-amber-600 hover:text-amber-800"
                      title="Rename file"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <a
                      href={`https://dt-web-sites.s3.ap-south-1.amazonaws.com/sites/${userId}/${file.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="View file"
                      onClick={(e) => e.stopPropagation()} // Prevent the row click from triggering
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Replace File Modal */}
      {showReplaceModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Replace File</h3>
            <p className="text-sm text-gray-600 mb-2">
              You are about to replace <span className="font-semibold">{selectedFile.name}</span>.
              The new file will keep the original filename <span className="font-semibold text-indigo-600">{selectedFile.name}</span>.
            </p>
            <p className="text-xs text-gray-500 mb-4 italic">
              Note: Only the content will be replaced. The filename will remain unchanged regardless of the selected file's name.
            </p>
            
            <form onSubmit={replaceFile}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Content
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowReplaceModal(false);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-4 py-2 text-white rounded-md transition-colors ${
                    isSaving 
                      ? 'bg-green-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isSaving ? 'Replacing...' : 'Replace File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Image Viewer Modal */}
      {imageViewerOpen && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setImageViewerOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-2">
            <button 
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
              onClick={() => setImageViewerOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
      
      {/* Rename File Modal */}
      {showRenameModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Rename {selectedFile.name}</h3>
            
            <form onSubmit={renameFile}>
              <div className="mb-4">
                <label htmlFor="newFileName" className="block text-sm font-medium text-gray-700 mb-1">
                  New File Name:
                </label>
                <input
                  type="text"
                  id="newFileName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeRenameModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
                  disabled={isRenaming}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none flex items-center"
                  disabled={isRenaming}
                >
                  {isRenaming ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Renaming...
                    </>
                  ) : (
                    'Rename'
                  )}
                </button>
              </div>
            </form>
            
            {error && (
              <div className="mt-3 p-2 bg-red-50 text-red-700 text-sm rounded">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper for CodeEditor to handle S3-specific functionality
interface S3CodeEditorWrapperProps {
  filePath: string;
  fileName: string;
  initialContent: string;
  onClose: () => void;
  onSave: (content: string) => Promise<boolean>;
}

function S3CodeEditorWrapper({ 
  filePath, 
  fileName, 
  initialContent, 
  onClose,
  onSave 
}: S3CodeEditorWrapperProps) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Custom save handler
  const handleSave = async () => {
    if (saving) return;
    
    setSaving(true);
    setSaveSuccess(false);
    setError('');
    
    try {
      const success = await onSave(content);
      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setSaving(false);
    }
  };
  
  // Determine language from file extension
  const getLanguageFromExtension = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension) return 'plaintext';
    
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'php': 'php',
      'xml': 'xml',
      'svg': 'xml',
      'txt': 'plaintext',
    };
    
    return languageMap[extension] || 'plaintext';
  };
  
  const language = getLanguageFromExtension(fileName);
  
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{fileName}</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
        {saveSuccess && (
          <div className="mb-4 p-4 bg-green-50 rounded-md">
            <p className="text-sm text-green-700">Changes saved successfully!</p>
            </div>
          )}
          
        <div className="flex-grow mb-4 border rounded overflow-hidden">
          <Editor
            height="60vh"
            language={language}
            value={content}
            onChange={(value: string | undefined) => setContent(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              wordWrap: 'on',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 rounded ${
              saving 
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
} 