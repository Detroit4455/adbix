'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import CodeEditor from './CodeEditor';
import LiveEditModal from './LiveEditModal';
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
  const [liveEditModal, setLiveEditModal] = useState<{isOpen: boolean, filePath: string}>({
    isOpen: false,
    filePath: ''
  });
  


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
    <div className="bg-white shadow rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-bold">S3 Website Files</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Files marked as "Editable" can be modified using the built-in code editor.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-green-500 bg-opacity-80 text-white text-xs sm:text-sm rounded hover:bg-green-600 transition font-medium"
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="px-3 py-2 bg-indigo-500 bg-opacity-80 text-white text-xs sm:text-sm rounded hover:bg-indigo-600 transition font-medium"
            disabled={isCreatingFolder || isCreatingFile}
          >
            <span className="hidden sm:inline">New Folder</span>
            <span className="sm:hidden">Folder</span>
          </button>
          <button
            onClick={() => setIsCreatingFile(true)}
            className="px-3 py-2 bg-green-500 bg-opacity-80 text-white text-xs sm:text-sm rounded hover:bg-green-600 transition font-medium"
            disabled={isCreatingFolder || isCreatingFile}
          >
            <span className="hidden sm:inline">New File</span>
            <span className="sm:hidden">File</span>
          </button>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2 py-2 text-xs sm:text-sm border rounded bg-white min-w-0 flex-shrink-0"
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
          <div className="flex">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'size' | 'date')}
              className="px-2 py-2 text-xs sm:text-sm border rounded-l bg-white min-w-0 flex-shrink-0"
            >
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="date">Date</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-2 bg-gray-100 text-xs sm:text-sm border border-l-0 rounded-r hover:bg-gray-200 flex-shrink-0"
              title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
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
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Size</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Last Modified</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAndFilteredFiles.map((file) => (
              <tr key={file.path} className="hover:bg-gray-50">
                <td className="px-3 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                      {getFileIcon(file)}
                    </div>
                    <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                      {(file.isDirectory || file.type === 'directory') ? (
                        <button
                          onClick={() => handleFolderClick(file.path)}
                          className="text-indigo-600 hover:text-indigo-500 font-medium text-sm truncate"
                        >
                          {file.name}/
                        </button>
                      ) : isEditableFile(file) ? (
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
                          <span className="mt-1 sm:mt-0 sm:ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded w-fit">Editable</span>
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
                      )}
                      {/* Show size and date on mobile under file name */}
                      <div className="sm:hidden mt-1 text-xs text-gray-500">
                        {!file.isDirectory && formatFileSize(file.size)} • {formatDate(file.lastModified)}
                      </div>
                      {file.type.startsWith('image/') && (
                        <div className="mt-2">
                          <Image
                            src={`https://dt-web-sites.s3.ap-south-1.amazonaws.com/sites/${session?.user?.mobileNumber}/${file.path}`}
                            alt={file.name}
                            width={80}
                            height={80}
                            className="object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-500 hidden sm:table-cell">
                  {file.isDirectory ? '-' : formatFileSize(file.size)}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-500 hidden md:table-cell">
                  {formatDate(file.lastModified)}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-500">
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                    {!file.isDirectory && (
                      <>


                        {/* Live Edit Button - Only for HTML files */}
                        {file.name.endsWith('.html') && (
                          <button
                            onClick={() => {
                              setLiveEditModal({
                                isOpen: true,
                                filePath: file.path
                              });
                            }}
                            className="text-green-600 hover:text-green-900 px-2 py-1 text-xs border border-green-200 rounded hover:bg-green-50 w-full sm:w-auto text-center"
                            title="Open in live editor for visual editing"
                          >
                            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-1.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="hidden sm:inline">Live Edit</span>
                            <span className="sm:hidden">Live</span>
                          </button>
                        )}

                        {/* Edit HTML Button - For editable files */}
                        {isEditableFile(file) && (
                          <button
                            onClick={() => setEditingFile(file.path)}
                            className="text-purple-600 hover:text-purple-900 px-2 py-1 text-xs border border-purple-200 rounded hover:bg-purple-50 w-full sm:w-auto text-center"
                            title="Edit file content with code editor"
                          >
                            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            <span className="hidden sm:inline">Edit HTML</span>
                            <span className="sm:hidden">Edit</span>
                          </button>
                        )}
                      </>
                    )}
                    {(file.isDirectory || file.type === 'directory') ? (
                      <button
                        onClick={() => handleDelete(file.name, file.path, true)}
                        className="text-red-600 hover:text-red-900 px-2 py-1 text-xs border border-red-200 rounded hover:bg-red-50 w-full sm:w-auto text-center"
                        title="Delete folder and all contents"
                      >
                        <span className="hidden sm:inline">Delete Folder</span>
                        <span className="sm:hidden">Delete</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDelete(file.name, file.path, false)}
                        className="text-red-600 hover:text-red-900 px-2 py-1 text-xs border border-red-200 rounded hover:bg-red-50 w-full sm:w-auto text-center"
                        title="Delete file"
                      >
                        <span className="hidden sm:inline">Delete File</span>
                        <span className="sm:hidden">Delete</span>
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

      {/* Live Edit Modal */}
      <LiveEditModal
        isOpen={liveEditModal.isOpen}
        onClose={() => setLiveEditModal({isOpen: false, filePath: ''})}
        filePath={liveEditModal.filePath}
        mobileNumber={session?.user?.mobileNumber || ''}
      />

    </div>
  );
}