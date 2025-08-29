'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import S3WebsiteUpload from '@/components/S3WebsiteUpload';
import S3FileManager from '@/components/S3FileManager';
import WebsitePreview from '@/components/WebsitePreview';
import MyImages from '@/components/MyImages';
import Navbar from '@/components/Navbar';
import LeftNavbar from '@/components/LeftNavbar';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import Link from 'next/link';
import { 
  CloudArrowUpIcon, 
  DocumentDuplicateIcon, 
  FolderIcon, 
  PhotoIcon, 
  LinkIcon,
  ServerIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

// URL utility functions for CloudFront support
function getWebsiteUrl(userId: string, filePath: string = 'index.html'): string {
  const cloudFrontBaseUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_BASE_URL;
  if (cloudFrontBaseUrl) {
    return `${cloudFrontBaseUrl}/sites/${userId}/${filePath}`;
  }
  // Fallback to S3 if CloudFront not configured
  const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://dt-web-sites.s3.ap-south-1.amazonaws.com';
  return `${s3BaseUrl}/sites/${userId}/${filePath}`;
}

function getDirectS3Url(userId: string, filePath: string = 'index.html'): string {
  const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://dt-web-sites.s3.ap-south-1.amazonaws.com';
  return `${s3BaseUrl}/sites/${userId}/${filePath}`;
}

function isCloudFrontConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_CLOUDFRONT_BASE_URL && process.env.NEXT_PUBLIC_CLOUDFRONT_BASE_URL.trim());
}

export default function WebOnS3Page() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('upload');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [canUploadWebsite, setCanUploadWebsite] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [hasWebsiteFiles, setHasWebsiteFiles] = useState(false);
  const [checkingFiles, setCheckingFiles] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Function to get direct S3 URL (bypassing CDN)
  const getDirectS3Url = (userId: string, filePath: string = 'index.html'): string => {
    const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://dt-web-sites.s3.ap-south-1.amazonaws.com';
    return `${s3BaseUrl}/sites/${userId}/${filePath}?v=${Date.now()}&r=${previewRefreshKey}`;
  };

  // Function to refresh preview
  const refreshPreview = () => {
    setPreviewRefreshKey(prev => prev + 1);
  };



  // Check upload website permission
  useEffect(() => {
    const checkUploadPermission = async () => {
      if (!session?.user?.role) {
        setPermissionLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/admin/rbac-settings/check?resource=upload-website&role=${session.user.role}`);
        if (response.ok) {
          const data = await response.json();
          setCanUploadWebsite(data.hasAccess);
        }
      } catch (error) {
        console.error('Error checking upload permission:', error);
        setCanUploadWebsite(false);
      } finally {
        setPermissionLoading(false);
      }
    };

    if (session) {
      checkUploadPermission();
    }
  }, [session]);

  // Get mobile number early for hooks
  const mobileNumber = session?.user?.mobileNumber || '';

  // Check if user has website files
  useEffect(() => {
    const checkWebsiteFiles = async () => {
      if (!mobileNumber || !session) {
        setCheckingFiles(false);
        return;
      }

      try {
        const response = await fetch(`/api/s3-files?userId=${mobileNumber}`);
        const data = await response.json();
        
        if (response.ok && data.files) {
          // Check if index.html exists or any files exist
          const hasIndexHtml = data.files.some((file: any) => 
            file.type === 'file' && file.name === 'index.html'
          );
          const hasAnyFiles = data.files.length > 0;
          setHasWebsiteFiles(hasIndexHtml || hasAnyFiles);
        } else {
          setHasWebsiteFiles(false);
        }
      } catch (error) {
        console.error('Error checking website files:', error);
        setHasWebsiteFiles(false);
      } finally {
        setCheckingFiles(false);
      }
    };

    if (session && mobileNumber) {
      checkWebsiteFiles();
    }
  }, [session, mobileNumber]);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user) return;
      
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data.profile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [session]);

  // Set default active tab based on permissions
  useEffect(() => {
    if (!canUploadWebsite && activeTab === 'upload') {
      setActiveTab('preview');
    }
  }, [canUploadWebsite, activeTab]);

  if (status === 'loading' || permissionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your S3 workspace...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    redirect('/login');
  }

  // Define all possible tabs
  const allTabs = [
    { 
      id: 'upload', 
      label: 'Upload Website', 
      icon: CloudArrowUpIcon,
      description: 'Upload your website files'
    },
    { 
      id: 'preview', 
      label: 'Preview & Edit', 
      icon: DocumentDuplicateIcon,
      description: 'Preview and edit your website'
    },
    { 
      id: 'files', 
      label: 'File Manager', 
      icon: FolderIcon,
      description: 'Manage your website files'
    },
    { 
      id: 'my-images', 
      label: 'Image Gallery', 
      icon: PhotoIcon,
      description: 'Manage your image collection'
    },
    { 
      id: 'access', 
      label: 'Access URLs', 
      icon: LinkIcon,
      description: 'Get your website access links'
    }
  ];

  // Filter tabs based on permissions
  const tabs = allTabs.filter(tab => {
    if (tab.id === 'upload') {
      return canUploadWebsite;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <LeftNavbar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        
        {/* Hero Section - Mobile Optimized */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3 sm:mb-4">
                  <ServerIcon className="h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-3 flex-shrink-0" />
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
                    Website Hosting
                  </h1>
                </div>
                <p className="text-indigo-100 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 max-w-2xl leading-relaxed">
                  Deploy your websites to adbix with automatic scaling, high availability, and global CDN distribution
                </p>
                <div className="text-indigo-100 text-xs sm:text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 flex-shrink-0"></div>
                    <span className="truncate">Connected to {mobileNumber}</span>
                  </div>
                </div>
              </div>
              
              {/* Stats Cards - Mobile Responsive */}
              <div className="mt-6 sm:mt-8 lg:mt-0 lg:ml-8">
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold">99.9%</div>
                    <div className="text-xs sm:text-sm text-indigo-100">Uptime</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Tab Navigation - Same layout for mobile and desktop */}
          <div className="bg-white shadow-lg rounded-2xl overflow-hidden mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex flex-wrap">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group flex-1 min-w-0 px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                        <span className="text-center leading-tight text-xs sm:text-sm">{tab.label}</span>
                      </div>
                      <div className={`mt-1 text-xs ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400'} hidden lg:block text-center`}>
                        {tab.description}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content with Enhanced Styling - Mobile Responsive */}
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Upload Tab */}
              {activeTab === 'upload' && canUploadWebsite && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <CloudArrowUpIcon className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Website</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      Upload your ZIP file containing your website files. We'll automatically extract and deploy it to adbix with proper structure validation.
                    </p>
                  </div>
                  <S3WebsiteUpload />
                </div>
              )}

              {/* Access Denied for Upload */}
              {activeTab === 'upload' && !canUploadWebsite && (
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                      You don't have permission to upload websites. Please contact your administrator for access.
                    </p>
                    <button
                      onClick={() => setActiveTab('preview')}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                      Go to Preview
                    </button>
                  </div>
                </div>
              )}

              {/* Preview Tab */}
              {activeTab === 'preview' && (
                <div className="space-y-6">
                  {mobileNumber && hasWebsiteFiles ? (
                    <div className="space-y-6">
                      {/* Preview Controls - Mobile Responsive */}
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div className="flex items-start space-x-3">
                          <DocumentDuplicateIcon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Website Preview</h2>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                              <p className="text-xs sm:text-sm text-gray-600">Live preview of your website <span className="text-xs text-gray-500 font-normal">(CDN bypass)</span></p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                          {/* Mobile/Desktop Toggle - Desktop only visible on larger screens */}
                          <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                              onClick={() => setIsMobileView(false)}
                              className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                                !isMobileView
                                  ? 'bg-white text-indigo-600 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              <ComputerDesktopIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 inline" />
                              Desktop
                            </button>
                            <button
                              onClick={() => setIsMobileView(true)}
                              className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                                isMobileView
                                  ? 'bg-white text-indigo-600 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              <DevicePhoneMobileIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 inline" />
                              Mobile
                            </button>
                          </div>
                          
                          <div className="flex space-x-2 sm:space-x-3">
                            {/* Refresh Button */}
                            <button
                              onClick={refreshPreview}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm"
                              title="Refresh preview from S3"
                            >
                              <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span className="hidden sm:inline">Refresh</span>
                              <span className="sm:hidden">Sync</span>
                            </button>


                          </div>
                        </div>
                      </div>
                      
                      {/* Preview Container - Mobile Responsive */}
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg">
                        <div className="p-1 sm:p-2 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full"></div>
                              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full"></div>
                              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full"></div>
                            </div>
                            <div className="flex-1 text-center">
                              <div className="text-xs text-gray-500 bg-white rounded px-2 sm:px-3 py-1 inline-block max-w-full truncate">
                                <span className="hidden sm:inline">
                                  sites/{mobileNumber}/index.html
                                </span>
                                <span className="sm:hidden">
                                  sites/{mobileNumber}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Preview Content - Mobile Responsive */}
                        <div className="flex justify-center bg-gray-100 p-2 sm:p-4 lg:p-6" style={{ minHeight: isMobileView ? '400px' : '600px' }}>
                          <div 
                            className={`transition-all duration-300 ${
                              isMobileView 
                                ? 'w-full max-w-[320px] sm:max-w-[375px] h-[500px] sm:h-[667px]' 
                                : 'w-full h-full max-w-5xl bg-white rounded-lg shadow-lg overflow-hidden'
                            }`}
                          >
                            {/* Mobile Device Frame - Responsive */}
                            {isMobileView && (
                              <div className="relative w-full h-full">
                                {/* Phone Body */}
                                <div className="w-full h-full bg-gray-900 rounded-[1.5rem] sm:rounded-[2.5rem] p-1 sm:p-2 shadow-xl">
                                  {/* Screen Bezel */}
                                  <div className="w-full h-full bg-black rounded-[1.2rem] sm:rounded-[2rem] p-0.5 sm:p-1">
                                    {/* Screen */}
                                    <div className="w-full h-full bg-white rounded-[1rem] sm:rounded-[1.8rem] overflow-hidden relative">
                                      {/* Status Bar */}
                                      <div className="absolute top-0 left-0 right-0 h-4 sm:h-6 bg-black text-white flex items-center justify-between px-3 sm:px-6 z-10">
                                        <div className="flex items-center space-x-1">
                                          <span className="text-xs font-medium">9:41</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <div className="w-3 h-1.5 sm:w-4 sm:h-2 border border-white rounded-sm">
                                            <div className="w-2 h-0.5 sm:w-3 sm:h-1 bg-white rounded-sm m-0.5"></div>
                                          </div>
                                          <svg className="w-3 h-2 sm:w-4 sm:h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M2 17h20v2H2zm1.15-4.05L4 11l-.85 1.95L1.2 13l1.95-.85L4 10.2l.85 1.95L6.8 13l-1.95-.85z"/>
                                          </svg>
                                        </div>
                                      </div>

                                      {/* Home Indicator */}
                                      <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-0.5 sm:w-24 sm:h-1 bg-black rounded-full"></div>

                                      {/* Content Area */}
                                      <div className="w-full h-full pt-4 pb-2 sm:pt-6 sm:pb-4">
                                        <iframe
                                          src={getDirectS3Url(mobileNumber, 'index.html')}
                                          className="w-full h-full border-0"
                                          title="Mobile Website Preview"
                                          loading="lazy"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Desktop Frame - Mobile Responsive */}
                            {!isMobileView && (
                              <div className="relative w-full h-[400px] sm:h-[600px]">
                                <iframe
                                  src={getDirectS3Url(mobileNumber, 'index.html')}
                                  className="w-full h-full border-0"
                                  title="Desktop Website Preview"
                                  loading="lazy"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      

                    </div>
                  ) : checkingFiles ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Checking Website Files...</h3>
                      <p className="text-gray-600">Please wait while we check your website files.</p>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
                      <div className="text-6xl mb-6">🚀</div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Build Your Website?</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Get started quickly by importing a professional template or upload your own website files.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-sm mx-auto">
                        <Link
                          href="/templates"
                          className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold w-full sm:w-auto"
                        >
                          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Import from Template
                        </Link>
                        
                        {canUploadWebsite && (
                          <span className="text-gray-400 text-sm">or</span>
                        )}
                        
                        {canUploadWebsite && (
                          <button
                            onClick={() => setActiveTab('upload')}
                            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold w-full sm:w-auto"
                          >
                            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                            Upload Website
                          </button>
                        )}
                      </div>
                      
                      <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200 max-w-md mx-auto">
                        <p className="text-sm text-blue-700">
                          <strong>💡 Tip:</strong> Templates are pre-built, professional websites that you can customize. 
                          They're perfect for getting started quickly!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Files Tab */}
              {activeTab === 'files' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <FolderIcon className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">adbix File Manager</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      Manage your website files directly on adbix. Upload, delete, organize, and modify files with our powerful file manager.
                    </p>
                  </div>
                  <S3FileManager />
                </div>
              )}

              {/* My Images Tab */}
              {activeTab === 'my-images' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <PhotoIcon className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Image Gallery</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      Manage your image collection with advanced features like cropping, resizing, and optimization for web delivery.
                    </p>
                  </div>
                  <MyImages />
                </div>
              )}

              {/* Access Tab - Enhanced Design */}
              {activeTab === 'access' && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <LinkIcon className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Website Access URLs</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      Access your website through multiple endpoints. Choose the best option for your needs.
                    </p>
                  </div>

                  <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
                    {/* Your website url - Mobile Responsive */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 sm:p-6">
                      <div className="flex items-center mb-3 sm:mb-4">
                        <div className="bg-green-500 rounded-lg p-2 mr-2 sm:mr-3 flex-shrink-0">
                          <GlobeAltIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Your website url</h3>
                      </div>
                      <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
                        Access through our application with additional features like analytics and caching.
                      </p>
                      <div className="space-y-3 mb-3 sm:mb-4">
                        <div className="bg-white p-3 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-700">Direct Proxy:</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/site/${mobileNumber}/index.html`)}
                              className="text-green-600 hover:text-green-500 text-xs px-2 py-1 bg-green-100 rounded"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="bg-green-50 p-2 rounded overflow-hidden">
                            <code className="text-xs text-green-700 font-mono break-all block">
                              <span className="hidden sm:inline">
                                {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/site/{mobileNumber}/index.html
                              </span>
                              <span className="sm:hidden">
                                adbix.com/site/{mobileNumber}
                              </span>
                            </code>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {mobileNumber && (
                          <a 
                            href={`/site/${mobileNumber}/index.html`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Open Direct Link</span>
                            <span className="sm:hidden">Open</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* QR Code Generator - Mobile Responsive */}
                    {mobileNumber && (
                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4 sm:p-6">
                        <div className="flex items-center mb-3 sm:mb-4">
                          <div className="bg-indigo-500 rounded-lg p-2 mr-2 sm:mr-3 flex-shrink-0">
                            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                            </svg>
                          </div>
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Visit to: {userProfile?.businessName || userProfile?.name || 'My Website'}</h3>
                        </div>
                        <QRCodeGenerator 
                          url={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/site/${mobileNumber}/index.html`}
                          logoUrl="/favicon_io/android-chrome-512x512.png"
                          businessName={userProfile?.businessName || userProfile?.name || 'My Website'}
                          size={400}
                        />
                      </div>
                    )}
                  </div>

                  {/* Additional Info - Mobile Responsive */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6">
                    <div className="flex items-start">
                      <div className="bg-amber-500 rounded-lg p-2 mr-3 mt-0.5 flex-shrink-0">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-semibold text-amber-900 mb-2">Access Information</h4>
                        <ul className="text-amber-800 text-xs sm:text-sm space-y-2">
                          <li className="flex items-start">
                            <span className="text-amber-600 mr-2 flex-shrink-0">•</span>
                            <span><strong>QR Code Usage:</strong> Download and print the QR code to display in your shop, business cards, flyers, or any marketing materials for easy customer access</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 