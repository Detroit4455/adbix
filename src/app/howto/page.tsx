'use client';

import Navbar from '@/components/Navbar';
import LeftNavbar from '@/components/LeftNavbar';
import { useState } from 'react';
import { 
  BookOpenIcon,
  CodeBracketIcon,
  FolderIcon,
  DocumentTextIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function HowToPage() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['structure']);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isExpanded = (sectionId: string) => expandedSections.includes(sectionId);

  const tutorialSections = [
    {
      id: 'structure',
      title: 'Directory Structure',
      icon: FolderIcon,
      description: 'Learn how to organize your website files properly',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'html',
      title: 'HTML Structure',
      icon: CodeBracketIcon,
      description: 'Build the foundation of your website with proper HTML',
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'paths',
      title: 'File Paths',
      icon: DocumentTextIcon,
      description: 'Master relative paths for images, CSS, and JavaScript',
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 'ai-help',
      title: 'AI Assistance',
      icon: SparklesIcon,
      description: 'Use AI prompts to generate website code quickly',
      color: 'from-orange-500 to-red-600'
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      icon: LightBulbIcon,
      description: 'Follow industry standards for better websites',
      color: 'from-teal-500 to-cyan-600'
    }
  ];

  const bestPractices = [
    'Always include a proper DOCTYPE and meta tags',
    'Use semantic HTML elements (header, nav, main, section, footer)',
    'Optimize images before uploading',
    'Keep file names lowercase and use hyphens for spaces',
    'Test your website on different devices and browsers',
    'Make sure all links and images work before uploading',
    'Use relative paths for all resources',
    'Include alt text for all images'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <LeftNavbar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <BookOpenIcon className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">How to Create Your Website</h1>
              <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
                Learn to build professional websites with our comprehensive step-by-step guides and best practices
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Navigation */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tutorial Sections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tutorialSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    className={`group relative overflow-hidden rounded-xl bg-gradient-to-r ${section.color} text-white p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200`}
                  >
                    <div className="relative z-10">
                      <Icon className="h-8 w-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                      <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                      <p className="text-sm opacity-90 mb-3">{section.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs opacity-75">Click to {isExpanded(section.id) ? 'collapse' : 'expand'}</span>
                        {isExpanded(section.id) ? 
                          <ChevronDownIcon className="h-4 w-4" /> : 
                          <ChevronRightIcon className="h-4 w-4" />
                        }
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tutorial Content */}
          <div className="space-y-8">
            {/* Directory Structure Section */}
            {isExpanded('structure') && (
              <section className="bg-white shadow-lg rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
                  <div className="flex items-center">
                    <FolderIcon className="h-8 w-8 mr-3" />
                    <h2 className="text-2xl font-bold">Directory Structure</h2>
                  </div>
                  <p className="mt-2 opacity-90">Organize your files properly for best results</p>
                </div>
                <div className="p-6">
                  <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
                    <pre className="text-green-400 font-mono text-sm leading-relaxed">
{`your-website/
├── index.html          # Main page (required)
├── images/            # Store all images here
│   ├── logo.png
│   ├── banner.jpg
│   └── products/
│       ├── prod1.jpg
│       └── prod2.jpg
├── css/              # Store all stylesheets here
│   └── styles.css
└── js/               # Store all JavaScript files here
    └── main.js`}
                    </pre>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <p className="text-blue-800 text-sm">
                      <strong>Pro Tip:</strong> Keep your file structure organized from the start. It makes maintenance easier and helps with deployment.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* HTML Structure Section */}
            {isExpanded('html') && (
              <section className="bg-white shadow-lg rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
                  <div className="flex items-center">
                    <CodeBracketIcon className="h-8 w-8 mr-3" />
                    <h2 className="text-2xl font-bold">HTML Structure</h2>
                  </div>
                  <p className="mt-2 opacity-90">Template for your index.html file</p>
                </div>
                <div className="p-6">
                  <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
                    <pre className="text-green-400 font-mono text-sm leading-relaxed">
{`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Website Title</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <header>
        <img src="images/logo.png" alt="Logo">
        <nav>
            <!-- Your navigation menu -->
        </nav>
    </header>

    <main>
        <section class="hero">
            <img src="images/banner.jpg" alt="Banner">
            <h1>Welcome to Your Website</h1>
        </section>

        <!-- More content sections -->
    </main>

    <footer>
        <!-- Footer content -->
    </footer>

    <script src="js/main.js"></script>
</body>
</html>`}
                    </pre>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <h4 className="font-semibold text-green-800 mb-2">Essential Elements</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• DOCTYPE declaration</li>
                        <li>• Viewport meta tag</li>
                        <li>• Semantic HTML5 elements</li>
                        <li>• Proper head section</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                      <h4 className="font-semibold text-amber-800 mb-2">Remember</h4>
                      <ul className="text-sm text-amber-700 space-y-1">
                        <li>• Include alt attributes</li>
                        <li>• Use relative paths</li>
                        <li>• Close all tags properly</li>
                        <li>• Validate your HTML</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* File Paths Section */}
            {isExpanded('paths') && (
              <section className="bg-white shadow-lg rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-8 w-8 mr-3" />
                    <h2 className="text-2xl font-bold">File Paths</h2>
                  </div>
                  <p className="mt-2 opacity-90">Master relative paths for all your resources</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />
                        Image Paths
                      </h3>
                      <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-1">Same directory:</div>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-purple-700">src="images/logo.png"</code>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-1">Subdirectories:</div>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-purple-700">src="images/products/prod1.jpg"</code>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />
                        CSS Paths
                      </h3>
                      <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-1">Stylesheet:</div>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-purple-700">href="css/styles.css"</code>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-1">Print CSS:</div>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-purple-700">href="css/print.css"</code>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />
                        JavaScript Paths
                      </h3>
                      <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-1">Main script:</div>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-purple-700">src="js/main.js"</code>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-1">Plugins:</div>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-purple-700">src="js/plugins.js"</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* AI Assistance Section */}
            {isExpanded('ai-help') && (
              <section className="bg-white shadow-lg rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6">
                  <div className="flex items-center">
                    <SparklesIcon className="h-8 w-8 mr-3" />
                    <h2 className="text-2xl font-bold">AI Assistance</h2>
                  </div>
                  <p className="mt-2 opacity-90">Get help from AI to create your website faster</p>
                </div>
                <div className="p-6">
                  <div className="mb-6">
                    <button
                      onClick={() => setShowPrompt(!showPrompt)}
                      className="inline-flex items-center bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      <SparklesIcon className="h-5 w-5 mr-2" />
                      {showPrompt ? 'Hide AI Prompt' : 'Show AI Prompt'}
                      <ArrowRightIcon className="h-4 w-4 ml-2" />
                    </button>
                  </div>
                  
                  {showPrompt && (
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Website Generation Prompt</h3>
                      <div className="bg-white p-6 rounded-lg border">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
{`Create a responsive HTML website for [your business type] with the following requirements:

1. Directory Structure:
   - index.html in root
   - images/ folder for all images
   - css/ folder for styles
   - js/ folder for scripts

2. Features needed:
   - [List your main features]
   - [List your sections]
   - [List any specific functionality]

3. Design preferences:
   - [Your color scheme]
   - [Your style preferences]
   - [Any specific layout requirements]

4. Content sections:
   - [List your main sections]
   - [List any specific content]

Please provide the complete HTML structure with proper file paths and responsive design.`}
                        </pre>
                      </div>
                      <div className="mt-4 p-4 bg-orange-100 rounded-lg">
                        <p className="text-orange-800 text-sm">
                          <strong>Tip:</strong> Customize the placeholders in brackets with your specific requirements for better AI-generated results.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Best Practices Section */}
            {isExpanded('best-practices') && (
              <section className="bg-white shadow-lg rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white p-6">
                  <div className="flex items-center">
                    <LightBulbIcon className="h-8 w-8 mr-3" />
                    <h2 className="text-2xl font-bold">Best Practices</h2>
                  </div>
                  <p className="mt-2 opacity-90">Follow these guidelines for professional websites</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {bestPractices.map((practice, index) => (
                      <div key={index} className="flex items-start p-4 bg-teal-50 rounded-lg border-l-4 border-teal-400">
                        <CheckCircleIcon className="h-5 w-5 text-teal-600 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-teal-800">{practice}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Call to Action */}
          <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Build Your Website?</h2>
            <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
              Now that you know the basics, start creating your website and upload it to our S3 hosting platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/web_on_s3"
                className="inline-flex items-center bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
              >
                <ArrowRightIcon className="h-5 w-5 mr-2" />
                Upload Your Website
              </a>
              <a
                href="/widgets"
                className="inline-flex items-center bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-800 transition-colors"
              >
                <SparklesIcon className="h-5 w-5 mr-2" />
                Explore Widgets
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 