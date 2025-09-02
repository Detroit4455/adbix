import type { Metadata } from 'next';
import Link from 'next/link';
import ContactForm from '@/components/ContactForm';
import { PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

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
      <div className="pt-16 pb-12 bg-gradient-to-br from-cyan-900 to-black relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl animate-pulse"></div>
          <div className="absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl animate-pulse"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">Contact Us</h1>
          <p className="mt-4 text-cyan-100 max-w-2xl">
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
                  <p className="text-gray-900 font-medium">support@adbix.in</p>
                </div>
              </div>

              <a
                href="https://wa.me/917058266244"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
                aria-label="WhatsApp +91-7058266244"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-white mr-3">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </span>
                <div>
                  <p className="text-sm text-gray-500">WhatsApp</p>
                  <p className="text-gray-900 font-medium">+91-7058266244</p>
                </div>
              </a>
            </div>

            <div className="mt-6 p-4 bg-indigo-50 rounded-xl text-sm text-indigo-800">
              Need immediate assistance? WhatsApp us for quick responses during business hours.
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


