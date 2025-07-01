'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Plan {
  _id: string;
  planId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
  isRecommended: boolean;
  isActive: boolean;
  displayOrder: number;
  buttonText: string;
  buttonColor: string;
  razorpayPlanId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Addon {
  _id: string;
  addonId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: string;
  category: string;
  icon?: string;
  isActive: boolean;
  displayOrder: number;
  requirements?: string[];
  createdAt: string;
  updatedAt: string;
}

interface PlanFormData {
  planId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
  isRecommended: boolean;
  isActive: boolean;
  displayOrder: number;
  buttonText: string;
  buttonColor: string;
  razorpayPlanId: string;
}

interface AddonFormData {
  addonId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: string;
  category: string;
  icon: string;
  isActive: boolean;
  displayOrder: number;
  requirements: string[];
}

export default function AdminBillingPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'plans' | 'addons'>('plans');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showAddonForm, setShowAddonForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  
  // Delete confirmation states
  const [showDeletePlanConfirm, setShowDeletePlanConfirm] = useState(false);
  const [showDeleteAddonConfirm, setShowDeleteAddonConfirm] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [addonToDelete, setAddonToDelete] = useState<Addon | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [planFormData, setPlanFormData] = useState<PlanFormData>({
    planId: '',
    name: '',
    description: '',
    price: 0,
    currency: 'INR',
    billingCycle: 'monthly',
    features: [''],
    isRecommended: false,
    isActive: true,
    displayOrder: 0,
    buttonText: 'Select Plan',
    buttonColor: 'purple',
    razorpayPlanId: ''
  });

  const [addonFormData, setAddonFormData] = useState<AddonFormData>({
    addonId: '',
    name: '',
    description: '',
    price: 0,
    currency: 'INR',
    billingCycle: 'monthly',
    category: 'widget',
    icon: '',
    isActive: true,
    displayOrder: 0,
    requirements: ['']
  });

  // Fetch plans and add-ons
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch plans from admin API (shows ALL plans including inactive)
      const plansResponse = await fetch('/api/admin/billing/plans');
      const plansData = await plansResponse.json();
      if (plansData.success) {
        setPlans(plansData.plans);
      } else {
        console.error('Error fetching plans:', plansData.error);
      }
      
      // Fetch add-ons from admin API (shows ALL add-ons including inactive)
      const addonsResponse = await fetch('/api/admin/billing/addons');
      const addonsData = await addonsResponse.json();
      if (addonsData.success) {
        setAddons(addonsData.addons);
      } else {
        console.error('Error fetching add-ons:', addonsData.error);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('🚀 Starting plan submit...');
      console.log('📝 Form data:', planFormData);
      console.log('✏️ Editing plan:', editingPlan);
      
      const url = editingPlan ? `/api/billing/plans/${editingPlan._id}` : '/api/billing/plans';
      const method = editingPlan ? 'PUT' : 'POST';
      
      console.log(`🌐 API call: ${method} ${url}`);
      
      const payload = {
        ...planFormData,
        features: planFormData.features.filter(f => f.trim() !== '')
      };
      
      console.log('📦 Payload:', payload);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers));
      
      const result = await response.json();
      console.log('📋 Response data:', result);
      
      if (result.success) {
        console.log('✅ Plan saved successfully');
        await fetchData();
        setShowPlanForm(false);
        setEditingPlan(null);
        resetPlanForm();
        
        // Show success message
        alert(`Plan ${editingPlan ? 'updated' : 'created'} successfully!`);
      } else {
        console.error('❌ Server returned error:', result.error);
        alert(`Error: ${result.error || 'Failed to save plan'}`);
      }
    } catch (error: any) {
      console.error('💥 Unexpected error saving plan:', error);
      
      // More detailed error logging
      if (error instanceof TypeError) {
        console.error('🌐 Network error - check your connection');
      } else if (error instanceof SyntaxError) {
        console.error('📄 JSON parsing error - invalid response format');
      }
      
      alert(`Unexpected error: ${error.message || 'Failed to save plan'}`);
    }
  };

  const handleAddonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAddon ? `/api/billing/addons/${editingAddon._id}` : '/api/billing/addons';
      const method = editingAddon ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...addonFormData,
          requirements: addonFormData.requirements.filter(r => r.trim() !== '')
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchData();
        setShowAddonForm(false);
        setEditingAddon(null);
        resetAddonForm();
      } else {
        alert(result.error || 'Failed to save add-on');
      }
    } catch (error) {
      console.error('Error saving add-on:', error);
      alert('Failed to save add-on');
    }
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    
    try {
      console.log('🗑️ Starting plan deletion...');
      console.log('📝 Plan to delete:', planToDelete);
      
      setDeleting(true);
      
      const response = await fetch(`/api/billing/plans/${planToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📡 Delete response status:', response.status);
      
      const result = await response.json();
      console.log('📋 Delete response data:', result);
      
      if (result.success) {
        console.log('✅ Plan deleted successfully');
        await fetchData();
        setShowDeletePlanConfirm(false);
        setPlanToDelete(null);
        alert(`Plan "${planToDelete.name}" deleted successfully!`);
      } else {
        console.error('❌ Server returned error:', result.error);
        alert(`Error: ${result.error || 'Failed to delete plan'}`);
      }
    } catch (error: any) {
      console.error('💥 Unexpected error deleting plan:', error);
      alert(`Unexpected error: ${error.message || 'Failed to delete plan'}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAddon = async () => {
    if (!addonToDelete) return;
    
    try {
      console.log('🗑️ Starting add-on deletion...');
      console.log('📝 Add-on to delete:', addonToDelete);
      
      setDeleting(true);
      
      const response = await fetch(`/api/billing/addons/${addonToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📡 Delete response status:', response.status);
      
      const result = await response.json();
      console.log('📋 Delete response data:', result);
      
      if (result.success) {
        console.log('✅ Add-on deleted successfully');
        await fetchData();
        setShowDeleteAddonConfirm(false);
        setAddonToDelete(null);
        alert(`Add-on "${addonToDelete.name}" deleted successfully!`);
      } else {
        console.error('❌ Server returned error:', result.error);
        alert(`Error: ${result.error || 'Failed to delete add-on'}`);
      }
    } catch (error: any) {
      console.error('💥 Unexpected error deleting add-on:', error);
      alert(`Unexpected error: ${error.message || 'Failed to delete add-on'}`);
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeletePlan = (plan: Plan) => {
    setPlanToDelete(plan);
    setShowDeletePlanConfirm(true);
  };

  const confirmDeleteAddon = (addon: Addon) => {
    setAddonToDelete(addon);
    setShowDeleteAddonConfirm(true);
  };

  const cancelDeletePlan = () => {
    setShowDeletePlanConfirm(false);
    setPlanToDelete(null);
  };

  const cancelDeleteAddon = () => {
    setShowDeleteAddonConfirm(false);
    setAddonToDelete(null);
  };

  const resetPlanForm = () => {
    setPlanFormData({
      planId: '',
      name: '',
      description: '',
      price: 0,
      currency: 'INR',
      billingCycle: 'monthly',
      features: [''],
      isRecommended: false,
      isActive: true,
      displayOrder: 0,
      buttonText: 'Select Plan',
      buttonColor: 'purple',
      razorpayPlanId: ''
    });
  };

  const resetAddonForm = () => {
    setAddonFormData({
      addonId: '',
      name: '',
      description: '',
      price: 0,
      currency: 'INR',
      billingCycle: 'monthly',
      category: 'widget',
      icon: '',
      isActive: true,
      displayOrder: 0,
      requirements: ['']
    });
  };

  const editPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanFormData({
      planId: plan.planId,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      features: plan.features.length > 0 ? plan.features : [''],
      isRecommended: plan.isRecommended,
      isActive: plan.isActive,
      displayOrder: plan.displayOrder,
      buttonText: plan.buttonText,
      buttonColor: plan.buttonColor,
      razorpayPlanId: plan.razorpayPlanId || ''
    });
    setShowPlanForm(true);
  };

  const editAddon = (addon: Addon) => {
    setEditingAddon(addon);
    setAddonFormData({
      addonId: addon.addonId,
      name: addon.name,
      description: addon.description,
      price: addon.price,
      currency: addon.currency,
      billingCycle: addon.billingCycle,
      category: addon.category,
      icon: addon.icon || '',
      isActive: addon.isActive,
      displayOrder: addon.displayOrder,
      requirements: addon.requirements && addon.requirements.length > 0 ? addon.requirements : ['']
    });
    setShowAddonForm(true);
  };

  const addFeature = () => {
    setPlanFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index: number) => {
    setPlanFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setPlanFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const addRequirement = () => {
    setAddonFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const removeRequirement = (index: number) => {
    setAddonFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setAddonFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? value : req)
    }));
  };

  const formatDate = (dateString: string) => {
    // Handle null, undefined, or invalid dates gracefully
    if (!dateString) return 'Not set';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Plan & Add-on Management</h1>
        <p className="text-gray-600">Manage billing plans and add-ons for your platform</p>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('plans')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'plans'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Plans ({plans.length})
            </button>
            <button
              onClick={() => setActiveTab('addons')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'addons'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Add-ons ({addons.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'plans' && (
            <div className="space-y-6">
              {/* Plans Header */}
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Billing Plans</h2>
                <button
                  onClick={() => {
                    resetPlanForm();
                    setEditingPlan(null);
                    setShowPlanForm(true);
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Add New Plan
                </button>
              </div>

              {/* Plans Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razorpay Plan ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modified</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {plans.map((plan) => (
                      <tr key={plan._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {plan.name}
                              {plan.isRecommended && (
                                <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{plan.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{plan.price.toLocaleString()}/{plan.billingCycle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            plan.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {plan.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {plan.razorpayPlanId || 'Not set'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(plan.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(plan.updatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => editPlan(plan)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDeletePlan(plan)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'addons' && (
            <div className="space-y-6">
              {/* Add-ons Header */}
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Add-ons</h2>
                <button
                  onClick={() => {
                    resetAddonForm();
                    setEditingAddon(null);
                    setShowAddonForm(true);
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Add New Add-on
                </button>
              </div>

              {/* Add-ons Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Add-on</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modified</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {addons.map((addon) => (
                      <tr key={addon._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {addon.icon && <span className="text-lg mr-2">{addon.icon}</span>}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{addon.name}</div>
                              <div className="text-sm text-gray-500">{addon.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {addon.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{addon.price.toLocaleString()}/{addon.billingCycle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            addon.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {addon.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(addon.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(addon.updatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => editAddon(addon)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDeleteAddon(addon)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plan Form Modal */}
      {showPlanForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
              </h3>
              <button
                onClick={() => {
                  setShowPlanForm(false);
                  setEditingPlan(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={handlePlanSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plan ID</label>
                  <input
                    type="text"
                    required
                    value={planFormData.planId}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, planId: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., basic, pro, premium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={planFormData.name}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Basic Plan"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    required
                    value={planFormData.description}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Plan description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={planFormData.price}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <select
                    value={planFormData.currency}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Billing Cycle</label>
                  <select
                    value={planFormData.billingCycle}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, billingCycle: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Button Color</label>
                  <select
                    value={planFormData.buttonColor}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, buttonColor: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="gray">Gray</option>
                    <option value="purple">Purple</option>
                    <option value="gradient">Gradient</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Button Text</label>
                  <input
                    type="text"
                    value={planFormData.buttonText}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, buttonText: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Select Plan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={planFormData.displayOrder}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, displayOrder: Number(e.target.value) }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Razorpay Plan ID</label>
                  <input
                    type="text"
                    value={planFormData.razorpayPlanId}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, razorpayPlanId: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., plan_xxxxxxxxxxxxxxxx"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Optional: Razorpay Plan ID for payment integration
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                  {planFormData.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Feature description"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeature}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    + Add Feature
                  </button>
                </div>

                <div className="md:col-span-2 flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={planFormData.isRecommended}
                      onChange={(e) => setPlanFormData(prev => ({ ...prev, isRecommended: e.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Recommended Plan</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={planFormData.isActive}
                      onChange={(e) => setPlanFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPlanForm(false);
                    setEditingPlan(null);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add-on Form Modal */}
      {showAddonForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingAddon ? 'Edit Add-on' : 'Create New Add-on'}
              </h3>
              <button
                onClick={() => {
                  setShowAddonForm(false);
                  setEditingAddon(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddonSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Add-on ID</label>
                  <input
                    type="text"
                    required
                    value={addonFormData.addonId}
                    onChange={(e) => setAddonFormData(prev => ({ ...prev, addonId: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., image-gallery"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Add-on Name</label>
                  <input
                    type="text"
                    required
                    value={addonFormData.name}
                    onChange={(e) => setAddonFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Image Gallery"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    required
                    value={addonFormData.description}
                    onChange={(e) => setAddonFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Add-on description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={addonFormData.price}
                    onChange={(e) => setAddonFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <select
                    value={addonFormData.currency}
                    onChange={(e) => setAddonFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Billing Cycle</label>
                  <select
                    value={addonFormData.billingCycle}
                    onChange={(e) => setAddonFormData(prev => ({ ...prev, billingCycle: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={addonFormData.category}
                    onChange={(e) => setAddonFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="widget">Widget</option>
                    <option value="feature">Feature</option>
                    <option value="service">Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Icon (Emoji)</label>
                  <input
                    type="text"
                    value={addonFormData.icon}
                    onChange={(e) => setAddonFormData(prev => ({ ...prev, icon: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="🖼️"
                    maxLength={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={addonFormData.displayOrder}
                    onChange={(e) => setAddonFormData(prev => ({ ...prev, displayOrder: Number(e.target.value) }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requirements (Optional)</label>
                  {addonFormData.requirements.map((requirement, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={requirement}
                        onChange={(e) => updateRequirement(index, e.target.value)}
                        className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Requirement description"
                      />
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    + Add Requirement
                  </button>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={addonFormData.isActive}
                      onChange={(e) => setAddonFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddonForm(false);
                    setEditingAddon(null);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  {editingAddon ? 'Update Add-on' : 'Create Add-on'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Plan Confirmation Modal */}
      {showDeletePlanConfirm && planToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Delete Plan</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to delete the plan <strong>"{planToDelete.name}"</strong>?
                </p>
                <p className="text-xs text-red-600">
                  This action cannot be undone. All data associated with this plan will be permanently deleted.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-6">
                <button
                  onClick={cancelDeletePlan}
                  disabled={deleting}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePlan}
                  disabled={deleting}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {deleting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {deleting ? 'Deleting...' : 'Delete Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Add-on Confirmation Modal */}
      {showDeleteAddonConfirm && addonToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Delete Add-on</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to delete the add-on <strong>"{addonToDelete.name}"</strong>?
                </p>
                <p className="text-xs text-red-600">
                  This action cannot be undone. All data associated with this add-on will be permanently deleted.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-6">
                <button
                  onClick={cancelDeleteAddon}
                  disabled={deleting}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAddon}
                  disabled={deleting}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {deleting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {deleting ? 'Deleting...' : 'Delete Add-on'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 