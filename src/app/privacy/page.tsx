import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - adbix',
  description: 'Privacy Policy for adbix',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      <div className="absolute right-4 top-4 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md border border-indigo-600 bg-white/80 px-3 py-1.5 text-sm font-medium text-indigo-700 shadow-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Go to home page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 1.293a1 1 0 00-1.414 0l-8 8A1 1 0 002 11h1v6a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001 1h4a1 1 0 001-1v-6h1a1 1 0 00.707-1.707l-8-8z" />
          </svg>
          Home
        </Link>
      </div>
      {/* Hero */}
      <div className="pt-16 pb-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">Privacy Policy</h1>
          <p className="mt-4 text-indigo-100 max-w-2xl">Effective date: 2024-01-01</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow p-6 md:p-10 border border-gray-200">
          <div className="prose max-w-none prose-indigo">
            <p className="text-gray-600">This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use adbix.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">Information We Collect</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Account information such as name, email, and phone number</li>
              <li>Usage data and device information</li>
              <li>Content you upload or manage through the platform</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>To provide and maintain the service</li>
              <li>To improve performance and user experience</li>
              <li>To communicate important updates and support</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">Sharing of Information</h2>
            <p className="text-gray-700">We do not sell your personal information. We may share data with trusted service providers to operate the platform as needed and in compliance with applicable laws.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">Data Security</h2>
            <p className="text-gray-700">We use administrative, technical, and physical safeguards to protect your information. However, no method of transmission over the internet is 100% secure.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">Your Rights</h2>
            <p className="text-gray-700">You may request access, correction, or deletion of your personal data, subject to legal requirements.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">Contact Us</h2>
            <p className="text-gray-700">If you have questions about this policy, contact us at <a className="text-indigo-600 hover:text-indigo-700" href="mailto:support@adbix.in">support@adbix.in</a> or call <a className="text-indigo-600 hover:text-indigo-700" href="tel:+917058266244">+91-7058266244</a>.</p>

            <p className="text-gray-500 mt-8">We may update this Privacy Policy from time to time. We encourage you to review it periodically.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


