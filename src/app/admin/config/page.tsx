'use client';

import { useState } from 'react';
import ServerSettingsForm from '@/components/ServerSettingsForm';

export default function AdminConfigPage() {
  const [activeTab, setActiveTab] = useState('server-settings');

  const tabs = [
    { id: 'server-settings', label: 'Server Settings', icon: '⚙️' },
    { id: 'storage', label: 'Storage Settings', icon: '💾' },
    { id: 'security', label: 'Security Settings', icon: '🔒' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
          <p className="text-gray-600 mt-2">Manage system-wide settings and configurations</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white shadow rounded-xl overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Server Settings Tab */}
            {activeTab === 'server-settings' && (
              <div>
                <ServerSettingsForm />
              </div>
            )}

            {/* Storage Settings Tab */}
            {activeTab === 'storage' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Storage Settings</h3>
                  <p className="text-gray-500">Storage configuration options coming soon...</p>
                </div>
              </div>
            )}

            {/* Security Settings Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Security Settings</h3>
                  <p className="text-gray-500">Security configuration options coming soon...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back to Admin Button */}
        <div className="flex justify-start">
          <a
            href="/admin"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
} 