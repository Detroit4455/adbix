import React from 'react';
import { connectToDatabase } from '@/lib/db';

interface User {
  _id: any;
  name?: string;
  email?: string;
  mobileNumber?: string;
  role?: string;
  status?: string;
  lastUpdated?: Date;
}

interface FormattedUser {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  role: string;
  status: string;
  lastUpdated: string;
}

export default async function UserManagementPage() {
  // Connect to the database
  const { db } = await connectToDatabase();
  
  // Fetch all users from the database
  const users: User[] = await db.collection('users').find({}).project({
    _id: 1,
    name: 1,
    email: 1,
    mobileNumber: 1,
    role: 1,
    status: 1,
    lastUpdated: 1,
  }).toArray();

  // Fetch available roles from settings table
  const roleSettings = await db.collection('settings').findOne({ type: 'roles' }) || {
    roles: ['admin', 'user', 'devops', 'manager'] // Default roles if not found in settings
  };

  const availableRoles = roleSettings.roles || ['admin', 'user', 'devops', 'manager'];

  // Format users for display
  const formattedUsers: FormattedUser[] = users.map((user: User) => ({
    id: user._id.toString(),
    name: user.name || 'No Name',
    email: user.email || 'No Email',
    mobileNumber: user.mobileNumber || 'No Mobile',
    role: user.role || 'user',
    status: user.status || 'active',
    lastUpdated: user.lastUpdated ? new Date(user.lastUpdated).toLocaleDateString() : 'Never'
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">User Management</h2>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
          Add New User
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mobile Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formattedUsers.map((user: FormattedUser) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.mobileNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                       user.role === 'devops' ? 'bg-green-100 text-green-800' :
                       user.role === 'manager' ? 'bg-yellow-100 text-yellow-800' :
                       'bg-blue-100 text-blue-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.lastUpdated}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                    <a 
                      href={`/admin/users/edit-role/${user.id}?name=${encodeURIComponent(user.name)}&role=${user.role}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit Role
                    </a>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{formattedUsers.length}</span> of <span className="font-medium">{formattedUsers.length}</span> results
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border rounded-md text-sm text-gray-600 hover:bg-gray-50">Previous</button>
              <button className="px-3 py-1 border rounded-md text-sm text-gray-600 hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 