'use client';

import { useState } from 'react';
import { 
  Cog6ToothIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SchemaHelperProps {
  onClose: () => void;
  onApplySchema: (schemaCode: string) => void;
}

export default function SchemaHelper({ onClose, onApplySchema }: SchemaHelperProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('basic');
  const [customSectionName, setCustomSectionName] = useState('');

  const templates = {
    basic: {
      name: 'Basic Section',
      code: `<div data-section="hero" data-section-name="Hero Section">
  <h1>Welcome to Our Website</h1>
  <p>This is a hero section that can be edited.</p>
  <img src="hero-image.jpg" alt="Hero Image">
</div>`
    },
    hero: {
      name: 'Hero Banner',
      code: `<section data-section="hero" data-section-name="Hero Banner">
  <div class="hero-content">
    <h1>Your Main Heading</h1>
    <p>Your compelling subtitle goes here</p>
    <a href="#" class="cta-button">Call to Action</a>
  </div>
  <div class="hero-image">
    <img src="hero-bg.jpg" alt="Hero Background">
  </div>
</section>`
    },
    content: {
      name: 'Content Section',
      code: `<div data-section="content" data-section-name="Content Section">
  <h2>About Us</h2>
  <p>This is the main content area that can be edited.</p>
  <div class="features">
    <div class="feature">
      <h3>Feature 1</h3>
      <p>Description of feature 1</p>
    </div>
    <div class="feature">
      <h3>Feature 2</h3>
      <p>Description of feature 2</p>
    </div>
  </div>
</div>`
    },
    contact: {
      name: 'Contact Form',
      code: `<div data-section="contact" data-section-name="Contact Section">
  <h2>Contact Us</h2>
  <p>Get in touch with us today</p>
  <form>
    <input type="text" placeholder="Your Name">
    <input type="email" placeholder="Your Email">
    <textarea placeholder="Your Message"></textarea>
    <button type="submit">Send Message</button>
  </form>
</div>`
    }
  };

  const handleApplyTemplate = () => {
    const template = templates[selectedTemplate as keyof typeof templates];
    if (template) {
      onApplySchema(template.code);
    }
  };

  const handleApplyCustom = () => {
    if (customSectionName.trim()) {
      const customCode = `<div data-section="${customSectionName.toLowerCase().replace(/\s+/g, '_')}" data-section-name="${customSectionName}">
  <h2>${customSectionName}</h2>
  <p>Your content goes here</p>
</div>`;
      onApplySchema(customCode);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Cog6ToothIcon className="h-6 w-6 text-indigo-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Schema Helper</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              How Schema-Driven Editing Works
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">Schema-driven editing allows you to:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Edit text, images, and colors through a settings panel</li>
                    <li>See changes in real-time without touching code</li>
                    <li>Maintain the original HTML structure and styling</li>
                    <li>Save configurations that can be reused</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Choose a Template</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(templates).map(([key, template]) => (
                <div
                  key={key}
                  onClick={() => setSelectedTemplate(key)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate === key
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                  <p className="text-sm text-gray-600">
                    {key === 'basic' && 'Simple section with heading, text, and image'}
                    {key === 'hero' && 'Full-width hero banner with background image'}
                    {key === 'content' && 'Content section with features grid'}
                    {key === 'contact' && 'Contact form section'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Code Preview */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Template Code</h3>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">HTML with Schema Attributes</span>
                <button
                  onClick={() => navigator.clipboard.writeText(templates[selectedTemplate as keyof typeof templates].code)}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Copy
                </button>
              </div>
              <pre className="text-green-400 text-sm overflow-x-auto">
                <code>{templates[selectedTemplate as keyof typeof templates].code}</code>
              </pre>
            </div>
          </div>

          {/* Custom Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Create Custom Section</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={customSectionName}
                onChange={(e) => setCustomSectionName(e.target.value)}
                placeholder="Enter section name (e.g., About Us, Services)"
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={handleApplyCustom}
                disabled={!customSectionName.trim()}
                className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate
              </button>
            </div>
          </div>

          {/* Schema Attributes Guide */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Schema Attributes Guide</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Required Attributes</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li><code className="bg-gray-200 px-1 rounded">data-section</code> - Unique section ID</li>
                    <li><code className="bg-gray-200 px-1 rounded">data-section-name</code> - Display name</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Supported Elements</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>Text: h1, h2, h3, h4, h5, h6, p, span, a, li</li>
                    <li>Images: img tags</li>
                    <li>Backgrounds: elements with background styles</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <CodeBracketIcon className="h-4 w-4 inline mr-1" />
            Add schema attributes to make your HTML editable
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyTemplate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              Apply Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
