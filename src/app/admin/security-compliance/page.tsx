'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

interface ComplianceRequirement {
  id: string;
  name: string;
  status: 'In Place' | 'Not Applicable' | 'Not in Place';
  evidence: string;
  implementation: string;
  fileLocation?: string;
}

export default function SecurityCompliancePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('overview');

  const complianceRequirements: ComplianceRequirement[] = [
    {
      id: 'req2',
      name: 'Requirement 2: Secure System Configuration',
      status: 'In Place',
      evidence: 'Security headers implemented in next.config.js',
      implementation: 'HSTS, CSP, X-Frame-Options, X-Content-Type-Options',
      fileLocation: 'next.config.js'
    },
    {
      id: 'req3',
      name: 'Requirement 3: Cardholder Data Protection',
      status: 'Not Applicable',
      evidence: 'No cardholder data stored in application',
      implementation: 'All payment data handled exclusively by Razorpay',
      fileLocation: 'src/app/api/webhooks/razorpay/route.ts'
    },
    {
      id: 'req6',
      name: 'Requirement 6: Secure Application Development',
      status: 'In Place',
      evidence: 'Secure coding practices implemented',
      implementation: 'Input validation, secure webhook handling, signature verification',
      fileLocation: 'Multiple files'
    },
    {
      id: 'req8',
      name: 'Requirement 8: Access Control and Authentication',
      status: 'In Place',
      evidence: 'Strong authentication with NextAuth implementation',
      implementation: 'Secure JWT secrets required, role-based access control',
      fileLocation: 'src/app/api/auth/'
    },
    {
      id: 'req9',
      name: 'Requirement 9: Physical Access to Cardholder Data',
      status: 'Not Applicable',
      evidence: 'Cloud-hosted application with no physical card data handling',
      implementation: 'No cardholder data stored or processed locally',
      fileLocation: 'Cloud Environment'
    },
    {
      id: 'req11',
      name: 'Requirement 11: Security Testing',
      status: 'In Place',
      evidence: 'Security testing implemented through webhook verification',
      implementation: 'Rate limiting (100 requests/minute), Replay protection (5-minute window)',
      fileLocation: 'src/app/api/webhooks/razorpay/route.ts'
    },
    {
      id: 'req12',
      name: 'Requirement 12: Information Security Policy',
      status: 'In Place',
      evidence: 'PCI DSS implementation document',
      implementation: 'Security procedures and compliance measures documented',
      fileLocation: 'PCI_DSS_COMPLIANCE_IMPLEMENTATION.md'
    }
  ];

  const getStatusBadge = (status: ComplianceRequirement['status']) => {
    const colors = {
      'In Place': 'bg-green-100 text-green-800',
      'Not Applicable': 'bg-gray-100 text-gray-800',
      'Not in Place': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
        {status}
      </span>
    );
  };

  if (!session || session.user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Security & Compliance Dashboard</h1>
          <p className="mt-2 text-gray-600">
            PCI DSS compliance status and security controls implementation
          </p>
        </div>

        {/* Compliance Status Overview */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900">SAQ A Compliant</h2>
              <p className="text-gray-600">Your application meets PCI DSS requirements for SAQ A</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">5</div>
              <div className="text-sm text-green-800">Requirements In Place</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">2</div>
              <div className="text-sm text-gray-800">Not Applicable</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-blue-800">Not in Place</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'requirements', name: 'PCI DSS Requirements', icon: '📋' },
              { id: 'architecture', name: 'Security Architecture', icon: '🏗️' },
              { id: 'controls', name: 'Security Controls', icon: '🛡️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Implementation Overview</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">🔐 Authentication Security</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• NextAuth.js implementation with secure sessions</li>
                      <li>• Role-based access control (Admin, User, Manager)</li>
                      <li>• Secure JWT secrets with fail-fast validation</li>
                      <li>• bcrypt password hashing</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">🌐 Network Security</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• HTTPS enforcement with HSTS headers</li>
                      <li>• Content Security Policy (CSP) implementation</li>
                      <li>• Frame protection and XSS prevention</li>
                      <li>• Secure referrer and permissions policies</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">🔒 Data Protection</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• No cardholder data storage or processing</li>
                      <li>• Minimal payment metadata retention</li>
                      <li>• Encrypted data transmission (HTTPS only)</li>
                      <li>• Sensitive data excluded from logs</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">⚡ API Security</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Webhook signature verification</li>
                      <li>• Rate limiting (100 requests/minute)</li>
                      <li>• Replay protection (5-minute window)</li>
                      <li>• Input validation and sanitization</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PCI DSS Requirements Tab */}
          {activeTab === 'requirements' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">PCI DSS Requirements Assessment</h3>
              
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>SAQ A Qualification:</strong> Your application uses Razorpay as a third-party payment processor 
                  and never stores, processes, or transmits cardholder data directly.
                </p>
              </div>
              
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requirement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Implementation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Evidence Location
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {complianceRequirements.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{req.name}</div>
                          <div className="text-sm text-gray-500">{req.evidence}</div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(req.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {req.implementation}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {req.fileLocation}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Security Architecture Tab */}
          {activeTab === 'architecture' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Architecture & Data Flow</h3>
              
              <div className="space-y-8">
                {/* Payment Flow Diagram */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Payment Flow Architecture</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
{`┌─────────────┐    HTTPS     ┌──────────────────┐    Secure API    ┌─────────────────┐
│   Customer  │──────────────│  Your Web App    │───────────────────│   Razorpay API  │
│   Browser   │              │  (PCI Scope Out) │                   │ (PCI Compliant) │
└─────────────┘              └──────────────────┘                   └─────────────────┘
       │                              │                                       │
       │ 1. Initiate Payment          │ 2. Create Subscription               │
       │                              │                                       │
       ▼                              ▼                                       ▼
┌─────────────┐    Redirect    ┌──────────────────┐    Payment Data   ┌─────────────────┐
│   Customer  │◄───────────────│  Razorpay        │◄──────────────────│  Payment        │
│   Payment   │                │  Checkout Page   │                   │  Processing     │
└─────────────┘                └──────────────────┘                   └─────────────────┘
       │                              │                                       │
       │ 3. Enter Card Details        │ 4. Process Payment                   │
       │    (NEVER touches your app)  │    (All CHD handled here)            │
       │                              │                                       │
       ▼                              ▼                                       ▼
┌─────────────┐    Webhook     ┌──────────────────┐   Minimal Data    ┌─────────────────┐
│  Payment    │────────────────│  Your Webhook    │◄──────────────────│  Razorpay       │
│  Complete   │                │  (Non-CHD only)  │                   │  Webhook        │
└─────────────┘                └──────────────────┘                   └─────────────────┘`}
                    </pre>
                  </div>
                </div>

                {/* Data Flow Diagram */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Cardholder Data Isolation</h4>
                  <div className="bg-red-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-red-800 font-medium">
                      🚫 CRITICAL: Your application environment NEVER contains Cardholder Data (CHD)
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
                      <h5 className="font-medium text-red-900 mb-2">Customer Input</h5>
                      <ul className="text-sm text-red-800 space-y-1">
                        <li>🔒 Card Number</li>
                        <li>🔒 CVV</li>
                        <li>🔒 Expiry Date</li>
                        <li>🔒 Cardholder Name</li>
                      </ul>
                      <p className="text-xs text-red-700 mt-2">❌ NEVER touches your app</p>
                    </div>
                    
                    <div className="border border-green-200 bg-green-50 p-4 rounded-lg">
                      <h5 className="font-medium text-green-900 mb-2">Your Application</h5>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>✅ Payment ID</li>
                        <li>✅ Amount</li>
                        <li>✅ Status</li>
                        <li>✅ Timestamp</li>
                        <li>✅ Last 4 Digits*</li>
                        <li>✅ Card Network*</li>
                      </ul>
                      <p className="text-xs text-green-700 mt-2">*Safe to store per PCI DSS</p>
                    </div>
                    
                    <div className="border border-blue-200 bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-2">Razorpay (PCI Compliant)</h5>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>✅ Securely Processed</li>
                        <li>✅ Encrypted Storage</li>
                        <li>✅ PCI Vault</li>
                        <li>✅ Tokenization</li>
                      </ul>
                      <p className="text-xs text-blue-700 mt-2">PCI DSS Level 1 Compliant</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Controls Tab */}
          {activeTab === 'controls' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Controls Implementation Matrix</h3>
              
              <div className="space-y-6">
                {[
                  {
                    category: '🔐 Authentication',
                    controls: [
                      { name: 'User Authentication', impl: 'NextAuth.js implementation', location: 'src/app/api/auth/', status: '✅' },
                      { name: 'Session Management', impl: 'Secure JWT with rotation', location: 'src/middleware.ts', status: '✅' },
                      { name: 'Password Security', impl: 'bcrypt hashing', location: 'src/models/User.ts', status: '✅' },
                      { name: 'Environment Secrets', impl: 'Required JWT/NextAuth secrets', location: 'Environment Variables', status: '✅' }
                    ]
                  },
                  {
                    category: '🌐 Network Security',
                    controls: [
                      { name: 'HTTPS Enforcement', impl: 'HSTS headers (31536000 sec)', location: 'next.config.js', status: '✅' },
                      { name: 'Content Security', impl: 'CSP with Razorpay whitelist', location: 'next.config.js', status: '✅' },
                      { name: 'Frame Protection', impl: 'X-Frame-Options: DENY', location: 'next.config.js', status: '✅' },
                      { name: 'XSS Protection', impl: 'X-XSS-Protection headers', location: 'next.config.js', status: '✅' }
                    ]
                  },
                  {
                    category: '🔒 Data Protection',
                    controls: [
                      { name: 'CHD Avoidance', impl: 'No cardholder data storage', location: 'Entire Application', status: '✅' },
                      { name: 'Data Minimization', impl: 'Minimal payment metadata only', location: 'src/app/api/webhooks/', status: '✅' },
                      { name: 'Sensitive Data Logs', impl: 'No sensitive data in logs', location: 'All API endpoints', status: '✅' },
                      { name: 'Encryption Transit', impl: 'HTTPS only communication', location: 'next.config.js', status: '✅' }
                    ]
                  },
                  {
                    category: '⚡ API Security',
                    controls: [
                      { name: 'Webhook Verification', impl: 'Razorpay signature validation', location: 'src/app/api/webhooks/', status: '✅' },
                      { name: 'Rate Limiting', impl: '100 requests/min per IP', location: 'src/app/api/webhooks/', status: '✅' },
                      { name: 'Replay Protection', impl: '5-minute event deduplication', location: 'src/app/api/webhooks/', status: '✅' },
                      { name: 'Input Validation', impl: 'Request data validation', location: 'All API endpoints', status: '✅' }
                    ]
                  }
                ].map((section, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                      <h4 className="text-md font-semibold text-gray-900">{section.category}</h4>
                    </div>
                    <div className="p-6">
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 text-sm font-medium text-gray-700">Control</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-700">Implementation</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-700">Location</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-700">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {section.controls.map((control, idx) => (
                              <tr key={idx} className="border-b border-gray-100">
                                <td className="py-2 text-sm text-gray-900">{control.name}</td>
                                <td className="py-2 text-sm text-gray-600">{control.impl}</td>
                                <td className="py-2 text-sm">
                                  <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">
                                    {control.location}
                                  </code>
                                </td>
                                <td className="py-2 text-sm">{control.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-4">
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Export Report
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Download Documentation
          </button>
        </div>
      </div>
    </div>
  );
}
