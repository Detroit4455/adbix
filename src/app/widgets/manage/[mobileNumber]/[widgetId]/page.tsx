import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import ShopStatusWidget from '@/app/components/ShopStatusWidget';
import ImageGalleryWidget from '@/app/components/ImageGalleryWidget';
import ImageGalleryManager from '@/app/components/ImageGalleryManager';
import ContactUsWidget from '@/app/components/ContactUsWidget';
import ContactUsManager from '@/app/components/ContactUsManager';
import ContactFormPreview from '@/app/components/ContactFormPreview';

interface ManageWidgetPageProps {
  params: Promise<{
    mobileNumber: string;
    widgetId: string;
  }>;
}

// Image Gallery Management Component
function ImageGalleryManagementPage({ userId }: { userId: string }) {
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
            />
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Preview updates automatically when you make changes below. You can also click the refresh button in the widget.
          </p>
        </div>

        {/* Gallery Management Interface */}
        <ImageGalleryManager 
          userId={userId} 
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
  src="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/widget-preview/${userId}/image-gallery" 
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
              <li>• Widget automatically displays your custom gallery images in position order</li>
              <li>• Use position numbers to control display order (1 = first, 2 = second, etc.)</li>
              <li>• Changes made above will appear immediately in embedded widgets</li>
              <li>• Use ↑↓ buttons for quick position adjustments</li>
              <li>• No coding required - just copy and paste the iframe code</li>
              <li>• Works on any website: WordPress, Wix, Squarespace, or custom HTML</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ManageWidgetPage({ params }: ManageWidgetPageProps) {
  const session = await getServerSession(authOptions);
  const { mobileNumber, widgetId } = await params;

  // Check if user is authenticated
  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  // Check if the widget is being accessed by its owner
  if (session.user.mobileNumber !== mobileNumber) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Access Denied!</strong>
          <span className="block sm:inline"> This widget belongs to another user.</span>
        </div>
      </div>
    );
  }

  // Render the appropriate widget based on widgetId
  switch (widgetId) {
    case 'shop-status':
      return (
        <div className="p-4">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">Manage Shop Status</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <ShopStatusWidget 
                showControls={true} 
                userId={mobileNumber}
                width="100%"
                height="150px"
              />
              <div className="mt-4 text-sm text-gray-600">
                <p>• Click the widget above to toggle your shop status</p>
                <p>• The status will be visible on your website</p>
                <p>• Changes are saved automatically</p>
              </div>
            </div>
          </div>
        </div>
      );
    case 'image-gallery':
      return <ImageGalleryManagementPage userId={mobileNumber} />;
    case 'contact-us':
      return (
        <div className="p-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Manage Contact Us Widget</h2>
            
            {/* Widget Preview */}
            <ContactFormPreview userId={mobileNumber} />

            {/* Contact Us Management Interface */}
            <ContactUsManager userId={mobileNumber} />

            {/* Embed Code Section */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-medium mb-4">Embed This Widget</h3>
              <p className="text-sm text-gray-600 mb-4">
                Copy this code to embed the contact form in your website:
              </p>
              <div className="bg-gray-50 p-4 rounded border">
                <code className="block text-xs overflow-x-auto text-gray-800">
                  {`<iframe 
  src="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/widget-preview/${mobileNumber}/contact-us" 
  width="400" 
  height="500" 
  frameborder="0"
  style="border: none; border-radius: 12px;">
</iframe>`}
                </code>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">Different Sizes</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">Compact Form</div>
                    <div>width="350" height="450"</div>
                    <div className="text-gray-500">Good for sidebars</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">Standard Form</div>
                    <div>width="400" height="500"</div>
                    <div className="text-gray-500">Default size</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">Large Form</div>
                    <div>width="500" height="600"</div>
                    <div className="text-gray-500">Full-featured contact</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-medium text-blue-800 mb-2">Usage Tips</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Customize form fields, colors, and labels in the settings above</li>
                  <li>• Messages are stored securely and can be viewed in the Messages tab</li>
                  <li>• Changes made above will appear immediately in embedded widgets</li>
                  <li>• All form submissions include timestamp and IP address for security</li>
                  <li>• No coding required - just copy and paste the iframe code</li>
                  <li>• Works on any website: WordPress, Wix, Squarespace, or custom HTML</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div className="p-4">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Widget Not Found!</strong>
            <span className="block sm:inline"> The requested widget does not exist.</span>
          </div>
        </div>
      );
  }
} 