'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  
  // Upload states
  const [uploading, setUploading] = useState(false);
  const [selectedTemplateForUpload, setSelectedTemplateForUpload] = useState<string | null>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

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

  // Core upload function (used by dropzone and row actions)
  const uploadZipForTemplate = useCallback(async (templateId: string, file: File) => {
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('zipFile', file);
      formData.append('templateId', templateId);

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
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload template files');
    } finally {
      setUploading(false);
    }
  }, [fetchTemplates]);

  // Handle file upload via dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedTemplateForUpload) {
      setError('Please select a template to upload files to');
      return;
    }
    if (acceptedFiles.length === 0 || !acceptedFiles[0].name.endsWith('.zip')) {
      setError('Please upload a valid ZIP file');
      return;
    }
    await uploadZipForTemplate(selectedTemplateForUpload, acceptedFiles[0]);
  }, [selectedTemplateForUpload, uploadZipForTemplate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    multiple: false,
  });

  // Handle row action: click to upload for a template
  const handleRowUploadClick = (templateId: string) => {
    setSelectedTemplateForUpload(templateId);
    if (zipInputRef.current) {
      zipInputRef.current.click();
    }
  };

  const handleZipInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.zip')) {
      setError('Please upload a valid ZIP file');
      e.target.value = '';
      return;
    }
    if (!selectedTemplateForUpload) {
      setError('Please select a template to upload files to');
      e.target.value = '';
      return;
    }
    await uploadZipForTemplate(selectedTemplateForUpload, file);
    e.target.value = '';
  };

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

  const term = searchTerm.trim().toLowerCase();
  const filteredTemplates = templates.filter((t) => {
    if (!term) return true;
    return (
      t.name.toLowerCase().includes(term) ||
      t.description.toLowerCase().includes(term) ||
      t.businessCategory.toLowerCase().includes(term) ||
      t.templateType.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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

      {/* Template Selection - Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Select Template to Upload Files</h3>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
            <p className="text-gray-600 mb-4">Create a template first before uploading files.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {filteredTemplates.length === 0 ? (
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTemplates.map((template) => (
                    <tr key={template.templateId} className={selectedTemplateForUpload === template.templateId ? 'bg-purple-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-500">ID: {template.templateId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatLabel(template.businessCategory)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatLabel(template.templateType)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{template.metadata.fileCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatFileSize(template.metadata.totalSize)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {template.metadata.hasIndexHtml ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Ready</span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">No files</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedTemplateForUpload(template.templateId)}
                            className={`px-3 py-1 rounded border ${selectedTemplateForUpload === template.templateId ? 'border-purple-500 text-purple-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                          >
                            Select
                          </button>
                          <button
                            onClick={() => handleRowUploadClick(template.templateId)}
                            className={`px-3 py-1 rounded text-white ${uploading ? 'bg-purple-300' : 'bg-purple-600 hover:bg-purple-700'}`}
                            disabled={uploading}
                          >
                            Upload ZIP
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        {/* Hidden input for per-row upload */}
        <input
          ref={zipInputRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={handleZipInputChange}
        />
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