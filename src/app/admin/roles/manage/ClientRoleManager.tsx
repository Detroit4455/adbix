'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ClientRoleManagerProps {
  initialRoles: string[];
}

export default function ClientRoleManager({ initialRoles }: ClientRoleManagerProps) {
  const [roles, setRoles] = useState<string[]>(initialRoles);
  const [newRole, setNewRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleAddRole = () => {
    if (!newRole.trim()) {
      setError('Role name cannot be empty');
      return;
    }

    // Convert to lowercase and remove special characters
    const formattedRole = newRole.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    if (roles.includes(formattedRole)) {
      setError('This role already exists');
      return;
    }

    setRoles([...roles, formattedRole]);
    setNewRole('');
    setError('');
  };

  const handleRemoveRole = (roleToRemove: string) => {
    // Don't allow removing admin or user roles
    if (roleToRemove === 'admin' || roleToRemove === 'user') {
      setError(`The ${roleToRemove} role cannot be removed as it is a system role.`);
      return;
    }

    setRoles(roles.filter(role => role !== roleToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/update-role-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roles,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role settings');
      }

      setSuccess('Role settings updated successfully');
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
        <div>
          <label htmlFor="roles" className="block text-sm font-medium text-gray-700 mb-2">
            Available Roles
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {roles.map((role) => (
              <div 
                key={role} 
                className={`
                  flex items-center px-3 py-1 rounded-full text-sm
                  ${role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                    role === 'user' ? 'bg-blue-100 text-blue-800' :
                    role === 'devops' ? 'bg-green-100 text-green-800' :
                    role === 'manager' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'}
                `}
              >
                {role}
                <button 
                  type="button"
                  onClick={() => handleRemoveRole(role)}
                  disabled={role === 'admin' || role === 'user'}
                  className={`ml-2 ${
                    role === 'admin' || role === 'user' 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-500 hover:text-red-500'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="flex">
            <input
              type="text"
              id="new-role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Add new role"
            />
            <button
              type="button"
              onClick={handleAddRole}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add
            </button>
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
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <p className="text-sm text-gray-700 mb-4">
            <strong>Note:</strong> The 'admin' and 'user' roles are system roles and cannot be removed. Additional roles you define here will be available when assigning roles to users.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Saving...' : 'Save Role Settings'}
          </button>
        </div>
      </form>
    </div>
  );
} 