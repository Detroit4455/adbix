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

interface WebTemplate {
  _id: string;
  templateId: string;
  name: string;
  description: string;
  businessCategory: string;
  templateType: string;
  tags: string[];
  s3Path: string;
  previewImage?: string;
  isActive: boolean;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    hasIndexHtml: boolean;
    fileCount: number;
    totalSize: number;
    lastModified: string;
  };
}

export default function TemplateFileManager() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<WebTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WebTemplate | null>(null);
  const [templateSearch, setTemplateSearch] = useState('');
  const [files, setFiles] = useState<S3FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
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

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Fetch files when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      fetchFiles();
    }
  }, [selectedTemplate, currentPath]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      setTemplates(data.templates);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    if (!selectedTemplate) return;

    try {
      setLoadingFiles(true);
      const response = await fetch(`/api/admin/templates/files?templateId=${selectedTemplate.templateId}&path=${currentPath}`);
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
      setLoadingFiles(false);
    }
  };

  const handleTemplateSelect = (template: WebTemplate) => {
    setSelectedTemplate(template);
    setCurrentPath('');
    setFiles([]);
    setError('');
    setSuccess('');
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !selectedTemplate) {
      setError('Folder name cannot be empty');
      return;
    }

    try {
      const response = await fetch('/api/admin/templates/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderName: newFolderName.trim(),
          templateId: selectedTemplate.templateId,
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
      setSuccess('Folder created successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0 || !selectedTemplate) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('templateId', selectedTemplate.templateId);
        formData.append('path', currentPath);

        const response = await fetch('/api/admin/templates/files', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }

        setUploadProgress(((i + 1) / fileList.length) * 100);
      }

      await fetchFiles();
      setSuccess(`${fileList.length} file(s) uploaded successfully`);
      setTimeout(() => setSuccess(''), 3000);
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
    if (!newFileName.trim() || !selectedTemplate) {
      setError('File name cannot be empty');
      return;
    }

    try {
      const fileName = newFileName.includes('.') ? newFileName : `${newFileName}.${newFileType}`;
      
      const response = await fetch('/api/admin/templates/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.templateId,
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
    if (!selectedTemplate) return;

    const confirmMsg = isDirectory
      ? `Are you sure you want to delete the folder "${fileName}" and all its contents? This action cannot be undone.`
      : `Are you sure you want to delete ${fileName}? This action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    try {
      const response = await fetch('/api/admin/templates/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.templateId,
          fileName: fileName,
          filePath: filePath,
          isDirectory: isDirectory
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete item');
      }

      await fetchFiles();
      setSuccess(`${isDirectory ? 'Folder' : 'File'} deleted successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const handleFolderClick = (folderPath: string) => {
    setCurrentPath(folderPath);
  };

  const handleBack = () => {
    const pathParts = currentPath.split('/').filter(p => p.length > 0);
    pathParts.pop();
    setCurrentPath(pathParts.join('/'));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFileIcon = (file: S3FileInfo) => {
    if (file.isDirectory) {
      return '📁';
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: string } = {
      'html': '🌐',
      'css': '🎨',
      'js': '⚡',
      'json': '📄',
      'txt': '📝',
      'md': '📝',
      'png': '🖼️',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'gif': '🖼️',
      'svg': '🖼️',
      'ico': '🖼️',
      'pdf': '📄',
      'xml': '📄',
      'zip': '📦',
      'woff': '🔤',
      'woff2': '🔤',
      'ttf': '🔤',
      'eot': '🔤'
    };
    
    return iconMap[extension || ''] || '📄';
  };

  const isEditableFile = (file: S3FileInfo): boolean => {
    if (file.isDirectory) return false;
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    const editableExtensions = ['html', 'css', 'js', 'json', 'txt', 'md', 'xml', 'svg'];
    return editableExtensions.includes(extension || '');
  };

  const getDefaultTemplate = (fileType: string): string => {
    const templates: { [key: string]: string } = {
      'html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Page</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <h1>Welcome to your new page</h1>
    <p>Start editing this file to create your content.</p>
</body>
</html>`,
      'css': `/* CSS Styles */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

h1 {
    color: #333;
    text-align: center;
}

p {
    color: #666;
    line-height: 1.6;
}`,
      'js': `// JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded');
    // Add your JavaScript code here
});`,
      'json': `{
    "name": "Template Configuration",
    "version": "1.0.0",
    "description": "Configuration file for template"
}`,
      'txt': 'This is a text file.\nAdd your content here.',
      'md': `# Markdown File

This is a markdown file. You can use markdown syntax to format your content.

## Features

- **Bold text**
- *Italic text*
- Lists
- Links
- And much more!`
    };
    
    return templates[fileType] || '';
  };

  const sortedAndFilteredFiles = files
    .filter(file => {
      if (filterType === 'all') return true;
      if (filterType === 'folders') return file.isDirectory;
      if (filterType === 'files') return !file.isDirectory;
      return file.type === filterType;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'date':
          aValue = new Date(a.lastModified).getTime();
          bValue = new Date(b.lastModified).getTime();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Select Template</h3>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              placeholder="Search templates..."
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
            {templateSearch && (
              <button
                type="button"
                onClick={() => setTemplateSearch('')}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Templates Found</h3>
            <p className="text-gray-600">Create a template first to manage its files.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {templates.filter(t => {
              const term = templateSearch.trim().toLowerCase();
              if (!term) return true;
              return (
                t.name.toLowerCase().includes(term) ||
                t.description.toLowerCase().includes(term) ||
                t.businessCategory.toLowerCase().includes(term) ||
                t.templateType.toLowerCase().includes(term)
              );
            }).length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🔎</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No matching templates</h3>
                <p className="text-gray-600 mb-4">Try a different search term or clear the search.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Files</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {templates
                    .filter(t => {
                      const term = templateSearch.trim().toLowerCase();
                      if (!term) return true;
                      return (
                        t.name.toLowerCase().includes(term) ||
                        t.description.toLowerCase().includes(term) ||
                        t.businessCategory.toLowerCase().includes(term) ||
                        t.templateType.toLowerCase().includes(term)
                      );
                    })
                    .map((template) => (
                      <tr key={template._id} className={selectedTemplate?._id === template._id ? 'bg-indigo-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{template.name}</div>
                          <div className="text-sm text-gray-500">ID: {template.templateId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.businessCategory}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.templateType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{template.metadata.fileCount}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {template.metadata.hasIndexHtml ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Ready</span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">No files</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleTemplateSelect(template)}
                            className={`px-3 py-1 rounded border ${selectedTemplate?._id === template._id ? 'border-indigo-500 text-indigo-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                          >
                            {selectedTemplate?._id === template._id ? 'Selected' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* File Manager */}
      {selectedTemplate && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Files for: {selectedTemplate.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Template ID: {selectedTemplate.templateId}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {selectedTemplate.metadata.hasIndexHtml && (
                  <a
                    href={`/template-preview/${selectedTemplate.templateId}`}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <span className="mr-1">🌐</span>
                    Preview
                  </a>
                )}
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-green-700">{success}</span>
                </div>
              </div>
            )}

            {/* File Operations */}
            <div className="flex flex-wrap gap-4 mb-6">
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <span>📁</span>
                <span>New Folder</span>
              </button>

              <button
                onClick={() => setIsCreatingFile(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <span>📄</span>
                <span>New File</span>
              </button>

              <label className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors cursor-pointer">
                <span>⬆️</span>
                <span>Upload Files</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {currentPath && (
                <button
                  onClick={handleBack}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <span>⬅️</span>
                  <span>Back</span>
                </button>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Uploading files...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Current Path */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
              <span>📍</span>
              <span>web-templates/{selectedTemplate.templateId}/{currentPath || ''}</span>
            </div>

            {/* File Controls */}
            <div className="flex flex-wrap gap-4 mb-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'size' | 'date')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
                <option value="date">Sort by Date</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Items</option>
                <option value="folders">Folders Only</option>
                <option value="files">Files Only</option>
              </select>
            </div>

            {/* Files List */}
            {loadingFiles ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : sortedAndFilteredFiles.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📂</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Files Found</h3>
                <p className="text-gray-600">Upload some files to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Size</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Modified</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAndFilteredFiles.map((file, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{getFileIcon(file)}</span>
                            <button
                              onClick={() => file.isDirectory ? handleFolderClick(file.path) : null}
                              className={`text-left ${file.isDirectory ? 'text-blue-600 hover:text-blue-800' : 'text-gray-900'}`}
                            >
                              {file.name}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {file.isDirectory ? 'Folder' : file.type}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {file.isDirectory ? '-' : formatFileSize(file.size)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(file.lastModified)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {!file.isDirectory && isEditableFile(file) && (
                              <button
                                onClick={() => setEditingFile(file.path)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Edit
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(file.name, file.path, file.isDirectory)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {isCreatingFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create File Modal */}
      {isCreatingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New File</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Enter file name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
            />
            <select
              value={newFileType}
              onChange={(e) => setNewFileType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
            >
              <option value="html">HTML File</option>
              <option value="css">CSS File</option>
              <option value="js">JavaScript File</option>
              <option value="json">JSON File</option>
              <option value="txt">Text File</option>
              <option value="md">Markdown File</option>
            </select>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsCreatingFile(false);
                  setNewFileName('');
                  setNewFileType('html');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFile}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Editor Modal */}
      {editingFile && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl h-5/6 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">
                Editing: {editingFile.split('/').pop()}
              </h3>
              <button
                onClick={() => setEditingFile(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-4">
              <CodeEditor
                fileName={editingFile}
                templateId={selectedTemplate.templateId}
                onClose={() => setEditingFile(null)}
                onSave={fetchFiles}
                isTemplate={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 