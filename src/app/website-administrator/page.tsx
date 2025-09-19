'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LeftNavbar from '@/components/LeftNavbar';
import Navbar from '@/components/Navbar';

// Import business category specific components
import RestaurantAdministrator from '@/components/business-categories/RestaurantAdministrator';
import BeautySalonAdministrator from '@/components/business-categories/BeautySalonAdministrator';

interface BusinessCategory {
  id: string;
  name: string;
  description?: string;
}

export default function WebsiteAdministratorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBusinessCategory, setSelectedBusinessCategory] = useState('');
  const [businessCategories, setBusinessCategories] = useState<BusinessCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Load user profile and business categories
  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
      fetchBusinessCategories();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.profile);
        // Set initial business category from user profile
        if (data.profile.businessCategory) {
          setSelectedBusinessCategory(data.profile.businessCategory.toLowerCase().replace(/\s+/g, '-'));
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchBusinessCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch('/api/business-categories');
      if (response.ok) {
        const data = await response.json();
        setBusinessCategories(data.categories);
        
        // If no category selected and user has no business category, default to first available
        if (!selectedBusinessCategory && data.categories.length > 0) {
          setSelectedBusinessCategory(data.categories[0].name.toLowerCase().replace(/\s+/g, '-'));
        }
      }
    } catch (error) {
      console.error('Error fetching business categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Handle business category change
  const handleBusinessCategoryChange = (categoryName: string) => {
    const normalizedCategory = categoryName.toLowerCase().replace(/\s+/g, '-');
    setSelectedBusinessCategory(normalizedCategory);
  };

  // Render the appropriate business administrator component
  const renderBusinessAdministrator = () => {
    const category = selectedBusinessCategory;
    
    switch (category) {
      case 'restaurant':
        return <RestaurantAdministrator />;
      case 'beauty-salon':
      case 'healthcare':
        return <BeautySalonAdministrator />;
      default:
        return (
          <div className="p-6">
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {getCurrentCategoryDisplay()} Administrator
              </h3>
              <p className="text-gray-500 mb-4">
                Specialized administrator for {getCurrentCategoryDisplay().toLowerCase()} businesses is coming soon.
              </p>
              <p className="text-sm text-gray-400">
                Currently, Restaurant and Beauty Salon administrators are fully functional. Other business categories will be added in future updates.
              </p>
            </div>
          </div>
        );
    }
  };

  // Get the display name for current category
  const getCurrentCategoryDisplay = () => {
    const category = businessCategories.find(cat => 
      cat.name.toLowerCase().replace(/\s+/g, '-') === selectedBusinessCategory
    );
    return category ? category.name : 'Business';
  };

  if (status === 'loading' || categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading website administrator...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <LeftNavbar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'} pt-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with Business Category Selector */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Website Administrator</h1>
                <p className="text-gray-600">Manage your {getCurrentCategoryDisplay().toLowerCase()} website content and settings</p>
              </div>
              
              {/* Business Category Selector */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Category
                </label>
                <select
                  value={selectedBusinessCategory}
                  onChange={(e) => handleBusinessCategoryChange(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm min-w-[200px]"
                >
                  <option value="">Select a category...</option>
                  {businessCategories.map((category) => (
                    <option 
                      key={category.id} 
                      value={category.name.toLowerCase().replace(/\s+/g, '-')}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
                {userProfile?.businessCategory && (
                  <p className="text-xs text-gray-500 mt-1">
                    Profile category: {userProfile.businessCategory}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Business Administrator Content */}
          {selectedBusinessCategory ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {renderBusinessAdministrator()}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Business Category</h3>
              <p className="text-gray-500">Choose your business category to start managing your website content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}