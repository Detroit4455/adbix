'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RestaurantAdministrator() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dedicated restaurant administrator page
    router.push('/restaurant-administrator');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <svg className="animate-spin w-8 h-8 text-amber-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-600">Redirecting to Restaurant Administrator...</p>
      </div>
    </div>
  );
}