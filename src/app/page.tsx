'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  ServerIcon,
  DocumentDuplicateIcon,
  PhotoIcon,
  CodeBracketIcon,
  CloudArrowUpIcon,
  GlobeAltIcon,
  SparklesIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  ArrowRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: CloudArrowUpIcon,
      title: 'Fast Deployment',
      description: 'Deploy your website instantly with our streamlined process and automated infrastructure.',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      icon: ServerIcon,
      title: 'Web Hosting',
      description: 'Reliable web hosting with global CDN',
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: DocumentDuplicateIcon,
      title: 'Smart Widgets',
      description: 'Enhance your website with customizable widgets for better user engagement.',
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: PhotoIcon,
      title: 'Image Management',
      description: 'Organize and optimize your images with our built-in gallery management system.',
      color: 'from-orange-500 to-red-600'
    }
  ];

  const benefits = [
    'No technical expertise required',
    'Automatic SSL certificates',
    'Global CDN distribution',
    'Real-time preview',
    'Mobile-responsive designs',
    'SEO optimization tools'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [features.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
                        <div className="flex items-center">
              <div className="h-10 w-10 mr-3">
                <img 
                  src="/favicon_io/android-chrome-192x192.png" 
                  alt="adbix" 
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">
                adbix
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left lg:flex lg:items-center">
              <div>
                <div className="inline-flex items-center bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full px-4 py-2 mb-6">
                  <SparklesIcon className="h-4 w-4 text-indigo-600 mr-2" />
                  <span className="text-sm font-medium text-indigo-700">
                    Professional website hosting made simple
                  </span>
                </div>
                
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl xl:text-7xl">
                  <span className="block">We build,</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    you focus on your business
                  </span>
                </h1>
                
                <p className="mt-6 text-lg text-gray-600 sm:text-xl max-w-3xl">
                  Our experts designs, develops, and maintains complete website solutions tailored to your needs. You'll always have full control, easily modifying text and replacing images yourself.
                </p>
                
                <div className="mt-8 sm:flex sm:justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link
                    href="/register"
                    className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                  >
                    <RocketLaunchIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    Start Building Now
                    <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  <Link
                    href="/howto"
                    className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 hover:border-indigo-500 text-gray-700 hover:text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all duration-200"
                  >
                    <LightBulbIcon className="h-5 w-5 mr-2" />
                    Learn How
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Feature Showcase */}
            <div className="mt-16 lg:mt-0 lg:col-span-6">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Platform Features</h3>
                  <div className="flex justify-center space-x-2 mb-6">
                    {features.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentFeature(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentFeature ? 'bg-indigo-600 w-8' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="text-center">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={index}
                        className={`transition-all duration-500 ${
                          index === currentFeature ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute'
                        }`}
                      >
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} text-white mb-4`}>
                          <Icon className="h-8 w-8" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h4>
                        <p className="text-gray-600">{feature.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase mb-4">
              Why Choose Us
            </h2>
            <h3 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Everything you need to succeed online
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors group">
                <div className="bg-indigo-100 group-hover:bg-indigo-200 rounded-lg p-2 mr-4">
                  <CheckIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-gray-700 group-hover:text-indigo-700 font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Details */}
      <div className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">
              Powerful features for modern websites
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform provides everything you need to create, host, and manage professional websites
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: CloudArrowUpIcon,
                title: 'Instant Deployment',
                description: 'Upload your files and go live in seconds with automatic optimization'
              },
              {
                icon: ServerIcon,
                title: 'Reliable Infrastructure',
                description: 'Built on Amazon S3 with global CDN for maximum performance'
              },
              {
                icon: ShieldCheckIcon,
                title: 'Secure & Fast',
                description: 'SSL certificates and security features included by default'
              },
              {
                icon: CodeBracketIcon,
                title: 'Developer Friendly',
                description: 'Support for all modern web technologies and frameworks'
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-3 w-fit mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-4">
            Ready to launch your website?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust our platform for their web hosting needs. 
            Start your journey today with our easy-to-use tools.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-lg"
            >
              <RocketLaunchIcon className="h-5 w-5 mr-2" />
              Create Account
            </Link>
            <Link
              href="/howto"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-indigo-600 transition-all"
            >
              <CodeBracketIcon className="h-5 w-5 mr-2" />
              View Documentation
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 mr-3">
                  <img 
                    src="/favicon_io/android-chrome-192x192.png" 
                    alt="adbix" 
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="text-xl font-bold text-white">adbix</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Professional website hosting and management platform designed for developers, 
                businesses, and anyone who wants to build amazing websites.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/login" className="block text-gray-400 hover:text-white transition-colors">Sign In</Link>
                <Link href="/register" className="block text-gray-400 hover:text-white transition-colors">Create Account</Link>
                <Link href="/howto" className="block text-gray-400 hover:text-white transition-colors">Documentation</Link>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <div className="space-y-2">
                <span className="block text-gray-400">Web Hosting</span>
                <span className="block text-gray-400">Widget Library</span>
                <span className="block text-gray-400">Image Management</span>
                <span className="block text-gray-400">SSL Security</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
                             <p className="text-gray-400 text-sm">
                 © 2024 adbix. All rights reserved.
               </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <span className="text-gray-400 text-sm">Privacy Policy</span>
                <span className="text-gray-400 text-sm">Terms of Service</span>
                <span className="text-gray-400 text-sm">Support</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
