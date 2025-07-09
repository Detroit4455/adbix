'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface Image {
  fileName: string;
  publicUrl: string;
  proxyUrl: string;
  size: number;
  lastModified: string;
  contentType: string;
  key: string;
}

interface MyImagesProps {
  isSelectionMode?: boolean;
}

export default function MyImages({ isSelectionMode = false }: MyImagesProps) {
  const { data: session } = useSession();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [replacingImage, setReplacingImage] = useState<string | null>(null);
  const [imageTimestamps, setImageTimestamps] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session) {
      loadImages();
    }
  }, [session]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/my-images/list');
      const data = await response.json();

      if (response.ok) {
        setImages(data.images || []);
      } else {
        setError(data.error || 'Failed to load images');
      }
    } catch (error) {
      console.error('Error loading images:', error);
      setError('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/my-images/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Image uploaded successfully!');
        loadImages();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setError(data.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (fileName: string) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await fetch('/api/my-images/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Image deleted successfully!');
        loadImages();
        setSelectedImage(null);
      } else {
        setError(data.error || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setError('Failed to delete image');
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      // Check if the Clipboard API is available and we're in a secure context
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        setSuccess('URL copied to clipboard!');
        return;
      }
      
      // Fallback method for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setSuccess('URL copied to clipboard!');
        } else {
          throw new Error('execCommand copy failed');
        }
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        // Final fallback - show URL in a prompt for manual copy
        window.prompt('Copy this URL manually:', url);
        setSuccess('URL displayed for manual copy');
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Last resort - show URL in a prompt
      window.prompt('Copy this URL manually:', url);
      setSuccess('URL displayed for manual copy');
    }
  };

  const replaceImage = async (fileName: string, newFile: File) => {
    try {
      setReplacingImage(fileName);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('file', newFile);
      formData.append('originalFileName', fileName);

      const replaceResponse = await fetch('/api/my-images/replace', {
        method: 'PUT',
        body: formData,
      });

      const replaceData = await replaceResponse.json();

      if (replaceResponse.ok) {
        setSuccess('Image replaced successfully!');
        // Add timestamp to force cache refresh for this specific image
        setImageTimestamps(prev => ({
          ...prev,
          [fileName]: Date.now()
        }));
        loadImages(); // Reload the images list
        setSelectedImage(null); // Close modal if open
      } else {
        setError(replaceData.error || 'Failed to replace image');
      }
    } catch (error) {
      console.error('Error replacing image:', error);
      setError('Failed to replace image');
    } finally {
      setReplacingImage(null);
    }
  };

  const handleReplaceClick = (fileName: string) => {
    setReplacingImage(fileName);
    if (replaceInputRef.current) {
      replaceInputRef.current.setAttribute('data-filename', fileName);
      replaceInputRef.current.click();
    }
  };

  const handleReplaceFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const fileName = event.target.getAttribute('data-filename');
    
    if (file && fileName) {
      replaceImage(fileName, file);
    }
    
    // Reset the input
    event.target.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleImageSelection = (image: Image) => {
    if (isSelectionMode) {
      console.log('🖼️ MyImages selection:', {
        fileName: image.fileName,
        publicUrl: image.publicUrl,
        proxyUrl: image.proxyUrl
      });
      
      // Send selected image data to parent window
      window.opener.postMessage({
        type: 'IMAGE_SELECTED',
        imageUrl: image.publicUrl,
        imageName: image.fileName,
        imageId: image.key
      }, window.location.origin);
      
      // Close the popup
      window.close();
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-2xl border border-white/20 overflow-hidden backdrop-blur-sm">
      {/* Modern Header with Glassmorphism */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm border border-white/30 shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                {isSelectionMode ? 'Select from My Images' : 'My Images Gallery'}
              </h2>
              <p className="text-white/80 text-sm font-medium">
                {isSelectionMode ? 'Choose an image from your personal collection' : 'Upload, manage, and share your images'}
              </p>
            </div>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/30">
            <span className="text-white font-semibold">{images.length}</span>
            <span className="text-white/80 text-sm ml-1">image{images.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-24 h-24 bg-pink-300/20 rounded-full blur-2xl animate-bounce"></div>
      </div>

      {/* Content Section */}
      <div className="p-8">
        {/* Premium Upload Section - Hidden in selection mode */}
        {!isSelectionMode && (
        <div className="mb-8">
          <div 
            className="relative group border-3 border-dashed border-indigo-200 rounded-2xl p-12 text-center hover:border-indigo-400 transition-all duration-300 bg-gradient-to-br from-white/50 to-indigo-50/30 backdrop-blur-sm hover:shadow-2xl hover:scale-[1.02]"
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('border-indigo-500', 'bg-indigo-100/50', 'shadow-2xl', 'scale-105');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-100/50', 'shadow-2xl', 'scale-105');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-100/50', 'shadow-2xl', 'scale-105');
              const files = e.dataTransfer.files;
              if (files.length > 0 && files[0].type.startsWith('image/')) {
                uploadImage(files[0]);
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <input
              ref={replaceInputRef}
              type="file"
              accept="image/*"
              onChange={handleReplaceFileSelect}
              className="hidden"
            />
            
            {/* Animated upload icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                <svg className="h-10 w-10 text-white" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Choose Images
                    </>
                  )}
                </button>
              </div>
              <p className="text-gray-600 font-medium">or drag and drop your images here</p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">PNG</span>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">JPG</span>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">GIF</span>
                <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full">WebP</span>
              </div>
              <p className="text-xs text-gray-400">Maximum file size: 10MB</p>
            </div>
          </div>
        </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 text-sm">{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-400 hover:text-green-600">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
            <span className="ml-3 text-gray-600">Loading images...</span>
          </div>
        )}

        {!loading && (
          <div>
            {images.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium">No images uploaded yet</p>
                <p className="text-sm">Upload your first image to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {images.map((image, index) => (
                  <div 
                    key={image.fileName} 
                    className="group relative bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 hover:border-indigo-300 transition-all duration-500 hover:shadow-2xl hover:scale-[1.03] transform-gpu"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Image Container */}
                    <div className="aspect-square relative overflow-hidden cursor-pointer" onClick={() => setSelectedImage(image)}>
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <img
                        src={imageTimestamps[image.fileName] ? `${image.proxyUrl}?t=${imageTimestamps[image.fileName]}` : image.proxyUrl}
                        alt={image.fileName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                        onLoad={(e) => {
                          console.log('Image loaded successfully via proxy:', image.proxyUrl);
                        }}
                        onError={(e) => {
                          console.error('Proxy failed, trying direct URL:', image.proxyUrl);
                          // Fallback to direct S3 URL
                          e.currentTarget.src = imageTimestamps[image.fileName] ? `${image.publicUrl}?t=${imageTimestamps[image.fileName]}` : image.publicUrl;
                                                     e.currentTarget.onerror = () => {
                            console.error('Both proxy and direct URL failed:', image.publicUrl);
                            const fallbackDiv = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallbackDiv) {
                              e.currentTarget.style.display = 'none';
                              fallbackDiv.classList.remove('hidden');
                            }
                          };
                        }}
                      />
                      
                      {/* Fallback for failed images */}
                      <div className="hidden w-full h-full absolute inset-0 flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500">
                        <svg className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-medium">Failed to load</span>
                      </div>
                      
                      {/* Hover overlay with preview icon */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-20">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* File type badge */}
                      <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {image.fileName.split('.').pop()?.toUpperCase()}
                      </div>
                    </div>
                    
                    {/* Card Content */}
                    <div className="p-4 bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm">
                      <div className="mb-3">
                        <h3 className="text-sm font-bold text-gray-900 truncate mb-1" title={image.fileName}>
                          {image.fileName}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="bg-gray-100 px-2 py-1 rounded-full">{formatFileSize(image.size)}</span>
                          <span>{formatDate(image.lastModified)}</span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="space-y-2">
                        {isSelectionMode ? (
                          /* Selection Mode - Show Select Button */
                          <button
                            onClick={() => handleImageSelection(image)}
                            className="w-full flex items-center justify-center text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-md font-medium"
                          >
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Select Image
                          </button>
                        ) : (
                          /* Normal Mode - Show Regular Actions */
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => copyToClipboard(image.publicUrl)}
                                className="flex items-center justify-center text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-md"
                              >
                                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy
                              </button>
                              <button
                                onClick={() => handleReplaceClick(image.fileName)}
                                disabled={replacingImage === image.fileName}
                                className="flex items-center justify-center text-xs bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {replacingImage === image.fileName ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1"></div>
                                    <span>...</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Replace
                                  </>
                                )}
                              </button>
                            </div>
                            <button
                              onClick={() => deleteImage(image.fileName)}
                              className="w-full flex items-center justify-center text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-2 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-md"
                            >
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedImage.fileName}</h3>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedImage.size)} • {formatDate(selectedImage.lastModified)}
                </p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <img
                src={imageTimestamps[selectedImage.fileName] ? `${selectedImage.proxyUrl}?t=${imageTimestamps[selectedImage.fileName]}` : selectedImage.proxyUrl}
                alt={selectedImage.fileName}
                className="max-w-full max-h-[60vh] mx-auto object-contain"
                onError={(e) => {
                  console.error('Modal image failed to load:', selectedImage.publicUrl);
                }}
              />
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Public URL:</label>
                <div className="flex">
                  <input
                    type="text"
                    value={selectedImage.publicUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-white text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(selectedImage.publicUrl)}
                    className="px-4 py-2 bg-purple-600 text-white text-sm rounded-r-md hover:bg-purple-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="flex space-x-3">
                {isSelectionMode ? (
                  <>
                    <button
                      onClick={() => handleImageSelection(selectedImage)}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-md"
                    >
                      <svg className="h-4 w-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Select This Image
                    </button>
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleReplaceClick(selectedImage.fileName)}
                      disabled={replacingImage === selectedImage.fileName}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {replacingImage === selectedImage.fileName ? 'Replacing...' : 'Replace Image'}
                    </button>
                    <button
                      onClick={() => deleteImage(selectedImage.fileName)}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                    >
                      Delete Image
                    </button>
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 