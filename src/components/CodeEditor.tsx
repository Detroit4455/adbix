'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useSession } from 'next-auth/react';

interface CodeEditorProps {
  filePath?: string;
  fileName?: string;
  templateId?: string;
  onClose: () => void;
  onSave?: () => void;
  embedded?: boolean;
  isTemplate?: boolean;
}

export default function CodeEditor({ filePath, fileName, templateId, onClose, onSave, embedded = false, isTemplate = false }: CodeEditorProps): React.ReactNode {
  const { data: session } = useSession();
  const [content, setContent] = useState<string>('');
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [language, setLanguage] = useState<string>('plaintext');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isTemplate && templateId && fileName) {
      fetchTemplateFileContent();
    } else if (session?.user?.mobileNumber && filePath) {
      fetchFileContent();
    }
  }, [session, filePath, isTemplate, templateId, fileName]);

  // Set default content templates for new files
  useEffect(() => {
    if (content === '' && currentFileName) {
      const extension = currentFileName.split('.').pop()?.toLowerCase();
      setContent(getDefaultTemplate(extension));
    }
  }, [currentFileName, content]);

  const fetchTemplateFileContent = async () => {
    try {
      setLoading(true);
      
      if (!templateId || !fileName) {
        throw new Error('Template ID and file name are required');
      }
      
      const response = await fetch(`/api/admin/templates/file-content?templateId=${templateId}&fileName=${fileName}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch template file content');
      }
      
      const data = await response.json();
      setContent(data.content);
      setCurrentFileName(fileName);
      
      // Determine language based on file extension
      const extension = fileName.split('.').pop()?.toLowerCase();
      setLanguage(getLanguageFromExtension(extension));
      
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template file');
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async () => {
    try {
      setLoading(true);
      
      if (!filePath) {
        throw new Error('File path is required');
      }
      
      // Check if this is an S3 file
      if (filePath.startsWith('s3/')) {
        const [_, userId, ...pathParts] = filePath.split('/');
        const path = pathParts.join('/');
        
        const response = await fetch(`/api/s3-file-content?userId=${userId}&path=${path}`);
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch file content');
        }
        
        const data = await response.json();
        setContent(data.content);
        setCurrentFileName(path.split('/').pop() || '');
      } else {
        // Handle regular file system files
        const response = await fetch(`/api/files/edit?mobileNumber=${session?.user?.mobileNumber}&path=${filePath}`);
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch file content');
        }
        
        const data = await response.json();
        setContent(data.content);
        setCurrentFileName(data.fileName);
      }
      
      // Determine language based on file extension
      const extension = currentFileName.split('.').pop()?.toLowerCase();
      setLanguage(getLanguageFromExtension(extension));
      
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const saveFileContent = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      
      if (isTemplate && templateId && fileName) {
        // Handle template file
        const response = await fetch('/api/admin/templates/file-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            templateId,
            fileName,
            content,
          }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save template file');
        }
      } else if (filePath) {
      // Check if this is an S3 file
      if (filePath.startsWith('s3/')) {
        const [_, userId, ...pathParts] = filePath.split('/');
        const path = pathParts.join('/');
        const fileName = path.split('/').pop() || '';
        const directoryPath = path.substring(0, path.lastIndexOf('/'));
        
        const response = await fetch('/api/s3-files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            path: directoryPath,
            content,
            fileName,
            isUpdate: true // Add flag to indicate this is an update
          }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save file');
        }
      } else {
        // Handle regular file system files
        const response = await fetch('/api/files/edit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mobileNumber: session?.user?.mobileNumber,
            filePath: filePath,
            content: content,
          }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save file');
          }
        }
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Call onSave callback if provided
      if (onSave) {
        onSave();
      }
      
      // Dispatch event with saved content for the preview
      if (typeof window !== 'undefined' && currentFileName.endsWith('.html')) {
        const updateEvent = new CustomEvent('fileContentUpdate', {
          detail: { 
            filePath: filePath || `template/${templateId}/${currentFileName}`,
            content: content 
          }
        });
        window.dispatchEvent(updateEvent);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setSaving(false);
    }
  };

  const getLanguageFromExtension = (extension?: string): string => {
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
      'rb': 'ruby',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'cpp',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'sh': 'shell',
      'bat': 'bat',
      'sql': 'sql',
      'yml': 'yaml',
      'yaml': 'yaml',
      'xml': 'xml',
      'svg': 'xml',
    };
    
    return languageMap[extension] || 'plaintext';
  };

    const getDefaultTemplate = (extension?: string): string => {    if (!extension) return '';        switch (extension) {      case 'html':        return `<!DOCTYPE html><html lang="en"><head>    <meta charset="UTF-8">    <meta name="viewport" content="width=device-width, initial-scale=1.0">    <title>My Website</title>    <link rel="stylesheet" href="styles.css"></head><body contenteditable="false">    <h1>Welcome to my website</h1>        <script src="script.js"></script></body></html>`;
      case 'css':
        return `/* Main Styles */
body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 20px;
    color: #333;
}

h1 {
    color: #0066cc;
}`;
      case 'js':
        return `// Main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    console.log('Document is ready!');
    
    // Your code here
});`;
      case 'json':
        return `{
    "name": "my-project",
    "version": "1.0.0",
    "description": "A sample project"
}`;
      case 'md':
        return `# My Project

## Introduction
This is a sample project.

## Features
- Feature 1
- Feature 2
- Feature 3`;
      default:
        return '';
    }
  };

  // Loading indicator
  if (loading) {
    if (embedded) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      );
    }
    
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading file content...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // For embedded mode (used in side-by-side view)
  if (embedded) {
    return (
      <div className="h-full flex flex-col">
        {error && (
          <div className="p-2 m-2 bg-red-50 text-xs text-red-800 rounded border border-red-200">
            {error}
          </div>
        )}
        
        {saveSuccess && (
          <div className="p-2 m-2 bg-green-50 text-xs text-green-800 rounded border border-green-200">
            Saved successfully!
          </div>
        )}
        
        <div className="flex items-center gap-2 px-2 py-1 border-b">
          <button
            onClick={saveFileContent}
            disabled={saving}
            className={`px-2 py-1 rounded text-xs ${
              saving 
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
        
        <div className="flex-grow">
          <Editor
            height="100%"
            language={language}
            value={content}
            onChange={(value) => {
              const newContent = value || '';
              setContent(newContent);
              
              // Dispatch event with updated content for the preview
              if (typeof window !== 'undefined' && currentFileName.endsWith('.html')) {
                const updateEvent = new CustomEvent('fileContentUpdate', {
                  detail: { 
                    filePath: filePath,
                    content: newContent 
                  }
                });
                window.dispatchEvent(updateEvent);
              }
            }}
            theme="vs-light"
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
      </div>
    );
  }
  
  // Full screen mode
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{currentFileName}</h2>
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
            onChange={(value) => setContent(value || '')}
            theme="vs-light"
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
            onClick={saveFileContent}
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