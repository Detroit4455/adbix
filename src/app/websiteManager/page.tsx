import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkResourceAccess } from '@/lib/rbac';
import Link from 'next/link';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  mobileNumber: string | null;
  role: string | null;
  createdAt: Date;
}

export const metadata = {
  title: 'Website Manager',
  description: 'Manage website configurations and deployments',
};

export default async function WebsiteManagerPage() {
  // Check if user is authenticated and has the right role
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }
  
  // Check if user has access to website-manager
  const userRole = session.user.role || 'user';
  const hasAccess = await checkResourceAccess('website-manager', userRole);
  
  if (!hasAccess) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
        <p className="text-gray-700">
          You do not have permission to access this page. Only users with appropriate roles can access Website Manager.
        </p>
      </div>
    );
  }

  // Fetch users from database using Mongoose
  await dbConnect();
  const usersData = await User.find({})
    .sort({ createdAt: -1 })
    .select('name email mobileNumber role createdAt')
    .lean();
  
  // Convert MongoDB documents to plain objects with explicit type casting
  const users: User[] = usersData.map((user: any) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    mobileNumber: user.mobileNumber,
    role: user.role,
    createdAt: user.createdAt
  }));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Website Manager</h2>
        <div className="flex space-x-3">
          <Link 
            href="/web_on_s3" 
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            New S3 Website
          </Link>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-800">User Websites on S3</h3>
          <p className="text-sm text-gray-600 mt-1">
            View and manage user websites deployed on Amazon S3
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mobile Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created On
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user: User) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name || 'No Name'}</div>
                          <div className="text-sm text-gray-500">{user.email || 'No Email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.mobileNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                          user.role === 'manager' ? 'bg-blue-100 text-blue-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        {user.mobileNumber && (
                          <>
                            <a 
                              href={`https://dt-web-sites.s3.ap-south-1.amazonaws.com/sites/${user.mobileNumber}/index.html`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View Site
                            </a>
                            <span className="text-gray-300">|</span>
                            <Link 
                              href={`/s3-siteviewer/${user.mobileNumber}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Manage Files
                            </Link>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Additional Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">S3 Website Management</h3>
        <p className="text-gray-600 mb-4">
          This page allows you to view and manage websites deployed by users on Amazon S3.
        </p>
        
        <div className="bg-blue-50 p-4 rounded-md">
          <p className="text-sm text-blue-700 font-medium mb-2">Available Management Features:</p>
          <ul className="list-disc ml-5 text-sm text-blue-700 space-y-1">
            <li>View a list of all users with websites on S3</li>
            <li>Direct links to view each user's live website</li>
            <li>File browser to navigate and manage S3 content</li>
            <li>Upload new websites via the S3 Website Upload page</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 