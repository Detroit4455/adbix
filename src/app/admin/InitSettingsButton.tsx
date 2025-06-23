'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InitializeSettingsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
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
        onClick={initializeSettings}
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
    </div>
  );
} 