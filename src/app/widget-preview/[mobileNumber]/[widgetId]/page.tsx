'use client';

import React, { useState, useEffect } from 'react';
import ShopStatusWidget from '@/app/components/ShopStatusWidget';
import ImageGalleryWidget from '@/app/components/ImageGalleryWidget';
import ContactUsWidget from '@/app/components/ContactUsWidget';

interface PreviewWidgetPageProps {
  params: Promise<{
    mobileNumber: string;
    widgetId: string;
  }>;
}

export default function PreviewWidgetPage({ params }: PreviewWidgetPageProps) {
  // Since we're now using client components, we need to handle params differently
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [widgetId, setWidgetId] = useState<string>('');
  
  // Extract params on client side
  useEffect(() => {
    const extractParams = async () => {
      const resolvedParams = await params;
      setMobileNumber(resolvedParams.mobileNumber);
      setWidgetId(resolvedParams.widgetId);
    };
    extractParams();
  }, [params]);

  // Add CSS reset - must be called before any conditional returns
  useEffect(() => {
    // Create and inject CSS reset for clean widget display
    const style = document.createElement('style');
    style.textContent = `
      * {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        height: 100% !important;
        width: 100% !important;
      }
    `;
    document.head.appendChild(style);

    // Cleanup function to remove the style when component unmounts
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Define widget dimensions based on type
  const getWidgetDimensions = (widgetType: string) => {
    switch (widgetType) {
      case 'shop-status':
        return { width: '250px', height: '150px' };
      case 'image-gallery':
        return { width: '500px', height: '300px' };
      case 'contact-us':
        return { width: '350px', height: '500px' };
      default:
        return { width: '250px', height: '150px' };
    }
  };

  const dimensions = getWidgetDimensions(widgetId);

  // Show loading state while params are being extracted
  if (!mobileNumber || !widgetId) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid #e5e7eb',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  // Function to render widget content - clean widget only
  const renderWidgetContent = () => {
    const containerStyle = {
      width: dimensions.width,
      height: dimensions.height,
      margin: '0',
      padding: '0',
      border: 'none',
      backgroundColor: 'transparent'
    };

    switch (widgetId) {
      case 'shop-status':
        return (
          <div style={containerStyle}>
            <ShopStatusWidget 
              showControls={false} 
              userId={mobileNumber}
              width="100%"
              height="100%"
            />
          </div>
        );
      case 'image-gallery':
        return (
          <div style={containerStyle}>
            <ImageGalleryWidget 
              showControls={false} 
              userId={mobileNumber}
              width="100%"
              height="100%"
            />
          </div>
        );
      case 'contact-us':
        return (
          <div style={containerStyle}>
            <ContactUsWidget 
              showControls={false} 
              userId={mobileNumber}
              width="100%"
              height="100%"
            />
          </div>
        );
      default:
        return (
          <div style={{ 
            width: dimensions.width,
            height: dimensions.height,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#fef3c7',
            color: '#92400e',
            fontSize: '14px',
            textAlign: 'center',
            border: '1px solid #f59e0b',
            borderRadius: '4px'
          }}>
            <div>
              <strong>Widget Not Found!</strong>
              <br />
              The requested widget does not exist.
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      margin: '0',
      padding: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      overflow: 'hidden'
    }}>
      {renderWidgetContent()}
    </div>
  );
} 