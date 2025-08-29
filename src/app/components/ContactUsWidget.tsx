'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FormField } from '@/models/ContactUsWidget';

interface ContactUsWidgetProps {
  userId?: string;
  showControls?: boolean;
  width?: string;
  height?: string;
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

// Helper function to convert hex color to rgba
const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Template styles
const getTemplateStyles = (template: string, settings: WidgetSettings) => {
  const baseStyles = {
    backgroundColor: hexToRgba(settings.backgroundColor, settings.backgroundOpacity),
    color: hexToRgba(settings.textColor, settings.textOpacity),
  };

  switch (template) {
    case 'minimal':
      return {
        ...baseStyles,
        border: `1px solid ${hexToRgba(settings.textColor, 0.2)}`,
        borderRadius: '4px',
        boxShadow: 'none',
      };
    case 'glassmorphism':
      return {
        ...baseStyles,
        background: `linear-gradient(135deg, ${hexToRgba(settings.backgroundColor, 0.8)}, ${hexToRgba(settings.backgroundColor, 0.6)})`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${hexToRgba('#ffffff', 0.2)}`,
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      };
    case 'gradient':
      return {
        ...baseStyles,
        background: `linear-gradient(135deg, ${hexToRgba(settings.backgroundColor, settings.backgroundOpacity)}, ${hexToRgba(settings.buttonColor, 0.8)})`,
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      };
    case 'neumorphism':
      return {
        ...baseStyles,
        borderRadius: '20px',
        boxShadow: `
          ${hexToRgba('#ffffff', 0.9)} 0px 4px 16px, 
          ${hexToRgba('#000000', 0.1)} 0px 8px 32px
        `,
        border: 'none',
      };
    case 'modern-card':
    default:
      return {
        ...baseStyles,
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      };
  }
};

export default function ContactUsWidget({ 
  userId, 
  showControls = false,
  width = '400px',
  height = '500px'
}: ContactUsWidgetProps) {
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/contact-us-widget?userId=${userId}`);
      const data = await response.json();
      
      // Ensure template field exists with default value
      const settingsWithTemplate = {
        ...data,
        template: data.template || 'modern-card'
      };
      
      console.log('Widget loaded with template:', settingsWithTemplate.template);
      setSettings(settingsWithTemplate);
      
      // Initialize form data with empty values
      const initialFormData: Record<string, string> = {};
      if (data.fields && Array.isArray(data.fields)) {
        data.fields.forEach((field: FormField) => {
          initialFormData[field.name] = '';
        });
      }
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load contact form');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !settings) return;

    // Validate required fields
    if (settings.fields && Array.isArray(settings.fields)) {
      for (const field of settings.fields) {
        if (field.required && !formData[field.name]?.trim()) {
          setError(`${field.label} is required`);
          return;
        }
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/contact-us-widget/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          formData
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({}); // Clear form
        // Reset form data
        const initialFormData: Record<string, string> = {};
        if (settings.fields && Array.isArray(settings.fields)) {
          settings.fields.forEach((field: FormField) => {
            initialFormData[field.name] = '';
          });
        }
        setFormData(initialFormData);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit message');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Failed to submit message');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const commonStyles = {
      width: '100%',
      padding: '8px 10px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      fontSize: '13px',
      color: settings ? hexToRgba(settings.textColor, settings.textOpacity) : '#333333',
      backgroundColor: settings ? hexToRgba(settings.placeholderBgColor, settings.placeholderBgOpacity) : '#ffffff',
      boxSizing: 'border-box' as const
    };

    const labelStyles = {
      display: 'block',
      marginBottom: '4px',
      fontSize: '13px',
      fontWeight: '500',
      color: settings?.textColor || '#333333'
    };

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.id} style={{ marginBottom: '12px' }}>
            <label style={labelStyles}>
              {field.label}
              {field.required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            <textarea
              name={field.name}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              required={field.required}
              rows={3}
              style={{
                ...commonStyles,
                resize: 'vertical' as const,
                minHeight: '60px'
              }}
            />
          </div>
        );
      default:
        return (
          <div key={field.id} style={{ marginBottom: '12px' }}>
            <label style={labelStyles}>
              {field.label}
              {field.required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            <input
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              required={field.required}
              style={commonStyles}
            />
          </div>
        );
    }
  };

  const containerStyle: React.CSSProperties = {
    width,
    height,
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: 'border-box',
    overflow: 'auto',
    ...(settings ? getTemplateStyles(settings.template, settings) : {
      backgroundColor: '#ffffff',
      color: '#333333',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    })
  };

  const loadingStyle: React.CSSProperties = {
    ...containerStyle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb'
  };

  const spinnerStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    border: '2px solid #e5e7eb',
    borderTop: '2px solid #374151',
    borderRadius: '50%'
  };

  // Inject CSS directly into document head for proper styling
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = `contact-widget-styles-${userId}`;
      
      // Remove existing styles if any
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }

      // Create new style element
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes contact-widget-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .contact-form input::placeholder,
        .contact-form textarea::placeholder {
          color: ${settings ? hexToRgba(settings.placeholderColor, settings.placeholderOpacity) : '#9ca3af'} !important;
          opacity: 1 !important;
        }
        
        .contact-form input:focus,
        .contact-form textarea:focus {
          outline: 2px solid ${settings ? hexToRgba(settings.buttonColor, 0.5) : '#3b82f6'} !important;
          outline-offset: 2px !important;
        }
        
        .contact-widget-spinner {
          animation: contact-widget-spin 1s linear infinite !important;
        }
      `;
      
      document.head.appendChild(style);

      // Cleanup function
      return () => {
        const styleToRemove = document.getElementById(styleId);
        if (styleToRemove) {
          styleToRemove.remove();
        }
      };
    }
  }, [settings, userId]);

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div style={{...spinnerStyle}} className="contact-widget-spinner"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', color: '#ef4444' }}>
          Failed to load contact form
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '600' }}>
            Thank You!
          </h3>
          <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
            Your message has been sent successfully. We'll get back to you soon!
          </p>
          <button
            onClick={() => setSubmitted(false)}
            style={{
              marginTop: '12px',
              padding: '8px 14px',
              backgroundColor: settings.buttonColor,
              color: settings.buttonTextColor,
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: '16px', textAlign: 'center' }}>
        <h2 style={{ 
          margin: '0 0 6px 0', 
          fontSize: `${Math.min(settings.titleFontSize || 18, 18)}px`, 
          fontWeight: '600',
          color: hexToRgba(settings.textColor, settings.textOpacity)
        }}>
          {settings.title}
        </h2>
        {settings.subtitle && (
          <p style={{ 
            margin: '0', 
            fontSize: '12px', 
            color: hexToRgba(settings.textColor, settings.textOpacity * 0.7)
          }}>
            {settings.subtitle}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="contact-form">
        {settings.fields && settings.fields
          .sort((a, b) => a.order - b.order)
          .map(renderField)}

        {error && (
          <div style={{
            marginBottom: '12px',
            padding: '8px 10px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            color: '#dc2626',
            fontSize: '12px'
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor: submitting ? '#9ca3af' : (settings ? hexToRgba(settings.buttonColor, settings.buttonOpacity) : '#3b82f6'),
            color: settings ? hexToRgba(settings.buttonTextColor, settings.buttonTextOpacity) : '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease'
          }}
        >
          {submitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>


    </div>
  );
} 

