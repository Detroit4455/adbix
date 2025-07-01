'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import LeftNavbar from '@/components/LeftNavbar';
import { 
  UserCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  role: string;
  businessName: string;
  businessCategory: string;
  businessAddress: string;
  area: string;
  pincode: string;
  instagramId: string;
  instagramUrl: string;
  facebookUrl: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    businessName: '',
    businessCategory: '',
    businessAddress: '',
    area: '',
    pincode: '',
    instagramId: '',
    instagramUrl: '',
    facebookUrl: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    fetchProfile();
  }, [session, status]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setFormData({
          name: data.profile.name || '',
          email: data.profile.email || '',
          businessName: data.profile.businessName || '',
          businessCategory: data.profile.businessCategory || '',
          businessAddress: data.profile.businessAddress || '',
          area: data.profile.area || '',
          pincode: data.profile.pincode || '',
          instagramId: data.profile.instagramId || '',
          instagramUrl: data.profile.instagramUrl || '',
          facebookUrl: data.profile.facebookUrl || ''
        });
      } else {
        console.error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (editing) {
      // Reset form data when canceling
      setFormData({
        name: profile?.name || '',
        email: profile?.email || '',
        businessName: profile?.businessName || '',
        businessCategory: profile?.businessCategory || '',
        businessAddress: profile?.businessAddress || '',
        area: profile?.area || '',
        pincode: profile?.pincode || '',
        instagramId: profile?.instagramId || '',
        instagramUrl: profile?.instagramUrl || '',
        facebookUrl: profile?.facebookUrl || ''
      });
      setErrors({});
    }
    setEditing(!editing);
    setSuccess('');
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    if (formData.instagramUrl && !/^https?:\/\/(www\.)?instagram\.com\//.test(formData.instagramUrl)) {
      newErrors.instagramUrl = 'Please enter a valid Instagram URL';
    }

    if (formData.facebookUrl && !/^https?:\/\/(www\.)?facebook\.com\//.test(formData.facebookUrl)) {
      newErrors.facebookUrl = 'Please enter a valid Facebook URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setErrors({});

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data.profile);
        setEditing(false);
        setSuccess('Profile updated successfully!');
        
        // Update the session if name changed
        if (formData.name !== session?.user?.name) {
          await update({
            ...session,
            user: {
              ...session?.user,
              name: formData.name
            }
          });
        }
      } else {
        setErrors({ general: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      setErrors({ general: 'An error occurred while updating your profile' });
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'devops':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'manager':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <LeftNavbar />
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
        <Navbar />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="mt-2 text-gray-600">Manage your account information and preferences</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
              <CheckIcon className="h-5 w-5 mr-2" />
              {success}
            </div>
          )}

          {/* Error Message */}
          {errors.general && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          {/* Profile Overview Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center space-x-6">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : profile.mobileNumber.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {profile.name || 'Set your name'}
                    </h2>
                    <p className="text-gray-600 mt-1">{profile.mobileNumber}</p>
                    {profile.businessName && (
                      <p className="text-indigo-600 mt-1 font-medium">{profile.businessName}</p>
                    )}
                    {profile.businessCategory && (
                      <p className="text-gray-500 mt-1">{profile.businessCategory}</p>
                    )}
                  </div>
                </div>
                <div className="mt-6 lg:mt-0">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getRoleColor(profile.role)}`}>
                    <ShieldCheckIcon className="h-4 w-4 mr-2" />
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Mode Toggle */}
          <div className="flex justify-end mb-6">
            <button
              onClick={handleEditToggle}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              {editing ? (
                <>
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Cancel Editing
                </>
              ) : (
                <>
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Edit Profile
                </>
              )}
            </button>
          </div>

          {/* Form Sections */}
          <div className="space-y-8">
            {/* Personal Information Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <UserCircleIcon className="h-6 w-6 text-indigo-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mobile Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={profile.mobileNumber}
                        readOnly
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Mobile number cannot be changed</p>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!editing}
                        className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 transition-colors ${
                          editing 
                            ? 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500' 
                            : 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                        } ${errors.name ? 'border-red-300' : ''}`}
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!editing}
                        className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 transition-colors ${
                          editing 
                            ? 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500' 
                            : 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                        } ${errors.email ? 'border-red-300' : ''}`}
                        placeholder="Enter your email address"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Account Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Role
                    </label>
                    <div className="relative">
                      <ShieldCheckIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                        readOnly
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Role is managed by administrators</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Information Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-emerald-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      disabled={!editing}
                      className={`block w-full px-3 py-2 border rounded-md leading-5 transition-colors ${
                        editing 
                          ? 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500' 
                          : 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                      }`}
                      placeholder="Enter your business name"
                    />
                  </div>

                  {/* Business Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Category
                    </label>
                    <input
                      type="text"
                      value={formData.businessCategory}
                      onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                      disabled={!editing}
                      className={`block w-full px-3 py-2 border rounded-md leading-5 transition-colors ${
                        editing 
                          ? 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500' 
                          : 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                      }`}
                      placeholder="e.g., Restaurant, Retail, Services"
                    />
                  </div>

                  {/* Area */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Area
                    </label>
                    <input
                      type="text"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      disabled={!editing}
                      className={`block w-full px-3 py-2 border rounded-md leading-5 transition-colors ${
                        editing 
                          ? 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500' 
                          : 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                      }`}
                      placeholder="Area or locality"
                    />
                  </div>

                  {/* Pincode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      disabled={!editing}
                      className={`block w-full px-3 py-2 border rounded-md leading-5 transition-colors ${
                        editing 
                          ? 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500' 
                          : 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                      } ${errors.pincode ? 'border-red-300' : ''}`}
                      placeholder="6-digit pincode"
                      maxLength={6}
                    />
                    {errors.pincode && (
                      <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>
                    )}
                  </div>
                </div>

                {/* Business Address */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Address
                  </label>
                  <textarea
                    value={formData.businessAddress}
                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                    disabled={!editing}
                    rows={3}
                    className={`block w-full px-3 py-2 border rounded-md leading-5 transition-colors ${
                      editing 
                        ? 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500' 
                        : 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                    }`}
                    placeholder="Enter your full business address"
                  />
                </div>
              </div>
            </div>

            {/* Social Media Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-pink-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4V5a1 1 0 011-1h6a1 1 0 011 1v1M6 9l6 6 6-6" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">Social Media</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Instagram ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram ID
                    </label>
                    <input
                      type="text"
                      value={formData.instagramId}
                      onChange={(e) => setFormData({ ...formData, instagramId: e.target.value })}
                      disabled={!editing}
                      className={`block w-full px-3 py-2 border rounded-md leading-5 transition-colors ${
                        editing 
                          ? 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500' 
                          : 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                      }`}
                      placeholder="@your_instagram_handle"
                    />
                  </div>

                  {/* Instagram URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      value={formData.instagramUrl}
                      onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                      disabled={!editing}
                      className={`block w-full px-3 py-2 border rounded-md leading-5 transition-colors ${
                        editing 
                          ? 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500' 
                          : 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                      } ${errors.instagramUrl ? 'border-red-300' : ''}`}
                      placeholder="https://instagram.com/your_handle"
                    />
                    {errors.instagramUrl && (
                      <p className="mt-1 text-sm text-red-600">{errors.instagramUrl}</p>
                    )}
                  </div>

                  {/* Facebook URL */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facebook URL
                    </label>
                    <input
                      type="url"
                      value={formData.facebookUrl}
                      onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                      disabled={!editing}
                      className={`block w-full px-3 py-2 border rounded-md leading-5 transition-colors ${
                        editing 
                          ? 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500' 
                          : 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                      } ${errors.facebookUrl ? 'border-red-300' : ''}`}
                      placeholder="https://facebook.com/your_page"
                    />
                    {errors.facebookUrl && (
                      <p className="mt-1 text-sm text-red-600">{errors.facebookUrl}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <CalendarIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Joined</p>
                        <p className="text-sm text-gray-600">{new Date(profile.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Last Updated</p>
                        <p className="text-sm text-gray-600">{new Date(profile.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {profile.area && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Location</p>
                          <p className="text-sm text-gray-600">{profile.area}{profile.pincode && `, ${profile.pincode}`}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Save Button */}
            {editing && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleEditToggle}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-5 w-5 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 