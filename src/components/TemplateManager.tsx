'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSession } from 'next-auth/react';

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

interface TemplateFormData {
  name: string;
  description: string;
  businessCategory: string;
  templateType: string;
  tags: string;
  previewImage: string;
  isActive: boolean;
  isPublic: boolean;
}

export default function TemplateManager() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<WebTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WebTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    businessCategory: 'business',
    templateType: 'landing-page',
    tags: '',
    previewImage: '',
    isActive: true,
    isPublic: true
  });

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedTemplateForUpload, setSelectedTemplateForUpload] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Business categories and template types
  const businessCategories = [
    'e-commerce', 'restaurant', 'portfolio', 'business', 'blog', 'education',
    'healthcare', 'real-estate', 'travel', 'fitness', 'technology', 'creative', 'non-profit', 'other'
  ];

  const templateTypes = [
    'landing-page', 'multi-page', 'blog', 'e-commerce', 'portfolio', 'corporate', 'personal', 'other'
  ];

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/admin/templates?${params.toString()}`);
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
  }, [searchTerm, categoryFilter, typeFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = editingTemplate ? '/api/admin/templates' : '/api/admin/templates';
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const payload = editingTemplate 
        ? { ...formData, templateId: editingTemplate.templateId, tags: formData.tags.split(',').map(t => t.trim()).filter(t => t) }
        : { ...formData, tags: formData.tags.split(',').map(t => t.trim()).filter(t => t) };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save template');
      }

      setSuccess(editingTemplate ? 'Template updated successfully' : 'Template created successfully');
      setShowCreateForm(false);
      setEditingTemplate(null);
      resetForm();
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    }
  };

  // Handle template deletion
  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/templates?templateId=${templateId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete template');
      }

      setSuccess('Template deleted successfully');
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

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
    setUploadProgress(0);

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

      setSuccess('Template files uploaded successfully');
      setSelectedTemplateForUpload(null);
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload template files');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [selectedTemplateForUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    multiple: false,
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      businessCategory: 'business',
      templateType: 'landing-page',
      tags: '',
      previewImage: '',
      isActive: true,
      isPublic: true
    });
  };

  // Edit template
  const editTemplate = (template: WebTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      businessCategory: template.businessCategory,
      templateType: template.templateType,
      tags: template.tags.join(', '),
      previewImage: template.previewImage || '',
      isActive: template.isActive,
      isPublic: template.isPublic
    });
    setShowCreateForm(true);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Header with Better CTAs */}
      <div className="text-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-8 rounded-lg">
        <h1 className="text-3xl font-bold mb-4">Website Templates Manager</h1>
        <p className="text-indigo-100 mb-6">Create and manage professional website templates for your users</p>
        
        {!showCreateForm && templates.length === 0 ? (
          <div className="space-y-4">
            <p className="text-lg">No templates yet. Create your first template!</p>
            <button
              onClick={() => {
                setShowCreateForm(true);
                setEditingTemplate(null);
                resetForm();
              }}
              className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors shadow-lg"
            >
              🚀 Create Your First Template
            </button>
          </div>
        ) : !showCreateForm ? (
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingTemplate(null);
              resetForm();
            }}
            className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors shadow-lg"
          >
            ➕ Add New Template
          </button>
        ) : null}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {businessCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              {templateTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Create/Edit Form - Simple and Clear */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Progress Indicator */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingTemplate ? '✏️ Edit Template' : '🎨 Create New Template'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingTemplate(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 mt-1">
              {editingTemplate ? 'Update your template information' : 'Step 1: Fill in template details, then upload your ZIP file'}
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-800 flex items-center">
                  📝 Basic Information
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Modern Restaurant Website"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this template is for and its key features..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Categories Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-800 flex items-center">
                  🏷️ Categories
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Category *
                    </label>
                    <select
                      required
                      value={formData.businessCategory}
                      onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {businessCategories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Type *
                    </label>
                    <select
                      required
                      value={formData.templateType}
                      onChange={(e) => setFormData({ ...formData, templateType: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {templateTypes.map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="responsive, modern, clean, professional"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Help users find your template with relevant keywords</p>
                </div>
              </div>

              {/* Optional Settings */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-800 flex items-center">
                  ⚙️ Settings
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview Image URL (optional)
                  </label>
                  <input
                    type="url"
                    value={formData.previewImage}
                    onChange={(e) => setFormData({ ...formData, previewImage: e.target.value })}
                    placeholder="https://example.com/template-preview.jpg"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex space-x-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-3 block text-sm font-medium text-gray-700">
                      ✅ Active (template is available)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublic" className="ml-3 block text-sm font-medium text-gray-700">
                      🌐 Public (visible to users)
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingTemplate ? '💾 Update Template' : '🚀 Create Template'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingTemplate(null);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Section - Only show if we have templates or just created one */}
      {!showCreateForm && templates.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              📁 Upload Template Files
            </h3>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Template to Upload Files To</label>
            <select
              value={selectedTemplateForUpload || ''}
              onChange={(e) => setSelectedTemplateForUpload(e.target.value || null)}
              className="w-full md:w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose a template...</option>
              {templates.map(template => (
                <option key={template.templateId} value={template.templateId}>
                  {template.name} ({template.businessCategory})
                </option>
              ))}
            </select>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}
              ${!selectedTemplateForUpload ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} disabled={!selectedTemplateForUpload} />
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="w-full bg-gray-200 rounded-full h-3 my-4">
                  <div className="bg-indigo-600 h-3 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <p className="text-gray-600 text-lg font-medium">Uploading template files... {uploadProgress}%</p>
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
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
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
              </p>
            </div>
          )}
        </div>
      )}

      {/* Templates List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Template List</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No templates found. Create your first template above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Files</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.templateId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-500">{template.description}</div>
                        {template.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {template.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {template.businessCategory.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {template.templateType.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {template.metadata.fileCount} files
                      </div>
                      <div className="text-xs">
                        {formatFileSize(template.metadata.totalSize)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          template.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          template.isPublic ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {template.isPublic ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {template.metadata.hasIndexHtml && (
                          <a
                            href={`https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'dt-web-sites'}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1'}.amazonaws.com/web-templates/${template.templateId}/index.html`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Preview
                          </a>
                        )}
                        <button
                          onClick={() => editTemplate(template)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(template.templateId)}
                          className="text-red-600 hover:text-red-900"
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
  );
} 