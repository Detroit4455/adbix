import React from 'react';
import { connectToDatabase } from '@/lib/db';
import ClientRoleManager from '@/app/admin/roles/manage/ClientRoleManager';

export default async function ManageRoleSettingsPage() {
  // Connect to the database
  const { db } = await connectToDatabase();

  // Fetch role settings from the database
  const roleSettings = await db.collection('settings').findOne({ type: 'roles' }) || {
    roles: ['admin', 'user', 'devops', 'manager'] // Default roles if not found
  };

  // Default website manager permissions
  const defaultPermissions = {
    admin: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canDeploy: true
    },
    devops: {
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canDeploy: true
    },
    user: {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canDeploy: false
    },
    manager: {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canDeploy: false
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Manage Role Settings</h2>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Available Roles</h3>
          <p className="text-sm text-gray-500 mb-6">
            Configure the roles that can be assigned to users in the system. These roles will be available in dropdown menus when editing user permissions.
          </p>

          <ClientRoleManager initialRoles={roleSettings.roles} />
        </div>
      </div>

      <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Role Permissions</h3>
          <p className="text-sm text-gray-500 mb-6">
            Here you can define which permissions are associated with each role. Note that the 'admin' role always has all permissions.
          </p>

          <table className="min-w-full divide-y divide-gray-200 mb-8">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Default Permissions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                    admin
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">Full system access</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">All permissions</div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    user
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">Standard user</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">View content, manage own profile</div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    devops
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">DevOps engineer</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">System configuration, deployment management</div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    manager
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">Project manager</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">View statistics, manage team members</div>
                </td>
              </tr>
            </tbody>
          </table>
          
          {/* Website Manager Permissions Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Website Manager Permissions</h3>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Website Manager permissions are currently configurable in the User Management section. Only users with 'admin' or 'devops' roles can access the Website Manager.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Role</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Create</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Edit</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Delete</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Deploy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  <tr>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">Admin</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="text-green-600">✓</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="text-green-600">✓</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="text-green-600">✓</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="text-green-600">✓</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">DevOps</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="text-green-600">✓</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="text-green-600">✓</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="text-red-600">✗</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="text-green-600">✓</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">User</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="text-red-600">✗</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="text-red-600">✗</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="text-red-600">✗</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="text-red-600">✗</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">Manager</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="text-red-600">✗</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="text-red-600">✗</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="text-red-600">✗</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="text-red-600">✗</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 