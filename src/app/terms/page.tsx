import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms and Conditions - adbix',
  description: 'Terms and Conditions for using adbix',
};

export default function TermsPage() {
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">Terms and Conditions</h1>
          <p className="mt-4 text-indigo-100 max-w-2xl">Effective date: 2024-01-01</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow p-6 md:p-10 border border-gray-200">
          <div className="prose max-w-none prose-indigo">
            <p className="text-gray-600">These Terms and Conditions ("Terms") govern your access to and use of adbix (the "Service"). By accessing or using the Service, you agree to be bound by these Terms.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">1. Acceptance of Terms</h2>
            <p className="text-gray-700">You must be at least 18 years old or have parental consent to use the Service. If you do not agree with these Terms, do not use the Service.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">2. Use of the Service</h2>
            <p className="text-gray-700">You agree to use the Service only for lawful purposes and in compliance with all applicable laws and regulations. You are responsible for your content and activity within the Service.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">3. Accounts and Security</h2>
            <p className="text-gray-700">You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">4. Content Ownership</h2>
            <p className="text-gray-700">You retain ownership of content you upload. By uploading content, you grant adbix a limited license to host, display, and distribute the content solely to provide the Service.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">5. Payments and Subscriptions</h2>
            <p className="text-gray-700">Paid features may be offered via subscription plans. Fees, billing cycles, and cancellation terms are presented at checkout. Taxes may apply. Failed payments may result in suspension.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">6. Prohibited Activities</h2>
            <p className="text-gray-700">You agree not to misuse the Service, including but not limited to distributing malware, infringing intellectual property, abusing bandwidth, or attempting to breach security.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">7. Termination</h2>
            <p className="text-gray-700">We may suspend or terminate access to the Service at our discretion for violations of these Terms or for other legitimate reasons. You may stop using the Service at any time.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">8. Disclaimer and Limitation of Liability</h2>
            <p className="text-gray-700">The Service is provided on an "as is" basis without warranties of any kind. To the fullest extent permitted by law, adbix is not liable for any indirect, incidental, or consequential damages.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">9. Changes to the Terms</h2>
            <p className="text-gray-700">We may update these Terms from time to time. Material changes will be posted on this page. Continued use of the Service after changes constitutes acceptance.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">10. Contact Us</h2>
            <p className="text-gray-700">Questions about these Terms? Contact <a className="text-indigo-600 hover:text-indigo-700" href="mailto:support@adbix.in">support@adbix.in</a> or call <a className="text-indigo-600 hover:text-indigo-700" href="tel:+917058266244">+91-7058266244</a>.</p>

            <p className="text-gray-500 mt-8">If any provision of these Terms is found unenforceable, the remaining provisions will remain in effect.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


