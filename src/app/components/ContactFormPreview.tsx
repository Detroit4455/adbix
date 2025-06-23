'use client';

import React from 'react';
import ContactUsWidget from './ContactUsWidget';

interface ContactFormPreviewProps {
  userId: string;
}

export default function ContactFormPreview({ userId }: ContactFormPreviewProps) {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Contact Form Preview</h3>
        <button
          onClick={handleRefresh}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <ContactUsWidget 
          showControls={true} 
          userId={userId}
          width="100%"
          height="500px"
        />
      </div>
      <p className="text-sm text-gray-500 mt-3">
        Preview updates automatically when you make changes below.
      </p>
    </div>
  );
} 