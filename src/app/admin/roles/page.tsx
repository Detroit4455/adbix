import React from 'react';
import Link from 'next/link';

export default function RolesManagementPage() {
  // This would normally fetch data from your database
  const roles = [
    { 
      id: 1, 
      name: 'Admin', 
      description: 'Full system access with all permissions',
      userCount: 2,
      permissions: ['manage_users', 'manage_roles', 'manage_content', 'view_statistics', 'configure_system']
    },
    { 
      id: 2, 
      name: 'User', 
      description: 'Standard user with limited access',
      userCount: 120,
      permissions: ['view_content', 'edit_own_content']
    },
    { 
      id: 3, 
      name: 'Editor', 
      description: 'Can create and edit content',
      userCount: 15,
      permissions: ['view_content', 'edit_content', 'create_content']
    },
    { 
      id: 4, 
      name: 'Viewer', 
      description: 'Read-only access to content',
      userCount: 45,
      permissions: ['view_content']
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Role Management</h2>
        <div className="flex space-x-3">
          <Link 
            href="/admin/roles/manage"
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage Role Settings
          </Link>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
            Add New Role
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{role.name}</h3>
                <p className="text-sm text-gray-500">{role.description}</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors text-sm">
                  Edit
                </button>
                {role.name !== 'Admin' && role.name !== 'User' && (
                  <button className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm">
                    Delete
                  </button>
                )}
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium text-gray-700">Permissions</h4>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {role.userCount} Users
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {role.permissions.map((permission) => (
                  <span 
                    key={permission} 
                    className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-md"
                  >
                    {permission.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 