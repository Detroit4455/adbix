import React, { useEffect, useState } from 'react';
import { showGlobalToast } from './GlobalToast';

interface Image {
  fileName: string;
  publicUrl: string;
  proxyUrl: string;
  size: number;
  lastModified: string;
  contentType: string;
  key: string;
}

interface WebpageImage {
  index: number;
  src: string;
  alt: string;
}

interface ImageManagerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onReplace: (oldImageUrl: string, newImageUrl: string) => void;
  userImages: Image[];
  loadingUserImages: boolean;
  reloadUserImages: () => void;
  onImageReplaced?: () => void;
}

const ImageManagerPanel: React.FC<ImageManagerPanelProps> = ({
  isOpen,
  onClose,
  iframeRef,
  onReplace,
  userImages,
  loadingUserImages,
  reloadUserImages,
  onImageReplaced,
}) => {
  const [webImages, setWebImages] = useState<WebpageImage[]>([]);
  // Remove successMessage state
  // Remove replaceModal, uploading, urlInput, error, and modal logic

  // Extract images from iframe
  useEffect(() => {
    if (!isOpen) return;
    if (!iframeRef.current) return;
    try {
      const iframeDoc = iframeRef.current.contentDocument;
      if (!iframeDoc) return;
      const imgElements = iframeDoc.querySelectorAll('img');
      const imgs = Array.from(imgElements).map((img, index) => ({
        index,
        src: img.src,
        alt: img.alt || `Image ${index + 1}`,
      }));
      setWebImages(imgs);
    } catch (e) {
      setWebImages([]);
    }
  }, [isOpen, iframeRef, iframeRef.current?.src]);

  // Handle image replacement from gallery
  const handleReplaceFromGallery = (webImg: WebpageImage, galleryImg: Image) => {
    onReplace(webImg.src, galleryImg.publicUrl);
    // setReplaceModal(null); // This line is removed
  };

  // Handle image replacement from file upload
  const handleReplaceFromUpload = async (webImg: WebpageImage, file: File) => {
    // setUploading(true); // This line is removed
    // setError(''); // This line is removed
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('oldImagePath', webImg.src);
      // You may need to pass mobileNumber or other info as needed
      const response = await fetch('/api/replace-image', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.imageUrl) {
        throw new Error(result.error || 'Failed to replace image');
      }
      onReplace(webImg.src, result.imageUrl);
      // setReplaceModal(null); // This line is removed
    } catch (e: any) {
      // setError(e.message || 'Failed to upload'); // This line is removed
    } finally {
      // setUploading(false); // This line is removed
    }
  };

  // Handle image replacement from URL
  const handleReplaceFromUrl = async (webImg: WebpageImage, url: string) => {
    // setUploading(true); // This line is removed
    // setError(''); // This line is removed
    try {
      // Validate URL
      new URL(url);
      // Call API to update image URL in HTML
      const response = await fetch('/api/replace-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url, imagePath: webImg.src }),
      });
      const result = await response.json();
      if (!response.ok || !result.imageUrl) {
        throw new Error(result.error || 'Failed to replace image');
      }
      onReplace(webImg.src, result.imageUrl);
      // setReplaceModal(null); // This line is removed
    } catch (e: any) {
      // setError(e.message || 'Invalid URL'); // This line is removed
    } finally {
      // setUploading(false); // This line is removed
    }
  };

  // Handle image replacement from repository popup
  const handleReplaceFromRepo = (webImg: WebpageImage) => {
    // Open popup
    const popup = window.open(
      '/image_repo?mode=select',
      'imageRepository',
      'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
    );
    if (!popup) {
      // setError('Popup blocked! Please allow popups for this site.');
      return;
    }
    // Listen for message
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.type === 'IMAGE_SELECTED') {
        const selectedImageUrl = event.data.imageUrl;
        onReplace(webImg.src, selectedImageUrl);
        showGlobalToast('Image replaced successfully!', 2000);
        if (typeof onImageReplaced === 'function') onImageReplaced();
        setTimeout(() => {
          onClose();
        }, 2000);
        window.removeEventListener('message', messageHandler);
        popup.close();
      }
    };
    window.addEventListener('message', messageHandler);
    // Cleanup if popup is closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
      }
    }, 1000);
  };

  // Highlight image in iframe
  const handleHighlight = (webImg: WebpageImage) => {
    if (!iframeRef.current) return;
    try {
      const iframeDoc = iframeRef.current.contentDocument;
      if (!iframeDoc) return;
      const imgElements = iframeDoc.querySelectorAll('img');
      const img = imgElements[webImg.index];
      if (img) {
        img.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const prevBoxShadow = img.style.boxShadow;
        const prevOutline = img.style.outline;
        img.style.boxShadow = '0 0 0 4px #f59e42, 0 0 16px 8px #fbbf24aa';
        img.style.outline = '3px solid #f59e42';
        img.style.transition = 'box-shadow 0.3s, outline 0.3s';
        setTimeout(() => {
          img.style.boxShadow = prevBoxShadow;
          img.style.outline = prevOutline;
        }, 2000);
      }
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 h-full w-[400px] max-w-full bg-white shadow-2xl z-[100] flex flex-col border-r border-gray-200 animate-slide-in-left">
      {/* Remove local success toast rendering */}
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <div>
          <div className="font-bold text-lg">Image Manager</div>
          <div className="text-xs opacity-80 mt-1">Found {webImages.length} images on this page</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reloadUserImages} className="bg-white/20 px-3 py-1 rounded hover:bg-white/30 text-sm flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
          <button onClick={onClose} className="bg-white/20 px-3 py-1 rounded hover:bg-white/30 text-sm flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            Close
          </button>
        </div>
      </div>
      {/* Webpage Images */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <div className="font-semibold mb-2">Images in Webpage</div>
          {webImages.length === 0 ? (
            <div className="text-gray-400 italic text-center py-8">No images found on this page</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {webImages.map((img) => (
                <div
                  key={img.index}
                  className="border rounded-lg p-3 bg-white shadow-sm flex flex-col gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={img.src} alt={img.alt} className="w-16 h-16 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-semibold text-base text-gray-900 truncate"
                        title={img.alt}
                      >
                        {img.alt}
                      </div>
                      <div
                        className="text-xs text-gray-500 truncate mt-1"
                        title={img.src}
                      >
                        {img.src}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold"
                      onClick={() => handleReplaceFromRepo(img)}
                    >
                      Replace
                    </button>
                    <button
                      className="bg-orange-400 hover:bg-orange-500 text-white px-4 py-2 rounded text-sm font-semibold"
                      onClick={() => handleHighlight(img)}
                    >
                      <svg className="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Highlight
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* User Gallery (for reference, not for direct replace) */}
        {/* ... can be added if needed ... */}
      </div>
      {/* Remove the replaceModal rendering and related modal code */}
    </div>
  );
};

export default ImageManagerPanel; 