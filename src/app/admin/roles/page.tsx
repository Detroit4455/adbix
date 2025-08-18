import React from 'react';
import Link from 'next/link';
import { connectToDatabase } from '@/lib/db';
import { connectMongoose } from '@/lib/db';
import RbacSettings from '@/models/RbacSettings';
import User from '@/models/User';

function toTitle(str: string) {
  return str
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function RolesManagementPage() {
  // Fetch role list from settings
  const { db } = await connectToDatabase();
  const settings = await db.collection('settings').findOne({ type: 'roles' });
  const roleNames: string[] = settings?.roles || ['admin', 'user', 'devops', 'manager'];

  // Ensure RBAC exists and fetch matrix
  await RbacSettings.initializeDefaultSettings();
  const rbac = await RbacSettings.findOne().lean();
  const matrix = rbac?.matrix || [];

  // Build role cards with live counts and resources
  const roles = await Promise.all(
    roleNames.map(async (name, idx) => {
      const count = await User.countDocuments({ role: name });
      const accessibleResources = matrix
        .filter((m: any) => (m.roles instanceof Map ? m.roles.get(name) : m.roles?.[name]) === true)
        .map((m: any) => toTitle(m.resource));

      let description = 'Custom role';
      if (name === 'admin') description = 'Full system access with all permissions';
      else if (name === 'user') description = 'Standard user with limited access';
      else if (name === 'devops') description = 'DevOps engineer with deployment access';
      else if (name === 'manager') description = 'Project/Team manager access';

      return {
        id: idx + 1,
        name: toTitle(name),
        description,
        userCount: count,
        permissions: accessibleResources
      };
    })
  );

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
              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {role.userCount} Users
              </div>
            </div>
            <div className="px-6 py-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Accessible Resources</h4>
              {role.permissions.length === 0 ? (
                <div className="text-xs text-gray-500">No explicit resources assigned</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((perm: string) => (
                    <span key={perm} className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-md">
                      {perm}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}