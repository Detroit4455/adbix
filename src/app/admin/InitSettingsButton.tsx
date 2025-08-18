'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InitializeSettingsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const router = useRouter();

  const initializeSettings = async () => {
    setIsLoading(true);
    setSuccess('');
    setError('');

    try {
      const response = await fetch('/api/admin/initialize-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize settings');
      }

      setSuccess('Settings initialized successfully');
      setShowConfirm(false);
      setConfirmText('');
      router.refresh(); // Refresh the page to update any data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isLoading}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {isLoading ? 'Initializing...' : 'Initialize System Settings'}
      </button>

      {success && (
        <div className="mt-2 text-sm text-green-600">
          {success}
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset Roles to Defaults?</h3>
            <p className="text-sm text-gray-700 mb-4">
              This action will overwrite your custom role list with the default roles
              <span className="font-medium"> [admin, user, devops, manager] </span>
              and update timestamps. It will not change RBAC permissions or user accounts.
            </p>
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-800">
                To confirm, type <span className="font-semibold">RESETROLE</span> in the box below.
              </p>
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type RESETROLE to proceed"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => { setShowConfirm(false); setConfirmText(''); }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={initializeSettings}
                disabled={isLoading || confirmText.trim() !== 'RESETROLE'}
                className={`px-4 py-2 rounded-md text-white ${isLoading || confirmText.trim() !== 'RESETROLE' ? 'bg-red-300' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isLoading ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 