import React from 'react';
import Navbar from '@/components/Navbar';

export default function WebsiteManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-6">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
} 