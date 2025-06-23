import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import Link from 'next/link';
import InitSettingsButton from './InitSettingsButton';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  
  const adminCards = [
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      link: '/admin/users'
    },
    {
      title: 'Role Management',
      description: 'Define and manage user roles and permissions',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      link: '/admin/roles'
    },
    {
      title: 'Website Manager',
      description: 'Manage and deploy website configurations',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      link: '/websiteManager'
    },
    {
      title: 'Website Analytics',
      description: 'View statistics and analytics about website usage',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      link: '/admin/statistics'
    },
    {
      title: 'System Configuration',
      description: 'Configure system settings and preferences',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      link: '/admin/config'
    }
  ];

  // Filter cards based on user role
  const userRole = session?.user?.role || 'user';
  const filteredCards = adminCards.filter(card => {
    // Only show Website Manager to admin and devops
    if (card.title === 'Website Manager') {
      return userRole === 'admin' || userRole === 'devops';
    }
    return true;
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-600">Welcome, {session?.user?.name || 'Admin'}</h2>
                    <p className="text-gray-500">Admin dashboard for adbix</p>
        <div className="mt-4">
          <InitSettingsButton />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards.map((card) => (
          <Link 
            key={card.title} 
            href={card.link}
            className="bg-white rounded-lg shadow p-6 transition-all hover:shadow-lg hover:scale-105 transform"
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                {card.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{card.title}</h3>
              <p className="text-gray-500 text-sm">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-600 mb-1">Total Users</h4>
            <div className="text-2xl font-bold text-blue-800">1,240</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-600 mb-1">Active Websites</h4>
            <div className="text-2xl font-bold text-green-800">860</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-purple-600 mb-1">Storage Used</h4>
            <div className="text-2xl font-bold text-purple-800">324 GB</div>
          </div>
        </div>
      </div>
    </div>
  );
} 