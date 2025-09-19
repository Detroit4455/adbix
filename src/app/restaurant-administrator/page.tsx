'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LeftNavbar from '@/components/LeftNavbar';
import Navbar from '@/components/Navbar';

interface MenuItem {
  name: string;
  price: string;
  type: 'veg' | 'non-veg';
  description?: string;
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

interface RestaurantColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  text_light: string;
}

interface RestaurantFonts {
  primary: string;
  secondary: string;
  accent: string;
}

interface RestaurantData {
  restaurant: {
    name: string;
    tagline: string;
    logo: string;
    background_image: string;
    title_image: string;
    colors: RestaurantColors;
    fonts: RestaurantFonts;
    google_review: string;
    gallery_images: { [key: string]: string };
    contact: {
      phone: string;
      email: string;
      address: string;
    };
    hours: string;
    specialty: string;
  };
  categories: MenuCategory[];
}

const defaultRestaurantData: RestaurantData = {
  restaurant: {
    name: "MEET & EAT",
    tagline: "Chinese & Momos Hub",
    logo: "fas fa-utensils",
    background_image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=1080&fit=crop&crop=center",
    title_image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop&crop=center",
    colors: {
      primary: "#d4af37",
      secondary: "#8b4513",
      accent: "#ff6b35",
      background: "#f8f9fa",
      text: "#333333",
      text_light: "#666666"
    },
    fonts: {
      primary: "Poppins, sans-serif",
      secondary: "Playfair Display, serif",
      accent: "Dancing Script, cursive"
    },
    google_review: "https://search.google.com/local/writereview?placeid=ChIJldRcU7q7wjsRDAR1SFZyGsc",
    gallery_images: {
      "1": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&crop=center",
      "2": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&crop=center",
      "3": "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop&crop=center"
    },
    contact: {
      phone: "9139230963",
      email: "info@meetandeat.com",
      address: "123 Main Street, Mumbai, India"
    },
    hours: "Monday - Sunday: 11:00 AM - 11:00 PM",
    specialty: "Chinese & Momos - Veg & Non-Veg"
  },
  categories: [
    {
      id: "soups",
      name: "SOUP",
      items: [
        {
          name: "Veg Soup",
          price: "₹80",
          type: "veg",
          description: "A light and healthy soup made with fresh mixed vegetables."
        },
        {
          name: "Veg Manchow Soup",
          price: "₹80",
          type: "veg",
          description: "A spicy and tangy soup with fried noodles."
        },
        {
          name: "Veg Hot & Sour Soup",
          price: "₹90",
          type: "veg",
          description: "A classic hot and sour soup with vegetables and a hint of spice."
        }
      ]
    },
    {
      id: "starters",
      name: "STARTER",
      items: [
        {
          name: "Veg Chinese Bhel",
          price: "₹80",
          type: "veg",
          description: "A popular Indo-Chinese snack with crispy noodles and a tangy sauce."
        },
        {
          name: "Veg Crispy",
          price: "₹150",
          type: "veg",
          description: "Assorted vegetables deep-fried until crispy, tossed in a sweet and spicy sauce."
        },
        {
          name: "Veg Manchurian (Dry)",
          price: "₹140",
          type: "veg",
          description: "Deep-fried vegetable balls coated in a spicy and tangy Manchurian sauce."
        }
      ]
    }
  ]
};

const navigationItems = [
  { id: 'restaurant-info', label: 'Restaurant Info', icon: '🏪' },
  { id: 'contact-details', label: 'Contact Details', icon: '📞' },
  { id: 'design-settings', label: 'Design Settings', icon: '🎨' },
  { id: 'gallery-images', label: 'Gallery Images', icon: '📸' },
  { id: 'menu-categories', label: 'Menu Categories', icon: '📋' },
  { id: 'menu-items', label: 'Menu Items', icon: '🍽️' }
];

// Helper function to safely merge loaded data with defaults and track default usage
const mergeWithDefaults = (loadedData: any, defaultData: RestaurantData): { data: RestaurantData; defaultFields: Set<string> } => {
  const defaultFields = new Set<string>();
  
  try {
    const result = {
      restaurant: {
        name: loadedData?.restaurant?.name || (defaultFields.add('restaurant.name'), defaultData.restaurant.name),
        tagline: loadedData?.restaurant?.tagline || (defaultFields.add('restaurant.tagline'), defaultData.restaurant.tagline),
        logo: loadedData?.restaurant?.logo || (defaultFields.add('restaurant.logo'), defaultData.restaurant.logo),
        background_image: loadedData?.restaurant?.background_image || (defaultFields.add('restaurant.background_image'), defaultData.restaurant.background_image),
        title_image: loadedData?.restaurant?.title_image || (defaultFields.add('restaurant.title_image'), defaultData.restaurant.title_image),
        colors: {
          primary: loadedData?.restaurant?.colors?.primary || (defaultFields.add('restaurant.colors.primary'), defaultData.restaurant.colors.primary),
          secondary: loadedData?.restaurant?.colors?.secondary || (defaultFields.add('restaurant.colors.secondary'), defaultData.restaurant.colors.secondary),
          accent: loadedData?.restaurant?.colors?.accent || (defaultFields.add('restaurant.colors.accent'), defaultData.restaurant.colors.accent),
          background: loadedData?.restaurant?.colors?.background || (defaultFields.add('restaurant.colors.background'), defaultData.restaurant.colors.background),
          text: loadedData?.restaurant?.colors?.text || (defaultFields.add('restaurant.colors.text'), defaultData.restaurant.colors.text),
          text_light: loadedData?.restaurant?.colors?.text_light || (defaultFields.add('restaurant.colors.text_light'), defaultData.restaurant.colors.text_light),
        },
        fonts: {
          primary: loadedData?.restaurant?.fonts?.primary || (defaultFields.add('restaurant.fonts.primary'), defaultData.restaurant.fonts.primary),
          secondary: loadedData?.restaurant?.fonts?.secondary || (defaultFields.add('restaurant.fonts.secondary'), defaultData.restaurant.fonts.secondary),
          accent: loadedData?.restaurant?.fonts?.accent || (defaultFields.add('restaurant.fonts.accent'), defaultData.restaurant.fonts.accent),
        },
        google_review: loadedData?.restaurant?.google_review || (defaultFields.add('restaurant.google_review'), defaultData.restaurant.google_review),
        gallery_images: (() => {
          const merged = { ...defaultData.restaurant.gallery_images };
          const loaded = loadedData?.restaurant?.gallery_images || {};
          Object.keys(defaultData.restaurant.gallery_images).forEach(key => {
            if (!loaded[key]) {
              defaultFields.add(`restaurant.gallery_images.${key}`);
            } else {
              merged[key] = loaded[key];
            }
          });
          return merged;
        })(),
        contact: {
          phone: loadedData?.restaurant?.contact?.phone || (defaultFields.add('restaurant.contact.phone'), defaultData.restaurant.contact.phone),
          email: loadedData?.restaurant?.contact?.email || (defaultFields.add('restaurant.contact.email'), defaultData.restaurant.contact.email),
          address: loadedData?.restaurant?.contact?.address || (defaultFields.add('restaurant.contact.address'), defaultData.restaurant.contact.address),
        },
        hours: loadedData?.restaurant?.hours || (defaultFields.add('restaurant.hours'), defaultData.restaurant.hours),
        specialty: loadedData?.restaurant?.specialty || (defaultFields.add('restaurant.specialty'), defaultData.restaurant.specialty),
      },
      categories: Array.isArray(loadedData?.categories) ? loadedData.categories.map((category: any, catIndex: number) => ({
        id: category?.id || (defaultFields.add(`categories.${catIndex}.id`), `category-${Date.now()}-${Math.random()}`),
        name: category?.name || (defaultFields.add(`categories.${catIndex}.name`), ''),
        items: Array.isArray(category?.items) ? category.items.map((item: any, itemIndex: number) => ({
          name: item?.name || (defaultFields.add(`categories.${catIndex}.items.${itemIndex}.name`), ''),
          price: item?.price || (defaultFields.add(`categories.${catIndex}.items.${itemIndex}.price`), ''),
          type: (item?.type === 'veg' || item?.type === 'non-veg') ? item.type : (defaultFields.add(`categories.${catIndex}.items.${itemIndex}.type`), 'veg'),
          description: item?.description || (defaultFields.add(`categories.${catIndex}.items.${itemIndex}.description`), '')
        })) : (defaultFields.add(`categories.${catIndex}.items`), [])
      })) : (defaultFields.add('categories'), defaultData.categories)
    };
    
    return { data: result, defaultFields };
  } catch (error) {
    console.error('Error merging data with defaults:', error);
    return { data: defaultData, defaultFields: new Set() };
  }
};

export default function RestaurantAdministratorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [restaurantData, setRestaurantData] = useState<RestaurantData>(defaultRestaurantData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeSection, setActiveSection] = useState('restaurant-info');
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<{ categoryIndex: number; itemIndex: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [isImageRepoOpen, setIsImageRepoOpen] = useState(false);
  const [selectedImageKey, setSelectedImageKey] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [defaultFields, setDefaultFields] = useState<Set<string>>(new Set());
  const newItemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user?.mobileNumber) {
      loadUserSettings();
    }
  }, [session]);

  const loadUserSettings = async () => {
    if (!session?.user?.mobileNumber) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user-settings?mobileNumber=${session.user.mobileNumber}&businessType=restaurant&fileName=menu.json`);
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          // Merge loaded data with default structure to handle missing keys
          const { data: mergedData, defaultFields: usedDefaults } = mergeWithDefaults(data.settings, defaultRestaurantData);
          setRestaurantData(mergedData);
          setDefaultFields(usedDefaults);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // On error, use default data instead of showing error
      setRestaurantData(defaultRestaurantData);
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
          businessType: 'restaurant',
          fileName: 'menu.json',
          settings: restaurantData
        }),
      });

      if (response.ok) {
        setSaveMessage('Restaurant menu saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Error saving menu. Please try again.');
      }
    } catch (error) {
      console.error('Error saving menu:', error);
      setSaveMessage('Error saving menu. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to check if a field is using default values
  const isUsingDefault = (fieldPath: string): boolean => {
    return defaultFields.has(fieldPath);
  };

  // Helper function to get default field styling
  const getDefaultFieldClass = (fieldPath: string, baseClass: string = ''): string => {
    if (isUsingDefault(fieldPath)) {
      return `${baseClass} bg-gray-50 border-gray-300 text-gray-700 placeholder-gray-500 shadow-inner`.trim();
    }
    return baseClass;
  };

  const updateField = (path: string, value: any) => {
    setRestaurantData(prev => {
      try {
        const newData = { ...prev };
        const keys = path.split('.');
        let current: any = newData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        
        // Remove field from default fields when user updates it
        if (defaultFields.has(path)) {
          const newDefaultFields = new Set(defaultFields);
          newDefaultFields.delete(path);
          setDefaultFields(newDefaultFields);
        }
        
        return newData;
      } catch (error) {
        console.error('Error updating field:', error);
        return prev; // Return previous state if error occurs
      }
    });
  };

  const addCategory = () => {
    const newCategory: MenuCategory = {
      id: `category-${Date.now()}`,
      name: '',
      items: []
    };
    setRestaurantData(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
    setEditingCategory(restaurantData.categories.length);
    
    // Focus on the new category input after a short delay
    setTimeout(() => {
      const newCategoryInput = document.querySelector(`input[data-category-index="${restaurantData.categories.length}"]`) as HTMLInputElement;
      if (newCategoryInput) {
        newCategoryInput.focus();
        newCategoryInput.select();
      }
    }, 100);
  };

  const removeCategory = (index: number) => {
    setRestaurantData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }));
  };

  const addMenuItem = () => {
    if (selectedCategory < 0 || selectedCategory >= restaurantData.categories.length) return;
    
    const newItem: MenuItem = {
      name: '',
      price: '',
      type: 'veg',
      description: ''
    };
    
    setRestaurantData(prev => {
      const newCategories = [...prev.categories];
      newCategories[selectedCategory] = {
        ...newCategories[selectedCategory],
        items: [...newCategories[selectedCategory].items, newItem]
      };
      
      return {
        ...prev,
        categories: newCategories
      };
    });
    
    const newItemIndex = restaurantData.categories[selectedCategory].items.length;
    setEditingItem({
      categoryIndex: selectedCategory,
      itemIndex: newItemIndex
    });
    
    setTimeout(() => {
      if (newItemRef.current) {
        newItemRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  const removeMenuItem = (categoryIndex: number, itemIndex: number) => {
    setRestaurantData(prev => {
      const newData = { ...prev };
      newData.categories[categoryIndex].items = newData.categories[categoryIndex].items.filter((_, i) => i !== itemIndex);
      return newData;
    });
  };

  const openImageRepository = (imageKey: string, imageType: 'gallery' | 'background' | 'title' = 'gallery') => {
    setSelectedImageKey(`${imageType}_${imageKey}`);
    setIsImageRepoOpen(true);
    
    const popup = window.open(
      '/image_repo?mode=select',
      'imageRepository',
      'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
    );
    
    if (!popup) {
      alert('Popup blocked! Please allow popups for this site to use the Image Repository.');
      setIsImageRepoOpen(false);
      return;
    }
    
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data && event.data.type === 'IMAGE_SELECTED') {
        const selectedImageUrl = event.data.imageUrl;
        
        console.log('🖼️ Image selected from repository:', selectedImageUrl);
        
        // Update the appropriate image based on type
        if (imageType === 'gallery') {
          updateField(`restaurant.gallery_images.${imageKey}`, selectedImageUrl);
        } else if (imageType === 'background') {
          updateField('restaurant.background_image', selectedImageUrl);
        } else if (imageType === 'title') {
          updateField('restaurant.title_image', selectedImageUrl);
        }
        
        // Auto-save the updated data
        setRestaurantData(prev => {
          const updatedData = { ...prev };
          setTimeout(async () => {
            setIsSaving(true);
            setSaveMessage('Saving image to menu.json...');
            
            try {
              const response = await fetch('/api/user-settings', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  mobileNumber: session?.user?.mobileNumber,
                  businessType: 'restaurant',
                  fileName: 'menu.json',
                  settings: updatedData
                }),
              });

              if (response.ok) {
                setSaveMessage('✅ Image replaced and saved to menu.json successfully!');
              } else {
                setSaveMessage('⚠️ Image replaced but failed to save to menu.json. Please save manually.');
              }
            } catch (error) {
              console.error('Error auto-saving after image replacement:', error);
              setSaveMessage('⚠️ Image replaced but failed to save to menu.json. Please save manually.');
            } finally {
              setIsSaving(false);
            }
          }, 100);
          
          return updatedData;
        });
        
        setTimeout(() => setSaveMessage(''), 4000);
        
        setIsImageRepoOpen(false);
        setSelectedImageKey('');
        window.removeEventListener('message', messageHandler);
        popup.close();
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        setIsImageRepoOpen(false);
        setSelectedImageKey('');
      }
    }, 1000);
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  const renderRestaurantInfo = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 sm:p-6 border border-amber-200">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <span className="text-2xl sm:text-3xl">🏪</span>
          Restaurant Information
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Restaurant Name *
              {isUsingDefault('restaurant.name') && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Using default value
                </span>
              )}
            </label>
            <input
              type="text"
              className={getDefaultFieldClass('restaurant.name', 'w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-base')}
              value={restaurantData.restaurant.name}
              onChange={(e) => updateField('restaurant.name', e.target.value)}
              placeholder="Enter restaurant name"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Tagline *
              {isUsingDefault('restaurant.tagline') && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Using default value
                </span>
              )}
            </label>
            <input
              type="text"
              className={getDefaultFieldClass('restaurant.tagline', 'w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-base')}
              value={restaurantData.restaurant.tagline}
              onChange={(e) => updateField('restaurant.tagline', e.target.value)}
              placeholder="Enter restaurant tagline"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Logo Icon (Font Awesome class)</label>
            <input
              type="text"
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              value={restaurantData.restaurant.logo}
              onChange={(e) => updateField('restaurant.logo', e.target.value)}
              placeholder="e.g., fas fa-utensils"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Google Review Link</label>
            <input
              type="url"
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              value={restaurantData.restaurant.google_review}
              onChange={(e) => updateField('restaurant.google_review', e.target.value)}
              placeholder="Google review URL"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Operating Hours</label>
            <input
              type="text"
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              value={restaurantData.restaurant.hours}
              onChange={(e) => updateField('restaurant.hours', e.target.value)}
              placeholder="e.g., Monday - Sunday: 11:00 AM - 11:00 PM"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Specialty</label>
            <input
              type="text"
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              value={restaurantData.restaurant.specialty}
              onChange={(e) => updateField('restaurant.specialty', e.target.value)}
              placeholder="e.g., Chinese & Momos - Veg & Non-Veg"
            />
          </div>
        </div>

        {/* Background and Title Images */}
        <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
          <h4 className="text-base sm:text-lg font-semibold text-gray-900">Hero Images</h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Background Image */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-900">Background Image</label>
              <div className="relative group">
                {restaurantData.restaurant.background_image && (
                  <img 
                    src={restaurantData.restaurant.background_image} 
                    alt="Background" 
                    className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                  />
                )}
                <button
                  onClick={() => openImageRepository('background', 'background')}
                  className="absolute inset-0 bg-black bg-opacity-50 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-medium"
                >
                  🖼️ Replace Background Image
                </button>
              </div>
              <input
                type="url"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
                value={restaurantData.restaurant.background_image}
                onChange={(e) => updateField('restaurant.background_image', e.target.value)}
                placeholder="Background image URL"
              />
            </div>

            {/* Title Image */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-900">Title Image</label>
              <div className="relative group">
                {restaurantData.restaurant.title_image && (
                  <img 
                    src={restaurantData.restaurant.title_image} 
                    alt="Title" 
                    className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                  />
                )}
                <button
                  onClick={() => openImageRepository('title', 'title')}
                  className="absolute inset-0 bg-black bg-opacity-50 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-medium"
                >
                  🖼️ Replace Title Image
                </button>
              </div>
              <input
                type="url"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
                value={restaurantData.restaurant.title_image}
                onChange={(e) => updateField('restaurant.title_image', e.target.value)}
                placeholder="Title image URL"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContactDetails = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-200">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <span className="text-2xl sm:text-3xl">📞</span>
          Contact Details
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Phone Number *
              {isUsingDefault('restaurant.contact.phone') && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Using default value
                </span>
              )}
            </label>
            <input
              type="tel"
              className={getDefaultFieldClass('restaurant.contact.phone', 'w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base')}
              value={restaurantData.restaurant.contact.phone}
              onChange={(e) => updateField('restaurant.contact.phone', e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Email Address *
              {isUsingDefault('restaurant.contact.email') && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Using default value
                </span>
              )}
            </label>
            <input
              type="email"
              className={getDefaultFieldClass('restaurant.contact.email', 'w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base')}
              value={restaurantData.restaurant.contact.email}
              onChange={(e) => updateField('restaurant.contact.email', e.target.value)}
              placeholder="Enter email address"
            />
          </div>
          
          <div className="lg:col-span-2 space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Restaurant Address *</label>
            <textarea
              className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-base"
              rows={3}
              value={restaurantData.restaurant.contact.address}
              onChange={(e) => updateField('restaurant.contact.address', e.target.value)}
              placeholder="Enter complete restaurant address"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDesignSettings = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6 border border-purple-200">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <span className="text-2xl sm:text-3xl">🎨</span>
          Design Settings
        </h3>
        
        {/* Colors Section */}
        <div className="mb-6 sm:mb-8">
          <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Color Scheme</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Object.entries(restaurantData.restaurant.colors).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 capitalize">
                  {key.replace('_', ' ')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    value={value}
                    onChange={(e) => updateField(`restaurant.colors.${key}`, e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    value={value}
                    onChange={(e) => updateField(`restaurant.colors.${key}`, e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fonts Section */}
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Typography</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Object.entries(restaurantData.restaurant.fonts).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 capitalize">
                  {key} Font
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                  value={value}
                  onChange={(e) => updateField(`restaurant.fonts.${key}`, e.target.value)}
                  placeholder="Font family"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderGalleryImages = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border border-green-200">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <span className="text-2xl sm:text-3xl">📸</span>
          Gallery Images
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Object.entries(restaurantData?.restaurant?.gallery_images || {}).map(([key, url]) => (
            <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="relative group">
                <img 
                  src={url} 
                  alt={`Gallery image ${key}`} 
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDMyMCAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTkyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNDQgODBIMTc2VjExMkgxNDRWODBaIiBmaWxsPSIjOUI5OUE3Ii8+CjxwYXRoIGQ9Ik0xMjggMTEyTDE1MiA4OEwxNzYgMTEySDEyOFoiIGZpbGw9IiM5Qjk5QTciLz4KPC9zdmc+';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => openImageRepository(key, 'gallery')}
                    disabled={isImageRepoOpen && selectedImageKey === `gallery_${key}`}
                    className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:bg-gray-300"
                  >
                    {isImageRepoOpen && selectedImageKey === `gallery_${key}` ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </span>
                    ) : (
                      '🖼️ Replace Image'
                    )}
                  </button>
                </div>
              </div>
              
              <div className="p-3 sm:p-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Image {key}
                  {isUsingDefault(`restaurant.gallery_images.${key}`) && (
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </label>
                <input
                  type="url"
                  className={getDefaultFieldClass(`restaurant.gallery_images.${key}`, 'w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm')}
                  value={url}
                  onChange={(e) => updateField(`restaurant.gallery_images.${key}`, e.target.value)}
                  placeholder="Image URL"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMenuCategories = () => (
    <div className="space-y-8">
       <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3 sm:p-4 border border-orange-200">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 space-y-2 sm:space-y-0">
           <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
             <span className="text-xl sm:text-2xl">📋</span>
             Menu Categories
           </h3>
           <button
             onClick={addCategory}
             className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-md font-medium flex items-center gap-1.5 text-sm"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
             </svg>
             Add Category
          </button>
        </div>
        
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
           {restaurantData.categories.map((category, index) => {
             const isNewCategory = editingCategory === index;
             return (
             <div key={index} className={`bg-white rounded-lg border-2 p-3 sm:p-4 transition-all duration-300 ${
               isNewCategory 
                 ? 'border-orange-300 shadow-lg ring-2 ring-orange-200' 
                 : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
             }`}>
               <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-2 flex-1 min-w-0">
                   <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></div>
                   <input
                     type="text"
                     data-category-index={index}
                     className="text-base sm:text-lg font-semibold bg-transparent border-none outline-none focus:bg-gray-50 p-1.5 rounded flex-1 text-gray-900"
                     value={category.name}
                     onChange={(e) => updateField(`categories.${index}.name`, e.target.value)}
                     placeholder="Category name"
                     autoFocus={isNewCategory}
                   />
                 </div>
                 <button
                   onClick={() => removeCategory(index)}
                   className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors flex-shrink-0 ml-2"
                   title="Delete category"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                   </svg>
                 </button>
               </div>
              
               <div className="space-y-1.5 text-xs sm:text-sm text-gray-700">
                 <div className="flex items-center justify-between">
                   <span className="text-gray-500">ID:</span>
                   <span className="font-mono text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded text-xs">{category.id}</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-gray-500">Items:</span>
                   <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-xs font-medium">
                     {category.items.length} item{category.items.length !== 1 ? 's' : ''}
                   </span>
                 </div>
                 {category.items.length > 0 && (
                   <div className="pt-1 border-t border-gray-100">
                     <div className="text-xs text-gray-500 mb-1">Recent items:</div>
                     <div className="space-y-0.5">
                       {category.items.slice(0, 2).map((item, itemIndex) => (
                         <div key={itemIndex} className="flex items-center justify-between text-xs">
                           <span className="text-gray-600 truncate">{item.name || 'Untitled Item'}</span>
                           <span className="text-orange-600 font-medium">{item.price || 'No price'}</span>
                         </div>
                       ))}
                       {category.items.length > 2 && (
                         <p className="text-xs text-gray-400">+{category.items.length - 2} more items</p>
                       )}
                     </div>
                   </div>
                 )}
               </div>
             </div>
             );
           })}
        </div>
      </div>
    </div>
  );

  const renderMenuItems = () => {
    // Safe access to category with fallback
    const currentCategory = restaurantData?.categories?.[selectedCategory];
    const filteredItems = currentCategory?.items?.filter(item =>
      item?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
      <div className="space-y-8">
         <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-3 sm:p-4 border border-emerald-200">
           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div>
               <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                 <span className="text-xl sm:text-2xl">🍽️</span>
                 Menu Items
               </h3>
               <p className="text-gray-700 text-xs sm:text-sm">
                 {currentCategory ? `Managing items in "${currentCategory.name}"` : 'Select a category to manage items'}
               </p>
            </div>
            
             <div className="flex flex-col sm:flex-row gap-2">
               <select
                 className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 font-medium focus:ring-1 focus:ring-emerald-500 focus:border-transparent shadow-sm min-w-[160px] text-sm"
                 value={selectedCategory}
                 onChange={(e) => setSelectedCategory(parseInt(e.target.value))}
               >
                {(restaurantData?.categories || []).map((category, index) => (
                  <option key={index} value={index}>
                    {category?.name || `Category ${index + 1}`} ({category?.items?.length || 0} items)
                  </option>
                ))}
              </select>
              
               <button
                 onClick={addMenuItem}
                 className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md font-medium flex items-center gap-1.5 text-sm"
                 disabled={!restaurantData?.categories || restaurantData.categories.length === 0}
               >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Item
              </button>
            </div>
          </div>
          
          {currentCategory && currentCategory.items.length > 0 && (
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
                 <input
                   type="text"
                   placeholder="Search menu items..."
                   className="w-full pl-8 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              {searchTerm && (
                 <button
                   onClick={() => setSearchTerm('')}
                   className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
              )}
            </div>
          )}
        </div>

        {!restaurantData?.categories || restaurantData.categories.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <svg className="w-16 sm:w-20 h-16 sm:h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Categories Available</h3>
            <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">Please add a category first before adding menu items.</p>
            <button
              onClick={() => setActiveSection('menu-categories')}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors font-medium"
            >
              Go to Categories
            </button>
          </div>
        ) : !currentCategory || currentCategory.items.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <svg className="w-16 sm:w-20 h-16 sm:h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Items in This Category</h3>
            <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">Start building your menu by adding the first item.</p>
            <button
              onClick={addMenuItem}
              className="bg-emerald-500 text-white px-8 py-3 rounded-xl hover:bg-emerald-600 transition-colors font-medium"
            >
              Add First Item
            </button>
          </div>
        ) : (
           <div className="space-y-3 sm:space-y-4">
             {filteredItems.map((item, itemIndex) => {
              const actualIndex = currentCategory.items.findIndex(i => i === item);
              const isNewItem = editingItem?.categoryIndex === selectedCategory && editingItem?.itemIndex === actualIndex;
              
              return (
                 <div 
                   key={actualIndex} 
                   ref={isNewItem ? newItemRef : null}
                   className={`bg-white rounded-lg border-2 p-3 sm:p-4 transition-all duration-300 ${
                     isNewItem 
                       ? 'border-emerald-300 shadow-lg ring-2 ring-emerald-200' 
                       : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                   }`}
                 >
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-2 flex-1 min-w-0">
                       <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.type === 'veg' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                       <h4 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                         {item.name || `New Item #${actualIndex + 1}`}
                       </h4>
                       {item.price && (
                         <span className="ml-2 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                           {item.price}
                         </span>
                       )}
                     </div>
                     
                     <button
                       onClick={() => removeMenuItem(selectedCategory, actualIndex)}
                       className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors flex-shrink-0 ml-2"
                       title="Remove item"
                     >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                       </svg>
                     </button>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     <div className="space-y-1">
                       <label className="block text-xs font-medium text-gray-700">Item Name *</label>
                       <input
                         type="text"
                         className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                         value={item.name}
                         onChange={(e) => updateField(`categories.${selectedCategory}.items.${actualIndex}.name`, e.target.value)}
                         placeholder="Enter item name"
                       />
                     </div>
                     
                     <div className="space-y-1">
                       <label className="block text-xs font-medium text-gray-700">Price *</label>
                       <input
                         type="text"
                         className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                         value={item.price}
                         onChange={(e) => updateField(`categories.${selectedCategory}.items.${actualIndex}.price`, e.target.value)}
                         placeholder="₹100"
                       />
                     </div>
                     
                     <div className="space-y-1 sm:col-span-2">
                       <label className="block text-xs font-medium text-gray-700">Type *</label>
                       <select
                         className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                         value={item.type}
                         onChange={(e) => updateField(`categories.${selectedCategory}.items.${actualIndex}.type`, e.target.value as 'veg' | 'non-veg')}
                       >
                         <option value="veg">🟢 Vegetarian</option>
                         <option value="non-veg">🔴 Non-Vegetarian</option>
                       </select>
                     </div>
                   </div>
                  
                   <div className="mt-3 space-y-1">
                     <label className="block text-xs font-medium text-gray-700">Description</label>
                     <textarea
                       className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all resize-none text-sm"
                       rows={2}
                       value={item.description || ''}
                       onChange={(e) => updateField(`categories.${selectedCategory}.items.${actualIndex}.description`, e.target.value)}
                       placeholder="Brief description"
                     />
                   </div>
                </div>
              );
            })}

             <div className="flex justify-center pt-3 sm:pt-4">
               <button
                 onClick={addMenuItem}
                 className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md font-medium flex items-center gap-2 text-sm"
               >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Another Item
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'restaurant-info':
        return renderRestaurantInfo();
      case 'contact-details':
        return renderContactDetails();
      case 'design-settings':
        return renderDesignSettings();
      case 'gallery-images':
        return renderGalleryImages();
      case 'menu-categories':
        return renderMenuCategories();
      case 'menu-items':
        return renderMenuItems();
      default:
        return renderRestaurantInfo();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <LeftNavbar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'} pt-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-3">
              Restaurant Administrator
            </h1>
            <p className="text-gray-800 text-base sm:text-lg">Manage your restaurant menu and information</p>
            
            {/* Default Fields Indicator */}
            {defaultFields.size > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-full text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>
                  {defaultFields.size} field{defaultFields.size === 1 ? '' : 's'} using default values - please review and update
                </span>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex flex-wrap justify-center md:justify-start space-x-2 sm:space-x-4 lg:space-x-8 px-2 sm:px-6 overflow-x-auto" aria-label="Tabs">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`${
                      activeSection === item.id
                        ? 'border-amber-500 text-amber-700 bg-amber-50'
                        : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
                    } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-semibold text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 rounded-t-lg transition-all`}
                  >
                    <span className="text-base sm:text-lg">{item.icon}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden text-xs">{item.label.split(' ')[0]}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <svg className="animate-spin w-12 h-12 text-amber-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div className="text-gray-500 text-lg">Loading restaurant data...</div>
                  </div>
                </div>
              ) : (
                renderActiveSection()
              )}
            </div>

            {/* Save Button */}
            <div className="border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-b-2xl">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                  Changes are saved automatically to menu.json
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                  {saveMessage && (
                    <div className={`text-xs sm:text-sm font-medium text-center sm:text-left ${saveMessage.includes('Error') || saveMessage.includes('⚠️') ? 'text-red-700' : 'text-green-700'}`}>
                      {saveMessage}
                    </div>
                  )}
                  <button
                    onClick={saveUserSettings}
                    disabled={isSaving}
                    className={`px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-xl font-semibold text-white transition-all text-sm sm:text-base ${
                      isSaving
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      'Save Menu'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
