'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface DefaultBusinessData {
  business_info: {
    name: string;
    tagline: string;
    description: string;
    category: string;
  };
  contact_details: {
    phone: string;
    email: string;
    address: string;
    website: string;
  };
  hours_of_operation: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  social_media: {
    instagram: string;
    facebook: string;
    linkedin: string;
    twitter: string;
  };
  services: Array<{
    name: string;
    description: string;
    features: string[];
  }>;
  team: Array<{
    name: string;
    position: string;
    bio: string;
    image_url: string;
  }>;
}

const defaultBusinessData: DefaultBusinessData = {
  business_info: {
    name: "",
    tagline: "",
    description: "",
    category: ""
  },
  contact_details: {
    phone: "",
    email: "",
    address: "",
    website: ""
  },
  hours_of_operation: {
    monday: "9:00 AM - 5:00 PM",
    tuesday: "9:00 AM - 5:00 PM",
    wednesday: "9:00 AM - 5:00 PM",
    thursday: "9:00 AM - 5:00 PM",
    friday: "9:00 AM - 5:00 PM",
    saturday: "10:00 AM - 4:00 PM",
    sunday: "Closed"
  },
  social_media: {
    instagram: "",
    facebook: "",
    linkedin: "",
    twitter: ""
  },
  services: [],
  team: []
};

const navigationItems = [
  { id: 'business-info', label: 'Business Info', icon: '🏢' },
  { id: 'contact-details', label: 'Contact Details', icon: '📞' },
  { id: 'hours', label: 'Operating Hours', icon: '⏰' },
  { id: 'services', label: 'Services', icon: '🔧' },
  { id: 'team', label: 'Team', icon: '👥' },
  { id: 'social-media', label: 'Social Media', icon: '📱' }
];

interface DefaultBusinessAdministratorProps {
  businessCategory: string;
}

export default function DefaultBusinessAdministrator({ businessCategory }: DefaultBusinessAdministratorProps) {
  const { data: session } = useSession();
  const [businessData, setBusinessData] = useState<DefaultBusinessData>(defaultBusinessData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeSection, setActiveSection] = useState('business-info');

  useEffect(() => {
    if (session?.user?.mobileNumber && businessCategory) {
      loadUserSettings();
      // Set the business category in the data
      setBusinessData(prev => ({
        ...prev,
        business_info: {
          ...prev.business_info,
          category: businessCategory
        }
      }));
    }
  }, [session, businessCategory]);

  const loadUserSettings = async () => {
    if (!session?.user?.mobileNumber) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user-settings?mobileNumber=${session.user.mobileNumber}&businessType=${businessCategory}`);
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setBusinessData(data.settings);
        }
      }
    } catch (error) {
      console.error('Error loading business settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserSettings = async () => {
    if (!session?.user?.mobileNumber) return;
    
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const response = await fetch('/api/user-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobileNumber: session.user.mobileNumber,
          businessType: businessCategory,
          settings: businessData
        }),
      });

      if (response.ok) {
        setSaveMessage('Settings saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Error saving settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (path: string, value: any) => {
    setBusinessData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const addService = () => {
    const newService = {
      name: 'New Service',
      description: '',
      features: []
    };
    setBusinessData(prev => ({
      ...prev,
      services: [...prev.services, newService]
    }));
  };

  const removeService = (index: number) => {
    setBusinessData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const renderBusinessInfo = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
          <input
            type="text"
            value={businessData.business_info.name}
            onChange={(e) => updateField('business_info.name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
          <input
            type="text"
            value={businessData.business_info.tagline}
            onChange={(e) => updateField('business_info.tagline', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
          <textarea
            rows={4}
            value={businessData.business_info.description}
            onChange={(e) => updateField('business_info.description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Describe your business, what you do, and what makes you unique..."
          />
        </div>
      </div>
    </div>
  );

  const renderContactDetails = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <input
            type="text"
            value={businessData.contact_details.phone}
            onChange={(e) => updateField('contact_details.phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={businessData.contact_details.email}
            onChange={(e) => updateField('contact_details.email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
          <input
            type="url"
            value={businessData.contact_details.website}
            onChange={(e) => updateField('contact_details.website', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="https://www.yourwebsite.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <textarea
            rows={3}
            value={businessData.contact_details.address}
            onChange={(e) => updateField('contact_details.address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Services</h3>
        <button
          onClick={addService}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Add Service
        </button>
      </div>
      
      <div className="space-y-4">
        {businessData.services.map((service, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Name</label>
                <input
                  type="text"
                  value={service.name}
                  onChange={(e) => updateField(`services.${index}.name`, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={service.description}
                  onChange={(e) => updateField(`services.${index}.description`, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => removeService(index)}
                  className="text-red-600 hover:text-red-800 px-2 py-1"
                >
                  Remove Service
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {businessData.services.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No services added yet. Click "Add Service" to get started.</p>
        </div>
      )}
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'contact-details':
        return renderContactDetails();
      case 'services':
        return renderServices();
      default:
        return renderBusinessInfo();
    }
  };

  const getCategoryDisplayName = () => {
    return businessCategory.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-900">
          {getCategoryDisplayName()} Administrator
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage your {getCategoryDisplayName().toLowerCase()} business information and settings
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`${
                activeSection === item.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading business data...</div>
          </div>
        ) : (
          renderActiveSection()
        )}
      </div>

      {/* Save Button */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
        <div className="flex items-center justify-between">
          <div>
            {saveMessage && (
              <span className={`text-sm ${saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {saveMessage}
              </span>
            )}
          </div>
          <button
            onClick={saveUserSettings}
            disabled={isSaving}
            className={`px-6 py-2 bg-indigo-600 text-white rounded-md font-medium transition-colors ${
              isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}
