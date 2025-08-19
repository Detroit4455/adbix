'use client';

import { useState, useEffect } from 'react';

interface ServerSettings {
  maxImagesPerUser: number;
  allowNewUserRegistration: boolean;
  enableTrialPeriod: boolean;
  trialPeriodDays: number;
  trialDescription: string;
  createdAt: string;
  updatedAt: string;
}

export default function ServerSettingsForm() {
  const [settings, setSettings] = useState<ServerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [maxImagesPerUser, setMaxImagesPerUser] = useState<number>(50);
  const [allowNewUserRegistration, setAllowNewUserRegistration] = useState<boolean>(true);
  const [enableTrialPeriod, setEnableTrialPeriod] = useState<boolean>(false);
  const [trialPeriodDays, setTrialPeriodDays] = useState<number>(30);
  const [trialDescription, setTrialDescription] = useState<string>('Free trial period for new subscriptions');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/server-settings');
      const data = await response.json();

      if (response.ok) {
        setSettings(data);
        setMaxImagesPerUser(data.maxImagesPerUser);
        setAllowNewUserRegistration(data.allowNewUserRegistration ?? true);
        setEnableTrialPeriod(data.enableTrialPeriod ?? false);
        setTrialPeriodDays(data.trialPeriodDays ?? 30);
        setTrialDescription(data.trialDescription ?? 'Free trial period for new subscriptions');
      } else {
        setError(data.error || 'Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const requestData = { 
        maxImagesPerUser,
        allowNewUserRegistration,
        enableTrialPeriod,
        trialPeriodDays,
        trialDescription
      };
      
      console.log('Sending server settings update request:', requestData);

      const response = await fetch('/api/admin/server-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      console.log('Server settings API response:', { status: response.status, data });

      if (response.ok) {
        setSettings(data);
        console.log('Settings updated in component state:', data);
        setSuccess('Settings saved successfully!');
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">Loading server settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Server Configuration</h2>
            <p className="text-indigo-100 text-sm">Manage server-wide settings and limits</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
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
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
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

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Upload Limits */}
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Image Upload Limits</h3>
                
                <div>
                  <label htmlFor="maxImagesPerUser" className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Images Per User
                  </label>
                  <input
                    type="number"
                    id="maxImagesPerUser"
                    min="1"
                    max="1000"
                    value={maxImagesPerUser}
                    onChange={(e) => setMaxImagesPerUser(parseInt(e.target.value) || 1)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Set the maximum number of images each user can upload to their "My Images" folder. Range: 1-1000 images.
                  </p>
                </div>
              </div>

              {/* User Registration Control */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Registration Control</h3>
                
                <div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allowNewUserRegistration"
                      checked={allowNewUserRegistration}
                      onChange={(e) => setAllowNewUserRegistration(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allowNewUserRegistration" className="ml-2 block text-sm font-medium text-gray-700">
                      Allow New User Registration
                    </label>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    When enabled, new users can create accounts. When disabled, only existing users can log in.
                  </p>
                </div>
              </div>

              {/* Trial Period Configuration */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🎁 Trial Period Configuration</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableTrialPeriod"
                        checked={enableTrialPeriod}
                        onChange={(e) => setEnableTrialPeriod(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="enableTrialPeriod" className="ml-2 block text-sm font-medium text-gray-700">
                        Enable Trial Period for New Subscriptions
                      </label>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      When enabled, new subscriptions will start with a free trial period before charging begins.
                    </p>
                  </div>

                  {enableTrialPeriod && (
                    <>
                      <div>
                        <label htmlFor="trialPeriodDays" className="block text-sm font-medium text-gray-700 mb-2">
                          Trial Period Duration (Days)
                        </label>
                        <select
                          id="trialPeriodDays"
                          value={trialPeriodDays}
                          onChange={(e) => setTrialPeriodDays(parseInt(e.target.value))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value={1}>1 day</option>
                          <option value={7}>7 days</option>
                          <option value={14}>14 days</option>
                          <option value={30}>30 days (1 month)</option>
                          <option value={60}>60 days (2 months)</option>
                          <option value={90}>90 days (3 months)</option>
                        </select>
                        <p className="mt-2 text-sm text-gray-500">
                          Number of days users get free access before first payment is charged.
                        </p>
                      </div>

                      <div>
                        <label htmlFor="trialDescription" className="block text-sm font-medium text-gray-700 mb-2">
                          Trial Description
                        </label>
                        <textarea
                          id="trialDescription"
                          value={trialDescription}
                          onChange={(e) => setTrialDescription(e.target.value)}
                          rows={3}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Free trial period for new subscriptions"
                        />
                        <p className="mt-2 text-sm text-gray-500">
                          Description shown to users about the trial period.
                        </p>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-0.5">ℹ️</span>
                          <div className="text-sm text-blue-700">
                            <p className="font-medium mb-1">Trial Period Details:</p>
                            <ul className="space-y-1 text-sm">
                              <li>• Users get {trialPeriodDays} days of free access</li>
                              <li>• UPI Autopay mandate is set up during trial</li>
                              <li>• First payment automatically charged after trial ends</li>
                              <li>• Users can cancel anytime during trial with no charges</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Current Settings Display */}
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Settings</h3>
                
                {settings && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-600">Max Images Per User:</span>
                      <span className="text-sm font-semibold text-gray-900">{settings.maxImagesPerUser}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-600">New User Registration:</span>
                      <span className={`text-sm font-semibold ${settings.allowNewUserRegistration ? 'text-green-600' : 'text-red-600'}`}>
                        {settings.allowNewUserRegistration ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-600">Trial Period:</span>
                      <span className={`text-sm font-semibold ${settings.enableTrialPeriod ? 'text-green-600' : 'text-gray-600'}`}>
                        {settings.enableTrialPeriod ? `${settings.trialPeriodDays} days` : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-600">Last Updated:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(settings.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 