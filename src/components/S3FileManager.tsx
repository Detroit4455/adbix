'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import CodeEditor from './CodeEditor';
import { createPortal } from 'react-dom';

interface S3FileInfo {
  name: string;
  type: string;
  size: number;
  lastModified: string;
  isDirectory?: boolean;
  path: string;
}

export default function S3FileManager() {
  const { data: session } = useSession();
  const [files, setFiles] = useState<S3FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<string>('all');
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('html');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'view' | 'edit' | 'code'>('view');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [isSavingPreview, setIsSavingPreview] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const refreshInterval = 30000; // 30 seconds

  useEffect(() => {
    if (session?.user?.mobileNumber) {
      fetchFiles();
    }
  }, [session, currentPath]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/s3-files?userId=${session?.user?.mobileNumber}&path=${currentPath}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch files');
      }
      const data = await response.json();
      setFiles(data.files);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }

    try {
      const response = await fetch('/api/s3-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderName: newFolderName.trim(),
          userId: session?.user?.mobileNumber,
          path: currentPath
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create folder');
      }

      setNewFolderName('');
      setIsCreatingFolder(false);
      await fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', session?.user?.mobileNumber || '');
        formData.append('path', currentPath);

        const response = await fetch('/api/s3-files', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      await fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) {
      setError('File name cannot be empty');
      return;
    }

    try {
      // Add file extension if not present
      const fileName = newFileName.includes('.') ? newFileName : `${newFileName}.${newFileType}`;
      
      const response = await fetch('/api/s3-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.mobileNumber,
          path: currentPath,
          content: getDefaultTemplate(newFileType),
          fileName: fileName,
          isNewFile: true
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create file');
      }

      setNewFileName('');
      setIsCreatingFile(false);
      await fetchFiles();
      setSuccess('File created successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create file');
    }
  };

  const handleDelete = async (fileName: string, filePath: string, isDirectory = false) => {
    const confirmMsg = isDirectory
      ? `Are you sure you want to delete the folder "${fileName}" and all its contents? This action cannot be undone.`
      : `Are you sure you want to delete ${fileName}? This action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    try {
      let directoryPath = '';
      let itemName = fileName;

      console.log('BEFORE PROCESSING:', {
        fileName,
        filePath,
        isDirectory,
        currentPath
      });

      if (isDirectory) {
        // For directories, we need the PARENT directory path, not the directory path itself
        // Example: if deleting folder 'images', and file.path is 'images', then parent is ''
        // Example: if deleting folder 'sub', and file.path is 'parent/sub', then parent is 'parent'
        
        // Split the filePath and remove the last part (which is the directory name itself)
        const pathParts = filePath.split('/').filter(part => part.length > 0);
        if (pathParts.length > 1) {
          // Remove the last part (directory name) to get parent path
          pathParts.pop();
          directoryPath = pathParts.join('/');
        } else {
          // Directory is in root (filePath is just the directory name)
          directoryPath = '';
        }
        
        console.log('DIRECTORY PROCESSING:', {
          originalFilePath: filePath,
          pathParts,
          finalDirectoryPath: directoryPath
        });
        
        itemName = fileName;
      } else {
        // For files, extract the directory path (everything except the filename)
        const lastSlashIndex = filePath.lastIndexOf('/');
        if (lastSlashIndex >= 0) {
          directoryPath = filePath.substring(0, lastSlashIndex);
        } else {
          directoryPath = '';
        }
        itemName = fileName;
      }

      // Debug logging
      console.log('FINAL Delete request:', {
        fileName: itemName,
        userId: session?.user?.mobileNumber,
        path: directoryPath,
        isDirectory,
        originalFilePath: filePath,
        expectedS3Key: `sites/${session?.user?.mobileNumber}/${directoryPath ? directoryPath + '/' : ''}${itemName}${isDirectory ? '/' : ''}`
      });

      const response = await fetch('/api/s3-files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileName: itemName, 
          userId: session?.user?.mobileNumber,
          path: directoryPath,
          isDirectory
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete file');
      }

      await fetchFiles();
      setSuccess(isDirectory ? 'Folder deleted successfully' : 'File deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const handleFolderClick = (folderPath: string) => {
    // Ensure folder path ends with a slash
    const normalizedPath = folderPath.endsWith('/') ? folderPath : folderPath + '/';
    setCurrentPath(normalizedPath);
  };

  const handleBack = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/');
    setCurrentPath(parentPath);
  };

  const handlePreview = async (filePath: string) => {
    try {
      setIsPreviewLoading(true);
      const response = await fetch(`/api/s3-file-content?userId=${session?.user?.mobileNumber}&path=${filePath}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch file content');
      }
      
      const data = await response.json();
      setPreviewContent(data.content);
      setPreviewFile(filePath);
      setPreviewMode('view');
      setLastRefreshTime(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file for preview');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleRefreshPreview = async () => {
    if (!previewFile) return;
    await handlePreview(previewFile);
  };

  // Add useEffect for auto-refresh
  useEffect(() => {
    if (previewMode === 'view' && previewFile) {
      const interval = setInterval(() => {
        handleRefreshPreview();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [previewMode, previewFile]);

  const handleSavePreview = async () => {
    if (!previewFile || !previewContent) return;
    
    try {
      setIsSavingPreview(true);
      
      // Clean up the content before saving
      let cleanedContent = previewContent;
      
      // Remove any injected UI elements
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = cleanedContent;
      
      // Remove any elements with specific classes or IDs that might be injected
      const elementsToRemove = tempDiv.querySelectorAll('.preview-ui, .image-replace, .refresh-button, [data-preview-mode]');
      elementsToRemove.forEach(el => el.remove());
      
      // Remove any script tags that might have been injected
      const scripts = tempDiv.querySelectorAll('script');
      scripts.forEach(script => script.remove());
      
      // Get the cleaned HTML
      cleanedContent = tempDiv.innerHTML;
      
      // Ensure we have proper HTML structure
      if (!cleanedContent.includes('<!DOCTYPE html>')) {
        cleanedContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${previewFile.split('/').pop()}</title>
</head>
<body>
    ${cleanedContent}
</body>
</html>`;
      }
      
      const response = await fetch('/api/s3-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session?.user?.mobileNumber,
          path: previewFile.substring(0, previewFile.lastIndexOf('/')),
          content: cleanedContent,
          fileName: previewFile.split('/').pop() || '',
          isUpdate: true
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save changes');
      }

      setSuccess('Changes saved successfully');
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh the preview content
      setPreviewContent(cleanedContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSavingPreview(false);
    }
  };

  const handleEdit = async (filePath: string) => {
    try {
      const response = await fetch(`/api/s3-file-content?userId=${session?.user?.mobileNumber}&path=${filePath}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch file content');
      }
      
      const data = await response.json();
      setEditingFile(filePath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file for editing');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getFileIcon = (file: S3FileInfo) => {
    if (file.isDirectory) {
      return (
        <svg className="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    }
    if (file.type.startsWith('image/')) {
      return (
        <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (file.type.includes('pdf')) {
      return (
        <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    if (isEditableFile(file)) {
      return (
        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    return (
      <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  };

  const isEditableFile = (file: S3FileInfo): boolean => {
    if (file.isDirectory) return false;
    if (file.type.startsWith('image/')) return false;
    if (file.type.includes('pdf')) return false;
    
    const editableExtensions = [
      'html', 'htm', 'css', 'js', 'jsx', 'ts', 'tsx', 
      'json', 'md', 'txt', 'xml', 'svg', 'yaml', 'yml',
      'php', 'py', 'rb', 'c', 'cpp', 'h', 'java', 'go'
    ];
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension ? editableExtensions.includes(extension) : false;
  };

  const sortedAndFilteredFiles = files
    .filter(file => {
      if (filterType === 'all') return true;
      if (filterType === 'editable') return isEditableFile(file);
      if (file.isDirectory) return filterType === 'folder';
      return file.type.startsWith(filterType);
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'size') {
        comparison = a.size - b.size;
      } else if (sortBy === 'date') {
        comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getDefaultTemplate = (fileType: string): string => {
    switch (fileType) {
      case 'html':
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Page</title>
</head>
<body>
    <h1>Welcome to your new page</h1>
    <p>Start editing this file to create your content.</p>
</body>
</html>`;
      case 'css':
        return `/* Add your styles here */
body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 20px;
}`;
      case 'js':
        return `// Add your JavaScript code here
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded');
});`;
      case 'json':
        return `{
    "name": "new-file",
    "description": "Add your JSON content here"
}`;
      case 'md':
        return `# New Markdown File

Start writing your markdown content here.

## Features
- Easy to write
- Supports formatting
- Can include code blocks`;
      case 'txt':
        return 'Start writing your text content here.';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">S3 Website Files</h2>
          <p className="text-sm text-gray-600 mt-1">Files marked as "Editable" can be modified using the built-in code editor.</p>
        </div>
        <div className="flex space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-green-500 bg-opacity-80 text-white text-xs rounded hover:bg-green-600 transition"
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="px-3 py-1.5 bg-indigo-500 bg-opacity-80 text-white text-xs rounded hover:bg-indigo-600 transition"
            disabled={isCreatingFolder || isCreatingFile}
          >
            New Folder
          </button>
          <button
            onClick={() => setIsCreatingFile(true)}
            className="px-3 py-1.5 bg-green-500 bg-opacity-80 text-white text-xs rounded hover:bg-green-600 transition"
            disabled={isCreatingFolder || isCreatingFile}
          >
            New File
          </button>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2 py-1 text-xs border rounded bg-white"
          >
            <option value="all">All Files</option>
            <option value="editable">Editable Files</option>
            <option value="folder">Folders</option>
            <option value="image/">Images</option>
            <option value="text/html">HTML</option>
            <option value="text/css">CSS</option>
            <option value="application/javascript">JavaScript</option>
            <option value="application/pdf">PDF</option>
            <option value="text/plain">Text</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'size' | 'date')}
            className="px-2 py-1 text-xs border rounded bg-white"
          >
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
            <option value="date">Sort by Date</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-2 py-1 bg-gray-100 text-xs rounded hover:bg-gray-200"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 rounded-md">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {isCreatingFolder && (
        <div className="mb-4 p-4 bg-gray-50 rounded-md">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="flex-1 px-3 py-2 border rounded-md text-sm"
            />
            <button
              onClick={handleCreateFolder}
              className="px-3 py-2 bg-indigo-500 text-white text-sm rounded-md hover:bg-indigo-600"
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreatingFolder(false);
                setNewFolderName('');
              }}
              className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isCreatingFile && (
        <div className="mb-4 p-4 bg-gray-50 rounded-md">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Enter file name"
              className="flex-1 px-3 py-2 border rounded-md text-sm"
            />
            <select
              value={newFileType}
              onChange={(e) => setNewFileType(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="js">JavaScript</option>
              <option value="json">JSON</option>
              <option value="md">Markdown</option>
              <option value="txt">Text</option>
            </select>
            <button
              onClick={handleCreateFile}
              className="px-3 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreatingFile(false);
                setNewFileName('');
              }}
              className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {currentPath && (
        <div className="mb-4 flex items-center space-x-2">
          <button
            onClick={handleBack}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
          >
            ← Back
          </button>
          <span className="text-sm text-gray-600">
            Current path: {currentPath}
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Modified</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAndFilteredFiles.map((file) => (
              <tr key={file.path} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {getFileIcon(file)}
                    </div>
                    <div className="ml-4">
                      {(file.isDirectory || file.type === 'directory') ? (
                        <button
                          onClick={() => handleFolderClick(file.path)}
                          className="text-indigo-600 hover:text-indigo-500 font-medium"
                        >
                          {file.name}/
                        </button>
                      ) : isEditableFile(file) ? (
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{file.name}</div>
                          <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">Editable</span>
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{file.name}</div>
                      )}
                      {file.type.startsWith('image/') && (
                        <div className="mt-2">
                          <Image
                            src={`https://dt-web-sites.s3.ap-south-1.amazonaws.com/sites/${session?.user?.mobileNumber}/${file.path}`}
                            alt={file.name}
                            width={100}
                            height={100}
                            className="object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {file.isDirectory ? '-' : formatFileSize(file.size)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(file.lastModified)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-4">
                    {isEditableFile(file) && (
                      <button
                        onClick={() => handleEdit(file.path)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                    )}
                    {!file.isDirectory && file.name.endsWith('.html') && (
                      <button
                        onClick={() => handlePreview(file.path)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Preview
                      </button>
                    )}
                    {(file.isDirectory || file.type === 'directory') ? (
                      <button
                        onClick={() => handleDelete(file.name, file.path, true)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete folder and all contents"
                      >
                        Delete
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDelete(file.name, file.path, false)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete file"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedAndFilteredFiles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No files found. Upload some files to get started.
        </div>
      )}

      {editingFile && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">Editing {editingFile}</h3>
              <button
                onClick={() => setEditingFile(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CodeEditor
                filePath={`s3/${session?.user?.mobileNumber}/${editingFile}`}
                onClose={() => setEditingFile(null)}
                embedded={true}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {previewFile && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-medium">Previewing {previewFile}</h3>
                {lastRefreshTime && (
                  <span className="text-sm text-gray-500">
                    Last refreshed: {lastRefreshTime.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {isEditableFile({ name: previewFile, type: '', size: 0, lastModified: '', path: previewFile }) && (
                  <>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPreviewMode('view')}
                        className={`px-3 py-1.5 text-xs rounded ${
                          previewMode === 'view'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        View
                      </button>
                      <button
                        onClick={() => setPreviewMode('edit')}
                        className={`px-3 py-1.5 text-xs rounded ${
                          previewMode === 'edit'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Edit Content
                      </button>
                      <button
                        onClick={() => setPreviewMode('code')}
                        className={`px-3 py-1.5 text-xs rounded ${
                          previewMode === 'code'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Edit HTML
                      </button>
                    </div>
                    {previewMode !== 'view' && (
                      <button
                        onClick={handleSavePreview}
                        disabled={isSavingPreview}
                        className={`px-3 py-1.5 text-xs rounded ${
                          isSavingPreview
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {isSavingPreview ? 'Saving...' : 'Save Changes'}
                      </button>
                    )}
                  </>
                )}
                {previewMode === 'view' && (
                  <button
                    onClick={handleRefreshPreview}
                    disabled={isPreviewLoading}
                    className={`px-3 py-1.5 text-xs rounded ${
                      isPreviewLoading
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isPreviewLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setPreviewFile(null);
                    setPreviewContent('');
                    setPreviewMode('view');
                    setLastRefreshTime(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {previewMode === 'view' && (
                <div className="w-full h-full flex flex-col">
                  {isPreviewLoading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                    </div>
                  )}
                  <div className="flex-1 overflow-auto p-4">
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: previewContent.replace(
                          /<img([^>]*)src=\"([^\"]*)\"([^>]*)>/g,
                          (match, before, src, after) => {
                            if (!src.startsWith('http') && !src.startsWith('/')) {
                              return `<img${before}src=\"/site/${session?.user?.mobileNumber}/${src}\"${after}>`;
                            }
                            return match;
                          }
                        )
                      }}
                    />
                  </div>
                </div>
              )}
              {previewMode === 'edit' && (
                <div className="w-full h-full flex flex-col">
                  <div className="flex-1 overflow-auto p-4">
                    <div
                      contentEditable
                      dangerouslySetInnerHTML={{ __html: previewContent }}
                      onBlur={(e) => {
                        // Clean up content when editing
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = e.currentTarget.innerHTML;
                        // Remove any injected UI elements
                        const elementsToRemove = tempDiv.querySelectorAll('.preview-ui, .image-replace, .refresh-button, [data-preview-mode]');
                        elementsToRemove.forEach(el => el.remove());
                        // Remove any script tags
                        const scripts = tempDiv.querySelectorAll('script');
                        scripts.forEach(script => script.remove());
                        setPreviewContent(tempDiv.innerHTML);
                      }}
                      className="prose max-w-none"
                      suppressContentEditableWarning={true}
                    />
                  </div>
                </div>
              )}
              {previewMode === 'code' && (
                <div className="w-full h-full">
                  <CodeEditor
                    filePath={`s3/${session?.user?.mobileNumber}/${previewFile}`}
                    onClose={() => setPreviewMode('view')}
                    embedded={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}