'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function LeftNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);

  if (!session) {
    return null;
  }

  const isActive = (path: string) => pathname === path;
  const isToolsActive = pathname.startsWith('/tools') || pathname === '/image_repo';

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 z-40 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-center p-4 border-b border-gray-200">
        <div className="relative group">
          <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 transform group-hover:scale-105">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-4 px-2">
        <div className="space-y-1">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/dashboard')
                ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700'
                : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            Dashboard
          </Link>

          {/* S3 Hosting */}
          <Link
            href="/web_on_s3"
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/web_on_s3')
                ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700'
                : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            S3 Hosting
          </Link>

          {/* Widgets */}
          <Link
            href="/widgets"
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/widgets')
                ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700'
                : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Widgets
          </Link>

          {/* Tools Section */}
          <div>
            <button
              onClick={() => setIsToolsExpanded(!isToolsExpanded)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isToolsActive
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Tools
              </div>
              <svg 
                className={`h-4 w-4 transition-transform ${isToolsExpanded ? 'rotate-90' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Tools Submenu */}
            {isToolsExpanded && (
              <div className="ml-8 mt-1 space-y-1">
                <Link
                  href="/tools"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/tools')
                      ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-700'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  All Tools
                </Link>
                <Link
                  href="/image_repo"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/image_repo')
                      ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-700'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Image Repository
                </Link>
              </div>
            )}
          </div>

          {/* How To */}
          <Link
            href="/howto"
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/howto')
                ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700'
                : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How To
          </Link>

          {/* Admin (if admin role) */}
          {session.user.role === 'admin' && (
            <Link
              href="/admin"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith('/admin')
                  ? 'bg-red-50 text-red-700 border-r-2 border-red-700'
                  : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
} 