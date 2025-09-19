'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { IRbacMatrix } from '@/models/RbacSettings';

interface RbacMatrixManagerProps {
  initialMatrix: IRbacMatrix[];
}

export default function RbacMatrixManager({ initialMatrix }: RbacMatrixManagerProps) {
  const [matrix, setMatrix] = useState<IRbacMatrix[]>(initialMatrix);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // Available roles
  const roles = ['admin', 'devops', 'user', 'manager'];

  // Available resources - add more resources here as needed
  const availableResources = ['website-manager', 'image-repo', 'my-images', 'upload-website', 'file-manager'];
  
  // Resource descriptions for tooltips
  const getResourceDescription = (resource: string): string => {
    const descriptions: { [key: string]: string } = {
      'website-manager': 'Controls access to website management features in the admin panel',
      'image-repo': 'Controls access to the shared image repository where users can browse and use images',
      'my-images': 'Controls access to personal image gallery where users can upload and manage their own images',
      'upload-website': 'Controls ability to upload and deploy websites to S3 hosting',
      'file-manager': 'Controls access to the File Manager tab in S3 Website Manager (/web_on_s3) where users can upload, edit, delete, and organize website files'
    };
    return descriptions[resource] || 'No description available';
  };
  
  // Handle toggling a role's access to a resource
  const handleToggleAccess = (resourceName: string, roleName: string) => {
    setMatrix(prevMatrix => {
      // Create a deep copy of the matrix
      const newMatrix = JSON.parse(JSON.stringify(prevMatrix)) as IRbacMatrix[];
      
      // Find the resource in the matrix
      const resourceIndex = newMatrix.findIndex(r => r.resource === resourceName);
      
      if (resourceIndex === -1) {
        // If resource doesn't exist, add it
        const newResource: IRbacMatrix = {
          resource: resourceName,
          roles: {
            [roleName]: true,
            // Default admin to true, others to false
            ...Object.fromEntries(roles.filter(r => r !== roleName).map(r => [r, r === 'admin']))
          }
        };
        newMatrix.push(newResource);
      } else {
        // Toggle the role's access
        const resource = newMatrix[resourceIndex];
        if (roleName === 'admin') {
          // Admin always has access, don't allow toggling
          resource.roles.admin = true;
        } else {
          resource.roles[roleName] = !resource.roles[roleName];
        }
      }
      
      return newMatrix;
    });
  };

  // Save RBAC settings to database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/rbac-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matrix,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update RBAC settings');
      }

      setSuccess('RBAC settings updated successfully');
      router.refresh(); // Refresh the page to show updated data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Resource</th>
                {roles.map(role => (
                  <th key={role} scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {availableResources.map(resource => {
                const resourceSettings = matrix.find(m => m.resource === resource) || {
                  resource,
                  roles: {
                    admin: true,
                    devops: false,
                    user: false,
                    manager: false
                  }
                };
                
                return (
                  <tr key={resource}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span>{resource.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                        <div className="relative group">
                          <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap max-w-xs z-10">
                            {getResourceDescription(resource)}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    {roles.map(role => (
                      <td key={`${resource}-${role}`} className="whitespace-nowrap px-3 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={role === 'admin' ? true : !!resourceSettings.roles[role]}
                          onChange={() => handleToggleAccess(resource, role)}
                          disabled={role === 'admin'} // Admin always has access
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {error && (
          <div className="mt-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-3 text-sm text-green-600">
            {success}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Saving...' : 'Save RBAC Settings'}
          </button>
        </div>
      </form>
    </div>
  );
} 