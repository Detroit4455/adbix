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
import Link from 'next/link';
import { 
  CloudArrowUpIcon, 
  DocumentDuplicateIcon, 
  FolderIcon, 
  PhotoIcon, 
  LinkIcon,
  ServerIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

export default function WebOnS3Page() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('upload');
  const [isTabsCollapsed, setIsTabsCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsTabsCollapsed(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (status === 'loading') {
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

  const mobileNumber = session.user?.mobileNumber || '';

  const tabs = [
    { 
      id: 'upload', 
      label: 'Upload Website', 
      icon: CloudArrowUpIcon,
      description: 'Upload your website files to S3'
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
      description: 'Manage your S3 website files'
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <LeftNavbar />
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
        <Navbar />
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <ServerIcon className="h-10 w-10 mr-3" />
                  <h1 className="text-3xl md:text-4xl font-bold">S3 Website Hosting</h1>
                </div>
                <p className="text-indigo-100 text-lg mb-6 max-w-2xl">
                  Deploy your static websites to Amazon S3 with automatic scaling, high availability, and global CDN distribution
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/websiteManager" 
                    className="inline-flex items-center bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-lg font-medium transition-colors shadow-lg"
                  >
                    <GlobeAltIcon className="h-5 w-5 mr-2" />
                    View All Websites
                                         <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
                  </Link>
                  <div className="text-indigo-100 text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      Connected to {mobileNumber}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="mt-8 lg:mt-0 lg:ml-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">∞</div>
                    <div className="text-sm text-indigo-100">Storage</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">99.9%</div>
                    <div className="text-sm text-indigo-100">Uptime</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Tab Navigation */}
          <div className="bg-white shadow-lg rounded-2xl overflow-hidden mb-8">
            {/* Mobile Tab Selector */}
            {isTabsCollapsed ? (
              <div className="p-4 border-b border-gray-200">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {tabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="border-b border-gray-200">
                <nav className="flex flex-wrap">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`group flex-1 min-w-0 px-4 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <Icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                          <span className="hidden sm:inline">{tab.label}</span>
                        </div>
                        <div className={`mt-1 text-xs ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400'} hidden lg:block`}>
                          {tab.description}
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}

            {/* Tab Content with Enhanced Styling */}
            <div className="p-6 lg:p-8">
              {/* Upload Tab */}
              {activeTab === 'upload' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <CloudArrowUpIcon className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Website</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      Upload your ZIP file containing your website files. We'll automatically extract and deploy it to S3 with proper structure validation.
                    </p>
                  </div>
                  <S3WebsiteUpload />
                </div>
              )}

              {/* Preview Tab */}
              {activeTab === 'preview' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <DocumentDuplicateIcon className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Website Preview & Editor</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      Preview your website and make real-time edits with our integrated editor and live preview system.
                    </p>
                  </div>
                  {mobileNumber ? (
                    <WebsitePreview mobileNumber={mobileNumber} />
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <div className="text-6xl mb-4">📁</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Website Found</h3>
                      <p className="text-gray-600 mb-4">Upload a website first to see the preview.</p>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                        Upload Website
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Files Tab */}
              {activeTab === 'files' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <FolderIcon className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">S3 File Manager</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      Manage your website files directly on S3. Upload, delete, organize, and modify files with our powerful file manager.
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

                  <div className="grid gap-8 md:grid-cols-2">
                    {/* Amazon S3 Direct Access */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                      <div className="flex items-center mb-4">
                        <div className="bg-blue-500 rounded-lg p-2 mr-3">
                          <ServerIcon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">Amazon S3 Direct</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        Direct access to your website hosted on Amazon S3 infrastructure with global CDN delivery.
                      </p>
                      
                      <div className="bg-white p-4 rounded-lg border mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">S3 URL:</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(`https://dt-web-sites.s3.ap-south-1.amazonaws.com/sites/${mobileNumber}/index.html`)}
                            className="text-blue-600 hover:text-blue-500 text-sm"
                          >
                            Copy
                          </button>
                        </div>
                        <code className="text-sm text-blue-700 font-mono break-all block bg-blue-50 p-2 rounded">
                          https://dt-web-sites.s3.ap-south-1.amazonaws.com/sites/{mobileNumber}/index.html
                        </code>
                      </div>
                      
                      {mobileNumber && (
                        <a 
                          href={`https://dt-web-sites.s3.ap-south-1.amazonaws.com/sites/${mobileNumber}/index.html`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                                                     <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                           Open S3 Website
                        </a>
                      )}
                    </div>

                    {/* Next.js Proxy Access */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center mb-4">
                        <div className="bg-green-500 rounded-lg p-2 mr-3">
                          <GlobeAltIcon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">Application Proxy</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        Access through our application with additional features like analytics and caching.
                      </p>
                      
                      <div className="space-y-3 mb-4">
                        <div className="bg-white p-3 rounded-lg border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">Direct Proxy:</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/site/${mobileNumber}/index.html`)}
                              className="text-green-600 hover:text-green-500 text-xs"
                            >
                              Copy
                            </button>
                          </div>
                          <code className="text-xs text-green-700 font-mono break-all block bg-green-50 p-2 rounded">
                            {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/site/{mobileNumber}/index.html
                          </code>
                        </div>

                        <div className="bg-white p-3 rounded-lg border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">Site Viewer:</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/site-viewer/${mobileNumber}?path=index.html`)}
                              className="text-green-600 hover:text-green-500 text-xs"
                            >
                              Copy
                            </button>
                          </div>
                          <code className="text-xs text-green-700 font-mono break-all block bg-green-50 p-2 rounded">
                            {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/site-viewer/{mobileNumber}?path=index.html
                          </code>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        {mobileNumber && (
                          <>
                            <a 
                              href={`/site/${mobileNumber}/index.html`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                                                             <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                               Direct
                             </a>
                             <a 
                               href={`/site-viewer/${mobileNumber}?path=index.html`}
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="inline-flex items-center bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                             >
                               <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                               Viewer
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <div className="flex items-start">
                      <div className="bg-amber-500 rounded-lg p-2 mr-3 mt-1">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-amber-900 mb-2">Access Information</h4>
                        <ul className="text-amber-800 text-sm space-y-1">
                          <li>• <strong>S3 Direct:</strong> Faster loading, direct from AWS infrastructure</li>
                          <li>• <strong>Application Proxy:</strong> Additional features like analytics and caching</li>
                          <li>• <strong>Site Viewer:</strong> Enhanced interface with debugging tools</li>
                          <li>• All URLs are automatically updated when you upload new files</li>
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