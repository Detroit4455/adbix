'use client';

import { useState } from 'react';

export default function PaymentSetupSection() {
  const [activePhase, setActivePhase] = useState<string>('phase1');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const phases = [
    {
      id: 'phase1',
      title: 'Phase 1: Razorpay Setup',
      description: 'Set up your Razorpay business account and enable UPI Autopay',
      checkpoints: [
        'Create Razorpay business account',
        'Complete business verification',
        'Generate Test API Keys',
        'Enable UPI Autopay feature',
        'Set authorization limits'
      ]
    },
    {
      id: 'phase2',
      title: 'Phase 2: Environment Config',
      description: 'Configure environment variables and verify setup',
      checkpoints: [
        'Create .env.local file',
        'Set RAZORPAY_KEY_ID',
        'Set RAZORPAY_KEY_SECRET',
        'Set RAZORPAY_WEBHOOK_SECRET',
        'Restart development server',
        'Test /billing page'
      ]
    },
    {
      id: 'phase3',
      title: 'Phase 3: Billing Plans',
      description: 'Create billing plans and add-ons in your system',
      checkpoints: [
        'Access admin panel',
        'Create Basic Plan (₹999/month)',
        'Create Pro Plan (₹1999/month)',
        'Create Enterprise Plan (₹4999/month)',
        'Create add-ons'
      ]
    },
    {
      id: 'phase4',
      title: 'Phase 4: Razorpay Plans',
      description: 'Create corresponding plans in Razorpay Dashboard',
      checkpoints: [
        'Go to Subscriptions → Plans',
        'Create plans in Razorpay',
        'Copy Razorpay plan IDs',
        'Update database with plan IDs',
        'Test plan creation API'
      ]
    },
    {
      id: 'phase5',
      title: 'Phase 5: Webhooks',
      description: 'Set up webhooks for real-time payment updates',
      checkpoints: [
        'Setup ngrok for development',
        'Configure webhook URL',
        'Add webhook in Razorpay Dashboard',
        'Select subscription events',
        'Test webhook verification'
      ]
    },
    {
      id: 'phase6',
      title: 'Phase 6: Testing',
      description: 'Comprehensive testing of the subscription system',
      checkpoints: [
        'Create test customer account',
        'Test UPI Autopay signup',
        'Test payment flows',
        'Verify database updates',
        'Test webhook events'
      ]
    },
    {
      id: 'phase7',
      title: 'Phase 7: Production',
      description: 'Switch to live mode and go live',
      checkpoints: [
        'Generate Live API Keys',
        'Update production environment',
        'Configure production webhooks',
        'Update Terms of Service',
        'Setup monitoring and alerts'
      ]
    }
  ];

  const currentPhase = phases.find(p => p.id === activePhase);

  return (
    <section className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Payment & Subscription Setup</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Admin Setup Guide</span>
          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
            UPI Autopay
          </span>
        </div>
      </div>

      {/* Overview Section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('overview')}
          className="flex items-center justify-between w-full p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <span className="text-purple-600 text-xl">🎯</span>
            <h3 className="text-lg font-medium text-purple-800">Overview & Prerequisites</h3>
          </div>
          <svg 
            className={`w-5 h-5 text-purple-600 transition-transform ${expandedSections.has('overview') ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expandedSections.has('overview') && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-3">System Capabilities</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• <strong>UPI Autopay</strong> for automatic recurring payments</li>
                  <li>• <strong>Flexible billing plans</strong> with add-ons</li>
                  <li>• <strong>Real-time payment tracking</strong> via webhooks</li>
                  <li>• <strong>Customer subscription management</strong></li>
                  <li>• <strong>Revenue analytics</strong> and reporting</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Prerequisites</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Admin access to Web as a Service platform</li>
                  <li>• Razorpay business account</li>
                  <li>• Bank account linked to Razorpay</li>
                  <li>• Domain with SSL (for production)</li>
                  <li>• MongoDB access for subscription data</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Phase Navigation */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {phases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => setActivePhase(phase.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activePhase === phase.id
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {phase.title}
            </button>
          ))}
        </div>
      </div>

      {/* Current Phase Details */}
      {currentPhase && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{currentPhase.title}</h3>
            <p className="text-gray-600">{currentPhase.description}</p>
          </div>

          <div className="space-y-3">
            {currentPhase.checkpoints.map((checkpoint, index) => (
              <div key={index} className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="text-sm text-gray-700 cursor-pointer">
                  {checkpoint}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-3">Quick Actions</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <a
            href="https://dashboard.razorpay.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="mr-2">🔗</span>
            Razorpay Dashboard
          </a>
          <a
            href="/billing"
            className="flex items-center justify-center p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <span className="mr-2">💳</span>
            Test Billing Page
          </a>
          <a
            href="/api/subscriptions"
            target="_blank"
            className="flex items-center justify-center p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <span className="mr-2">🔧</span>
            API Status
          </a>
        </div>
      </div>

      {/* Environment Variables Guide */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3">Environment Variables Setup</h4>
        <div className="bg-gray-800 text-green-400 p-4 rounded-lg text-sm font-mono">
          <div className="text-gray-400"># .env.local</div>
          <div>RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE</div>
          <div>RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_KEY_SECRET_HERE</div>
          <div>RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE</div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-yellow-600 text-xl mt-0.5">⚠️</span>
          <div>
            <h4 className="font-medium text-yellow-800 mb-2">Important Security Notes</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Never commit .env.local to version control</li>
              <li>• Use HTTPS for all webhook endpoints in production</li>
              <li>• Test thoroughly with Razorpay test credentials before going live</li>
              <li>• Keep webhook secrets secure and rotate API keys regularly</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Troubleshooting Section */}
      <div className="mt-6">
        <button
          onClick={() => toggleSection('troubleshooting')}
          className="flex items-center justify-between w-full p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <span className="text-red-600 text-xl">🚨</span>
            <h3 className="text-lg font-medium text-red-800">Troubleshooting Common Issues</h3>
          </div>
          <svg 
            className={`w-5 h-5 text-red-600 transition-transform ${expandedSections.has('troubleshooting') ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expandedSections.has('troubleshooting') && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">"Payment service not configured" Error</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-4">
                  <li>Verify all environment variables are set correctly</li>
                  <li>Restart development server after adding variables</li>
                  <li>Check Razorpay credential validity in dashboard</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Webhook signature verification failed</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-4">
                  <li>Ensure webhook secret matches environment variable</li>
                  <li>Check request timestamp tolerance</li>
                  <li>Verify webhook payload integrity</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">UPI Autopay mandate creation fails</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-4">
                  <li>Verify customer UPI ID format</li>
                  <li>Check Razorpay account UPI Autopay enablement</li>
                  <li>Ensure proper authorization limits are set</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resources */}
      <div className="mt-6 bg-green-50 rounded-lg p-4">
        <h4 className="font-medium text-green-800 mb-3">📚 Documentation & Resources</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-green-700 mb-2">Razorpay Documentation</h5>
            <ul className="space-y-1 text-green-600">
              <li>• <a href="https://razorpay.com/docs/subscriptions/" target="_blank" className="hover:underline">Subscriptions API</a></li>
              <li>• <a href="https://razorpay.com/docs/payments/upi-autopay/" target="_blank" className="hover:underline">UPI Autopay Integration</a></li>
              <li>• <a href="https://razorpay.com/docs/webhooks/" target="_blank" className="hover:underline">Webhook Implementation</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-green-700 mb-2">Internal Documentation</h5>
            <ul className="space-y-1 text-green-600">
              <li>• <a href="/admin" className="hover:underline">Admin Dashboard</a></li>
              <li>• Environment Setup Guide (ENVIRONMENT_SETUP.md)</li>
              <li>• Complete Setup Guide (ADMIN_SUBSCRIPTION_SETUP_GUIDE.md)</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
 