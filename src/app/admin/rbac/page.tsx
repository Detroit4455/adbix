import React from 'react';
import { connectMongoose } from '@/lib/db';
import RbacMatrixManager from '@/app/admin/rbac/RbacMatrixManager';
import RbacSettings, { IRbacMatrix } from '@/models/RbacSettings';

// Helper function to sanitize data for client components
function sanitizeMatrix(matrix: any[]): IRbacMatrix[] {
  return matrix.map(item => {
    // Ensure roles is a plain object
    let roles = item.roles;
    if (item.roles instanceof Map) {
      roles = {};
      item.roles.forEach((value: boolean, key: string) => {
        roles[key] = value;
      });
    } else if (typeof item.roles.toJSON === 'function') {
      // Handle any custom toJSON methods
      roles = item.roles.toJSON();
    }
    
    return {
      resource: item.resource,
      roles
    };
  });
}

export default async function RbacManagementPage() {
  try {
    // Connect to the database
    await connectMongoose();
    
    // Initialize default settings if not exists
    await RbacSettings.initializeDefaultSettings();
    
    // Fetch RBAC settings from the database with lean to get plain JS objects
    const settings = await RbacSettings.findOne().maxTimeMS(5000).lean().exec();
    
    // Default matrix if not found
    const defaultMatrix: IRbacMatrix[] = [
      {
        resource: 'website-manager',
        roles: {
          admin: true,
          devops: true,
          user: false,
          manager: false
        }
      },
      {
        resource: 'image-repo',
        roles: {
          admin: true,
          devops: true,
          user: false,
          manager: false
        }
      }
    ];
    
    // Sanitize data to avoid serialization issues
    const matrix = settings?.matrix ? sanitizeMatrix(settings.matrix) : defaultMatrix;

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">RBAC Management</h2>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resource Access Matrix</h3>
            <p className="text-sm text-gray-500 mb-6">
              Configure which roles have access to different resources in the system. Check the boxes to grant access.
            </p>

            <RbacMatrixManager initialMatrix={matrix} />
            
            <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-md font-medium text-blue-800 mb-2">How RBAC Works</h4>
              <p className="text-sm text-blue-700 mb-2">
                Role-Based Access Control (RBAC) lets you control who can access different parts of the system based on their role.
              </p>
              <ul className="list-disc list-inside text-sm text-blue-700">
                <li>The admin role always has access to all resources</li>
                <li>Changes are applied immediately system-wide</li>
                <li>You can define custom access patterns for different roles</li>
                <li>Resources not listed here default to admin-only access</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading RBAC management page:', error);
    
    // Return error UI
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">RBAC Management</h2>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
          <h3 className="text-lg font-medium mb-2">Error Loading RBAC Settings</h3>
          <p>There was a problem connecting to the database. Please try again later or contact your administrator.</p>
        </div>
      </div>
    );
  }
} 