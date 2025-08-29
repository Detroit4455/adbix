import ShopStatusWidget from '@/app/components/ShopStatusWidget';
import ContactUsWidget from '@/app/components/ContactUsWidget';
import ImageGalleryWidget from '@/app/components/ImageGalleryWidget';

interface PreviewWidgetPageProps {
  params: {
    mobileNumber: string;
    widgetId: string;
  };
}

export default function PreviewWidgetPage({ params }: PreviewWidgetPageProps) {
  const { mobileNumber, widgetId } = params;

  // Render the appropriate widget based on widgetId
  switch (widgetId) {
    case 'shop-status':
      return (
        <ShopStatusWidget 
          showControls={false} 
          userId={mobileNumber}
          width="100%"
          height="100vh"
        />
      );
    case 'contact-us':
      return (
        <ContactUsWidget 
          showControls={false} 
          userId={mobileNumber}
          width="100%"
          height="100vh"
        />
      );
    case 'image-gallery':
      return (
        <ImageGalleryWidget 
          showControls={false} 
          userId={mobileNumber}
          width="100%"
          height="100vh"
        />
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
} 