'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function SecurityCompliancePublicPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const complianceStats = {
    totalRequirements: 7,
    implemented: 5,
    notApplicable: 2,
    inProgress: 0
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Security & Compliance</h1>
            <p className="text-xl text-indigo-100 mb-8">
              PCI DSS SAQ A Compliant Web-as-a-Service Platform
            </p>
            <div className="inline-flex items-center bg-green-500 text-white px-6 py-3 rounded-full">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              PCI DSS Compliant
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4">
            {[
              { id: 'overview', name: 'Overview', icon: '🔍' },
              { id: 'compliance', name: 'PCI DSS Compliance', icon: '🛡️' },
              { id: 'security', name: 'Security Features', icon: '🔒' },
              { id: 'architecture', name: 'Architecture', icon: '🏗️' },
              { id: 'certifications', name: 'Certifications', icon: '📜' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeSection === item.id
                    ? 'bg-indigo-100 text-indigo-700 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Enterprise-Grade Security</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Our platform is built with security-first principles, ensuring your data and payments 
                are protected with industry-leading security standards and PCI DSS compliance.
              </p>
            </div>

            {/* Security Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-green-50 p-6 rounded-xl text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-green-600">{complianceStats.implemented}</div>
                <div className="text-sm text-green-800 font-medium">Security Controls</div>
                <div className="text-xs text-green-600">Implemented</div>
              </div>

              <div className="bg-blue-50 p-6 rounded-xl text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-blue-600">256-bit</div>
                <div className="text-sm text-blue-800 font-medium">SSL Encryption</div>
                <div className="text-xs text-blue-600">End-to-End</div>
              </div>

              <div className="bg-purple-50 p-6 rounded-xl text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-sm text-purple-800 font-medium">CHD Storage</div>
                <div className="text-xs text-purple-600">Complete Isolation</div>
              </div>

              <div className="bg-orange-50 p-6 rounded-xl text-center">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-orange-600">SAQ A</div>
                <div className="text-sm text-orange-800 font-medium">PCI DSS Level</div>
                <div className="text-xs text-orange-600">Certified</div>
              </div>
            </div>

            {/* Key Security Features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-8 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-6">🔐 Authentication & Access</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3">✓</span>
                    <span>Multi-factor authentication support</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3">✓</span>
                    <span>Role-based access control (RBAC)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3">✓</span>
                    <span>Secure session management</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3">✓</span>
                    <span>Password encryption with bcrypt</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 p-8 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-6">🌐 Network Security</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3">✓</span>
                    <span>HTTPS enforcement with HSTS</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3">✓</span>
                    <span>Content Security Policy (CSP)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3">✓</span>
                    <span>XSS and clickjacking protection</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3">✓</span>
                    <span>Rate limiting and DDoS protection</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* PCI DSS Compliance Section */}
        {activeSection === 'compliance' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">PCI DSS SAQ A Compliance</h2>
              <p className="text-lg text-gray-600">
                Our platform meets all requirements for PCI DSS Self-Assessment Questionnaire A
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-900">SAQ A Qualified</h3>
              </div>
              <p className="text-green-800 mb-4">
                We qualify for SAQ A because we use Razorpay as a third-party payment processor 
                and never store, process, or transmit cardholder data directly.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-900 mb-2">✅ Requirements Met:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Secure system configuration</li>
                    <li>• Secure application development</li>
                    <li>• Access control implementation</li>
                    <li>• Security testing procedures</li>
                    <li>• Information security policies</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-green-900 mb-2">🔒 Not Applicable:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Cardholder data protection (no CHD stored)</li>
                    <li>• Physical access restrictions (cloud-hosted)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Compliance Timeline */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Compliance Implementation Timeline</h3>
              <div className="space-y-4">
                {[
                  { phase: 'Phase 1', title: 'Security Headers Implementation', status: 'completed', description: 'HSTS, CSP, and security headers deployed' },
                  { phase: 'Phase 2', title: 'Authentication Security', status: 'completed', description: 'NextAuth integration with secure session management' },
                  { phase: 'Phase 3', title: 'Webhook Security', status: 'completed', description: 'Signature verification, rate limiting, replay protection' },
                  { phase: 'Phase 4', title: 'Data Minimization', status: 'completed', description: 'Implemented minimal payment metadata storage' },
                  { phase: 'Phase 5', title: 'Documentation & Audit', status: 'completed', description: 'Comprehensive security documentation completed' }
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                      item.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="font-medium text-gray-900">{item.phase}: {item.title}</h4>
                        <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                          item.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Security Features Section */}
        {activeSection === 'security' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Advanced Security Features</h2>
              <p className="text-lg text-gray-600">
                Comprehensive security controls protecting your data and applications
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: '🔐',
                  title: 'Authentication Security',
                  features: [
                    'NextAuth.js integration',
                    'Secure JWT tokens',
                    'Session management',
                    'Password encryption'
                  ]
                },
                {
                  icon: '🌐',
                  title: 'Network Protection',
                  features: [
                    'HTTPS enforcement',
                    'Security headers',
                    'Content Security Policy',
                    'XSS protection'
                  ]
                },
                {
                  icon: '🔒',
                  title: 'Data Protection',
                  features: [
                    'No CHD storage',
                    'Data minimization',
                    'Encrypted transmission',
                    'Secure logging'
                  ]
                },
                {
                  icon: '⚡',
                  title: 'API Security',
                  features: [
                    'Webhook verification',
                    'Rate limiting',
                    'Replay protection',
                    'Input validation'
                  ]
                },
                {
                  icon: '👥',
                  title: 'Access Control',
                  features: [
                    'Role-based permissions',
                    'Admin controls',
                    'User management',
                    'Audit logging'
                  ]
                },
                {
                  icon: '📊',
                  title: 'Monitoring',
                  features: [
                    'Security event logging',
                    'Real-time monitoring',
                    'Compliance tracking',
                    'Incident response'
                  ]
                }
              ].map((category, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="text-3xl mb-4">{category.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{category.title}</h3>
                  <ul className="space-y-2">
                    {category.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Architecture Section */}
        {activeSection === 'architecture' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Security Architecture</h2>
              <p className="text-lg text-gray-600">
                Secure-by-design architecture with complete cardholder data isolation
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Payment Processing Flow</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <pre className="text-sm text-gray-700 overflow-x-auto whitespace-pre">
{`Customer → Your Application → Razorpay Checkout → Payment Processing
                ↓                      ↓                     ↓
        Secure Interface      PCI Compliant Form    Encrypted Storage
                ↓                      ↓                     ↓
          Non-CHD Data  ←   Webhook Response  ←   Payment Complete
          (Safe Storage)     (Minimal Info)      (Secure Processing)`}
                </pre>
              </div>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Key Security Principle:</strong> Cardholder data never touches our application environment. 
                  All sensitive payment information is handled exclusively by Razorpay's PCI DSS Level 1 compliant infrastructure.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h4 className="font-semibold text-red-900 mb-4">🚫 What We DON'T Store</h4>
                <ul className="space-y-2 text-sm text-red-800">
                  <li>• Full credit card numbers</li>
                  <li>• CVV/CVC codes</li>
                  <li>• Card expiration dates</li>
                  <li>• Cardholder names from payment forms</li>
                  <li>• PIN numbers or authentication data</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-semibold text-green-900 mb-4">✅ What We DO Store</h4>
                <ul className="space-y-2 text-sm text-green-800">
                  <li>• Payment transaction IDs</li>
                  <li>• Payment amounts and currency</li>
                  <li>• Payment status and timestamps</li>
                  <li>• Last 4 digits (non-sensitive)*</li>
                  <li>• Card network/brand (Visa, etc.)*</li>
                </ul>
                <p className="text-xs text-green-700 mt-3">*Permitted by PCI DSS as non-sensitive data</p>
              </div>
            </div>
          </div>
        )}

        {/* Certifications Section */}
        {activeSection === 'certifications' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Security Certifications & Standards</h2>
              <p className="text-lg text-gray-600">
                Industry-recognized security standards and compliance certifications
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">PCI DSS SAQ A</h3>
                <p className="text-gray-600 mb-4">
                  Payment Card Industry Data Security Standard Self-Assessment Questionnaire A
                </p>
                <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  ✓ Compliant
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">SSL/TLS Encryption</h3>
                <p className="text-gray-600 mb-4">
                  256-bit SSL encryption with HSTS enforcement for all data transmission
                </p>
                <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  ✓ Implemented
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Standards Compliance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { standard: 'OWASP Top 10', status: 'Protected', description: 'Protection against top web vulnerabilities' },
                  { standard: 'ISO 27001 Principles', status: 'Implemented', description: 'Information security management practices' },
                  { standard: 'NIST Framework', status: 'Aligned', description: 'Cybersecurity framework alignment' },
                  { standard: 'GDPR Ready', status: 'Compliant', description: 'Data protection and privacy controls' },
                  { standard: 'SOC 2 Type II Principles', status: 'Implemented', description: 'Security, availability, and confidentiality' },
                  { standard: 'HTTPS Everywhere', status: 'Enforced', description: 'End-to-end encrypted communication' }
                ].map((item, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-1">{item.standard}</h4>
                    <div className="flex items-center mb-2">
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-md font-medium text-blue-900">Continuous Compliance Monitoring</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    Our security and compliance posture is continuously monitored and updated to maintain 
                    the highest standards of protection for your data and applications.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Build Securely?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Start building your web applications on our PCI DSS compliant platform with enterprise-grade security built-in.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/register"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/contact"
              className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Contact Security Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
