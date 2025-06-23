import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import Navbar from '@/components/Navbar';
import S3SiteViewer from '@/components/S3SiteViewer';

interface SiteViewerPageProps {
  params: {
    mobileno: string;
  };
  searchParams?: {
    path?: string;
  };
}

export default async function SiteViewerPage({ 
  params, 
  searchParams 
}: SiteViewerPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const { mobileno } = params;
  const initialPath = searchParams?.path || 'index.html';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="bg-indigo-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">S3 Website Viewer</h1>
          <p className="text-indigo-100">
            Viewing site for mobile number: <span className="font-semibold">{mobileno}</span>
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-800">Website Preview</h2>
            </div>
            <div className="flex items-center">
              <a 
                href={`https://dt-web-sites.s3.ap-south-1.amazonaws.com/sites/${mobileno}/${initialPath}`}
                target="_blank"
                rel="noopener noreferrer" 
                className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
              >
                View Original S3 URL
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            This preview loads content from your S3 bucket through a proxy.
          </p>
        </div>

        <S3SiteViewer 
          userId={mobileno} 
          initialPath={initialPath}
        />
        
        <div className="mt-8 p-4 border rounded-lg bg-blue-50 border-blue-200">
          <h3 className="text-md font-semibold text-blue-800 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Access Information
          </h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p>You can access this website through Next.js using these URLs:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong>Local URL:</strong>
                <code className="ml-2 px-2 py-1 bg-blue-100 rounded text-blue-900 font-mono break-all">
                  http://localhost:3000/site/{mobileno}/{initialPath}
                </code>
              </li>
              <li>
                <strong>Original S3 URL:</strong>
                <code className="ml-2 px-2 py-1 bg-blue-100 rounded text-blue-900 font-mono break-all">
                  https://dt-web-sites.s3.ap-south-1.amazonaws.com/sites/{mobileno}/{initialPath}
                </code>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 