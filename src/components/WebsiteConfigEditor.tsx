'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { HexColorPicker } from 'react-colorful';

interface WebsiteConfigEditorProps {
  userId: string;
}

interface ConfigComponent {
  type: string;
  id: string;
  content?: string;
  props?: Record<string, any>;
  children?: ConfigComponent[];
}

interface WebsiteConfig {
  siteTitle: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    backgroundColor: string;
  };
  meta: {
    description: string;
    keywords: string;
  };
  pages: Record<string, {
    title: string;
    layout: string;
    components: ConfigComponent[];
  }>;
}

export default function WebsiteConfigEditor({ userId }: WebsiteConfigEditorProps) {
  const [config, setConfig] = useState<WebsiteConfig | null>(null);
  const [configJson, setConfigJson] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'visual'
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const [colors, setColors] = useState({
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    backgroundColor: '#ffffff'
  });

  useEffect(() => {
    fetchConfig();
  }, [userId]);

  // Extract theme colors from JSON when configJson changes
  useEffect(() => {
    try {
      if (configJson) {
        const parsedConfig = JSON.parse(configJson);
        if (parsedConfig.theme) {
          setColors({
            primaryColor: parsedConfig.theme.primaryColor || '#3b82f6',
            secondaryColor: parsedConfig.theme.secondaryColor || '#10b981',
            backgroundColor: parsedConfig.theme.backgroundColor || '#ffffff'
          });
        }
      }
    } catch (err) {
      // Ignore JSON parsing errors here, they'll be caught in the save function
    }
  }, [configJson]);

  const fetchConfig = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Try to fetch the config.json file from S3
      const response = await fetch(`/api/s3-file-content?userId=${userId}&path=config.json`);
      
      if (!response.ok) {
        // If the file doesn't exist, create a default template
        setConfig(getDefaultConfig());
        setConfigJson(JSON.stringify(getDefaultConfig(), null, 2));
      } else {
        const data = await response.json();
        try {
          const parsedConfig = JSON.parse(data.content);
          setConfig(parsedConfig);
          setConfigJson(JSON.stringify(parsedConfig, null, 2));
        } catch (parseError) {
          // If the JSON is invalid, create a default template
          setConfig(getDefaultConfig());
          setConfigJson(JSON.stringify(getDefaultConfig(), null, 2));
          setError('The configuration file contained invalid JSON. A default template has been loaded.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load website configuration');
      // Load default config as fallback
      setConfig(getDefaultConfig());
      setConfigJson(JSON.stringify(getDefaultConfig(), null, 2));
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setError('');
    setSaveSuccess(false);
    
    try {
      // Validate JSON
      const parsedConfig = JSON.parse(configJson);
      
      // Save the config.json file to S3
      const response = await fetch('/api/s3-update-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          path: 'config.json',
          content: configJson,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please fix the syntax errors.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to save configuration');
      }
    } finally {
      setSaving(false);
    }
  };

  const getDefaultConfig = (): WebsiteConfig => {
    return {
      siteTitle: "My Website",
      theme: {
        primaryColor: "#3b82f6",
        secondaryColor: "#10b981",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#ffffff"
      },
      meta: {
        description: "A beautiful website created with the Website Builder",
        keywords: "website, portfolio, business"
      },
      pages: {
        "index.html": {
          title: "Home",
          layout: "default",
          components: [
            {
              type: "header",
              id: "main-header",
              props: {
                style: {
                  backgroundColor: "#3b82f6",
                  color: "#ffffff",
                  padding: "2rem"
                }
              },
              children: [
                {
                  type: "heading",
                  id: "header-title",
                  content: "Welcome to My Website",
                  props: {
                    level: 1,
                    style: {
                      fontSize: "2.5rem",
                      fontWeight: "bold"
                    }
                  }
                }
              ]
            },
            {
              type: "section",
              id: "hero-section",
              props: {
                style: {
                  padding: "4rem 2rem",
                  textAlign: "center"
                }
              },
              children: [
                {
                  type: "heading",
                  id: "hero-title",
                  content: "Your Vision, Our Creation",
                  props: {
                    level: 2,
                    style: {
                      fontSize: "2rem",
                      marginBottom: "1.5rem"
                    }
                  }
                },
                {
                  type: "paragraph",
                  id: "hero-text",
                  content: "This is a customizable website built with our web builder. Edit this text to describe your business or project.",
                  props: {
                    style: {
                      maxWidth: "700px",
                      margin: "0 auto",
                      lineHeight: 1.6
                    }
                  }
                }
              ]
            }
          ]
        }
      }
    };
  };
  
  // Update theme colors in the JSON
  const updateColorInConfig = (colorKey: string, colorValue: string) => {
    try {
      const parsedConfig = JSON.parse(configJson);
      
      if (!parsedConfig.theme) {
        parsedConfig.theme = {};
      }
      
      parsedConfig.theme[colorKey] = colorValue;
      
      setConfigJson(JSON.stringify(parsedConfig, null, 2));
      setColors({
        ...colors,
        [colorKey]: colorValue
      });
    } catch (err) {
      setError('Failed to update color. Please check your JSON structure.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-semibold text-gray-800">Website Configuration</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={fetchConfig}
            className="px-3 py-1.5 text-xs text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={saveConfig}
            disabled={saving}
            className={`px-3 py-1.5 text-xs text-white rounded transition-colors ${
              saving 
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'editor'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          JSON Editor
        </button>
        <button
          onClick={() => setActiveTab('visual')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'visual'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Visual Editor
        </button>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {saveSuccess && (
        <div className="p-4 bg-green-50 text-green-700 text-sm">
          Configuration saved successfully!
        </div>
      )}
      
      {activeTab === 'editor' ? (
        <div>
          {/* Color Pickers Section */}
          <div className="p-4 border-b">
            <h3 className="text-sm font-medium text-gray-800 mb-3">Theme Colors</h3>
            <div className="grid grid-cols-3 gap-4">
              {/* Primary Color */}
              <div>
                <div className="flex items-center mb-2">
                  <div 
                    className="w-4 h-4 rounded mr-2" 
                    style={{ backgroundColor: colors.primaryColor }} 
                  />
                  <span className="text-xs font-medium">Primary Color</span>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setActiveColorPicker(activeColorPicker === 'primaryColor' ? null : 'primaryColor')}
                    className="w-full flex items-center justify-between text-xs bg-gray-50 border border-gray-300 rounded px-3 py-2 hover:bg-gray-100"
                  >
                    <span>{colors.primaryColor}</span>
                    <div className="w-5 h-5 rounded" style={{ backgroundColor: colors.primaryColor }}></div>
                  </button>
                  {activeColorPicker === 'primaryColor' && (
                    <div className="absolute z-10 mt-1">
                      <div 
                        className="fixed inset-0" 
                        onClick={() => setActiveColorPicker(null)}
                      ></div>
                      <div className="relative">
                        <HexColorPicker 
                          color={colors.primaryColor} 
                          onChange={(color) => updateColorInConfig('primaryColor', color)} 
                        />
                        <input
                          type="text"
                          value={colors.primaryColor}
                          onChange={(e) => updateColorInConfig('primaryColor', e.target.value)}
                          className="mt-2 w-full text-xs border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Secondary Color */}
              <div>
                <div className="flex items-center mb-2">
                  <div 
                    className="w-4 h-4 rounded mr-2" 
                    style={{ backgroundColor: colors.secondaryColor }} 
                  />
                  <span className="text-xs font-medium">Secondary Color</span>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setActiveColorPicker(activeColorPicker === 'secondaryColor' ? null : 'secondaryColor')}
                    className="w-full flex items-center justify-between text-xs bg-gray-50 border border-gray-300 rounded px-3 py-2 hover:bg-gray-100"
                  >
                    <span>{colors.secondaryColor}</span>
                    <div className="w-5 h-5 rounded" style={{ backgroundColor: colors.secondaryColor }}></div>
                  </button>
                  {activeColorPicker === 'secondaryColor' && (
                    <div className="absolute z-10 mt-1">
                      <div 
                        className="fixed inset-0" 
                        onClick={() => setActiveColorPicker(null)}
                      ></div>
                      <div className="relative">
                        <HexColorPicker 
                          color={colors.secondaryColor} 
                          onChange={(color) => updateColorInConfig('secondaryColor', color)} 
                        />
                        <input
                          type="text"
                          value={colors.secondaryColor}
                          onChange={(e) => updateColorInConfig('secondaryColor', e.target.value)}
                          className="mt-2 w-full text-xs border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Background Color */}
              <div>
                <div className="flex items-center mb-2">
                  <div 
                    className="w-4 h-4 rounded mr-2" 
                    style={{ backgroundColor: colors.backgroundColor }} 
                  />
                  <span className="text-xs font-medium">Background Color</span>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setActiveColorPicker(activeColorPicker === 'backgroundColor' ? null : 'backgroundColor')}
                    className="w-full flex items-center justify-between text-xs bg-gray-50 border border-gray-300 rounded px-3 py-2 hover:bg-gray-100"
                  >
                    <span>{colors.backgroundColor}</span>
                    <div className="w-5 h-5 rounded" style={{ backgroundColor: colors.backgroundColor }}></div>
                  </button>
                  {activeColorPicker === 'backgroundColor' && (
                    <div className="absolute z-10 mt-1">
                      <div 
                        className="fixed inset-0" 
                        onClick={() => setActiveColorPicker(null)}
                      ></div>
                      <div className="relative">
                        <HexColorPicker 
                          color={colors.backgroundColor} 
                          onChange={(color) => updateColorInConfig('backgroundColor', color)} 
                        />
                        <input
                          type="text"
                          value={colors.backgroundColor}
                          onChange={(e) => updateColorInConfig('backgroundColor', e.target.value)}
                          className="mt-2 w-full text-xs border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="p-4 h-80">
            <Editor
              height="100%"
              language="json"
              value={configJson}
              onChange={(value) => setConfigJson(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                wordWrap: 'on',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Visual Editor</h3>
            <p className="text-gray-600">
              The visual editor is currently under development. Please use the JSON editor to modify your website configuration.
            </p>
            
            {config && config.theme && (
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-800 mb-2">Website Information</h4>
                <div className="bg-white p-4 rounded border border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Site Title</p>
                      <p className="font-medium text-gray-800">{config.siteTitle || 'Untitled'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Primary Color</p>
                      <div className="flex items-center">
                        <div 
                          className="w-6 h-6 rounded mr-2" 
                          style={{ backgroundColor: config.theme.primaryColor || '#000000' }}
                        />
                        <span>{config.theme.primaryColor || '#000000'}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Font Family</p>
                      <p className="font-medium text-gray-800">{config.theme.fontFamily || 'Default'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Number of Pages</p>
                      <p className="font-medium text-gray-800">{config.pages ? Object.keys(config.pages).length : 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="p-4 border-t">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Configuration Tips</h3>
        <ul className="text-xs text-gray-600 space-y-1 list-disc pl-5">
          <li>The configuration file controls the structure and appearance of your website</li>
          <li>Changes to the configuration will affect all pages that use the configured components</li>
          <li>After saving, view your website to see the changes</li>
          <li>Remember to validate your JSON structure before saving</li>
          <li>Use the color pickers to easily choose and preview theme colors</li>
        </ul>
      </div>
    </div>
  );
} 