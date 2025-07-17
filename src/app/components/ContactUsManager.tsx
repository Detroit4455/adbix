'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FormField, ContactUsMessage } from '@/models/ContactUsWidget';

interface ContactUsManagerProps {
  userId: string;
}

interface WidgetSettings {
  title: string;
  subtitle: string;
  fields: FormField[];
  backgroundColor: string;
  backgroundOpacity: number;
  textColor: string;
  textOpacity: number;
  buttonColor: string;
  buttonOpacity: number;
  buttonTextColor: string;
  buttonTextOpacity: number;
  placeholderColor: string;
  placeholderOpacity: number;
  placeholderBgColor: string;
  placeholderBgOpacity: number;
  template: string;
  titleFontSize: number;
}

export default function ContactUsManager({ userId }: ContactUsManagerProps) {
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [messages, setMessages] = useState<ContactUsMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'messages'>('settings');
  const [newField, setNewField] = useState<Partial<FormField>>({
    type: 'text',
    label: '',
    placeholder: '',
    required: false
  });
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(`/api/contact-us-widget?userId=${userId}`);
      const data = await response.json();
      
      // Ensure all required fields have default values
      const settingsWithDefaults = {
        title: data.title || 'Contact Us',
        subtitle: data.subtitle || 'Get in touch with us',
        fields: data.fields || [],
        backgroundColor: data.backgroundColor || '#ffffff',
        backgroundOpacity: data.backgroundOpacity ?? 1,
        textColor: data.textColor || '#333333',
        textOpacity: data.textOpacity ?? 1,
        buttonColor: data.buttonColor || '#3b82f6',
        buttonOpacity: data.buttonOpacity ?? 1,
        buttonTextColor: data.buttonTextColor || '#ffffff',
        buttonTextOpacity: data.buttonTextOpacity ?? 1,
        placeholderColor: data.placeholderColor || '#9ca3af',
        placeholderOpacity: data.placeholderOpacity ?? 1,
        placeholderBgColor: data.placeholderBgColor || '#ffffff',
        placeholderBgOpacity: data.placeholderBgOpacity ?? 1,
        template: data.template || 'modern-card',
        titleFontSize: data.titleFontSize || 24
      };
      
      console.log('Loaded settings with template:', settingsWithDefaults.template);
      setSettings(settingsWithDefaults);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, [userId]);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/contact-us-widget/messages?userId=${userId}`);
      const data = await response.json();
      setMessages(data.messages || data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [userId]);

  useEffect(() => {
    Promise.all([fetchSettings(), fetchMessages()]).finally(() => {
      setLoading(false);
    });
  }, [fetchSettings, fetchMessages]);

  const saveSettings = async (showAlert = true) => {
    if (!settings) return;

    setSaving(true);
    try {
      console.log('Saving settings with template:', settings.template);
      const response = await fetch('/api/contact-us-widget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...settings
        }),
      });

      if (response.ok) {
        const savedData = await response.json();
        console.log('Settings saved successfully with template:', savedData.template);
        if (showAlert) {
          alert('Settings saved successfully!');
        }
        // Refresh the page to apply changes
        window.location.reload();
      } else {
        if (showAlert) {
          alert('Failed to save settings');
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      if (showAlert) {
        alert('Failed to save settings');
      }
    } finally {
      setSaving(false);
    }
  };

  // Auto-save when template changes
  const handleTemplateChange = async (newTemplate: string) => {
    if (!settings) return;
    
    const updatedSettings = { ...settings, template: newTemplate };
    setSettings(updatedSettings);
    
    // Auto-save without showing alert
    setSaving(true);
    try {
      const response = await fetch('/api/contact-us-widget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...updatedSettings
        }),
      });

      if (response.ok) {
        console.log('Template auto-saved successfully:', newTemplate);
        // Auto-refresh after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Error auto-saving template:', error);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save when settings change (for colors and other properties)
  const handleSettingChange = async (newSettings: WidgetSettings) => {
    if (!settings) return;
    
    setSettings(newSettings);
    
    // Debounce auto-save to avoid too many requests
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/contact-us-widget', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            ...newSettings
          }),
        });

        if (response.ok) {
          console.log('Settings auto-saved successfully');
        }
      } catch (error) {
        console.error('Error auto-saving settings:', error);
      }
    }, 500); // 500ms debounce
  };

  // Set default template configurations
  const setDefaultTemplate = async (template: 'modern-card' | 'minimal') => {
    if (!settings) return;
    
    let defaultSettings: Partial<WidgetSettings>;
    
    if (template === 'modern-card') {
      // Dark website suitable colors
      defaultSettings = {
        template: 'modern-card',
        backgroundColor: '#1f2937',
        backgroundOpacity: 0.95,
        textColor: '#f9fafb',
        textOpacity: 1,
        buttonColor: '#3b82f6',
        buttonOpacity: 1,
        buttonTextColor: '#ffffff',
        buttonTextOpacity: 1,
        placeholderColor: '#9ca3af',
        placeholderOpacity: 1,
        placeholderBgColor: '#374151',
        placeholderBgOpacity: 0.8,
        titleFontSize: 24
      };
    } else {
      // White website suitable colors
      defaultSettings = {
        template: 'minimal',
        backgroundColor: '#ffffff',
        backgroundOpacity: 1,
        textColor: '#111827',
        textOpacity: 1,
        buttonColor: '#059669',
        buttonOpacity: 1,
        buttonTextColor: '#ffffff',
        buttonTextOpacity: 1,
        placeholderColor: '#6b7280',
        placeholderOpacity: 1,
        placeholderBgColor: '#f9fafb',
        placeholderBgOpacity: 1,
        titleFontSize: 20
      };
    }
    
    const updatedSettings = { ...settings, ...defaultSettings };
    setSettings(updatedSettings);
    
    // Auto-save the default template
    setSaving(true);
    try {
      const response = await fetch('/api/contact-us-widget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...updatedSettings
        }),
      });

      if (response.ok) {
        console.log('Default template saved successfully:', template);
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Error saving default template:', error);
    } finally {
      setSaving(false);
    }
  };

  const refreshSettings = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchSettings(), fetchMessages()]);
    } finally {
      setLoading(false);
    }
  };



  const addField = () => {
    if (!settings || !newField.label?.trim()) return;

    const currentFields = settings.fields || [];
    const field: FormField = {
      id: Date.now().toString(),
      name: newField.label.toLowerCase().replace(/\s+/g, '_'),
      type: newField.type as 'text' | 'email' | 'textarea' | 'tel',
      label: newField.label,
      placeholder: newField.placeholder || '',
      required: newField.required || false,
      order: currentFields.length + 1
    };

    setSettings({
      ...settings,
      fields: [...currentFields, field]
    });

    setNewField({
      type: 'text',
      label: '',
      placeholder: '',
      required: false
    });
  };

  const removeField = (fieldId: string) => {
    if (!settings) return;
    const currentFields = settings.fields || [];
    setSettings({
      ...settings,
      fields: currentFields.filter(f => f.id !== fieldId)
    });
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    if (!settings) return;
    const currentFields = settings.fields || [];
    setSettings({
      ...settings,
      fields: currentFields.map(f => 
        f.id === fieldId ? { ...f, ...updates } : f
      )
    });
  };

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    if (!settings) return;
    
    const currentFields = settings.fields || [];
    const fields = [...currentFields];
    const index = fields.findIndex(f => f.id === fieldId);
    
    if (direction === 'up' && index > 0) {
      [fields[index], fields[index - 1]] = [fields[index - 1], fields[index]];
    } else if (direction === 'down' && index < fields.length - 1) {
      [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
    }
    
    // Update order numbers
    fields.forEach((field, idx) => {
      field.order = idx + 1;
    });
    
    setSettings({
      ...settings,
      fields
    });
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch(`/api/contact-us-widget/messages?messageId=${messageId}&userId=${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessages(messages.filter(m => m._id !== messageId));
      } else {
        alert('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your widget settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex justify-center items-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Failed to Load Settings</h2>
          <p className="text-gray-600">Unable to load your widget configuration</p>
          <button 
            onClick={refreshSettings}
            className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Contact Us Widget Manager
          </h1>
          <p className="text-xl text-gray-600">
            Customize your contact form and manage incoming messages
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg p-1 mb-8 max-w-md mx-auto">
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              🎨 Widget Settings
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200 ${
                activeTab === 'messages'
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              📧 Messages ({messages.length})
            </button>
          </nav>
        </div>

        {activeTab === 'settings' && (
          <div className="space-y-8">
            {/* Basic Settings */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <span className="mr-2">⚙️</span>
                  Basic Settings
                </h3>
                <p className="text-green-100 mt-1">Configure your widget's title and subtitle</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Widget Title
                    </label>
                    <input
                      type="text"
                      value={settings.title}
                      onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      placeholder="Enter your widget title"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Widget Subtitle
                    </label>
                    <input
                      type="text"
                      value={settings.subtitle}
                      onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      placeholder="Enter your widget subtitle"
                    />
                  </div>
                </div>
                
                {/* Font Size Settings */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6">
                  <h4 className="font-bold mb-4 text-indigo-900 flex items-center text-lg">
                    <span className="mr-3 text-2xl">🔤</span>
                    Typography Settings
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-indigo-800 mb-3">
                        Title Font Size: <span className="text-indigo-600 font-bold">{settings.titleFontSize}px</span>
                      </label>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="16"
                          max="48"
                          step="1"
                          value={settings.titleFontSize}
                          onChange={(e) => handleSettingChange({ ...settings, titleFontSize: parseInt(e.target.value) })}
                          className="w-full h-3 bg-indigo-200 rounded-lg appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, #e0e7ff 0%, #6366f1 ${((settings.titleFontSize - 16) / (48 - 16)) * 100}%, #e0e7ff ${((settings.titleFontSize - 16) / (48 - 16)) * 100}%, #e0e7ff 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs text-indigo-600 font-medium">
                          <span>16px</span>
                          <span>32px</span>
                          <span>48px</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Preview */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-indigo-200">
                      <div className="text-xs font-medium text-indigo-700 mb-2">Preview:</div>
                      <div 
                        className="font-bold text-gray-900"
                        style={{ fontSize: `${settings.titleFontSize}px` }}
                      >
                        {settings.title}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Selection */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-white">🎨 Design Templates</h3>
                    <p className="text-blue-100 mt-1">Choose your widget style (auto-saves)</p>
                  </div>
                                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                  <span className="text-white text-sm font-medium">
                    Current: {settings.template === 'modern-card' ? 'Modern Card' : 'Minimal'}
                  </span>
                </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  {/* Modern Card Template */}
                  <div className="relative group">
                    <div
                      onClick={() => handleTemplateChange('modern-card')}
                      className={`relative p-8 cursor-pointer transition-all duration-300 transform hover:scale-105 rounded-2xl ${
                        settings.template === 'modern-card'
                          ? 'shadow-2xl ring-4 ring-blue-200 scale-105'
                          : 'shadow-lg hover:shadow-xl'
                      }`}
                      style={{
                        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                        border: settings.template === 'modern-card' ? '3px solid #3b82f6' : '2px solid #374151'
                      }}
                    >
                      <div className="text-center text-white">
                        <div className="text-4xl mb-4">🌙</div>
                        <h4 className="font-bold text-lg mb-3">Modern Card</h4>
                        <p className="text-sm opacity-90 leading-relaxed mb-4">Perfect for dark websites with professional styling</p>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                          <div className="text-sm font-medium">Dark Theme Optimized</div>
                        </div>
                      </div>
                      {settings.template === 'modern-card' && (
                        <>
                          <div className="absolute -top-3 -right-3 bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                            <span className="text-lg">✓</span>
                          </div>
                          <div className="absolute bottom-3 left-3 right-3">
                            <div className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-full text-center shadow-md">
                              ACTIVE TEMPLATE
                            </div>
                          </div>
                        </>
                      )}
                      {saving && settings.template === 'modern-card' && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                          <div className="flex flex-col items-center space-y-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                            <span className="text-sm text-blue-600 font-bold">Saving...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Default Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDefaultTemplate('modern-card');
                      }}
                      className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      ⚡ Apply Default
                    </button>
                  </div>

                  {/* Minimal Template */}
                  <div className="relative group">
                    <div
                      onClick={() => handleTemplateChange('minimal')}
                      className={`relative p-8 cursor-pointer transition-all duration-300 transform hover:scale-105 rounded-2xl border-2 ${
                        settings.template === 'minimal'
                          ? 'border-gray-800 bg-gray-50 shadow-xl ring-4 ring-gray-200 scale-105'
                          : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-lg'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-4 text-gray-700">☀️</div>
                        <h4 className="font-bold text-lg mb-3 text-gray-900">Minimal</h4>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">Perfect for white websites with clean minimal design</p>
                        <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                          <div className="text-sm font-medium text-gray-700">Light Theme Optimized</div>
                        </div>
                      </div>
                      {settings.template === 'minimal' && (
                        <>
                          <div className="absolute -top-3 -right-3 bg-gray-800 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                            <span className="text-lg">✓</span>
                          </div>
                          <div className="absolute bottom-3 left-3 right-3">
                            <div className="bg-gray-800 text-white text-sm font-bold px-4 py-2 rounded-full text-center shadow-md">
                              ACTIVE TEMPLATE
                            </div>
                          </div>
                        </>
                      )}
                      {saving && settings.template === 'minimal' && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                          <div className="flex flex-col items-center space-y-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-800 border-t-transparent"></div>
                            <span className="text-sm text-gray-800 font-bold">Saving...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Default Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDefaultTemplate('minimal');
                      }}
                      className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      ⚡ Apply Default
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Color Settings */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <span className="mr-2">🎨</span>
                  Colors & Transparency
                </h3>
                <p className="text-purple-100 mt-1">Customize the appearance of your widget</p>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Background */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
                      <h4 className="font-bold mb-4 text-blue-900 flex items-center text-lg">
                        <span className="mr-3 text-2xl">🖼️</span>
                        Background
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-blue-800">Color</label>
                          <div className="relative">
                            <input
                              type="color"
                              value={settings.backgroundColor}
                              onChange={(e) => handleSettingChange({ ...settings, backgroundColor: e.target.value })}
                              className="w-full h-14 border-3 border-blue-300 rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                            />
                            <div className="absolute -bottom-2 left-0 right-0 text-center">
                              <span className="text-xs font-medium text-blue-600 bg-white px-2 py-1 rounded-full shadow">
                                {settings.backgroundColor}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-blue-800">
                            Opacity: <span className="text-blue-600 font-bold">{Math.round(settings.backgroundOpacity * 100)}%</span>
                          </label>
                          <div className="space-y-2">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={settings.backgroundOpacity}
                              onChange={(e) => handleSettingChange({ ...settings, backgroundOpacity: parseFloat(e.target.value) })}
                              className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
                              style={{
                                background: `linear-gradient(to right, #dbeafe 0%, #3b82f6 ${settings.backgroundOpacity * 100}%, #dbeafe ${settings.backgroundOpacity * 100}%, #dbeafe 100%)`
                              }}
                            />
                            <div className="flex justify-between text-xs text-blue-600 font-medium">
                              <span>0%</span>
                              <span>50%</span>
                              <span>100%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Text */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
                      <h4 className="font-bold mb-4 text-green-900 flex items-center text-lg">
                        <span className="mr-3 text-2xl">📝</span>
                        Text Styling
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-green-800">Color</label>
                          <div className="relative">
                            <input
                              type="color"
                              value={settings.textColor}
                              onChange={(e) => handleSettingChange({ ...settings, textColor: e.target.value })}
                              className="w-full h-14 border-3 border-green-300 rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                            />
                            <div className="absolute -bottom-2 left-0 right-0 text-center">
                              <span className="text-xs font-medium text-green-600 bg-white px-2 py-1 rounded-full shadow">
                                {settings.textColor}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-green-800">
                            Opacity: <span className="text-green-600 font-bold">{Math.round(settings.textOpacity * 100)}%</span>
                          </label>
                          <div className="space-y-2">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={settings.textOpacity}
                              onChange={(e) => handleSettingChange({ ...settings, textOpacity: parseFloat(e.target.value) })}
                              className="w-full h-3 bg-green-200 rounded-lg appearance-none cursor-pointer slider"
                              style={{
                                background: `linear-gradient(to right, #dcfce7 0%, #22c55e ${settings.textOpacity * 100}%, #dcfce7 ${settings.textOpacity * 100}%, #dcfce7 100%)`
                              }}
                            />
                            <div className="flex justify-between text-xs text-green-600 font-medium">
                              <span>0%</span>
                              <span>50%</span>
                              <span>100%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Button */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6">
                      <h4 className="font-bold mb-4 text-purple-900 flex items-center text-lg">
                        <span className="mr-3 text-2xl">🔘</span>
                        Button Styling
                      </h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="block text-sm font-semibold text-purple-800">Background</label>
                            <div className="relative">
                              <input
                                type="color"
                                value={settings.buttonColor}
                                onChange={(e) => handleSettingChange({ ...settings, buttonColor: e.target.value })}
                                className="w-full h-12 border-3 border-purple-300 rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                              />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-semibold text-purple-800">
                              BG Opacity: <span className="text-purple-600 font-bold">{Math.round(settings.buttonOpacity * 100)}%</span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={settings.buttonOpacity}
                              onChange={(e) => handleSettingChange({ ...settings, buttonOpacity: parseFloat(e.target.value) })}
                              className="w-full h-3 bg-purple-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="block text-sm font-semibold text-purple-800">Text Color</label>
                            <div className="relative">
                              <input
                                type="color"
                                value={settings.buttonTextColor}
                                onChange={(e) => handleSettingChange({ ...settings, buttonTextColor: e.target.value })}
                                className="w-full h-12 border-3 border-purple-300 rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                              />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-semibold text-purple-800">
                              Text Opacity: <span className="text-purple-600 font-bold">{Math.round(settings.buttonTextOpacity * 100)}%</span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={settings.buttonTextOpacity}
                              onChange={(e) => handleSettingChange({ ...settings, buttonTextOpacity: parseFloat(e.target.value) })}
                              className="w-full h-3 bg-purple-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6">
                      <h4 className="font-bold mb-4 text-orange-900 flex items-center text-lg">
                        <span className="mr-3 text-2xl">📋</span>
                        Form Fields Styling
                      </h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="block text-sm font-semibold text-orange-800">Field Background</label>
                            <div className="relative">
                              <input
                                type="color"
                                value={settings.placeholderBgColor}
                                onChange={(e) => handleSettingChange({ ...settings, placeholderBgColor: e.target.value })}
                                className="w-full h-12 border-3 border-orange-300 rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                              />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-semibold text-orange-800">
                              Field BG Opacity: <span className="text-orange-600 font-bold">{Math.round(settings.placeholderBgOpacity * 100)}%</span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={settings.placeholderBgOpacity}
                              onChange={(e) => handleSettingChange({ ...settings, placeholderBgOpacity: parseFloat(e.target.value) })}
                              className="w-full h-3 bg-orange-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="block text-sm font-semibold text-orange-800">Placeholder Text</label>
                            <div className="relative">
                              <input
                                type="color"
                                value={settings.placeholderColor}
                                onChange={(e) => handleSettingChange({ ...settings, placeholderColor: e.target.value })}
                                className="w-full h-12 border-3 border-orange-300 rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                              />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-semibold text-orange-800">
                              Placeholder Opacity: <span className="text-orange-600 font-bold">{Math.round(settings.placeholderOpacity * 100)}%</span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={settings.placeholderOpacity}
                              onChange={(e) => handleSettingChange({ ...settings, placeholderOpacity: parseFloat(e.target.value) })}
                              className="w-full h-3 bg-orange-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Fields Management */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <span className="mr-2">📝</span>
                  Form Fields
                </h3>
                <p className="text-orange-100 mt-1">Manage your contact form fields</p>
              </div>
              <div className="p-6">
                
                {/* Existing Fields */}
                <div className="space-y-4 mb-8">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <span className="mr-2">📋</span>
                    Current Fields
                  </h4>
                  {settings.fields && settings.fields
                    .sort((a, b) => a.order - b.order)
                    .map((field) => (
                    <div key={field.id} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex flex-col space-y-1">
                            <button
                              onClick={() => moveField(field.id, 'up')}
                              className="text-gray-400 hover:text-gray-600 text-xs"
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moveField(field.id, 'down')}
                              className="text-gray-400 hover:text-gray-600 text-xs"
                              title="Move down"
                            >
                              ↓
                            </button>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">{field.label}</span>
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                            <div className="text-xs text-gray-500">Type: {field.type}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeField(field.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors text-sm"
                        >
                          Delete
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Label
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Placeholder
                          </label>
                          <input
                            type="text"
                            value={field.placeholder}
                            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex items-center space-x-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Type
                            </label>
                            <select
                              value={field.type}
                              onChange={(e) => updateField(field.id, { type: e.target.value as FormField['type'] })}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                            >
                              <option value="text">Text</option>
                              <option value="email">Email</option>
                              <option value="tel">Phone</option>
                              <option value="textarea">Textarea</option>
                            </select>
                          </div>
                          <div className="flex items-center mt-4">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(field.id, { required: e.target.checked })}
                              className="mr-2"
                            />
                            <label className="text-xs text-gray-700">Required</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Field */}
                <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 bg-blue-50">
                  <h4 className="font-semibold mb-4 text-blue-900 flex items-center">
                    <span className="mr-2">➕</span>
                    Add New Field
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Field Label"
                      value={newField.label || ''}
                      onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                      className="px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Placeholder"
                      value={newField.placeholder || ''}
                      onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                      className="px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <select
                      value={newField.type || 'text'}
                      onChange={(e) => setNewField({ ...newField, type: e.target.value as FormField['type'] })}
                      className="px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="tel">Phone</option>
                      <option value="textarea">Textarea</option>
                    </select>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newField.required || false}
                        onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-blue-900">Required</label>
                    </div>
                  </div>
                  <button
                    onClick={addField}
                    disabled={!newField.label?.trim()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium disabled:bg-gray-400 hover:bg-blue-700 transition-colors"
                  >
                    Add Field
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => saveSettings()}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold disabled:opacity-50 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  {saving ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Saving...
                    </span>
                  ) : (
                    '💾 Save All Settings'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <span className="mr-2">📧</span>
                    Received Messages
                  </h3>
                  <p className="text-green-100 mt-1">
                    Messages submitted through your contact widget
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <span className="text-white font-semibold">
                    Total: {messages.length} messages
                  </span>
                </div>
              </div>
            </div>

            {messages.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h4 className="text-xl font-semibold text-gray-600 mb-2">No messages yet</h4>
                <p className="text-gray-500">Messages submitted through your widget will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Contact Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Message Content
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {messages.map((message, index) => {
                      const formData = message.formData as Record<string, string>;
                      const messageFields = Object.entries(formData);
                      const contactInfo = messageFields.filter(([key]) => 
                        ['name', 'email', 'phone', 'tel'].some(field => key.toLowerCase().includes(field))
                      );
                      const messageContent = messageFields.filter(([key]) => 
                        ['message', 'comment', 'inquiry', 'subject'].some(field => key.toLowerCase().includes(field))
                      );
                      const otherFields = messageFields.filter(([key]) => 
                        !['name', 'email', 'phone', 'tel', 'message', 'comment', 'inquiry', 'subject'].some(field => key.toLowerCase().includes(field))
                      );

                      return (
                        <tr 
                          key={message._id as string} 
                          className={`transition-colors ${
                            message.isRead 
                              ? `hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}` 
                              : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
                          }`}
                        >
                          {/* Date & Time */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-gray-900">
                                  {new Date(message.submissionTime).toLocaleDateString()}
                                </div>
                                {!message.isRead && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    New
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-500">
                                {new Date(message.submissionTime).toLocaleTimeString()}
                              </div>
                            </div>
                          </td>

                          {/* Contact Details */}
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {contactInfo.map(([key, value]) => (
                                <div key={key} className="text-sm">
                                  <span className="font-medium text-gray-600 capitalize">
                                    {key.replace(/_/g, ' ')}:
                                  </span>
                                  <span className="ml-1 text-gray-900">{value}</span>
                                </div>
                              ))}
                              {otherFields.map(([key, value]) => (
                                <div key={key} className="text-sm">
                                  <span className="font-medium text-gray-600 capitalize">
                                    {key.replace(/_/g, ' ')}:
                                  </span>
                                  <span className="ml-1 text-gray-900">{value}</span>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Message Content */}
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              {messageContent.map(([key, value]) => (
                                <div key={key} className="text-sm">
                                  <div className="font-medium text-gray-600 capitalize mb-1">
                                    {key.replace(/_/g, ' ')}:
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-3 text-gray-900 max-w-xs">
                                    {value.length > 100 ? (
                                      <div>
                                        <span>{value.substring(0, 100)}...</span>
                                        <button 
                                          className="text-blue-600 hover:text-blue-800 ml-1 font-medium"
                                          onClick={() => alert(value)}
                                        >
                                          Read more
                                        </button>
                                      </div>
                                    ) : (
                                      value
                                    )}
                                  </div>
                                </div>
                              ))}
                              {messageContent.length === 0 && (
                                <span className="text-gray-400 italic">No message content</span>
                              )}
                            </div>
                          </td>

                          {/* IP Address */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {message.ipAddress ? (
                              <div className="text-sm">
                                <div className="flex items-center">
                                  <span className="mr-1">🌐</span>
                                  <span className="font-mono text-gray-600 text-xs">
                                    {message.ipAddress}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-sm">N/A</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => {
                                  const messageText = Object.entries(formData)
                                    .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
                                    .join('\n\n');
                                  alert(`Full Message:\n\n${messageText}`);
                                }}
                                className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium"
                                title="View full message"
                              >
                                👁️ View
                              </button>
                              <button
                                onClick={() => deleteMessage(message._id as string)}
                                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors text-xs font-medium"
                                title="Delete message"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
} 