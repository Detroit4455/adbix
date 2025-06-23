'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <nav className={`bg-white ${isScrolled ? 'shadow sticky top-0 z-50' : ''} transition-shadow duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                adbix
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {session && session.user.role === 'admin' && (
              <div className="hidden md:flex space-x-1">
                <Link 
                  href="/admin" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin')
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  Admin
                </Link>
              </div>
            )}

            <div className="relative">
              {session ? (
                <div>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 focus:outline-none"
                  >
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                        {session.user?.name?.charAt(0) || session.user?.mobileNumber?.charAt(0) || 'U'}
                      </div>
                      <span className="ml-2 hidden md:block text-sm font-medium">{session.user?.name || session.user?.mobileNumber}</span>
                      <svg
                        className={`h-5 w-5 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsDropdownOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          <div className="px-4 py-2 border-b text-xs text-gray-500">
                            Signed in as <span className="font-medium text-gray-900 block truncate">{session.user?.mobileNumber}</span>
                          </div>
                          <Link 
                            href="/profile" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                            role="menuitem" 
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            Profile
                          </Link>
                          {session.user.role === 'admin' && (
                            <Link 
                              href="/admin" 
                              className="block px-4 py-2 text-sm text-purple-700 hover:bg-purple-50" 
                              role="menuitem" 
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              Admin Panel
                            </Link>
                          )}
                          <button
                            onClick={handleSignOut}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            role="menuitem"
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Link 
                    href="/login" 
                    className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-md text-sm font-medium hover:bg-indigo-50 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link 
                    href="/register" 
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 