'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import LeftNavbar from '@/components/LeftNavbar';
import Link from 'next/link';
import { 
  ChartBarIcon,
  ServerIcon,
  DocumentDuplicateIcon,
  PhotoIcon,
  UserCircleIcon,
  GlobeAltIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CogIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    redirect('/login');
  }

  const userName = session.user?.name || session.user?.mobileNumber || 'User';
  const userRole = session.user?.role || 'user';

  // Quick action cards
  const quickActions = [
    {
      title: 'Upload Website',
      description: 'Deploy your website to S3',
      href: '/web_on_s3',
      icon: ServerIcon,
      color: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      hoverColor: 'hover:from-blue-600 hover:to-indigo-700'
    },
    {
      title: 'Manage Widgets',
      description: 'Create and customize widgets',
      href: '/widgets',
      icon: DocumentDuplicateIcon,
      color: 'bg-gradient-to-r from-purple-500 to-pink-600',
      hoverColor: 'hover:from-purple-600 hover:to-pink-700'
    },
    {
      title: 'Image Gallery',
      description: 'Organize your images',
      href: '/image_repo',
      icon: PhotoIcon,
      color: 'bg-gradient-to-r from-green-500 to-emerald-600',
      hoverColor: 'hover:from-green-600 hover:to-emerald-700'
    },
    {
      title: 'Learning Center',
      description: 'Learn how to build websites',
      href: '/howto',
      icon: ChartBarIcon,
      color: 'bg-gradient-to-r from-orange-500 to-red-600',
      hoverColor: 'hover:from-orange-600 hover:to-red-700'
    }
  ];

  // Recent activity items (mock data - replace with real data)
  const recentActivity = [
    { action: 'Website uploaded', time: '5 minutes ago', icon: GlobeAltIcon },
    { action: 'Widget created', time: '1 hour ago', icon: DocumentDuplicateIcon },
    { action: 'Images uploaded', time: '2 hours ago', icon: PhotoIcon },
    { action: 'Profile updated', time: '1 day ago', icon: UserCircleIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <LeftNavbar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <div className="bg-white/20 rounded-full p-3 mr-4">
                    <UserCircleIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold">Welcome back, {userName}!</h1>
                    <p className="text-indigo-100 mt-1">Ready to build something amazing today?</p>
                  </div>
                </div>
                <div className="flex items-center text-indigo-100 text-sm">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  {currentTime.toLocaleString()}
                </div>
              </div>
              
              {/* User Info Card */}
              <div className="mt-8 lg:mt-0 lg:ml-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-center">
                    <div className="bg-white/20 rounded-full p-4 mx-auto mb-3 w-16 h-16 flex items-center justify-center">
                      <UserCircleIcon className="h-8 w-8" />
                    </div>
                    <h3 className="font-semibold text-lg">{userName}</h3>
                    <p className="text-indigo-100 text-sm capitalize">{userRole} Account</p>
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <div className="text-xs text-indigo-100">Mobile: {session.user?.mobileNumber}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Actions Grid */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
              <ArrowTrendingUpIcon className="h-6 w-6 text-gray-400" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={index}
                    href={action.href}
                    className={`group relative overflow-hidden rounded-2xl ${action.color} ${action.hoverColor} text-white p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200`}
                  >
                    <div className="relative z-10">
                      <Icon className="h-8 w-8 mb-4 group-hover:scale-110 transition-transform duration-200" />
                      <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                      <p className="text-sm opacity-90">{action.description}</p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Dashboard Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                </div>
                
                <div className="space-y-4">
                  {recentActivity.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="bg-indigo-100 rounded-lg p-2 mr-4">
                          <Icon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.action}</p>
                          <p className="text-xs text-gray-500">{item.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Link 
                    href="/web_on_s3" 
                    className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                  >
                    View all activity →
                  </Link>
                </div>
              </div>
            </div>

            {/* System Status & Quick Links */}
            <div className="space-y-6">
              {/* System Status */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">S3 Storage</span>
                    <span className="text-sm font-medium text-green-600">Online</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">CDN</span>
                    <span className="text-sm font-medium text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Widgets</span>
                    <span className="text-sm font-medium text-green-600">Available</span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
                
                <div className="space-y-2">
                  <Link href="/web_on_s3" className="flex items-center p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <ServerIcon className="h-4 w-4 mr-3 text-gray-400" />
                    S3 Website Manager
                  </Link>
                  <Link href="/widgets" className="flex items-center p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <DocumentDuplicateIcon className="h-4 w-4 mr-3 text-gray-400" />
                    Widget Library
                  </Link>
                  <Link href="/image_repo" className="flex items-center p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <PhotoIcon className="h-4 w-4 mr-3 text-gray-400" />
                    Image Repository
                  </Link>
                  <Link href="/howto" className="flex items-center p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <ChartBarIcon className="h-4 w-4 mr-3 text-gray-400" />
                    How-To Guides
                  </Link>
                  {userRole === 'admin' && (
                    <Link href="/admin" className="flex items-center p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                      <CogIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Admin Panel
                    </Link>
                  )}
                </div>
              </div>

              {/* Help & Resources */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get started with our comprehensive guides and tutorials.
                </p>
                <Link 
                  href="/howto" 
                  className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  View Tutorials
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 