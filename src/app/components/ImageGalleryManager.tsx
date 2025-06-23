'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  position: number;
}

interface GallerySettings {
  view: string;
  items: GalleryItem[];
  backgroundColor?: string; // RGBA color string with opacity
}

interface ImageGalleryManagerProps {
  userId: string;
  onGalleryUpdate?: () => void; // Callback to notify parent about updates
}

// Available view types
const VIEW_TYPES = {
  SLIDESHOW: 'slideshow',
  GRID: 'grid',
  MASONRY: 'masonry', 
  CAROUSEL: 'carousel',
  FULLSCREEN: 'fullscreen'
};

const VIEW_OPTIONS = [
  { value: VIEW_TYPES.SLIDESHOW, label: '🎭 Slideshow', description: 'Classic sliding gallery with navigation' },
  { value: VIEW_TYPES.GRID, label: '📱 Grid Layout', description: 'Organized grid of images' },
  { value: VIEW_TYPES.MASONRY, label: '🧱 Masonry', description: 'Pinterest-style varied heights' },
  { value: VIEW_TYPES.CAROUSEL, label: '🎠 Carousel', description: 'Main image with thumbnails' },
  { value: VIEW_TYPES.FULLSCREEN, label: '🖼️ Fullscreen', description: 'Full-size image display' }
];

export default function ImageGalleryManager({ userId, onGalleryUpdate }: ImageGalleryManagerProps) {
  const { data: session } = useSession();
  const [gallerySettings, setGallerySettings] = useState<GallerySettings>({
    view: VIEW_TYPES.SLIDESHOW,
    items: [],
    backgroundColor: 'rgba(245, 247, 250, 1)' // Default background
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newItem, setNewItem] = useState<Partial<GalleryItem>>({
    title: '',
    description: '',
    imageUrl: '',
    category: 'Custom',
    position: 1
  });

  // Default gallery items with positions
  const defaultGalleryItems: GalleryItem[] = [
    {
      id: '1',
      title: 'Party Ready',
      description: 'Vibrant and festive party style.',
      imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=300&h=200&fit=crop',
      category: 'Party',
      position: 1
    },
    {
      id: '2',
      title: 'Bridal Magic',
      description: 'Graceful look for your big day.',
      imageUrl: 'https://images.unsplash.com/photo-1594736797933-d0d80986bcc6?w=300&h=200&fit=crop',
      category: 'Bridal',
      position: 2
    },
    {
      id: '3',
      title: 'Urban Chic',
      description: 'Trendy urban makeover.',
      imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=200&fit=crop',
      category: 'Urban',
      position: 3
    },
    {
      id: '4',
      title: 'Elegant Waves',
      description: 'Soft and elegant hairstyle.',
      imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop',
      category: 'Elegant',
      position: 4
    },
    {
      id: '5',
      title: 'Radiant Glow',
      description: 'Natural radiant makeup look.',
      imageUrl: 'https://images.unsplash.com/photo-1596462502378-119101fe5440?w=300&h=200&fit=crop',
      category: 'Natural',
      position: 5
    }
  ];

  // Show message
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Sort items by position
  const sortItemsByPosition = (items: GalleryItem[]) => {
    return [...items].sort((a, b) => a.position - b.position);
  };

  // Convert RGBA to hex and opacity for color picker
  const parseBackgroundColor = (rgba: string) => {
    if (!rgba || !rgba.startsWith('rgba(')) {
      return { hex: '#f5f7fa', opacity: 1 };
    }
    
    const match = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (match) {
      const [, r, g, b, a] = match;
      const hex = '#' + [r, g, b].map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
      return { hex, opacity: parseFloat(a) };
    }
    
    return { hex: '#f5f7fa', opacity: 1 };
  };

  // Convert hex and opacity to RGBA
  const createRGBA = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Handle background color change
  const handleBackgroundColorChange = async (hex: string, opacity: number) => {
    const backgroundColor = createRGBA(hex, opacity);
    const updatedSettings = {
      ...gallerySettings,
      backgroundColor
    };
    
    const success = await saveGallerySettings(updatedSettings);
    if (success) {
      showMessage('success', 'Background color updated successfully!');
    }
  };

  // Load gallery settings
  const loadGallerySettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/image-gallery?userId=${userId}`);
      const data = await response.json();
      
      if (data.settings) {
        // New format with view and items
        const itemsWithPositions = (data.settings.items || []).map((item: any, index: number) => ({
          ...item,
          position: item.position || index + 1
        }));
        
        setGallerySettings({
          view: data.settings.view || VIEW_TYPES.SLIDESHOW,
          items: itemsWithPositions.length > 0 ? sortItemsByPosition(itemsWithPositions) : sortItemsByPosition(defaultGalleryItems),
          backgroundColor: data.settings.backgroundColor || 'rgba(245, 247, 250, 1)'
        });
      } else if (data.items && data.items.length > 0) {
        // Legacy format - items only
        const itemsWithPositions = data.items.map((item: any, index: number) => ({
          ...item,
          position: item.position || index + 1
        }));
        setGallerySettings({
          view: VIEW_TYPES.SLIDESHOW,
          items: sortItemsByPosition(itemsWithPositions),
          backgroundColor: 'rgba(245, 247, 250, 1)'
        });
      } else {
        setGallerySettings({
          view: VIEW_TYPES.SLIDESHOW,
          items: sortItemsByPosition(defaultGalleryItems),
          backgroundColor: 'rgba(245, 247, 250, 1)'
        });
      }
    } catch (error) {
      console.error('Error loading gallery settings:', error);
      setGallerySettings({
        view: VIEW_TYPES.SLIDESHOW,
        items: sortItemsByPosition(defaultGalleryItems),
        backgroundColor: 'rgba(245, 247, 250, 1)'
      });
      showMessage('error', 'Failed to load gallery settings');
    } finally {
      setLoading(false);
    }
  };

  // Save gallery settings
  const saveGallerySettings = async (settings: GallerySettings) => {
    try {
      setSaving(true);
      const sortedItems = sortItemsByPosition(settings.items);
      const updatedSettings = { ...settings, items: sortedItems };
      
      const response = await fetch('/api/image-gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: updatedSettings,
          userId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save gallery settings');
      }

      setGallerySettings(updatedSettings);
      onGalleryUpdate?.(); // Notify parent component
      showMessage('success', 'Gallery updated successfully!');
      return true;
    } catch (error) {
      console.error('Error saving gallery settings:', error);
      showMessage('error', 'Failed to save changes. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Update view type
  const handleViewChange = async (newView: string) => {
    const updatedSettings = {
      ...gallerySettings,
      view: newView
    };
    
    const success = await saveGallerySettings(updatedSettings);
    if (success) {
      showMessage('success', `Switched to ${VIEW_OPTIONS.find(v => v.value === newView)?.label} view`);
    }
  };

  // Validate image URL
  const validateImageUrl = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      
      // Timeout after 10 seconds
      setTimeout(() => resolve(false), 10000);
    });
  };

  // Get next available position
  const getNextPosition = () => {
    const maxPosition = Math.max(...gallerySettings.items.map(item => item.position), 0);
    return maxPosition + 1;
  };

  // Add new item
  const handleAddItem = async () => {
    if (!newItem.title || !newItem.description || !newItem.imageUrl) {
      showMessage('error', 'Please fill in all fields');
      return;
    }

    // Validate position
    const position = newItem.position || getNextPosition();
    if (position < 1) {
      showMessage('error', 'Position must be 1 or greater');
      return;
    }

    // Validate image URL
    setSaving(true);
    const isValidImage = await validateImageUrl(newItem.imageUrl);
    setSaving(false);

    if (!isValidImage) {
      showMessage('error', 'Invalid image URL or image failed to load');
      return;
    }

    const newGalleryItem: GalleryItem = {
      id: Date.now().toString(),
      title: newItem.title || '',
      description: newItem.description || '',
      imageUrl: newItem.imageUrl || '',
      category: newItem.category || 'Custom',
      position: position
    };

    // Insert at specified position and adjust others
    const updatedItems = [...gallerySettings.items];
    
    // If position already exists, shift other items
    if (updatedItems.some(item => item.position === position)) {
      updatedItems.forEach(item => {
        if (item.position >= position) {
          item.position += 1;
        }
      });
    }

    updatedItems.push(newGalleryItem);
    
    const success = await saveGallerySettings({
      ...gallerySettings,
      items: updatedItems
    });

    if (success) {
      setNewItem({
        title: '',
        description: '',
        imageUrl: '',
        category: 'Custom',
        position: getNextPosition()
      });
      setShowAddForm(false);
    }
  };

  // Update existing item
  const handleUpdateItem = async (updatedItem: GalleryItem) => {
    // Validate image URL if it changed
    const existingItem = gallerySettings.items.find(item => item.id === updatedItem.id);
    if (existingItem && existingItem.imageUrl !== updatedItem.imageUrl) {
      setSaving(true);
      const isValidImage = await validateImageUrl(updatedItem.imageUrl);
      setSaving(false);

      if (!isValidImage) {
        showMessage('error', 'Invalid image URL or image failed to load');
        return;
      }
    }

    const updatedItems = gallerySettings.items.map(item => {
      if (item.id === updatedItem.id) {
        return updatedItem;
      }
      return item;
    });

    // Handle position conflicts
    const itemsWithSamePosition = updatedItems.filter(item => 
      item.position === updatedItem.position && item.id !== updatedItem.id
    );

    if (itemsWithSamePosition.length > 0) {
      // Shift conflicting items
      updatedItems.forEach(item => {
        if (item.id !== updatedItem.id && item.position >= updatedItem.position) {
          item.position += 1;
        }
      });
    }

    const success = await saveGallerySettings({
      ...gallerySettings,
      items: updatedItems
    });

    if (success) {
      setEditingItem(null);
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    const itemToDelete = gallerySettings.items.find(item => item.id === itemId);
    if (!itemToDelete) return;

    const updatedItems = gallerySettings.items
      .filter(item => item.id !== itemId)
      .map(item => {
        // Adjust positions after deletion
        if (item.position > itemToDelete.position) {
          return { ...item, position: item.position - 1 };
        }
        return item;
      });

    const success = await saveGallerySettings({
      ...gallerySettings,
      items: updatedItems
    });

    if (success) {
      setEditingItem(null);
    }
  };

  // Move item up/down
  const handleMoveItem = async (itemId: string, direction: 'up' | 'down') => {
    const currentItem = gallerySettings.items.find(item => item.id === itemId);
    if (!currentItem) return;

    const newPosition = direction === 'up' ? currentItem.position - 1 : currentItem.position + 1;
    
    if (newPosition < 1 || newPosition > gallerySettings.items.length) return;

    const updatedItems = gallerySettings.items.map(item => {
      if (item.id === itemId) {
        return { ...item, position: newPosition };
      } else if (item.position === newPosition) {
        return { ...item, position: currentItem.position };
      }
      return item;
    });

    await saveGallerySettings({
      ...gallerySettings,
      items: updatedItems
    });
  };

  // Reset to defaults
  const handleResetToDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset to default gallery? This will remove all your custom items.')) {
      return;
    }

    const success = await saveGallerySettings({
      ...gallerySettings,
      items: defaultGalleryItems
    });

    if (success) {
      setEditingItem(null);
      setShowAddForm(false);
    }
  };

  useEffect(() => {
    loadGallerySettings();
  }, [userId]);

  // Update new item position when gallery changes
  useEffect(() => {
    setNewItem(prev => ({
      ...prev,
      position: getNextPosition()
    }));
  }, [gallerySettings.items]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading gallery settings...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* View Selection Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">🎨 Gallery View Style</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {VIEW_OPTIONS.map((option) => (
            <div 
              key={option.value}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                gallerySettings.view === option.value 
                  ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => handleViewChange(option.value)}
            >
              <div className="font-medium text-gray-800">{option.label}</div>
              <div className="text-sm text-gray-600 mt-1">{option.description}</div>
              {gallerySettings.view === option.value && (
                <div className="mt-2 text-xs font-medium text-blue-600">✓ Active</div>
              )}
            </div>
          ))}
        </div>
        
        {/* Background Color Section */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-md font-medium mb-3">🎨 Background Color</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={parseBackgroundColor(gallerySettings.backgroundColor || '').hex}
                  onChange={(e) => {
                    const { opacity } = parseBackgroundColor(gallerySettings.backgroundColor || '');
                    handleBackgroundColorChange(e.target.value, opacity);
                  }}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-sm text-gray-600">
                    Color: {parseBackgroundColor(gallerySettings.backgroundColor || '').hex}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Opacity</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={parseBackgroundColor(gallerySettings.backgroundColor || '').opacity}
                  onChange={(e) => {
                    const { hex } = parseBackgroundColor(gallerySettings.backgroundColor || '');
                    handleBackgroundColorChange(hex, parseFloat(e.target.value));
                  }}
                  className="flex-1"
                />
                <div className="text-sm text-gray-600 min-w-[3rem]">
                  {Math.round(parseBackgroundColor(gallerySettings.backgroundColor || '').opacity * 100)}%
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="text-sm text-gray-600">Preview:</div>
            <div 
              className="w-20 h-8 border border-gray-300 rounded"
              style={{ backgroundColor: gallerySettings.backgroundColor }}
            ></div>
            <div className="text-xs text-gray-500">
              {gallerySettings.backgroundColor}
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-500">
          💡 <strong>Tip:</strong> Changes are saved automatically and will appear in your embedded widget immediately.
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-6"></div>

      {/* Rest of existing component content... */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">📋 Manage Gallery Items</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showAddForm ? 'Cancel' : 'Add New Image'}
          </button>
          <button
            onClick={handleResetToDefaults}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
          <h4 className="font-medium mb-4">Add New Gallery Item</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={newItem.title || ''}
                onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter image title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={newItem.category || 'Custom'}
                onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Custom">Custom</option>
                <option value="Party">Party</option>
                <option value="Bridal">Bridal</option>
                <option value="Urban">Urban</option>
                <option value="Elegant">Elegant</option>
                <option value="Natural">Natural</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={newItem.description || ''}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Enter image description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
              <input
                type="url"
                value={newItem.imageUrl || ''}
                onChange={(e) => setNewItem({...newItem, imageUrl: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input
                type="number"
                value={newItem.position || 1}
                onChange={(e) => setNewItem({...newItem, position: parseInt(e.target.value) || 1})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
              <div className="text-xs text-gray-500 mt-1">Items with same position will be auto-adjusted</div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAddItem}
              disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Item'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Gallery Items List */}
      <div className="space-y-4">
        <h4 className="font-medium">Current Gallery Items ({gallerySettings.items.length})</h4>
        {sortItemsByPosition(gallerySettings.items).map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-4">
            {editingItem?.id === item.id ? (
              // Edit Form
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={editingItem.category}
                      onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Custom">Custom</option>
                      <option value="Party">Party</option>
                      <option value="Bridal">Bridal</option>
                      <option value="Urban">Urban</option>
                      <option value="Elegant">Elegant</option>
                      <option value="Natural">Natural</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={editingItem.description}
                      onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={editingItem.imageUrl}
                      onChange={(e) => setEditingItem({...editingItem, imageUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input
                      type="number"
                      value={editingItem.position}
                      onChange={(e) => setEditingItem({...editingItem, position: parseInt(e.target.value) || 1})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateItem(editingItem)}
                    disabled={saving}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setEditingItem(null)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // Display Mode
              <div className="flex items-start gap-4">
                <img 
                  src={item.imageUrl} 
                  alt={item.title}
                  className="w-24 h-24 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=300&h=200&fit=crop';
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">{item.title}</h5>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Category: {item.category}</span>
                        <span className="font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">Position: {item.position}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <button
                        onClick={() => handleMoveItem(item.id, 'up')}
                        disabled={item.position === 1 || saving}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveItem(item.id, 'down')}
                        disabled={item.position === gallerySettings.items.length || saving}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => setEditingItem(item)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {gallerySettings.items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No gallery items found.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-2 text-blue-600 hover:text-blue-700"
            >
              Add your first image
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 