'use client';

import React, { useEffect, useState } from 'react';

interface User {
  _id: any;
  name?: string;
  email?: string;
  mobileNumber?: string;
  role?: string;
  status?: string;
  requireSubscriptionCheck?: boolean;
  lastUpdated?: Date;
}

interface FormattedUser {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  role: string;
  status: string;
  requireSubscriptionCheck: boolean;
  lastUpdated: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<FormattedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 100;

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search.trim()) params.set('search', search.trim());
      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users || []);
      if (data.pagination) {
        setPages(data.pagination.pages || 1);
        setTotal(data.pagination.total || 0);
      } else {
        setPages(1);
        setTotal((data.users || []).length);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Toggle subscription check for a user
  const toggleSubscriptionCheck = async (userId: string, requireSubscriptionCheck: boolean) => {
    try {
      const response = await fetch('/api/admin/toggle-subscription-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, requireSubscriptionCheck }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle subscription check');
      }

      // Refresh the users list
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle subscription check');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  // Realtime search with debounce
  useEffect(() => {
    const handle = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        fetchUsers();
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg text-gray-600">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error: {error}</div>
        <button 
          onClick={fetchUsers}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">User Management</h2>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, mobile..."
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
          <button
            onClick={() => { setPage(1); fetchUsers(); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1); fetchUsers(); }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
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
                  Subscription Check
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
              {users.map((user: FormattedUser) => (
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
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.requireSubscriptionCheck ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user.requireSubscriptionCheck ? 'Enabled' : 'Disabled'}
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
                    <button 
                      onClick={() => toggleSubscriptionCheck(user.id, !user.requireSubscriptionCheck)}
                      className={`${user.requireSubscriptionCheck ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                    >
                      {user.requireSubscriptionCheck ? 'Disable Sub Check' : 'Enable Sub Check'}
                    </button>
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
              Page <span className="font-medium">{page}</span> of <span className="font-medium">{pages}</span> • Total <span className="font-medium">{total}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={`px-3 py-1 border rounded-md text-sm ${page <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => (p < pages ? p + 1 : p))}
                disabled={page >= pages}
                className={`px-3 py-1 border rounded-md text-sm ${page >= pages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 