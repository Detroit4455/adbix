'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import LeftNavbar from '@/components/LeftNavbar';
import { 
  DocumentDuplicateIcon, 
  EyeIcon, 
  CogIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  CodeBracketIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface Widget {
  id: string;
  name: string;
  description: string;
  path: string;
  thumbnail: string;
  category: string;
  status: 'active' | 'draft' | 'new';
  features: string[];
}

export default function WidgetsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedWidgetId, setCopiedWidgetId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  if (status === 'loading') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
    </div>;
  }
  
  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  const userMobileNumber = session.user.mobileNumber;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const widgets: Widget[] = [
    {
      id: 'shop-status',
      name: 'Shop Status',
      description: 'Display and control your shop status with a sleek toggle interface that keeps customers informed about your business hours',
      path: `/widget-preview/${userMobileNumber}/shop-status`,
      thumbnail: '🛍️',
      category: 'business',
      status: 'active',
      features: ['Real-time status', 'Custom styling', 'Mobile responsive']
    },
    {
      id: 'image-gallery',
      name: 'Image Gallery',
      description: 'Beautiful sliding image gallery with smooth transitions, lazy loading, and customizable layouts perfect for showcasing your products',
      path: `/widget-preview/${userMobileNumber}/image-gallery`,
      thumbnail: '🖼️',
      category: 'media',
      status: 'active',
      features: ['Smooth transitions', 'Lazy loading', 'Multiple layouts', 'Touch support']
    },
    {
      id: 'contact-us',
      name: 'Contact Us',
      description: 'Professional contact form with validation, spam protection, and customizable fields to collect inquiries from your visitors',
      path: `/widget-preview/${userMobileNumber}/contact-us`,
      thumbnail: '📧',
      category: 'communication',
      status: 'active',
      features: ['Form validation', 'Spam protection', 'Custom fields', 'Email notifications']
    }
  ];

  const categories = [
    { id: 'all', name: 'All Widgets', count: widgets.length },
    { id: 'business', name: 'Business', count: widgets.filter(w => w.category === 'business').length },
    { id: 'media', name: 'Media', count: widgets.filter(w => w.category === 'media').length },
    { id: 'communication', name: 'Communication', count: widgets.filter(w => w.category === 'communication').length }
  ];

  const filteredWidgets = widgets.filter(widget => {
    const matchesSearch = widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         widget.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const copyEmbedCode = async (widget: Widget) => {
    const embedCode = `<iframe 
  src="${baseUrl}/widget-preview/${userMobileNumber}/${widget.id}" 
  width="250" 
  height="150" 
  frameborder="0"
  style="border: none;"
></iframe>`;
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(embedCode);
        setCopiedWidgetId(widget.id);
        setTimeout(() => setCopiedWidgetId(null), 2000);
      } else {
        // Fallback for older browsers or when clipboard API is not available
        const textArea = document.createElement('textarea');
        textArea.value = embedCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopiedWidgetId(widget.id);
            setTimeout(() => setCopiedWidgetId(null), 2000);
          } else {
            throw new Error('Copy command failed');
          }
        } catch (fallbackErr) {
          console.error('Fallback copy failed:', fallbackErr);
          alert('Failed to copy embed code. Please copy manually.');
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Failed to copy embed code:', err);
      // Final fallback - show the code in an alert for manual copying
      alert(`Embed code:\n\n${embedCode}\n\nPlease copy this code manually.`);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      new: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {status === 'new' && <SparklesIcon className="w-3 h-3 mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LeftNavbar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Header Section */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Widget Library
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Enhance your website with our collection of customizable widgets
              </p>
            </div>
            <div className="mt-6 lg:mt-0 lg:ml-6">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  {filteredWidgets.length} Widget{filteredWidgets.length !== 1 ? 's' : ''} Available
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search widgets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>

            {/* Category Filter */}
            <div className="sm:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredWidgets.map((widget) => (
            <div key={widget.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-indigo-200 transition-all duration-200 overflow-hidden group">
              {/* Widget Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{widget.thumbnail}</div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{widget.name}</h3>
                      {getStatusBadge(widget.status)}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {widget.description}
                </p>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
                  <div className="flex flex-wrap gap-1">
                    {widget.features.map((feature, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Embed Code Section */}
              <div className="px-6 pb-4">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 flex items-center">
                      <CodeBracketIcon className="w-4 h-4 mr-1" />
                      Embed Code
                    </h4>
                    <button
                      onClick={() => copyEmbedCode(widget)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      {copiedWidgetId === widget.id ? (
                        <>
                          <CheckIcon className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                          Copy Embed Code
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 pb-6">
                <div className="flex space-x-3">
                  <Link 
                    href={`/widget-preview/${userMobileNumber}/${widget.id}`}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors group"
                  >
                    <EyeIcon className="w-4 h-4 mr-2" />
                    Preview
                    <ChevronRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link 
                    href={`/widgets/manage/${userMobileNumber}/${widget.id}`}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <CogIcon className="w-4 h-4 mr-2" />
                    Manage
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredWidgets.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No widgets found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Clear filters
            </button>
          </div>
                 )}
       </div>
     </div>
       </div>
     </div>
   );
 } 