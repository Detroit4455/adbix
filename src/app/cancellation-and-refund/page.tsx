import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy - adbix',
  description: 'Cancellation and Refund Policy for adbix',
};

export default function CancellationRefundPage() {
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">Cancellation & Refund Policy</h1>
          <p className="mt-4 text-indigo-100 max-w-2xl">Effective date: 2024-01-01</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow p-6 md:p-10 border border-gray-200">
          <div className="prose max-w-none prose-indigo">
            <p className="text-gray-600">This Cancellation & Refund Policy explains how cancellations and refunds are handled for services purchased on adbix.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">1. Subscription Cancellations</h2>
            <p className="text-gray-700">You can cancel your subscription at any time from your account settings. After cancellation, your plan remains active until the end of the current billing period. You will not be charged further unless you resubscribe.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">2. Refund Eligibility</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Refunds are generally not provided for partial billing periods after cancellation.</li>
              <li>If you experience a service issue caused by us, contact support within 7 days of the charge; we will review on a case-by-case basis.</li>
              <li>Fees paid to third parties (e.g., domain providers, payment gateways) are non-refundable.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">3. One-time Services</h2>
            <p className="text-gray-700">For one-time implementation or setup services, refunds are not available once work has commenced. If no work has started, you may request cancellation and a full refund.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">4. How to Request a Refund</h2>
            <p className="text-gray-700">Send your request to <a className="text-indigo-600 hover:text-indigo-700" href="mailto:support@adbix.app">support@adbix.app</a> with your account email, invoice ID, and a brief description of the issue. You can also call <a className="text-indigo-600 hover:text-indigo-700" href="tel:+917058266244">+91-7058266244</a>.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">5. Processing Time</h2>
            <p className="text-gray-700">If approved, refunds are typically processed within 5–10 business days to the original payment method. Processing times may vary by bank or payment provider.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">6. Chargebacks</h2>
            <p className="text-gray-700">Please contact us before initiating a chargeback. We are committed to resolving issues quickly and fairly.</p>

            <p className="text-gray-500 mt-8">We may update this policy periodically. Continued use of the service after updates constitutes acceptance of the revised policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


