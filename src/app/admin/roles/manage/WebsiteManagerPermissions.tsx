'use client';

import React, { useState } from 'react';

interface WebsiteManagerPermissionsProps {
  initialPermissions: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canDeploy: boolean;
  };
  role: string;
  onSave: (permissions: any) => void;
}

export default function WebsiteManagerPermissions({ 
  initialPermissions, 
  role,
  onSave 
}: WebsiteManagerPermissionsProps) {
  const [permissions, setPermissions] = useState({
    canCreate: initialPermissions?.canCreate || false,
    canEdit: initialPermissions?.canEdit || false,
    canDelete: initialPermissions?.canDelete || false,
    canDeploy: initialPermissions?.canDeploy || false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleTogglePermission = (permission: string) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission as keyof typeof prev]
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSave({ websiteManager: permissions });
    } catch (error) {
      console.error('Error saving permissions:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Determine if this role should have these permissions editable
  // Only admin and devops should have website manager permissions
  const isEditableRole = role === 'admin' || role === 'devops';
  
  return (
    <div className="mt-6 border-t border-gray-200 pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Website Manager Permissions</h3>
      
      {!isEditableRole ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Website Manager permissions are only applicable for admin and devops roles.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="canCreate"
                  name="canCreate"
                  type="checkbox"
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  checked={permissions.canCreate}
                  onChange={() => handleTogglePermission('canCreate')}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="canCreate" className="font-medium text-gray-700">Create Websites</label>
                <p className="text-gray-500">Can create new website configurations</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="canEdit"
                  name="canEdit"
                  type="checkbox"
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  checked={permissions.canEdit}
                  onChange={() => handleTogglePermission('canEdit')}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="canEdit" className="font-medium text-gray-700">Edit Websites</label>
                <p className="text-gray-500">Can modify existing website configurations</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="canDelete"
                  name="canDelete"
                  type="checkbox"
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  checked={permissions.canDelete}
                  onChange={() => handleTogglePermission('canDelete')}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="canDelete" className="font-medium text-gray-700">Delete Websites</label>
                <p className="text-gray-500">Can remove website configurations</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="canDeploy"
                  name="canDeploy"
                  type="checkbox"
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  checked={permissions.canDeploy}
                  onChange={() => handleTogglePermission('canDeploy')}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="canDeploy" className="font-medium text-gray-700">Deploy Websites</label>
                <p className="text-gray-500">Can deploy websites to production environments</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Save Permissions'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 