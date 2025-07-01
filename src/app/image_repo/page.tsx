'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import LeftNavbar from '@/components/LeftNavbar';
import Navbar from '@/components/Navbar';
import MyImages from '@/components/MyImages';

interface ImageFile {
  id: string;
  name: string;
  s3Url: string;
  size: number;
  width?: number;
  height?: number;
  formattedSize: string;
  createdAt: string;
  type: string;
  description: string;
  fileName: string;
  mimeType: string;
  uploadedBy: string;
}

interface UploadForm {
  name: string;
  type: string;
  description: string;
}

interface ImageStats {
  totalImages: number;
  totalSize: number;
  formattedTotalSize: string;
  averageSize: number;
  formattedAverageSize: string;
  typeBreakdown: Array<{
    type: string;
    count: number;
    totalSize: number;
    formattedSize: string;
  }>;
}

export default function ImageRepoPage() {
  const { data: session, status } = useSession();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [stats, setStats] = useState<ImageStats | null>(null);
  const [hasUploadAccess, setHasUploadAccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterRatio, setFilterRatio] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadForms, setUploadForms] = useState<UploadForm[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [selectedImageForUrl, setSelectedImageForUrl] = useState<ImageFile | null>(null);
  const [urlDimensions, setUrlDimensions] = useState({ width: '', height: '', quality: '80', format: 'auto' });
  const [showFullSizeModal, setShowFullSizeModal] = useState(false);
  const [selectedImageForFullSize, setSelectedImageForFullSize] = useState<ImageFile | null>(null);
  const [activeTab, setActiveTab] = useState<'repository' | 'myImages'>('repository');

  // Fetch images from API
  const fetchImages = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        type: filterType
      });
      
      const response = await fetch(`/api/image-repo/images?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setImages(data.images);
      } else {
        setError('Failed to fetch images');
      }
    } catch (err) {
      setError('Failed to fetch images');
      console.error('Error fetching images:', err);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/image-repo/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Check RBAC access on component mount
  useEffect(() => {
    const checkAccess = async () => {
      if (session?.user?.role) {
        try {
          const response = await fetch(`/api/admin/rbac-settings/check?resource=image-repo&role=${session.user.role}`);
          const data = await response.json();
          setHasUploadAccess(data.hasAccess || session.user.role === 'admin');
        } catch (error) {
          console.error('Error checking RBAC access:', error);
          setHasUploadAccess(session.user.role === 'admin');
        }
      }
    };

    if (session) {
      checkAccess();
    }
  }, [session]);

  // Fetch images and stats
  useEffect(() => {
    if (session) {
      fetchImages();
      fetchStats();
    }
  }, [session, searchTerm, filterType, filterRatio]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFullSizeModal(false);
        setShowUrlModal(false);
        setShowUploadModal(false);
      }
    };

    if (showFullSizeModal || showUrlModal || showUploadModal) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [showFullSizeModal, showUrlModal, showUploadModal]);

  // Early returns for loading and authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    redirect('/login');
  }

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files);
    setUploadFiles(selectedFiles);
    
    // Initialize forms for each file
    const forms = selectedFiles.map(file => ({
      name: file.name.split('.')[0], // Remove extension
      type: 'other',
      description: ''
    }));
    setUploadForms(forms);
    setShowUploadModal(true);
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      
      // Add files
      uploadFiles.forEach(file => {
        formData.append('images', file);
      });
      
      // Add metadata
      uploadForms.forEach(form => {
        formData.append('names', form.name);
        formData.append('types', form.type);
        formData.append('descriptions', form.description);
      });

      const response = await fetch('/api/image-repo/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Successfully uploaded ${data.uploaded} image(s)`);
        setShowUploadModal(false);
        setUploadFiles([]);
        setUploadForms([]);
        await fetchImages();
        await fetchStats();
        
        if (data.errors && data.errors.length > 0) {
          setError(`Some files failed: ${data.errors.map((e: any) => e.error).join(', ')}`);
        }
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectImage = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedImages.length === 0) return;

    try {
      const response = await fetch('/api/image-repo/images', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageIds: selectedImages }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Deleted ${data.deleted} image(s)`);
        setSelectedImages([]);
        await fetchImages();
        await fetchStats();
      } else {
        setError(data.error || 'Failed to delete images');
      }
    } catch (err) {
      setError('Failed to delete images');
      console.error('Delete error:', err);
    }
  };

  const updateUploadForm = (index: number, field: keyof UploadForm, value: string) => {
    setUploadForms(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      if (!navigator.clipboard) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setSuccess(`${type} copied to clipboard!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Clipboard error:', err);
      setError('Failed to copy to clipboard. Please try selecting and copying manually.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const calculateAspectRatio = (width: number, height: number): string => {
    if (!width || !height || width <= 0 || height <= 0) {
      return 'Unknown';
    }
    
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    const ratioW = width / divisor;
    const ratioH = height / divisor;
    
    // Common aspect ratios
    if (ratioW === ratioH) return '1:1';
    if (ratioW === 16 && ratioH === 9) return '16:9';
    if (ratioW === 4 && ratioH === 3) return '4:3';
    if (ratioW === 3 && ratioH === 2) return '3:2';
    if (ratioW === 5 && ratioH === 4) return '5:4';
    if (ratioW === 2 && ratioH === 1) return '2:1';
    if (ratioW === 3 && ratioH === 4) return '3:4';
    if (ratioW === 9 && ratioH === 16) return '9:16';
    
    // For uncommon ratios, simplify if numbers are too large
    if (ratioW > 50 || ratioH > 50) {
      return `${Math.round(width / height * 10) / 10}:1`;
    }
    
    return `${ratioW}:${ratioH}`;
  };

  const generateImageUrl = (image: ImageFile, options?: { width?: string; height?: string; quality?: string; format?: string }) => {
    if (!options || (!options.width && !options.height)) {
      // Return direct S3 URL for original image
      return image.s3Url;
    }
    
    // Generate parameterized URL for future CDN/image service integration
    const params = new URLSearchParams();
    if (options.width) params.append('w', options.width);
    if (options.height) params.append('h', options.height);
    if (options.quality && options.quality !== '80') params.append('q', options.quality);
    if (options.format && options.format !== 'auto') params.append('f', options.format);
    
    // For now, append parameters to the original URL
    // This URL format can be used with CDN services like Cloudinary, ImageKit, etc.
    return `${image.s3Url}?${params.toString()}`;
  };

  const openUrlModal = (image: ImageFile) => {
    setSelectedImageForUrl(image);
    setUrlDimensions({ width: '', height: '', quality: '80', format: 'auto' });
    setShowUrlModal(true);
  };

  const openFullSizeModal = (image: ImageFile) => {
    setSelectedImageForFullSize(image);
    setShowFullSizeModal(true);
  };

  const filteredImages = images.filter(img => {
    const matchesSearch = img.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || img.type === filterType;
    
    const matchesRatio = filterRatio === 'all' || 
      (img.width && img.height && calculateAspectRatio(img.width, img.height) === filterRatio);
    
    return matchesSearch && matchesType && matchesRatio;
  });

  const imageTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'photo', label: 'Photo' },
    { value: 'icon', label: 'Icon' },
    { value: 'banner', label: 'Banner' },
    { value: 'logo', label: 'Logo' },
    { value: 'background', label: 'Background' },
    { value: 'product', label: 'Product' },
    { value: 'other', label: 'Other' }
  ];

  const aspectRatios = [
    { value: 'all', label: 'All Ratios' },
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:2', label: 'Classic (3:2)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '3:4', label: 'Portrait (3:4)' },
    { value: '2:3', label: 'Portrait (2:3)' },
    { value: '21:9', label: 'Ultrawide (21:9)' },
    { value: '5:4', label: 'Large Format (5:4)' },
    { value: '16:10', label: 'Widescreen (16:10)' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      <LeftNavbar />
      <div className="flex-1 ml-64">
        <Navbar />
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-600 bg-clip-text text-transparent mb-2">
                  Image Gallery
                </h1>
                <p className="text-xl text-gray-600 font-medium">
                  Manage and organize your images with advanced cloud features
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 bg-white rounded-t-2xl shadow-sm">
              <button
                onClick={() => setActiveTab('repository')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 relative ${
                  activeTab === 'repository'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Image Repository
                </div>
              </button>
              <button
                onClick={() => setActiveTab('myImages')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 relative ${
                  activeTab === 'myImages'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  My Images
                </div>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'myImages' ? (
            /* My Images Tab */
            <div className="bg-white rounded-b-2xl shadow-sm p-6">
              <MyImages />
            </div>
          ) : (
            /* Repository Tab */
            <div className="bg-white rounded-b-2xl shadow-sm">
              {/* Error/Success Messages */}
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-800 px-6 py-4 rounded-xl mb-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}
              {success && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 text-green-800 px-6 py-4 rounded-xl mb-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{success}</span>
                  </div>
                </div>
              )}

          {/* Controls */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
              <div className="flex items-center gap-4">
                {hasUploadAccess && (
                  <label className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelection}
                      className="hidden"
                    />
                    Upload Images
                  </label>
                )}
                
                {selectedImages.length > 0 && hasUploadAccess && (
                  <button
                    onClick={handleDeleteSelected}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Selected ({selectedImages.length})
                  </button>
                )}

                {!hasUploadAccess && (
                  <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 cursor-not-allowed opacity-75">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Upload Restricted
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/70 backdrop-blur-sm shadow-sm font-medium"
                >
                  {imageTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filterRatio}
                  onChange={(e) => setFilterRatio(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/70 backdrop-blur-sm shadow-sm font-medium"
                >
                  {aspectRatios.map(ratio => (
                    <option key={ratio.value} value={ratio.value}>
                      {ratio.label}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search images..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/70 backdrop-blur-sm shadow-sm font-medium min-w-[280px]"
                  />
                  <svg className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white/70 backdrop-blur-sm shadow-sm">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 transition-all duration-200 ${viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                      : 'bg-transparent text-gray-600 hover:bg-gray-50'}`}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 transition-all duration-200 ${viewMode === 'list' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                      : 'bg-transparent text-gray-600 hover:bg-gray-50'}`}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

              {/* Images Display */}
          {filteredImages.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-16 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="h-12 w-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No images found</h3>
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm ? 'No images match your search criteria. Try adjusting your filters.' : 'Upload your first images to start building your collection.'}
              </p>
              {!searchTerm && (
                <label className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-medium inline-flex items-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelection}
                    className="hidden"
                  />
                  Upload Your First Images
                </label>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {filteredImages.map((image) => (
                <div key={image.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="relative cursor-pointer" onClick={() => openFullSizeModal(image)}>
                    <img
                      src={image.s3Url}
                      alt={image.name}
                      loading="lazy"
                      className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Zoom icon on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-black/60 text-white p-3 rounded-full">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>

                    <div className="absolute top-3 left-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedImages.includes(image.id)}
                        onChange={() => handleSelectImage(image.id)}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded-md shadow-lg bg-white/90 backdrop-blur-sm"
                      />
                    </div>
                    <div className="absolute top-3 right-3">
                      <div className="flex flex-col gap-2 items-end">
                        <span className="bg-white/90 backdrop-blur-sm text-xs px-3 py-1 rounded-full shadow-lg font-medium text-gray-700 border border-white/50">
                          {image.type}
                        </span>
                        <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full shadow-lg font-medium">
                          {image.width && image.height ? calculateAspectRatio(image.width, image.height) : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 truncate text-lg mb-2" title={image.name}>
                      {image.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 truncate" title={image.description}>
                      {image.description || 'No description'}
                    </p>
                    <div className="mb-4 text-sm text-gray-500 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{image.formattedSize}</span>
                        {image.width && image.height && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{image.width}×{image.height}</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium">
                          {image.width && image.height ? calculateAspectRatio(image.width, image.height) : 'Unknown'}
                        </span>
                        <span>Uploaded by: {image.uploadedBy}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(image.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {/* Action buttons at bottom */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => copyToClipboard(image.s3Url, 'Original URL')}
                        className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        title="Copy original URL"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                      <button
                        onClick={() => openUrlModal(image)}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        title="Resize options"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        Resize
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedImages(filteredImages.map(img => img.id));
                          } else {
                            setSelectedImages([]);
                          }
                        }}
                        checked={filteredImages.length > 0 && selectedImages.length === filteredImages.length}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preview
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Upload Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredImages.map((image) => (
                    <tr key={image.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedImages.includes(image.id)}
                          onChange={() => handleSelectImage(image.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={image.s3Url}
                          alt={image.name}
                          loading="lazy"
                          className="h-10 w-10 rounded-lg object-cover cursor-pointer hover:scale-110 transition-transform duration-200"
                          onClick={() => openFullSizeModal(image)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{image.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{image.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                          {image.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{image.formattedSize}</div>
                        {image.width && image.height && (
                          <div className="text-xs text-gray-400">
                            {image.width}×{image.height} ({calculateAspectRatio(image.width, image.height)})
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(image.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => copyToClipboard(image.s3Url, 'Original URL')}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Copy URL
                        </button>
                        <button
                          onClick={() => openUrlModal(image)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Resize
                        </button>
                        <button
                          onClick={() => setSelectedImages([image.id])}
                          className="text-red-600 hover:text-red-900"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Stats */}
          {stats && hasUploadAccess && (
            <div className="mt-10 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Repository Statistics</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 border border-indigo-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-4xl font-bold text-indigo-700 mb-2">{stats.totalImages}</div>
                  <div className="text-sm font-medium text-indigo-600">Total Images</div>
                </div>
                <div className="text-center bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="text-4xl font-bold text-emerald-700 mb-2">{stats.formattedTotalSize}</div>
                  <div className="text-sm font-medium text-emerald-600">Storage Used</div>
                </div>
                <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-4xl font-bold text-purple-700 mb-2">{selectedImages.length}</div>
                  <div className="text-sm font-medium text-purple-600">Selected Images</div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
                <div className="p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Upload Images</h2>
                    </div>
                    <button
                      onClick={() => {
                        setShowUploadModal(false);
                        setUploadFiles([]);
                        setUploadForms([]);
                      }}
                      className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {uploadFiles.map((file, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Image Name *
                              </label>
                              <input
                                type="text"
                                value={uploadForms[index]?.name || ''}
                                onChange={(e) => updateUploadForm(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Enter image name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type *
                              </label>
                              <select
                                value={uploadForms[index]?.type || 'other'}
                                onChange={(e) => updateUploadForm(index, 'type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              >
                                {imageTypes.slice(1).map(type => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <textarea
                                value={uploadForms[index]?.description || ''}
                                onChange={(e) => updateUploadForm(index, 'description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                rows={2}
                                placeholder="Enter image description"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowUploadModal(false);
                        setUploadFiles([]);
                        setUploadForms([]);
                      }}
                      className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={isUploading || uploadForms.some(form => !form.name || !form.type)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isUploading ? 'Uploading...' : `Upload ${uploadFiles.length} Image(s)`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* URL Generation Modal */}
          {showUrlModal && selectedImageForUrl && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
                <div className="p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Image URL Options</h2>
                    </div>
                    <button
                      onClick={() => setShowUrlModal(false)}
                      className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Image Preview */}
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedImageForUrl.s3Url}
                        alt={selectedImageForUrl.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{selectedImageForUrl.name}</h3>
                        <p className="text-sm text-gray-500">{selectedImageForUrl.formattedSize}</p>
                      </div>
                    </div>

                    {/* Original URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Original Image URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={selectedImageForUrl.s3Url}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                        />
                        <button
                          onClick={() => copyToClipboard(selectedImageForUrl.s3Url, 'Original URL')}
                          className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    {/* Resize Options */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Resized URL</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Width (px)
                          </label>
                          <input
                            type="number"
                            value={urlDimensions.width}
                            onChange={(e) => setUrlDimensions(prev => ({ ...prev, width: e.target.value }))}
                            placeholder="Auto"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Height (px)
                          </label>
                          <input
                            type="number"
                            value={urlDimensions.height}
                            onChange={(e) => setUrlDimensions(prev => ({ ...prev, height: e.target.value }))}
                            placeholder="Auto"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quality (1-100)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={urlDimensions.quality}
                            onChange={(e) => setUrlDimensions(prev => ({ ...prev, quality: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Format
                          </label>
                          <select
                            value={urlDimensions.format}
                            onChange={(e) => setUrlDimensions(prev => ({ ...prev, format: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="auto">Auto</option>
                            <option value="jpeg">JPEG</option>
                            <option value="png">PNG</option>
                            <option value="webp">WebP</option>
                          </select>
                        </div>
                      </div>

                      {/* Generated URL */}
                      {(urlDimensions.width || urlDimensions.height) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Generated Resized URL
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={generateImageUrl(selectedImageForUrl, urlDimensions)}
                              readOnly
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                            />
                            <button
                              onClick={() => copyToClipboard(generateImageUrl(selectedImageForUrl, urlDimensions), 'Resized URL')}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Common Presets */}
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Presets</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[
                            { name: 'Thumbnail', width: '150', height: '150' },
                            { name: 'Small', width: '300', height: '300' },
                            { name: 'Medium', width: '600', height: '600' },
                            { name: 'Large', width: '1200', height: '1200' },
                            { name: 'Banner', width: '1200', height: '400' },
                            { name: 'Square', width: '500', height: '500' },
                            { name: 'Wide', width: '800', height: '450' },
                            { name: 'Portrait', width: '400', height: '600' }
                          ].map(preset => (
                            <button
                              key={preset.name}
                              onClick={() => setUrlDimensions(prev => ({ 
                                ...prev, 
                                width: preset.width, 
                                height: preset.height 
                              }))}
                              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                            >
                              {preset.name}
                              <br />
                              <span className="text-gray-500">{preset.width}×{preset.height}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Usage Instructions</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Use the original URL for best quality and fastest loading</li>
                        <li>• Parameterized URLs can be used with CDN services (Cloudinary, ImageKit, etc.)</li>
                        <li>• Leave width or height empty for proportional scaling</li>
                        <li>• Parameters: w=width, h=height, q=quality, f=format</li>
                        <li>• Example: image.jpg?w=300&h=200&q=85&f=webp</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setShowUrlModal(false)}
                      className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
          )}

          {/* Full Size Image Modal */}
          {showFullSizeModal && selectedImageForFullSize && (
            <div 
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowFullSizeModal(false)}
            >
              <div 
                className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button
                  onClick={() => setShowFullSizeModal(false)}
                  className="absolute top-4 right-4 z-10 bg-black/60 text-white p-3 rounded-full hover:bg-black/80 transition-all duration-200"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Image controls */}
                <div className="absolute top-4 left-4 z-10 bg-black/60 text-white p-4 rounded-xl backdrop-blur-sm">
                  <h3 className="font-medium text-lg mb-2">{selectedImageForFullSize.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div>Size: {selectedImageForFullSize.formattedSize}</div>
                    <div>Type: {selectedImageForFullSize.type}</div>
                    {selectedImageForFullSize.width && selectedImageForFullSize.height && (
                      <div>
                        Dimensions: {selectedImageForFullSize.width}×{selectedImageForFullSize.height}
                      </div>
                    )}
                    {selectedImageForFullSize.width && selectedImageForFullSize.height && (
                      <div>
                        Ratio: {calculateAspectRatio(selectedImageForFullSize.width, selectedImageForFullSize.height)}
                      </div>
                    )}
                    <div>Uploaded by: {selectedImageForFullSize.uploadedBy}</div>
                    <div>Date: {new Date(selectedImageForFullSize.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-3">
                  <button
                    onClick={() => copyToClipboard(selectedImageForFullSize.s3Url, 'Original URL')}
                    className="bg-black/60 text-white px-4 py-2 rounded-xl hover:bg-black/80 transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy URL
                  </button>
                  <button
                    onClick={() => {
                      setShowFullSizeModal(false);
                      openUrlModal(selectedImageForFullSize);
                    }}
                    className="bg-black/60 text-white px-4 py-2 rounded-xl hover:bg-black/80 transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    Resize Options
                  </button>
                </div>

                {/* Full size image */}
                <img
                  src={selectedImageForFullSize.s3Url}
                  alt={selectedImageForFullSize.name}
                  loading="lazy"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 