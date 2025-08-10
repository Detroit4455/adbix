import type { Metadata } from 'next';
import Link from 'next/link';
import ContactForm from '@/components/ContactForm';
import { PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Contact - adbix',
  description: 'Get in touch with adbix',
};

export default function ContactPage() {
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">Contact Us</h1>
          <p className="mt-4 text-indigo-100 max-w-2xl">
            We would love to hear about your project. Reach out and we’ll get back to you shortly.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details */}
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Get in touch</h2>
            <div className="space-y-4">
              <a
                href="tel:+917058266244"
                className="flex items-start p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                aria-label="Call +91-7058266244"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white mr-3">
                  <PhoneIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm text-gray-500">Call us</p>
                  <p className="text-gray-900 font-medium">+91-7058266244</p>
                </div>
              </a>

              <div className="flex items-start p-4 bg-gray-50 rounded-xl">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 text-gray-700 mr-3">
                  <EnvelopeIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900 font-medium">support@adbix.app</p>
                </div>
              </div>

              <div className="flex items-start p-4 bg-gray-50 rounded-xl">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 text-gray-700 mr-3">
                  <MapPinIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm text-gray-500">Office</p>
                  <p className="text-gray-900 font-medium">Remote-first</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-indigo-50 rounded-xl text-sm text-indigo-800">
              Prefer WhatsApp? Message us at the same number.
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow p-6 md:p-8 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Send us a message</h2>
              <p className="text-gray-600 mb-6">Fill out the form and our team will respond as soon as possible.</p>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


