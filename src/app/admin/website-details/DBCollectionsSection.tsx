'use client';

import { useState, useEffect } from 'react';

export default function DBCollectionsSection() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCollections() {
      try {
        const response = await fetch('/api/admin/db-collections');
        
        if (response.ok) {
          const data = await response.json();
          setCollections(data.collections);
        } else {
          setError('Failed to fetch collections data');
        }
      } catch (e) {
        setError('Error connecting to database');
      } finally {
        setLoading(false);
      }
    }

    fetchCollections();
  }, []);

  return (
    <section className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Database Collections</h2>
      {loading ? (
        <div className="text-gray-600">Loading collections data...</div>
      ) : error ? (
        <div className="text-red-600 bg-red-50 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {collections.map((collection: any) => (
            <div key={collection.name} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-gray-800">{collection.displayName}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {collection.count} records
                  </span>
                  {collection.lastUpdated && (
                    <span>
                      Last updated: {new Date(collection.lastUpdated).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-gray-600 mb-2">{collection.description}</p>
              <p className="text-sm text-gray-500">{collection.summary}</p>
              {collection.error && (
                <p className="text-red-500 text-sm mt-2">⚠️ {collection.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
} 