'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string;
  planId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
  isRecommended: boolean;
  isActive: boolean;
  buttonText: string;
  buttonColor: string;
  displayOrder: number;
  razorpayPlanId?: string;
}

interface Addon {
  id: string;
  addonId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: string;
  category: string;
  icon?: string;
  requirements?: string[];
  displayOrder: number;
}

interface Subscription {
  id: string;
  planId: string;
  razorpaySubscriptionId: string;
  status: string;
  amount: number;
  currency: string;
  startDate: string;
  endDate?: string;
  nextBillingDate?: string;
  shortUrl?: string;
  canBeCancelled: boolean;
  isActive: boolean;
  createdAt: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

// Declare Razorpay global
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function BillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('billing-info');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [errorModal, setErrorModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'error' | 'success' | 'info';
  }>({
    show: false,
    title: '',
    message: '',
    type: 'error'
  });
  
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    cancelText: string;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<{ [key: string]: boolean }>({});
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: ''
  });

  // Utility function to handle error messages
  const getErrorMessage = (error: any, defaultMessage: string): string => {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.message) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('timeout')) {
        return 'Request timed out. Please try again.';
      } else if (error.message.includes('500')) {
        return 'Server error. Please try again later or contact support if the issue persists.';
      }
      return error.message;
    }
    
    return defaultMessage;
  };

  // Function to show modal messages
  const showModal = (title: string, message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setErrorModal({
      show: true,
      title,
      message,
      type
    });
  };

  // Function to close modal
  const closeModal = () => {
    setErrorModal({
      show: false,
      title: '',
      message: '',
      type: 'error'
    });
  };

  const showConfirmModal = (
    title: string, 
    message: string, 
    onConfirm: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ) => {
    setConfirmModal({ 
      show: true, 
      title, 
      message, 
      onConfirm, 
      confirmText, 
      cancelText 
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ 
      show: false, 
      title: '', 
      message: '', 
      onConfirm: () => {}, 
      confirmText: 'Confirm', 
      cancelText: 'Cancel' 
    });
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch plans, addons, and subscriptions
  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  // Auto-refresh for authenticated subscriptions (check every 30 seconds)
  useEffect(() => {
    if (status === 'authenticated' && subscriptions.length > 0) {
      const authenticatedSubs = subscriptions.filter(sub => sub.status === 'authenticated');
      
      if (authenticatedSubs.length > 0) {
        console.log(`Found ${authenticatedSubs.length} authenticated subscription(s), setting up auto-refresh`);
        
        const intervalId = setInterval(async () => {
          console.log('Auto-refreshing subscription status for authenticated subscriptions');
          try {
            await fetchData();
            
            // Check if any subscriptions are now active
            const stillAuthenticated = subscriptions.filter(sub => sub.status === 'authenticated');
            if (stillAuthenticated.length === 0) {
              console.log('All subscriptions have moved past authenticated status, stopping auto-refresh');
              clearInterval(intervalId);
            }
          } catch (error) {
            console.error('Error during auto-refresh:', error);
          }
        }, 30000); // Check every 30 seconds

        // Cleanup interval on component unmount or when subscriptions change
        return () => {
          console.log('Cleaning up subscription auto-refresh interval');
          clearInterval(intervalId);
        };
      }
    }
  }, [status, subscriptions]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch plans
      const plansResponse = await fetch('/api/billing/plans');
      const plansData = await plansResponse.json();
      
      if (plansData.success) {
        setPlans(plansData.plans);
        const defaultPlan = plansData.plans.find((p: Plan) => p.isRecommended) || plansData.plans[0];
        if (defaultPlan) {
          setSelectedPlan(defaultPlan.planId);
        }
      }
      
      // Fetch addons
      const addonsResponse = await fetch('/api/billing/addons');
      const addonsData = await addonsResponse.json();
      
      if (addonsData.success) {
        setAddons(addonsData.addons);
        const initialSelectedAddons: { [key: string]: boolean } = {};
        addonsData.addons.forEach((addon: Addon) => {
          initialSelectedAddons[addon.addonId] = false;
        });
        setSelectedAddons(initialSelectedAddons);
      }

      // Fetch user subscriptions
      const subscriptionsResponse = await fetch('/api/subscriptions');
      
      // Check for Razorpay configuration error
      if (subscriptionsResponse.status === 503) {
        const errorData = await subscriptionsResponse.json();
        setError(errorData.message || 'Payment service not configured. Please contact support.');
        return;
      }
      
      const subscriptionsData = await subscriptionsResponse.json();
      
      if (subscriptionsData.success) {
        setSubscriptions(subscriptionsData.subscriptions);
        const activeSubscription = subscriptionsData.subscriptions.find(
          (sub: Subscription) => sub.isActive
        );
        setCurrentSubscription(activeSubscription || null);
      }

      // Fetch customer info from Adbix database User collection
      const profileResponse = await fetch('/api/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.profile) {
          setCustomerInfo({
            name: profileData.profile.name || '',
            email: profileData.profile.email || '',
            phone: profileData.profile.mobileNumber || ''
          });
        }
      } else {
        // Fallback to session data if profile fetch fails
        if (session?.user) {
          setCustomerInfo({
            name: session.user.name || '',
            email: session.user.email || '',
            phone: session.user.mobileNumber || ''
          });
        }
      }
      
    } catch (error: any) {
      console.error('Error fetching billing data:', error);
      
      // Provide specific error messages based on the error type
      let errorMessage = 'Failed to load billing data. Please refresh the page and try again.';
      
      if (error.message) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and refresh the page.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please refresh the page and try again.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please try again later or contact support if the issue persists.';
        } else {
          errorMessage = 'Failed to load billing data. Please refresh the page and try again.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleAddOn = (addonId: string) => {
    setSelectedAddons(prev => ({
      ...prev,
      [addonId]: !prev[addonId]
    }));
  };

  const calculateTotal = () => {
    const selectedPlanData = plans.find(p => p.planId === selectedPlan);
    let basePrice = selectedPlanData ? selectedPlanData.price : 0;
    let addOnPrice = 0;
    
    addons.forEach(addon => {
      if (selectedAddons[addon.addonId]) {
        addOnPrice += addon.price;
      }
    });
    
    return basePrice + addOnPrice;
  };

  const handleSubscriptionAction = async (action: 'cancel' | 'pause' | 'resume' | 'activate' | 'refresh', subscriptionId: string) => {
    try {
      setProcessingPayment(true);
      
      if (action === 'refresh') {
        // Just refresh the data
        await fetchData();
        showModal('Status Refreshed', 'Subscription status has been refreshed. Please check if your subscription is now active.', 'info');
        return;
      }
      
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to perform action');
      }

        // Refresh subscription data
        await fetchData();

      let message = '';
      let title = '';
        
      switch (action) {
        case 'cancel':
          title = 'Subscription Cancelled';
          message = 'Your subscription has been cancelled successfully.';
              break;
        case 'pause':
          title = 'Subscription Paused';
          message = 'Your subscription has been paused successfully.';
              break;
        case 'resume':
          title = 'Subscription Resumed';
          message = 'Your subscription has been resumed successfully.';
              break;
        case 'activate':
          title = 'Activation Initiated';
          message = 'Your subscription activation has been triggered. The first payment will be processed shortly. Please refresh the page in a few moments to see the updated status.';
              break;
      }

      showModal(title, message, 'success');

    } catch (error: any) {
      console.error('Error performing subscription action:', error);
      showModal('Error', error.message || 'Failed to perform action', 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCreateSubscription = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      setShowCustomerForm(true);
      return;
    }

    try {
      setProcessingPayment(true);

      const selectedAddonIds = Object.keys(selectedAddons).filter(
        addonId => selectedAddons[addonId]
      );

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan,
          selectedAddons: selectedAddonIds,
          customerInfo,
          notifyInfo: {
            phone: customerInfo.phone,
            email: customerInfo.email
          }
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Get Razorpay key from API
        const configResponse = await fetch('/api/razorpay-config');
        const configResult = await configResponse.json();
        
        if (!configResponse.ok || !configResult.keyId) {
          throw new Error('Failed to load payment configuration');
        }

        // Open Razorpay checkout for UPI Autopay
        const options = {
          key: configResult.keyId,
          subscription_id: result.subscription.razorpaySubscriptionId,
          name: 'Adbix',
          description: `${plans.find(p => p.planId === selectedPlan)?.name} Plan Subscription`,
          image: '/favicon_io/android-chrome-512x512.png', // Adbix logo
          handler: async function (response: any) {
            console.log('Payment successful:', response);
            try {
              // Show immediate success message
              showModal('Success', 'UPI Autopay mandate approved successfully! Activating your subscription...', 'success');
              
              // Wait for webhook processing to complete (up to 30 seconds)
              let activationAttempts = 0;
              const maxAttempts = 6; // 6 attempts over 30 seconds
              
              const checkActivation = async (): Promise<boolean> => {
                activationAttempts++;
                console.log(`Checking activation status - attempt ${activationAttempts}/${maxAttempts}`);
                
                try {
                  // Refresh subscription data
                  await fetchData();
                  
                  // Check if any subscription is now active
                  const activeSubscription = subscriptions.find(sub => sub.status === 'active');
                  
                  if (activeSubscription) {
                    console.log('Subscription activated successfully!');
                    showModal('Success', '🎉 Subscription Activated Successfully!\n\nYour UPI Autopay subscription is now active and billing has started. You will receive payment notifications via SMS and email for all future payments.\n\nWelcome to Adbix!', 'success');
                    return true;
                  }
                  
                  if (activationAttempts < maxAttempts) {
                    // Wait 5 seconds before next attempt
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    return await checkActivation();
                  } else {
                    // Final attempt - show activation guidance
                    console.log('Auto-activation timed out, showing manual guidance');
                    showModal('Mandate Approved', '✅ UPI Autopay mandate approved successfully!\n\nYour subscription is being activated in the background. This usually takes 1-2 minutes.\n\n📋 What happens next:\n• First payment will be processed automatically\n• You\'ll receive SMS/email notifications\n• Subscription will show as "Active" once payment completes\n\n💡 If it doesn\'t activate within 5 minutes, try refreshing the page or click "Charge Now" button in the subscriptions tab.', 'info');
                    return false;
                  }
                } catch (error) {
                  console.error('Error checking activation status:', error);
                  if (activationAttempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    return await checkActivation();
                  } else {
                    showModal('Mandate Approved', 'UPI Autopay mandate approved successfully! Please refresh the page to see updated information, or contact support if the subscription doesn\'t activate within a few minutes.', 'success');
                    return false;
                  }
                }
              };
              
              // Start the activation checking process
              await checkActivation();
              
            } catch (error) {
              console.error('Error in payment success handler:', error);
              showModal('Success', 'UPI Autopay mandate approved successfully! Please refresh the page to see updated information.', 'success');
            } finally {
              // Always stop processing state after payment success
              setProcessingPayment(false);
            }
          },
          prefill: {
            name: customerInfo.name,
            email: customerInfo.email,
            contact: customerInfo.phone
          },
          theme: {
            color: '#0891b2'
          },
          modal: {
            ondismiss: function() {
              // Reset processing state when modal is dismissed without payment
              setProcessingPayment(false);
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        
        // Safety timeout to reset processing state (30 seconds)
        const processingTimeout = setTimeout(() => {
          console.warn('Payment processing timeout - resetting processing state');
          setProcessingPayment(false);
        }, 30000);
        
        // Clear timeout when payment completes or modal closes
        const originalHandler = options.handler;
        const originalDismiss = options.modal.ondismiss;
        
        options.handler = async function(response: any) {
          clearTimeout(processingTimeout);
          await originalHandler(response);
        };
        
        options.modal.ondismiss = function() {
          clearTimeout(processingTimeout);
          originalDismiss();
        };
        
        razorpay.open();
      } else {
        // Handle specific error cases
        let errorMessage = 'Failed to create subscription. Please try again.';
        
        if (result.error) {
          switch (result.error) {
            case 'You already have an active subscription':
              errorMessage = 'You already have an active subscription. Please cancel your current subscription before creating a new one.';
              break;
            case 'Plan not found':
              errorMessage = 'The selected plan is no longer available. Please refresh the page and try again.';
              break;
            case 'Razorpay plan not configured for this plan':
              errorMessage = 'This plan is not properly configured for payments. Please contact support.';
              break;
            case 'Failed to create customer profile':
            case 'Failed to create or find customer profile':
              errorMessage = 'Unable to create your customer profile. Please check your details and try again.';
              break;
            case 'Customer already exists for the merchant':
              errorMessage = 'Your account is already registered. Please try creating the subscription again.';
              break;
            case 'Payment service not configured':
              errorMessage = 'Payment service is temporarily unavailable. Please contact support.';
              break;
            case 'Plan ID is required':
              errorMessage = 'Please select a valid plan and try again.';
              break;
            case 'Unauthorized':
              errorMessage = 'Your session has expired. Please log in again.';
              break;
            default:
              // Check for timing-related errors
              if (result.error.includes('start time is past') || result.error.includes('Cannot do an auth transaction')) {
                errorMessage = 'There was a timing issue with the payment setup. Please try again in a few moments. The system is setting up your UPI Autopay subscription.';
              } else {
              errorMessage = result.error;
              }
          }
        }
        
        // Show detailed error message
        showModal('Subscription Failed', errorMessage, 'error');
        setProcessingPayment(false);
      }
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      
      // Handle network and other errors
      let errorMessage = 'Unable to create subscription. Please check your internet connection and try again.';
      
      if (error.message) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      showModal('Network Error', errorMessage, 'error');
      setProcessingPayment(false);
    }
  };

  const handleCustomerFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowCustomerForm(false);
    handleCreateSubscription();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-900 to-black flex items-center justify-center relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl animate-pulse"></div>
          <div className="absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl animate-pulse"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isRazorpayConfigError = error.includes('Payment service not configured') || error.includes('Razorpay');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-900 to-black flex items-center justify-center relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl animate-pulse"></div>
          <div className="absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl animate-pulse"></div>
        </div>
        <div className="relative z-10 text-center max-w-md mx-4">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              {isRazorpayConfigError ? 'Payment Service Unavailable' : 'Error Loading Billing Data'}
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            
            {isRazorpayConfigError ? (
              <div className="text-left bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-800 mb-2">For Developers:</h3>
                <p className="text-sm text-gray-600 mb-2">
                  The Razorpay payment service is not configured. Please:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Set up your Razorpay account</li>
                  <li>Configure environment variables in <code className="bg-gray-200 px-1 rounded">.env.local</code></li>
                  <li>Restart the development server</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  See <code className="bg-gray-200 px-1 rounded">ENVIRONMENT_SETUP.md</code> for detailed instructions.
                </p>
              </div>
            ) : null}
            
            <button 
              onClick={() => window.location.reload()} 
              className="bg-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-cyan-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-900 to-black relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl animate-pulse"></div>
        <div className="absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl animate-pulse"></div>
      </div>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 bg-black bg-opacity-80 hover:bg-opacity-90 text-white px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg backdrop-blur-sm border border-black border-opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-medium">Home</span>
              </button>
              <div className="flex-1"></div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Billing & Subscriptions</h1>
            <p className="text-cyan-100">Manage your plan, add-ons, and UPI Autopay subscriptions.</p>
          </div>

          {/* Customer Information Form Modal */}
          {showCustomerForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-xl font-semibold mb-4">Customer Information</h3>
                <form onSubmit={handleCustomerFormSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter your email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowCustomerForm(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-cyan-600 text-white py-2 px-4 rounded-lg hover:bg-cyan-700 transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Error/Success Modal */}
          {errorModal.show && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                    errorModal.type === 'success' ? 'bg-green-100' : 
                    errorModal.type === 'info' ? 'bg-blue-100' : 'bg-red-100'
                  }`}>
                    <span className="text-2xl">
                      {errorModal.type === 'success' ? '✅' : 
                       errorModal.type === 'info' ? 'ℹ️' : '❌'}
                    </span>
                  </div>
                  <div>
                    <h3 className={`text-xl font-semibold ${
                      errorModal.type === 'success' ? 'text-green-800' : 
                      errorModal.type === 'info' ? 'text-blue-800' : 'text-red-800'
                    }`}>
                      {errorModal.title}
                    </h3>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700 leading-relaxed">{errorModal.message}</p>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={closeModal}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      errorModal.type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' : 
                      errorModal.type === 'info' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 
                      'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {errorModal.type === 'success' ? 'Great!' : 'Got it'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Modal */}
          {confirmModal.show && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mr-4">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-orange-800">
                      {confirmModal.title}
                    </h3>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700 leading-relaxed">{confirmModal.message}</p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeConfirmModal}
                    className="px-6 py-3 rounded-lg font-medium transition-colors bg-gray-300 hover:bg-gray-400 text-gray-800"
                  >
                    {confirmModal.cancelText}
                  </button>
                  <button
                    onClick={confirmModal.onConfirm}
                    className="px-6 py-3 rounded-lg font-medium transition-colors bg-red-600 hover:bg-red-700 text-white"
                  >
                    {confirmModal.confirmText}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Left Content */}
              <div className="flex-1 p-8">
                {/* Navigation Tabs */}
                <div className="flex space-x-8 mb-8 border-b border-gray-200">
                  {[
                    { id: 'billing-info', label: 'Billing Information', icon: '💳' },
                    { id: 'subscriptions', label: 'My Subscriptions', icon: '📋' },
                    { id: 'payment-methods', label: 'Payment Methods', icon: '🏦' },
                    { id: 'billing-history', label: 'Billing History', icon: '📊' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Current Subscription Section */}
                {currentSubscription && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Current Subscription</h2>
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {plans.find(p => p.planId === currentSubscription.planId)?.name || 'Plan'} Plan
                          </h3>
                          <p className="text-gray-600 mb-2">
                            Status: <span className={`font-medium ${
                              currentSubscription.status === 'active' ? 'text-green-600' : 
                              currentSubscription.status === 'paused' ? 'text-yellow-600' : 
                              'text-red-600'
                            }`}>
                              {currentSubscription.status.toUpperCase()}
                            </span>
                          </p>
                          {currentSubscription.nextBillingDate && (
                            <p className="text-gray-600 mb-4">
                              Next billing: {new Date(currentSubscription.nextBillingDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="space-x-2">
                          {currentSubscription.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleSubscriptionAction('pause', currentSubscription.id)}
                                disabled={processingPayment}
                                className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50"
                              >
                                Pause
                              </button>
                              {currentSubscription.canBeCancelled && (
                                <button
                                  onClick={() => {
                                    const plan = plans.find(p => p.planId === currentSubscription.planId);
                                    showConfirmModal(
                                      'Cancel Subscription',
                                      `Are you sure you want to cancel your ${plan?.name || 'subscription'} plan? This action cannot be undone and you will lose access to all features immediately.`,
                                      () => {
                                        closeConfirmModal();
                                        handleSubscriptionAction('cancel', currentSubscription.id);
                                      },
                                      'Yes, Cancel Subscription',
                                      'Keep Subscription'
                                    );
                                  }}
                                  disabled={processingPayment}
                                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              )}
                            </>
                          )}
                          {currentSubscription.status === 'paused' && (
                            <button
                              onClick={() => handleSubscriptionAction('resume', currentSubscription.id)}
                              disabled={processingPayment}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              Resume
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Billing Information Tab Content */}
                {activeTab === 'billing-info' && (
                  <>

                    {/* Choose Your Plan Section */}
                    <div className="mb-8" data-section="choose-plan">
                      <h2 className="text-xl font-semibold text-gray-800 mb-6">
                        {currentSubscription && currentSubscription.isActive ? 'Upgrade Your Plan' : 'Choose Your Plan'}
                      </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                          {plans.map((plan) => (
                            <div key={plan.id} className={`relative bg-white border-2 rounded-2xl p-6 transition-all ${
                              selectedPlan === plan.planId ? 'border-cyan-600 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                            }`}>
                              {plan.isRecommended && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                  <span className="bg-cyan-600 text-white px-4 py-1 rounded-full text-xs font-medium">
                                    Recommended
                                  </span>
                                </div>
                              )}
                              <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                                <div className="mb-6">
                                  <span className="text-3xl font-bold text-purple-600">₹{plan.price}</span>
                                  <span className="text-gray-500">/{plan.billingCycle}</span>
                                </div>
                                <ul className="text-left space-y-2 mb-6">
                                  {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-center text-sm">
                                      <span className="text-green-500 mr-2">✓</span>
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                                <button
                                  onClick={() => setSelectedPlan(plan.planId)}
                                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                                    selectedPlan === plan.planId
                                      ? 'bg-cyan-600 text-white'
                                      : plan.buttonColor === 'gradient'
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                                        : plan.buttonColor === 'purple'
                                          ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {selectedPlan === plan.planId ? 'Selected' : plan.buttonText}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    {/* Add-ons Section */}
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800 mb-6">Add-ons</h2>
                        <div className="space-y-4">
                          {addons.map((addon) => (
                            <div key={addon.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  {addon.icon && <span className="text-lg">{addon.icon}</span>}
                                  <h4 className="font-semibold text-gray-900">{addon.name}</h4>
                                </div>
                                <p className="text-sm text-gray-600">{addon.description}</p>
                                <p className="text-sm font-medium text-purple-600">₹{addon.price}/{addon.billingCycle}</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedAddons[addon.addonId] || false}
                                  onChange={() => toggleAddOn(addon.addonId)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                  </>
                )}

                {/* Subscriptions Tab */}
                {activeTab === 'subscriptions' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold text-gray-800">My Subscriptions</h2>
                      <div className="text-sm text-gray-500">
                        {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''} found
                      </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
                      {[
                        { id: 'all', label: '📋 All', count: subscriptions.length },
                        { id: 'active', label: '✅ Active', count: subscriptions.filter(s => s.status === 'active').length },
                        { id: 'paused', label: '⏸️ Paused', count: subscriptions.filter(s => s.status === 'paused').length },
                        { id: 'cancelled', label: '❌ Cancelled', count: subscriptions.filter(s => ['cancelled', 'completed'].includes(s.status)).length }
                      ].map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setSubscriptionFilter(filter.id)}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                            subscriptionFilter === filter.id
                              ? 'bg-white text-purple-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          <span>{filter.label}</span>
                          <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                            {filter.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Subscription Cards */}
                    {subscriptions.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions yet</h3>
                        <p className="text-gray-500 mb-6">Start by selecting a plan and creating your first subscription.</p>
                        <button
                          onClick={() => setActiveTab('billing-info')}
                          className="bg-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-cyan-700 transition-colors"
                        >
                          Browse Plans
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {subscriptions
                          .filter(subscription => {
                            if (subscriptionFilter === 'all') return true;
                            if (subscriptionFilter === 'active') return subscription.status === 'active';
                            if (subscriptionFilter === 'paused') return subscription.status === 'paused';
                            if (subscriptionFilter === 'cancelled') return ['cancelled', 'completed'].includes(subscription.status);
                            return true;
                          })
                          .map((subscription) => {
                            const plan = plans.find(p => p.planId === subscription.planId);
                            return (
                              <div key={subscription.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                      <span className="text-purple-600 font-bold text-lg">
                                        {plan?.name?.charAt(0) || 'P'}
                                      </span>
                                    </div>
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900">
                                        {plan?.name || 'Plan'} Plan
                                      </h3>
                                      <p className="text-gray-500 text-sm">
                                        Subscription ID: {subscription.razorpaySubscriptionId}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-purple-600">
                                      ₹{subscription.amount / 100}
                                    </div>
                                    <div className="text-sm text-gray-500">per month</div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <div>
                                    <div className="text-sm text-gray-500 mb-1">Status</div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      subscription.status === 'active' ? 'bg-green-100 text-green-800' : 
                                      subscription.status === 'authenticated' ? 'bg-blue-100 text-blue-800' :
                                      subscription.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {subscription.status === 'active' ? '🟢' : 
                                       subscription.status === 'authenticated' ? '🔵' :
                                       subscription.status === 'paused' ? '🟡' : '🔴'}
                                      {subscription.status === 'authenticated' ? 'AUTHENTICATED (UPI)' : subscription.status.toUpperCase()}
                                    </span>
                                    
                                    {/* Helpful message for authenticated subscriptions */}
                                    {subscription.status === 'authenticated' && (
                                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                        <p className="text-sm text-yellow-800">
                                          <strong>UPI Autopay mandate approved!</strong> Your subscription is ready.
                                          The first payment will be charged automatically within the next few minutes to activate your subscription.
                                        </p>
                                        <div className="mt-2 flex gap-2">
                                          <button
                                            onClick={async () => {
                                              try {
                                                setProcessingPayment(true);
                                                const result = await handleSubscriptionAction('activate', subscription.id);
                                                // Auto-refresh after activation attempt
                                                setTimeout(async () => {
                                                  try {
                                                    console.log('Auto-refreshing after manual activation attempt');
                                                    await fetchData();
                                                  } catch (error) {
                                                    console.error('Error during post-activation refresh:', error);
                                                  }
                                                }, 3000);
                                              } catch (error) {
                                                console.error('Error during manual activation:', error);
                                                setProcessingPayment(false);
                                              }
                                            }}
                                            disabled={processingPayment}
                                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                                          >
                                            {processingPayment ? 'Processing...' : 'Charge Now'}
                                          </button>
                                          <button
                                            onClick={async () => {
                                              try {
                                                setProcessingPayment(true);
                                                await handleSubscriptionAction('refresh', subscription.id);
                                                // Auto-refresh after status check
                                                setTimeout(async () => {
                                                  try {
                                                    console.log('Auto-refreshing after status check');
                                                    await fetchData();
                                                  } catch (error) {
                                                    console.error('Error during post-refresh update:', error);
                                                  }
                                                }, 2000);
                                              } catch (error) {
                                                console.error('Error during status check:', error);
                                                setProcessingPayment(false);
                                              }
                                            }}
                                            disabled={processingPayment}
                                            className="px-3 py-1 bg-cyan-600 text-white text-xs rounded hover:bg-cyan-700 disabled:opacity-50"
                                          >
                                            {processingPayment ? 'Checking...' : 'Check Status'}
                                          </button>
                                        </div>
                                        <p className="text-xs text-yellow-600 mt-1">
                                          💡 If the subscription doesn't activate automatically, click "Charge Now" to process the first payment immediately.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-500 mb-1">Start Date</div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {new Date(subscription.startDate).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </div>
                                  </div>
                                  {subscription.nextBillingDate && (
                                    <div>
                                      <div className="text-sm text-gray-500 mb-1">Next Billing</div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {new Date(subscription.nextBillingDate).toLocaleDateString('en-IN', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric'
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-3 pt-4 border-t border-gray-100">
                                  {/* Show cancel button for created, authenticated, and active subscriptions */}
                                  {['created', 'authenticated', 'active'].includes(subscription.status) && (
                                    <button
                                      onClick={() => {
                                        const plan = plans.find(p => p.planId === subscription.planId);
                                        showConfirmModal(
                                          'Cancel Subscription',
                                          `Are you sure you want to cancel your ${plan?.name || 'subscription'} plan? This action cannot be undone and you will lose access to all features immediately.`,
                                          () => {
                                            closeConfirmModal();
                                            handleSubscriptionAction('cancel', subscription.id);
                                          },
                                          'Yes, Cancel Subscription',
                                          'Keep Subscription'
                                        );
                                      }}
                                      disabled={processingPayment}
                                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                                    >
                                      {processingPayment ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                          <span>Cancelling...</span>
                                        </>
                                      ) : (
                                        <>
                                          <span>❌</span>
                                          <span>Cancel</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                  
                                  {/* Pause button only for active subscriptions */}
                                  {subscription.status === 'active' && (
                                    <button
                                      onClick={() => handleSubscriptionAction('pause', subscription.id)}
                                      disabled={processingPayment}
                                      className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                                    >
                                      {processingPayment ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                          <span>Pausing...</span>
                                        </>
                                      ) : (
                                        <>
                                          <span>⏸️</span>
                                          <span>Pause</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                  
                                  {/* Resume button only for paused subscriptions */}
                                  {subscription.status === 'paused' && (
                                    <button
                                      onClick={() => handleSubscriptionAction('resume', subscription.id)}
                                      disabled={processingPayment}
                                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                                    >
                                      {processingPayment ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                          <span>Resuming...</span>
                                        </>
                                      ) : (
                                        <>
                                          <span>▶️</span>
                                          <span>Resume</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                  
                                  {/* Copy ID button - always show */}
                                  <button
                                    onClick={() => {
                                      // Copy subscription ID to clipboard
                                      navigator.clipboard.writeText(subscription.razorpaySubscriptionId);
                                      showModal('Copied', 'Subscription ID copied to clipboard!', 'success');
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center space-x-1"
                                  >
                                    <span>📋</span>
                                    <span>Copy ID</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Methods Tab */}
                {activeTab === 'payment-methods' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold text-gray-800">Payment Methods</h2>
                    </div>

                    <div className="space-y-6">
                      {/* UPI Autopay Info */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                            <span className="text-2xl">🔄</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">UPI Autopay</h3>
                            <p className="text-gray-600">Automatic recurring payments via UPI</p>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Benefits:</h4>
                            <ul className="space-y-1 text-sm text-gray-700">
                              <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>No manual payments required</li>
                              <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Never miss a payment</li>
                              <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Secure and encrypted</li>
                              <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Cancel anytime</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">How it works:</h4>
                            <ol className="space-y-1 text-sm text-gray-700">
                              <li className="flex items-start"><span className="text-purple-500 mr-2 font-medium">1.</span>Select your plan and add-ons</li>
                              <li className="flex items-start"><span className="text-purple-500 mr-2 font-medium">2.</span>Authorize UPI Autopay mandate</li>
                              <li className="flex items-start"><span className="text-purple-500 mr-2 font-medium">3.</span>Automatic monthly billing begins</li>
                            </ol>
                          </div>
                        </div>
                      </div>

                      {/* Supported Payment Methods */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Supported UPI Apps</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { name: 'Google Pay', emoji: '💳', color: 'bg-blue-50 text-blue-700' },
                            { name: 'PhonePe', emoji: '📱', color: 'bg-purple-50 text-purple-700' },
                            { name: 'Paytm', emoji: '💰', color: 'bg-blue-50 text-blue-700' },
                            { name: 'BHIM UPI', emoji: '🏛️', color: 'bg-orange-50 text-orange-700' },
                            { name: 'Amazon Pay', emoji: '📦', color: 'bg-orange-50 text-orange-700' },
                            { name: 'Mobikwik', emoji: '📲', color: 'bg-red-50 text-red-700' },
                            { name: 'FreeCharge', emoji: '⚡', color: 'bg-green-50 text-green-700' },
                            { name: 'Other UPI', emoji: '🔗', color: 'bg-gray-50 text-gray-700' }
                          ].map((method) => (
                            <div key={method.name} className={`${method.color} rounded-lg p-3 text-center`}>
                              <div className="text-2xl mb-1">{method.emoji}</div>
                              <div className="text-sm font-medium">{method.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Security Info */}
                      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                        <div className="flex items-center mb-3">
                          <span className="text-green-600 text-2xl mr-3">🔒</span>
                          <h3 className="text-lg font-semibold text-green-800">Security & Privacy</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 text-sm text-green-700">
                          <div>
                            <p className="mb-2">Your payment information is protected with:</p>
                            <ul className="space-y-1">
                              <li>• 256-bit SSL encryption</li>
                              <li>• PCI DSS compliance</li>
                              <li>• Two-factor authentication</li>
                            </ul>
                          </div>
                          <div>
                            <p className="mb-2">Powered by Razorpay:</p>
                            <ul className="space-y-1">
                              <li>• RBI approved payment gateway</li>
                              <li>• Used by 8M+ businesses</li>
                              <li>• 99.99% uptime guarantee</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Billing History Tab */}
                {activeTab === 'billing-history' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold text-gray-800">Billing History</h2>
                      <button className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors flex items-center space-x-2">
                        <span>📊</span>
                        <span>Download Report</span>
                      </button>
                    </div>

                    {/* Transaction History */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>
                      
                      {subscriptions.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-3">📋</div>
                          <p className="text-gray-500">No transactions yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {subscriptions.map((subscription) => {
                            const plan = plans.find(p => p.planId === subscription.planId);
                            return (
                              <div key={subscription.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-4">
                                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <span className="text-purple-600 font-bold">
                                      {plan?.name?.charAt(0) || 'P'}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">
                                      {plan?.name || 'Plan'} Plan Subscription
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                      Created on {new Date(subscription.createdAt).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-gray-900">
                                    ₹{subscription.amount / 100}
                                  </div>
                                  <div className={`text-sm ${
                                    subscription.status === 'active' ? 'text-green-600' : 
                                    subscription.status === 'paused' ? 'text-yellow-600' : 
                                    'text-red-600'
                                  }`}>
                                    {subscription.status.toUpperCase()}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sidebar - Order Summary / Current Subscription */}
              {activeTab === 'billing-info' && (
                <div className="lg:w-80 bg-gray-50 p-8 border-l border-gray-200">
                  {currentSubscription && currentSubscription.isActive ? (
                    // Active Subscription View
                    <>
                      <h3 className="text-xl font-semibold text-gray-800 mb-6">Current Subscription</h3>
                      
                      {/* Current Plan Details */}
                      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center mb-2">
                          <span className="text-green-600 mr-2">✅</span>
                          <h4 className="font-medium text-green-800">Active Plan</h4>
                        </div>
                        <p className="text-sm text-green-700">
                          Your subscription is active and auto-renewing.
                        </p>
                      </div>

                      {/* Plan Details */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center py-3">
                          <span className="text-gray-700">
                            {plans.find(p => p.planId === currentSubscription.planId)?.name || 'Plan'} Plan
                          </span>
                          <span className="font-medium text-gray-900">
                            ₹{currentSubscription.amount / 100}/month
                          </span>
                        </div>
                        
                        {/* Subscription Info */}
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className="font-medium text-green-600 capitalize">{currentSubscription.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Started:</span>
                            <span>{new Date(currentSubscription.startDate).toLocaleDateString('en-IN')}</span>
                          </div>
                          {currentSubscription.nextBillingDate && (
                            <div className="flex justify-between">
                              <span>Next billing:</span>
                              <span>{new Date(currentSubscription.nextBillingDate).toLocaleDateString('en-IN')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Total */}
                      <div className="border-t border-gray-200 pt-4 mb-6">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900">Monthly Amount</span>
                          <span className="text-xl font-bold text-green-600">₹{currentSubscription.amount / 100}</span>
                        </div>
                      </div>

                      {/* Cancel Subscription Button */}
                      {currentSubscription.canBeCancelled && (
                        <button
                          onClick={() => {
                            const plan = plans.find(p => p.planId === currentSubscription.planId);
                            showConfirmModal(
                              'Cancel Subscription',
                              `Are you sure you want to cancel your ${plan?.name || 'subscription'} plan? This action cannot be undone and you will lose access to all features immediately.`,
                              () => {
                                closeConfirmModal();
                                handleSubscriptionAction('cancel', currentSubscription.id);
                              },
                              'Yes, Cancel Subscription',
                              'Keep Subscription'
                            );
                          }}
                          disabled={processingPayment}
                          className="w-full bg-red-600 text-white py-4 px-6 rounded-xl font-medium text-lg hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                        >
                          {processingPayment ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                              Processing...
                            </div>
                          ) : (
                            '❌ Cancel Subscription'
                          )}
                        </button>
                      )}

                      {/* Additional Actions */}
                      <div className="space-y-2">
                        {currentSubscription.status === 'active' && (
                          <button
                            onClick={() => handleSubscriptionAction('pause', currentSubscription.id)}
                            disabled={processingPayment}
                            className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50"
                          >
                            ⏸️ Pause Subscription
                          </button>
                        )}
                        {currentSubscription.status === 'paused' && (
                          <button
                            onClick={() => handleSubscriptionAction('resume', currentSubscription.id)}
                            disabled={processingPayment}
                            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            ▶️ Resume Subscription
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-3 text-center">
                        Subscription ID: {currentSubscription.razorpaySubscriptionId.slice(-8)}
                      </p>
                    </>
                  ) : (
                    // New Subscription View
                    <>
                      <h3 className="text-xl font-semibold text-gray-800 mb-6">Order Summary</h3>
                      
                      {/* UPI Autopay Notice */}
                      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center mb-2">
                          <span className="text-blue-600 mr-2">🔄</span>
                          <h4 className="font-medium text-blue-800">UPI Autopay</h4>
                        </div>
                        <p className="text-sm text-blue-700">
                          Automatic recurring payments via UPI. No more manual payments!
                        </p>
                      </div>

                      {/* Plan Details */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center py-3">
                          <span className="text-gray-700">
                            {plans.find(p => p.planId === selectedPlan)?.name || 'Plan'} Plan
                          </span>
                          <span className="font-medium text-gray-900">
                            ₹{plans.find(p => p.planId === selectedPlan)?.price || 0}/{plans.find(p => p.planId === selectedPlan)?.billingCycle || 'month'}
                          </span>
                        </div>
                        
                        {/* Add-ons */}
                        {addons.map((addon) => {
                          if (!selectedAddons[addon.addonId]) return null;
                          return (
                            <div key={addon.id} className="flex justify-between items-center py-2 text-sm">
                              <span className="text-gray-600">{addon.name}</span>
                              <span className="text-gray-900">₹{addon.price}/{addon.billingCycle}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Total */}
                      <div className="border-t border-gray-200 pt-4 mb-6">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                          <span className="text-xl font-bold text-purple-600">₹{calculateTotal()}/month</span>
                        </div>
                      </div>

                      {/* Checkout Button */}
                      <button
                        onClick={handleCreateSubscription}
                        disabled={processingPayment}
                        className="w-full bg-cyan-600 text-white py-4 px-6 rounded-xl font-medium text-lg hover:bg-cyan-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingPayment ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          'Start UPI Autopay Subscription'
                        )}
                      </button>

                      <p className="text-xs text-gray-500 mt-3 text-center">
                        Secure payment powered by Razorpay. Your UPI ID will be used for automatic recurring payments.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 