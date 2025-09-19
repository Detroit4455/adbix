'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LeftNavbar from '@/components/LeftNavbar';
import Navbar from '@/components/Navbar';

interface Service {
  name: string;
  description: string;
  image_url: string;
  price_range: string;
}

interface Testimonial {
  author: string;
  quote: string;
  rating: number;
}

interface GalleryImage {
  url: string;
  alt_text: string;
}

interface BeautySalonColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  text_light: string;
}

interface BeautySalonFonts {
  primary: string;
  secondary: string;
  accent: string;
}

interface BeautySalonData {
  salon: {
    name: string;
    tagline: string;
    about_us: string;
    logo: string;
    background_image: string;
    title_image: string;
    colors: BeautySalonColors;
    fonts: BeautySalonFonts;
    google_review: string;
    contact: {
      phone: string;
      email: string;
      address: string;
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
      google_maps_link: string;
      pinterest: string;
    };
  };
  services: Service[];
  testimonials: Testimonial[];
  gallery_images: GalleryImage[];
}

const defaultBeautySalonData: BeautySalonData = {
  salon: {
    name: "Beauty Bliss Salon",
    tagline: "Where Beauty Meets Excellence",
    about_us: "Beauty Bliss Salon is dedicated to providing an exceptional beauty experience. Our team of certified professionals is committed to using the highest quality products and techniques to help you look and feel your best.",
    logo: "fas fa-cut",
    background_image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&h=1080&fit=crop&crop=center",
    title_image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=400&fit=crop&crop=center",
    colors: {
      primary: "#e91e63",
      secondary: "#ad1457",
      accent: "#f8bbd9",
      background: "#fce4ec",
      text: "#2d2d2d",
      text_light: "#757575"
    },
    fonts: {
      primary: "Playfair Display, serif",
      secondary: "Source Sans Pro, sans-serif",
      accent: "Dancing Script, cursive"
    },
    google_review: "https://search.google.com/local/writereview?placeid=ChIJldRcU7q7wjsRDAR1SFZyGsc",
    contact: {
      phone: "+91 9876543210",
      email: "info@beautyblisssalon.com",
      address: "123 Beauty Lane, Fashion District, Mumbai 400001"
    },
    hours_of_operation: {
      monday: "10:00 AM - 8:00 PM",
      tuesday: "10:00 AM - 8:00 PM",
      wednesday: "10:00 AM - 8:00 PM",
      thursday: "10:00 AM - 8:00 PM",
      friday: "10:00 AM - 8:00 PM",
      saturday: "11:00 AM - 6:00 PM",
      sunday: "Closed"
    },
    social_media: {
      instagram: "https://www.instagram.com/beautybliss",
      facebook: "https://www.facebook.com/beautybliss",
      google_maps_link: "https://goo.gl/maps/example_location",
      pinterest: "https://www.pinterest.com/beautybliss"
    }
  },
  services: [
    {
      name: "Haircuts & Styling",
      description: "Professional haircuts and styling for all hair types",
      image_url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=300&fit=crop",
      price_range: "₹500 - ₹2500"
    },
    {
      name: "Facials & Skincare",
      description: "Rejuvenating facial treatments for glowing skin",
      image_url: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&h=300&fit=crop",
      price_range: "₹1200 - ₹5000"
    }
  ],
  testimonials: [
    {
      author: "Priya Sharma",
      quote: "Amazing service! The staff is so friendly and professional. I love my new haircut!",
      rating: 5
    },
    {
      author: "Anita Gupta",
      quote: "Excellent facial. My skin feels so refreshed. Highly recommended!",
      rating: 5
    }
  ],
  gallery_images: [
    {
      url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop",
      alt_text: "Professional hair styling"
    },
    {
      url: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&h=600&fit=crop",
      alt_text: "Facial treatment"
    },
    {
      url: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=600&fit=crop",
      alt_text: "Salon interior"
    }
  ]
};

// Helper function to safely merge loaded data with defaults and track default usage
const mergeWithDefaults = (loadedData: any, defaultData: BeautySalonData): { data: BeautySalonData; defaultFields: Set<string> } => {
  const defaultFields = new Set<string>();
  
  try {
    const result = {
      salon: {
        name: loadedData?.salon?.name || (defaultFields.add('salon.name'), defaultData.salon.name),
        tagline: loadedData?.salon?.tagline || (defaultFields.add('salon.tagline'), defaultData.salon.tagline),
        about_us: loadedData?.salon?.about_us || (defaultFields.add('salon.about_us'), defaultData.salon.about_us),
        logo: loadedData?.salon?.logo || (defaultFields.add('salon.logo'), defaultData.salon.logo),
        background_image: loadedData?.salon?.background_image || (defaultFields.add('salon.background_image'), defaultData.salon.background_image),
        title_image: loadedData?.salon?.title_image || (defaultFields.add('salon.title_image'), defaultData.salon.title_image),
        colors: {
          primary: loadedData?.salon?.colors?.primary || (defaultFields.add('salon.colors.primary'), defaultData.salon.colors.primary),
          secondary: loadedData?.salon?.colors?.secondary || (defaultFields.add('salon.colors.secondary'), defaultData.salon.colors.secondary),
          accent: loadedData?.salon?.colors?.accent || (defaultFields.add('salon.colors.accent'), defaultData.salon.colors.accent),
          background: loadedData?.salon?.colors?.background || (defaultFields.add('salon.colors.background'), defaultData.salon.colors.background),
          text: loadedData?.salon?.colors?.text || (defaultFields.add('salon.colors.text'), defaultData.salon.colors.text),
          text_light: loadedData?.salon?.colors?.text_light || (defaultFields.add('salon.colors.text_light'), defaultData.salon.colors.text_light),
        },
        fonts: {
          primary: loadedData?.salon?.fonts?.primary || (defaultFields.add('salon.fonts.primary'), defaultData.salon.fonts.primary),
          secondary: loadedData?.salon?.fonts?.secondary || (defaultFields.add('salon.fonts.secondary'), defaultData.salon.fonts.secondary),
          accent: loadedData?.salon?.fonts?.accent || (defaultFields.add('salon.fonts.accent'), defaultData.salon.fonts.accent),
        },
        google_review: loadedData?.salon?.google_review || (defaultFields.add('salon.google_review'), defaultData.salon.google_review),
        contact: {
          phone: loadedData?.salon?.contact?.phone || (defaultFields.add('salon.contact.phone'), defaultData.salon.contact.phone),
          email: loadedData?.salon?.contact?.email || (defaultFields.add('salon.contact.email'), defaultData.salon.contact.email),
          address: loadedData?.salon?.contact?.address || (defaultFields.add('salon.contact.address'), defaultData.salon.contact.address),
        },
        hours_of_operation: {
          monday: loadedData?.salon?.hours_of_operation?.monday || (defaultFields.add('salon.hours_of_operation.monday'), defaultData.salon.hours_of_operation.monday),
          tuesday: loadedData?.salon?.hours_of_operation?.tuesday || (defaultFields.add('salon.hours_of_operation.tuesday'), defaultData.salon.hours_of_operation.tuesday),
          wednesday: loadedData?.salon?.hours_of_operation?.wednesday || (defaultFields.add('salon.hours_of_operation.wednesday'), defaultData.salon.hours_of_operation.wednesday),
          thursday: loadedData?.salon?.hours_of_operation?.thursday || (defaultFields.add('salon.hours_of_operation.thursday'), defaultData.salon.hours_of_operation.thursday),
          friday: loadedData?.salon?.hours_of_operation?.friday || (defaultFields.add('salon.hours_of_operation.friday'), defaultData.salon.hours_of_operation.friday),
          saturday: loadedData?.salon?.hours_of_operation?.saturday || (defaultFields.add('salon.hours_of_operation.saturday'), defaultData.salon.hours_of_operation.saturday),
          sunday: loadedData?.salon?.hours_of_operation?.sunday || (defaultFields.add('salon.hours_of_operation.sunday'), defaultData.salon.hours_of_operation.sunday),
        },
        social_media: {
          instagram: loadedData?.salon?.social_media?.instagram || (defaultFields.add('salon.social_media.instagram'), defaultData.salon.social_media.instagram),
          facebook: loadedData?.salon?.social_media?.facebook || (defaultFields.add('salon.social_media.facebook'), defaultData.salon.social_media.facebook),
          google_maps_link: loadedData?.salon?.social_media?.google_maps_link || (defaultFields.add('salon.social_media.google_maps_link'), defaultData.salon.social_media.google_maps_link),
          pinterest: loadedData?.salon?.social_media?.pinterest || (defaultFields.add('salon.social_media.pinterest'), defaultData.salon.social_media.pinterest),
        }
      },
      services: Array.isArray(loadedData?.services) ? loadedData.services.map((service: any, index: number) => ({
        name: service?.name || (defaultFields.add(`services.${index}.name`), ''),
        description: service?.description || (defaultFields.add(`services.${index}.description`), ''),
        image_url: service?.image_url || (defaultFields.add(`services.${index}.image_url`), ''),
        price_range: service?.price_range || (defaultFields.add(`services.${index}.price_range`), '')
      })) : (defaultFields.add('services'), defaultData.services),
      testimonials: Array.isArray(loadedData?.testimonials) ? loadedData.testimonials.map((testimonial: any, index: number) => ({
        author: testimonial?.author || (defaultFields.add(`testimonials.${index}.author`), ''),
        quote: testimonial?.quote || (defaultFields.add(`testimonials.${index}.quote`), ''),
        rating: testimonial?.rating || (defaultFields.add(`testimonials.${index}.rating`), 5)
      })) : (defaultFields.add('testimonials'), defaultData.testimonials),
      gallery_images: Array.isArray(loadedData?.gallery_images) ? loadedData.gallery_images.map((image: any, index: number) => ({
        url: image?.url || (defaultFields.add(`gallery_images.${index}.url`), ''),
        alt_text: image?.alt_text || (defaultFields.add(`gallery_images.${index}.alt_text`), '')
      })) : (defaultFields.add('gallery_images'), defaultData.gallery_images)
    };
    
    return { data: result, defaultFields };
  } catch (error) {
    console.error('Error merging data with defaults:', error);
    return { data: defaultData, defaultFields: new Set() };
  }
};

const navigationItems = [
  { id: 'salon-info', label: 'Salon Info', icon: '💄' },
  { id: 'contact-details', label: 'Contact Details', icon: '📞' },
  { id: 'hours-operation', label: 'Operating Hours', icon: '🕒' },
  { id: 'design-settings', label: 'Design Settings', icon: '🎨' },
  { id: 'services', label: 'Services', icon: '✨' },
  { id: 'testimonials', label: 'Testimonials', icon: '⭐' },
  { id: 'gallery-images', label: 'Gallery Images', icon: '📸' },
  { id: 'social-media', label: 'Social Media', icon: '📱' }
];

export default function BeautySalonAdministratorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [salonData, setSalonData] = useState<BeautySalonData>(defaultBeautySalonData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeSection, setActiveSection] = useState('salon-info');
  const [editingService, setEditingService] = useState<number | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<number | null>(null);
  const [editingGallery, setEditingGallery] = useState<number | null>(null);
  const [isImageRepoOpen, setIsImageRepoOpen] = useState(false);
  const [selectedImageKey, setSelectedImageKey] = useState<string>('');
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
      const response = await fetch(`/api/user-settings?mobileNumber=${session.user.mobileNumber}&businessType=beauty-salon&fileName=salon.json`);
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          const { data: mergedData, defaultFields: usedDefaults } = mergeWithDefaults(data.settings, defaultBeautySalonData);
          setSalonData(mergedData);
          setDefaultFields(usedDefaults);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSalonData(defaultBeautySalonData);
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
          businessType: 'beauty-salon',
          fileName: 'salon.json',
          settings: salonData
        }),
      });

      if (response.ok) {
        setSaveMessage('Beauty salon data saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Error saving data. Please try again.');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      setSaveMessage('Error saving data. Please try again.');
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
      return `${baseClass} bg-gray-50 border-gray-300 text-gray-500 placeholder-gray-400 shadow-inner`.trim();
    }
    return baseClass;
  };

  const updateField = (path: string, value: any) => {
    setSalonData(prev => {
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
        return prev;
      }
    });
  };

  const openImageRepository = (imageKey: string, imageType: 'gallery' | 'background' | 'title' | 'service' = 'gallery', index?: number) => {
    setSelectedImageKey(`${imageType}_${imageKey}_${index || 0}`);
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
        if (imageType === 'gallery' && typeof index === 'number') {
          updateField(`gallery_images.${index}.url`, selectedImageUrl);
        } else if (imageType === 'background') {
          updateField('salon.background_image', selectedImageUrl);
        } else if (imageType === 'title') {
          updateField('salon.title_image', selectedImageUrl);
        } else if (imageType === 'service' && typeof index === 'number') {
          updateField(`services.${index}.image_url`, selectedImageUrl);
        }
        
        // Auto-save
        setSalonData(prev => {
          const updatedData = { ...prev };
          setTimeout(async () => {
            setIsSaving(true);
            setSaveMessage('Saving image to salon.json...');
            
            try {
              const response = await fetch('/api/user-settings', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  mobileNumber: session?.user?.mobileNumber,
                  businessType: 'beauty-salon',
                  fileName: 'salon.json',
                  settings: updatedData
                }),
              });

              if (response.ok) {
                setSaveMessage('✅ Image replaced and saved to salon.json successfully!');
              } else {
                setSaveMessage('⚠️ Image replaced but failed to save to salon.json. Please save manually.');
              }
            } catch (error) {
              console.error('Error auto-saving after image replacement:', error);
              setSaveMessage('⚠️ Image replaced but failed to save to salon.json. Please save manually.');
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

  const renderSalonInfo = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-200">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <span className="text-3xl">💄</span>
          Salon Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Salon Name *
              {isUsingDefault('salon.name') && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Using default value
                </span>
              )}
            </label>
            <input
              type="text"
              className={getDefaultFieldClass('salon.name', 'w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all')}
              value={salonData.salon.name}
              onChange={(e) => updateField('salon.name', e.target.value)}
              placeholder="Enter salon name"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Tagline *
              {isUsingDefault('salon.tagline') && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Using default value
                </span>
              )}
            </label>
            <input
              type="text"
              className={getDefaultFieldClass('salon.tagline', 'w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all')}
              value={salonData.salon.tagline}
              onChange={(e) => updateField('salon.tagline', e.target.value)}
              placeholder="Enter salon tagline"
            />
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              About Us
              {isUsingDefault('salon.about_us') && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Using default value
                </span>
              )}
            </label>
            <textarea
              className={getDefaultFieldClass('salon.about_us', 'w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none')}
              rows={4}
              value={salonData.salon.about_us}
              onChange={(e) => updateField('salon.about_us', e.target.value)}
              placeholder="Describe your salon"
            />
          </div>
        </div>

        {/* Hero Images */}
        <div className="mt-8 space-y-6">
          <h4 className="text-lg font-semibold text-gray-800">Hero Images</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Background Image */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">Background Image</label>
              <div className="relative group">
                {salonData.salon.background_image && (
                  <img 
                    src={salonData.salon.background_image} 
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
            </div>

            {/* Title Image */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">Title Image</label>
              <div className="relative group">
                {salonData.salon.title_image && (
                  <img 
                    src={salonData.salon.title_image} 
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'salon-info':
        return renderSalonInfo();
      // Add other sections as needed
      default:
        return renderSalonInfo();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <LeftNavbar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'} pt-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-3">
              Beauty Salon Administrator
            </h1>
            <p className="text-gray-600 text-lg">Manage your beauty salon information and services</p>
            
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
              <nav className="flex flex-wrap justify-center md:justify-start space-x-8 px-6" aria-label="Tabs">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`${
                      activeSection === item.id
                        ? 'border-pink-500 text-pink-600 bg-pink-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-4 border-b-2 font-semibold text-sm flex items-center space-x-2 rounded-t-lg transition-all`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <svg className="animate-spin w-12 h-12 text-pink-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div className="text-gray-500 text-lg">Loading beauty salon data...</div>
                  </div>
                </div>
              ) : (
                renderActiveSection()
              )}
            </div>

            {/* Save Button */}
            <div className="border-t border-gray-200 px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Changes are saved automatically to salon.json
                </div>
                <div className="flex items-center space-x-4">
                  {saveMessage && (
                    <div className={`text-sm font-medium ${saveMessage.includes('Error') || saveMessage.includes('⚠️') ? 'text-red-600' : 'text-green-600'}`}>
                      {saveMessage}
                    </div>
                  )}
                  <button
                    onClick={saveUserSettings}
                    disabled={isSaving}
                    className={`px-8 py-3 rounded-xl font-semibold text-white transition-all ${
                      isSaving
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-md hover:shadow-lg'
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
                      'Save Data'
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
