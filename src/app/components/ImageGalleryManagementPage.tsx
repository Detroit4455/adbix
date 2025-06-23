'use client';

import React, { useState } from 'react';
import ImageGalleryWidget from '@/app/components/ImageGalleryWidget';
import ImageGalleryManager from '@/app/components/ImageGalleryManager';

interface ImageGalleryManagementPageProps {
  userId: string;
}

export default function ImageGalleryManagementPage({ userId }: ImageGalleryManagementPageProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Callback to refresh the widget when gallery is updated
  const handleGalleryUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="p-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Manage Image Gallery</h2>
        
        {/* Widget Preview */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Gallery Preview</h3>
          <div className="border rounded-lg overflow-hidden">
            <ImageGalleryWidget 
              showControls={true} 
              userId={userId}
              width="100%"
              height="400px"
              refreshTrigger={refreshTrigger}
            />
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Preview updates automatically when you make changes below. You can also click the refresh button in the widget.
          </p>
        </div>

        {/* Gallery Management Interface */}
        <ImageGalleryManager 
          userId={userId} 
          onGalleryUpdate={handleGalleryUpdate}
        />

        {/* Embed Code Section */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-medium mb-4">Embed This Widget</h3>
          <p className="text-sm text-gray-600 mb-4">
            Copy this code to embed the gallery in your website:
          </p>
          <div className="bg-gray-50 p-4 rounded border">
            <code className="block text-xs overflow-x-auto text-gray-800">
              {`<iframe 
  src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/widget-preview/${userId}/image-gallery" 
  width="600" 
  height="400" 
  frameborder="0"
  style="border: none; border-radius: 12px;">
</iframe>`}
            </code>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium text-gray-800 mb-2">Different Sizes</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium">Small Widget</div>
                <div>width="400" height="250"</div>
                <div className="text-gray-500">Good for sidebars</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium">Medium Widget</div>
                <div>width="600" height="400"</div>
                <div className="text-gray-500">Default size</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium">Large Widget</div>
                <div>width="800" height="500"</div>
                <div className="text-gray-500">Hero sections</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-medium text-blue-800 mb-2">Usage Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Widget automatically displays your custom gallery images</li>
              <li>• Changes made above will appear immediately in embedded widgets</li>
              <li>• No coding required - just copy and paste the iframe code</li>
              <li>• Works on any website: WordPress, Wix, Squarespace, or custom HTML</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 