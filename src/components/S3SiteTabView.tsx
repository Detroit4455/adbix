'use client';

import { useState } from 'react';
import S3SiteViewer from '@/components/S3SiteViewer';
import WebsiteConfigEditor from '@/components/WebsiteConfigEditor';

interface S3SiteTabViewProps {
  userId: string;
  initialPath: string;
}

export default function S3SiteTabView({ userId, initialPath }: S3SiteTabViewProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'components'>('files');

  return (
    <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center py-3 px-6 focus:outline-none ${
            activeTab === 'files'
              ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px font-medium'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Files and Directories
        </button>
        
        <button
          onClick={() => setActiveTab('components')}
          className={`flex items-center py-3 px-6 focus:outline-none ${
            activeTab === 'components'
              ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px font-medium'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
          Website Components
        </button>
      </div>

      {/* Tab Content */}
      <div className="relative">
        {/* Files Tab */}
        <div className={`${activeTab === 'files' ? 'block' : 'hidden'}`}>
          <div className="bg-gray-50 p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Files and Directories</h2>
              <a 
                href={`https://dt-web-sites.s3.ap-south-1.amazonaws.com/sites/${userId}/index.html`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                View Live Site
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Browse and manage the files in your S3 site
            </p>
          </div>
          
          <S3SiteViewer userId={userId} initialPath={initialPath} />
        </div>

        {/* Components Tab */}
        <div className={`${activeTab === 'components' ? 'block' : 'hidden'}`}>
          <div className="bg-gray-50 p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Website Components</h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure your website structure and appearance
            </p>
          </div>
          
          <WebsiteConfigEditor userId={userId} />
        </div>
      </div>
    </div>
  );
} 