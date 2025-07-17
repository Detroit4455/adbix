'use client';

import Navbar from '@/components/Navbar';
import LeftNavbar from '@/components/LeftNavbar';
import { useState } from 'react';
import { 
  DocumentDuplicateIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  UserGroupIcon,
  CubeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

export default function HowToPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <LeftNavbar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <SparklesIcon className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Get Your Website Online</h1>
              <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
                Choose the perfect way to create your professional website. Start with templates or get custom development.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Main Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            
            {/* Card 1: Build from a Template */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mb-4">
                    <DocumentDuplicateIcon className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Build from a Template</h2>
                  <p className="text-gray-600 mb-2">
                    Get online instantly with our stunning, ready-to-use templates.
                  </p>
                  <p className="text-lg font-semibold text-green-600">It's completely FREE!</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Quick Launch & Intuitive Editor</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Fully Responsive & SEO Optimized</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Diverse Designs for Any Industry</span>
                  </div>
                </div>

                <a
                  href="/templates"
                  className="w-full inline-flex items-center justify-center bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                  Browse Templates
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </a>
              </div>
            </div>

            {/* Card 2: Request Custom Development */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col justify-between min-h-[480px] p-0">
              <div className="p-8 pb-0">
                {/* Icon and Title Row */}
                <div className="flex items-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mr-4">
                    <CodeBracketIcon className="h-8 w-8 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 rounded-lg inline-block shadow-md">
                    Request Custom Development
                  </span>
                </div>
                {/* Description */}
                <div className="mb-2 text-center">
                  <span className="font-semibold text-blue-700 text-lg">Have a unique vision?</span>
                  <span className="text-gray-700 block mt-1">Our expert team will design and develop a bespoke website tailored precisely to your specific requirements.</span>
                </div>
                {/* Price Line */}
                <div className="text-center mb-6">
                  <span className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                    with a one-time development charge starting from ₹199!
                  </span>
                </div>
                {/* Checklist */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Tailored Design & Advanced Features</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Dedicated Project Manager & Support</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Scalable & Future-Proof Architecture</span>
                  </div>
                </div>
              </div>
              {/* Button */}
              <div className="p-8 pt-0">
                <a
                  href="/contact"
                  className="w-full inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <PhoneIcon className="h-5 w-5 mr-2" />
                  Request Custom Development
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </a>
              </div>
            </div>
          </div>

          {/* Additional Info Section */}
          <div className="mt-16 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 text-center border border-gray-200">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Need Help Choosing?</h3>
              <p className="text-gray-600 mb-8 text-lg">
                Not sure which option is right for you? Here's a quick comparison to help you decide.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="flex items-center mb-4">
                    <DocumentDuplicateIcon className="h-6 w-6 text-green-600 mr-2" />
                    <h4 className="text-lg font-semibold text-gray-900">Choose Templates If:</h4>
                  </div>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      You want to launch quickly
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      You prefer no upfront costs
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      A template design fits your needs
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      You want to customize it yourself
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="flex items-center mb-4">
                    <CodeBracketIcon className="h-6 w-6 text-blue-600 mr-2" />
                    <h4 className="text-lg font-semibold text-gray-900">Choose Custom Development If:</h4>
                  </div>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      You have specific design requirements
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      You need advanced functionality
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      You want professional assistance
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      You need a unique, branded experience
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
              Whether you choose a template or custom development, we're here to help you create an amazing website.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/templates"
                className="inline-flex items-center bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
              >
                <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                Start with Templates
              </a>
              <a
                href="/contact"
                className="inline-flex items-center bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-800 transition-colors"
              >
                <PhoneIcon className="h-5 w-5 mr-2" />
                Request Custom Development
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 