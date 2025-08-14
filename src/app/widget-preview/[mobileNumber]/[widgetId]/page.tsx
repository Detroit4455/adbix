'use client';

import React, { useState, useEffect } from 'react';
import ShopStatusWidget from '@/app/components/ShopStatusWidget';
import ImageGalleryWidget from '@/app/components/ImageGalleryWidget';
import ContactUsWidget from '@/app/components/ContactUsWidget';
import Navbar from '@/components/Navbar';
import LeftNavbar from '@/components/LeftNavbar';

interface PreviewWidgetPageProps {
  params: Promise<{
    mobileNumber: string;
    widgetId: string;
  }>;
}

export default function PreviewWidgetPage({ params }: PreviewWidgetPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
      <div className="min-h-screen bg-gray-50">
        <LeftNavbar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
        <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
          <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // Function to render widget content
  const renderWidgetContent = () => {
    switch (widgetId) {
    case 'shop-status':
      return (
        <div style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          padding: '20px'
        }}>
          <div style={{
            width: dimensions.width,
            height: dimensions.height,
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            marginBottom: '40px'
          }}>
            <ShopStatusWidget 
              showControls={false} 
              userId={mobileNumber}
              width="100%"
              height="100%"
            />
          </div>
          
          {/* How to Use Section */}
          <div style={{
            maxWidth: '500px',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#3b82f6',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1e293b',
                margin: '0'
              }}>
                This widget will be part of your website
              </h3>
            </div>
            
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0'
            }}>
              <p style={{
                fontSize: '15px',
                color: '#475569',
                lineHeight: '1.6',
                margin: '0',
                textAlign: 'center'
              }}>
                Changes made from here will be reflected on your website.
                <br />
                <strong style={{ color: '#1e293b' }}>Manage everything from here - no coding required.</strong>
              </p>
            </div>
          </div>
        </div>
      );
    case 'image-gallery':
      return (
        <div style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          padding: '20px'
        }}>
          <div style={{
            width: dimensions.width,
            height: dimensions.height,
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            marginBottom: '40px'
          }}>
            <ImageGalleryWidget 
              showControls={false} 
              userId={mobileNumber}
              width="100%"
              height="100%"
            />
          </div>
          
          {/* How to Use Section */}
          <div style={{
            maxWidth: '500px',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#3b82f6',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1e293b',
                margin: '0'
              }}>
                This widget will be part of your website
              </h3>
            </div>
            
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0'
            }}>
              <p style={{
                fontSize: '15px',
                color: '#475569',
                lineHeight: '1.6',
                margin: '0',
                textAlign: 'center'
              }}>
                Changes made from here will be reflected on your website.
                <br />
                <strong style={{ color: '#1e293b' }}>Manage everything from here - no coding required.</strong>
              </p>
            </div>
          </div>
        </div>
      );
    case 'contact-us':
      return (
        <div style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          padding: '20px'
        }}>
          <div style={{
            width: dimensions.width,
            height: dimensions.height,
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            marginBottom: '40px'
          }}>
            <ContactUsWidget 
              showControls={false} 
              userId={mobileNumber}
              width="100%"
              height="100%"
            />
          </div>
          
          {/* How to Use Section */}
          <div style={{
            maxWidth: '500px',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#3b82f6',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1e293b',
                margin: '0'
              }}>
                This widget will be part of your website
              </h3>
            </div>
            
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0'
            }}>
              <p style={{
                fontSize: '15px',
                color: '#475569',
                lineHeight: '1.6',
                margin: '0',
                textAlign: 'center'
              }}>
                Changes made from here will be reflected on your website.
                <br />
                <strong style={{ color: '#1e293b' }}>Manage everything from here - no coding required.</strong>
              </p>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div style={{ 
          width: '100%', 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#fef3c7',
          color: '#92400e',
          fontSize: '14px',
          textAlign: 'center',
          padding: '20px',
          boxSizing: 'border-box'
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
    <div className="min-h-screen bg-gray-50">
      <LeftNavbar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          {renderWidgetContent()}
        </div>
      </div>
    </div>
  );
} 