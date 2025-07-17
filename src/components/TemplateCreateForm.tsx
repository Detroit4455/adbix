'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface TemplateFormData {
  name: string;
  description: string;
  businessCategory: string;
  templateType: string;
  tags: string;
  previewImage: string;
  isActive: boolean;
  isPublic: boolean;
  visibility: 'public' | 'custom';
  customMobileNumber: string;
}

interface TemplateCreateFormProps {
  onSuccess?: () => void;
}

export default function TemplateCreateForm({ onSuccess }: TemplateCreateFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    businessCategory: 'business',
    templateType: 'landing-page',
    tags: '',
    previewImage: '',
    isActive: true,
    isPublic: true,
    visibility: 'public',
    customMobileNumber: ''
  });

  // Business categories and template types
  const businessCategories = [
    'e-commerce', 'restaurant', 'portfolio', 'business', 'blog', 'education',
    'healthcare', 'real-estate', 'travel', 'fitness', 'technology', 'creative', 'non-profit', 'other'
  ];

  const templateTypes = [
    'landing-page', 'multi-page', 'blog', 'e-commerce', 'portfolio', 'corporate', 'personal', 'other'
  ];

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate custom template fields
      if (formData.visibility === 'custom' && !formData.customMobileNumber.trim()) {
        setError('Mobile number is required for custom templates');
        setLoading(false);
        return;
      }

      const payload = { 
        ...formData, 
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        isPublic: formData.visibility === 'public',
        customMobileNumber: formData.visibility === 'custom' ? formData.customMobileNumber.trim() : null
      };

      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create template');
      }

      setSuccess('Template created successfully! You can now upload files for this template.');
      resetForm();
      
      // Call onSuccess callback after a short delay
      setTimeout(() => {
        onSuccess?.();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

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
      isPublic: true,
      visibility: 'public',
      customMobileNumber: ''
    });
  };

  // Format label for display
  const formatLabel = (str: string) => {
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Error and success messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start border border-red-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg flex items-start border border-green-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Create Template Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Template Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter template name"
              required
            />
          </div>

          {/* Business Category */}
          <div>
            <label htmlFor="businessCategory" className="block text-sm font-medium text-gray-700 mb-2">
              Business Category *
            </label>
            <select
              id="businessCategory"
              value={formData.businessCategory}
              onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              {businessCategories.map((category) => (
                <option key={category} value={category}>
                  {formatLabel(category)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Describe your template and its features"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Template Type */}
          <div>
            <label htmlFor="templateType" className="block text-sm font-medium text-gray-700 mb-2">
              Template Type *
            </label>
            <select
              id="templateType"
              value={formData.templateType}
              onChange={(e) => setFormData({ ...formData, templateType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              {templateTypes.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
          </div>

          {/* Preview Image URL */}
          <div>
            <label htmlFor="previewImage" className="block text-sm font-medium text-gray-700 mb-2">
              Preview Image URL
            </label>
            <input
              type="url"
              id="previewImage"
              value={formData.previewImage}
              onChange={(e) => setFormData({ ...formData, previewImage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://example.com/preview.jpg"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <input
            type="text"
            id="tags"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="modern, responsive, creative (comma-separated)"
          />
          <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
        </div>

        {/* Template Visibility */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Template Visibility *
            </label>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="visibility-public"
                  name="visibility"
                  value="public"
                  checked={formData.visibility === 'public'}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'public' | 'custom', customMobileNumber: '' })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                />
                <label htmlFor="visibility-public" className="ml-3 block text-sm text-gray-700">
                  <span className="font-medium">Public</span>
                  <span className="block text-xs text-gray-500">Visible to all users</span>
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="radio"
                  id="visibility-custom"
                  name="visibility"
                  value="custom"
                  checked={formData.visibility === 'custom'}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'public' | 'custom' })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                />
                <label htmlFor="visibility-custom" className="ml-3 block text-sm text-gray-700">
                  <span className="font-medium">Custom</span>
                  <span className="block text-xs text-gray-500">Visible only to specific user</span>
                </label>
              </div>
            </div>
          </div>

          {/* Custom Mobile Number Field */}
          {formData.visibility === 'custom' && (
            <div className="ml-7 mt-3">
              <label htmlFor="customMobileNumber" className="block text-sm font-medium text-gray-700 mb-2">
                User Mobile Number *
              </label>
              <input
                type="tel"
                id="customMobileNumber"
                value={formData.customMobileNumber}
                onChange={(e) => setFormData({ ...formData, customMobileNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter mobile number (e.g., 9876543210)"
                required={formData.visibility === 'custom'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Template will only be visible to this user
              </p>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active (template can be used)
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Template
              </>
            )}
          </button>
        </div>
      </form>

      {/* Help Section */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Template Creation Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Choose a clear, descriptive name for your template</li>
          <li>• Select the most appropriate business category and template type</li>
          <li>• Use relevant tags to help users find your template</li>
          <li>• After creation, you'll be able to upload ZIP files in the Upload Files tab</li>
        </ul>
      </div>
    </div>
  );
} 