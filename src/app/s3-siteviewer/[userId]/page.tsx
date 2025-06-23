import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import S3SiteTabView from '@/components/S3SiteTabView';
import Navbar from '@/components/Navbar';
import { checkResourceAccess } from '@/lib/rbac';

export default async function S3SiteViewerPage({ params, searchParams }: { 
  params: { userId: string }, 
  searchParams: { path?: string } 
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  const { userId } = params;
  const path = searchParams.path || '';
  
  // Check if the user has access to view this user's site
  const userRole = session.user?.role || 'user';
  const isAdmin = await checkResourceAccess('user-management', userRole);
  const isSelf = session.user?.mobileNumber === userId;
  
  if (!isAdmin && !isSelf) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Access Denied!</strong>
            <span className="block sm:inline"> You don't have permission to view this user's S3 site.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      {/* Hero section with enhanced styling */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-500 text-white shadow-md">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">S3 Site Viewer</h1>
              <p className="text-indigo-100 text-lg">
                Managing website for: <span className="font-semibold">{userId}</span>
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <a 
                href={`https://dt-web-sites.s3.ap-south-1.amazonaws.com/sites/${userId}/index.html`}
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white text-indigo-700 hover:bg-indigo-50 transition-colors px-4 py-2 rounded-md shadow font-medium flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Live Site
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Quick info bar */}
        <div className="bg-indigo-50 rounded-lg p-4 mb-6 border border-indigo-100 shadow-sm">
          <div className="flex flex-wrap items-center text-sm">
            <div className="mr-6 mb-2 md:mb-0 flex items-center text-indigo-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>S3 Access Path: <code className="bg-white px-1 py-0.5 rounded text-indigo-700 font-mono text-xs">sites/{userId}/</code></span>
            </div>
            <div className="flex items-center text-indigo-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Edit access granted: <span className="font-medium">{isAdmin ? 'Admin Rights' : 'User Rights'}</span></span>
            </div>
          </div>
        </div>
        
        {/* Main content area with tabbed interface */}
        <div className="mb-8">
          <S3SiteTabView userId={userId} initialPath={path} />
        </div>
        
        {/* Access Information - Enhanced with card-based layout */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
          <div className="bg-gray-50 p-4 border-b border-gray-200">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-800">S3 Website Information</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Direct Access Card */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-blue-50 px-4 py-2 border-b border-blue-100">
                  <h3 className="font-semibold text-blue-800">Amazon S3 Direct Access</h3>
                </div>
                <div className="p-4">
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <code className="text-sm text-blue-700 font-mono break-all">
                      https://dt-web-sites.s3.ap-south-1.amazonaws.com/sites/{userId}/index.html
                    </code>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Use this URL to directly access your S3-hosted website
                  </p>
                </div>
              </div>
              
              {/* Important Notes Card */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-blue-50 px-4 py-2 border-b border-blue-100">
                  <h3 className="font-semibold text-blue-800">Important Notes</h3>
                </div>
                <div className="p-4">
                  <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
                    <li>This viewer shows the actual files stored on Amazon S3</li>
                    <li>Navigate through directories by clicking on them</li>
                    <li>Files will open in a new tab when clicked</li>
                    <li>The website configuration controls the structure and appearance of your site</li>
                    <li>Changes to colors in the configuration will be reflected in your website</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Help Resources Section */}
            <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
              <h3 className="text-sm font-medium text-indigo-800 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Help Resources
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <a href="#" className="bg-white p-2 rounded border border-indigo-100 hover:bg-indigo-50 transition-colors flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Documentation
                </a>
                <a href="#" className="bg-white p-2 rounded border border-indigo-100 hover:bg-indigo-50 transition-colors flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                  Video Tutorials
                </a>
                <a href="#" className="bg-white p-2 rounded border border-indigo-100 hover:bg-indigo-50 transition-colors flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  FAQs
                </a>
                <a href="#" className="bg-white p-2 rounded border border-indigo-100 hover:bg-indigo-50 transition-colors flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer area */}
      <div className="bg-gray-50 border-t border-gray-200 mt-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center text-sm text-gray-600">
            <p>&copy; 2023 adbix. All rights reserved.</p>
            <div className="mt-2 md:mt-0 flex space-x-4">
              <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 