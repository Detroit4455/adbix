'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LeftNavbar from '@/components/LeftNavbar';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function ToolsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  const tools = [
    {
      id: 'image_repo',
      name: 'Image Repository',
      description: 'Manage and organize your images for use across your websites. Upload, view, and organize your image assets.',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '/image_repo',
      color: 'from-green-400 to-blue-500',
      hoverColor: 'hover:from-green-500 hover:to-blue-600'
    },
    {
      id: 'file_manager',
      name: 'File Manager',
      description: 'Manage your website files, upload new content, and organize your site structure.',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5h8" />
        </svg>
      ),
      href: '/file-manager',
      color: 'from-purple-400 to-pink-500',
      hoverColor: 'hover:from-purple-500 hover:to-pink-600',
      comingSoon: true
    },
    {
      id: 'code_editor',
      name: 'Code Editor',
      description: 'Edit your website code directly in the browser with syntax highlighting and live preview.',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      href: '/code-editor',
      color: 'from-yellow-400 to-orange-500',
      hoverColor: 'hover:from-yellow-500 hover:to-orange-600',
      comingSoon: true
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'Track your website performance, visitor statistics, and engagement metrics.',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/analytics',
      color: 'from-indigo-400 to-purple-500',
      hoverColor: 'hover:from-indigo-500 hover:to-purple-600',
      comingSoon: true
    },
    {
      id: 'seo_tools',
      name: 'SEO Tools',
      description: 'Optimize your website for search engines with meta tags, sitemaps, and SEO analysis.',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      href: '/seo-tools',
      color: 'from-red-400 to-pink-500',
      hoverColor: 'hover:from-red-500 hover:to-pink-600',
      comingSoon: true
    },
    {
      id: 'backup_restore',
      name: 'Backup & Restore',
      description: 'Create backups of your websites and restore them when needed. Keep your data safe.',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ),
      href: '/backup-restore',
      color: 'from-teal-400 to-cyan-500',
      hoverColor: 'hover:from-teal-500 hover:to-cyan-600',
      comingSoon: true
    },
    {
      id: 'website_administrator',
      name: 'Website Administrator',
      description: 'Create and manage business website templates. Select your business type and customize your website settings.',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      href: '/website-administrator',
      color: 'from-rose-400 to-pink-500',
      hoverColor: 'hover:from-rose-500 hover:to-pink-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <LeftNavbar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        
        {/* Hero Section - Mobile Optimized */}
        <div className="bg-gradient-to-br from-cyan-900 to-black text-white relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl animate-pulse"></div>
            <div className="absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl animate-pulse"></div>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3 sm:mb-4">
                  <svg className="h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
                    Tools
                  </h1>
                </div>
                <p className="text-cyan-100 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 max-w-2xl leading-relaxed">
                  Powerful tools to help you build, manage, and optimize your websites
                </p>
              </div>
              
              {/* Stats Cards - Mobile Responsive */}
              <div className="mt-6 sm:mt-8 lg:mt-0 lg:ml-8">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold">{tools.length}</div>
                    <div className="text-xs sm:text-sm text-cyan-100">Tools</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold">1</div>
                    <div className="text-xs sm:text-sm text-cyan-100">Available</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <div key={tool.id} className="relative group">
                {tool.comingSoon ? (
                  <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 opacity-75 cursor-not-allowed">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${tool.color} text-white opacity-50`}>
                        {tool.icon}
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                        Coming Soon
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">{tool.name}</h3>
                    <p className="text-gray-400 text-sm">{tool.description}</p>
                  </div>
                ) : (
                  <Link href={tool.href}>
                    <div className={`bg-white rounded-xl shadow-md hover:shadow-xl p-6 border border-gray-200 transition-all duration-300 transform hover:scale-105 cursor-pointer group`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${tool.color} ${tool.hoverColor} text-white transition-all duration-300`}>
                          {tool.icon}
                        </div>
                        <svg className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-gray-600 text-sm">{tool.description}</p>
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Featured Tool Section */}
          <div className="mt-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold mb-4">Get Started with Image Repository</h2>
              <p className="text-lg opacity-90 mb-6">
                Organize all your images in one place. Upload, manage, and use your images across all your websites with our powerful Image Repository tool.
              </p>
              <Link href="/image_repo">
                <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Try Image Repository →
                </button>
              </Link>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-12 bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              Check out our documentation and tutorials to get the most out of these tools.
            </p>
            <div className="flex space-x-4">
              <Link href="/howto">
                <button className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
                  View Tutorials
                </button>
              </Link>
              <button className="bg-gray-50 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 