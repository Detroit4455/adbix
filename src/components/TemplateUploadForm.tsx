'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSession } from 'next-auth/react';

interface WebTemplate {
  _id: string;
  templateId: string;
  name: string;
  description: string;
  businessCategory: string;
  templateType: string;
  metadata: {
    hasIndexHtml: boolean;
    fileCount: number;
    totalSize: number;
    lastModified: string;
  };
}

export default function TemplateUploadForm() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<WebTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Upload states
  const [uploading, setUploading] = useState(false);
  const [selectedTemplateForUpload, setSelectedTemplateForUpload] = useState<string | null>(null);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/templates');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch templates');
      }

      setTemplates(data.templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Handle file upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedTemplateForUpload) {
      setError('Please select a template to upload files to');
      return;
    }

    if (acceptedFiles.length === 0 || !acceptedFiles[0].name.endsWith('.zip')) {
      setError('Please upload a valid ZIP file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('zipFile', acceptedFiles[0]);
      formData.append('templateId', selectedTemplateForUpload);

      const response = await fetch('/api/admin/templates/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload template files');
      }

      setSuccess('Template files uploaded successfully! The template is now ready for use.');
      setSelectedTemplateForUpload(null);
      await fetchTemplates(); // Refresh templates to show updated file counts

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload template files');
    } finally {
      setUploading(false);
    }
  }, [selectedTemplateForUpload, fetchTemplates]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    multiple: false,
  });

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format label for display
  const formatLabel = (str: string) => {
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Error and success messages */}
      {error && (
        <div className="p-4 bg-red-50 rounded-lg flex items-start border border-red-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 rounded-lg flex items-start border border-green-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Template Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Template to Upload Files</h3>
        
        {templates.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
            <p className="text-gray-600 mb-4">Create a template first before uploading files.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <div
                key={template.templateId}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedTemplateForUpload === template.templateId
                    ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedTemplateForUpload(template.templateId)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 truncate">{template.name}</h4>
                  {selectedTemplateForUpload === template.templateId && (
                    <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Category:</span> {formatLabel(template.businessCategory)}</p>
                  <p><span className="font-medium">Type:</span> {formatLabel(template.templateType)}</p>
                  
                  {template.metadata.hasIndexHtml ? (
                    <div className="flex items-center text-green-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs">
                        {template.metadata.fileCount} files ({formatFileSize(template.metadata.totalSize)})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center text-orange-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs">No files uploaded yet</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Upload Section */}
      {templates.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Template Files</h3>
          
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
              ${selectedTemplateForUpload
                ? (isDragActive 
                  ? 'border-purple-400 bg-purple-50' 
                  : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50')
                : 'border-gray-200 bg-gray-50 cursor-not-allowed'
              }
              ${uploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} disabled={!selectedTemplateForUpload || uploading} />
            
            {uploading ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
                <p className="text-purple-700 font-medium text-lg">Uploading and processing...</p>
                <p className="text-sm text-gray-500">
                  Please wait while we extract and upload your template files
                </p>
              </div>
            ) : (
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-700 font-medium mb-2 text-lg">
                  {selectedTemplateForUpload 
                    ? (isDragActive ? "Drop your ZIP archive here" : "Drag and drop your website ZIP file here")
                    : "Select a template above first"}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  {selectedTemplateForUpload ? "Your ZIP file should contain index.html and all website files" : ""}
                </p>
                {selectedTemplateForUpload && (
                  <button 
                    type="button"
                    className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    📁 Choose ZIP File
                  </button>
                )}
              </div>
            )}
          </div>
          
          {selectedTemplateForUpload && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>Tip:</strong> Make sure your ZIP file contains an index.html file and all necessary assets (CSS, JS, images).
                The system will automatically extract and organize your files.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ZIP File Requirements */}
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <h4 className="text-sm font-semibold text-yellow-800 mb-2">📋 ZIP File Requirements</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Must contain an <code className="bg-yellow-100 px-1 py-0.5 rounded">index.html</code> file as the main entry point</li>
          <li>• Include all necessary assets (CSS, JavaScript, images, fonts)</li>
          <li>• Use relative paths for linking assets</li>
          <li>• Keep file size under 50MB for optimal performance</li>
          <li>• Ensure all images are web-optimized (JPEG, PNG, WebP, SVG)</li>
        </ul>
      </div>
    </div>
  );
} 