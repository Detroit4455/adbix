'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

export default function TemplatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;
  const [previewUrl, setPreviewUrl] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const fetchTemplateInfo = async () => {
      try {
        const response = await fetch('/api/templates');
        const data = await response.json();
        
        const template = data.templates.find((t: any) => t.templateId === templateId);
        
        if (template) {
          setTemplateName(template.name);
          if (template.previewUrl) {
            setPreviewUrl(template.previewUrl);
          } else {
            // Construct the preview URL directly
            const directUrl = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'dt-web-sites'}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1'}.amazonaws.com/web-templates/${templateId}/index.html`;
            setPreviewUrl(directUrl);
          }
        } else {
          setError('Template not found');
        }
      } catch (err) {
        console.error('Error fetching template:', err);
        setError('Failed to load template');
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      fetchTemplateInfo();
    }
  }, [templateId]);

  const handleBack = () => {
    router.back();
  };

  const toggleViewMode = () => {
    setIsMobileView(!isMobileView);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 64px)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading template preview...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 64px)' }}>
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Preview Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <Navbar />
      
      {/* Template Preview Content */}
      <div className="relative p-6" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Control Panel - Top Right */}
        <div className="absolute top-6 right-6 z-50 flex flex-col items-end space-y-3">
          {/* View Mode Toggle */}
          <button
            onClick={toggleViewMode}
            className="px-4 py-2 bg-black bg-opacity-70 text-white rounded-lg hover:bg-opacity-80 transition-all duration-200 flex items-center space-x-2"
            title={isMobileView ? "Switch to Desktop View" : "Switch to Mobile View"}
          >
            {isMobileView ? (
              <>
                <ComputerDesktopIcon className="h-4 w-4" />
                <span className="text-sm">Desktop</span>
              </>
            ) : (
              <>
                <DevicePhoneMobileIcon className="h-4 w-4" />
                <span className="text-sm">Mobile</span>
              </>
            )}
          </button>

          {/* Template Name */}
          {templateName && (
            <div className="px-4 py-2 bg-black bg-opacity-70 text-white rounded-lg">
              <span className="text-sm font-medium">{templateName}</span>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center space-x-2"
            title="Close Preview"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm">Close</span>
          </button>
        </div>

        {/* Preview Container with Border Frame */}
        <div className="w-full h-full flex items-center justify-center">
          <div 
            className={`transition-all duration-300 ${
              isMobileView 
                ? 'w-[375px] h-[667px]' // More ideal mobile dimensions
                : 'w-full h-full max-w-6xl bg-white rounded-lg shadow-2xl border-4 border-gray-200 overflow-hidden' // Desktop dimensions
            }`}
          >
            {/* Mobile Device Frame */}
            {isMobileView && (
              <div className="relative w-full h-full">
                {/* Phone Body */}
                <div className="w-full h-full bg-gray-900 rounded-[3rem] p-2 shadow-2xl">
                  {/* Screen Bezel */}
                  <div className="w-full h-full bg-black rounded-[2.5rem] p-1">
                    {/* Screen */}
                    <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative">
                      {/* Status Bar */}
                      <div className="absolute top-0 left-0 right-0 h-6 bg-black text-white flex items-center justify-between px-6 z-10">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-medium">9:41</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-4 h-2 border border-white rounded-sm">
                            <div className="w-3 h-1 bg-white rounded-sm m-0.5"></div>
                          </div>
                          <svg className="w-4 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.9 1 3 1.9 3 3V21C3 22.1 3.9 23 5 23H19C20.1 23 21 22.1 21 21V9ZM19 9H14V4H5V21H19V9Z"/>
                          </svg>
                        </div>
                      </div>

                      {/* Home Indicator */}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-black rounded-full"></div>

                      {/* Content Area */}
                      <div className="w-full h-full pt-6 pb-8">
                        <iframe
                          src={previewUrl}
                          className="w-full h-full border-0"
                          title={`Preview of ${templateName}`}
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Frame */}
            {!isMobileView && (
              <div className="relative w-full h-full">
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title={`Preview of ${templateName}`}
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 