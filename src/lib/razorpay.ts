import Razorpay from 'razorpay';

// Razorpay configuration
export const RAZORPAY_CONFIG = {
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
  webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  currency: 'INR' as const,
  receipt_prefix: 'sub_',
};

// Check if Razorpay is configured
export function isRazorpayConfigured(): boolean {
  return !!(RAZORPAY_CONFIG.key_id && RAZORPAY_CONFIG.key_secret);
}

// Initialize Razorpay instance only if credentials are available
let razorpayInstance: Razorpay | null = null;

export function getRazorpayInstance(): Razorpay {
  if (!isRazorpayConfigured()) {
    throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: RAZORPAY_CONFIG.key_id,
      key_secret: RAZORPAY_CONFIG.key_secret,
    });
  }

  return razorpayInstance;
}

// Safe Razorpay instance that won't throw during module initialization
export const razorpay = {
  get configured() {
    return isRazorpayConfigured();
  },
  getInstance() {
    return getRazorpayInstance();
  }
};

// Utility functions
export class RazorpayService {
  
  /**
   * Create a Razorpay plan
   */
  static async createPlan(planData: {
    period: 'monthly' | 'yearly';
    interval: number;
    item: {
      name: string;
      description: string;
      amount: number; // in paise
      currency: string;
    };
    notes?: Record<string, any>;
  }): Promise<any> {
    try {
      if (!isRazorpayConfigured()) {
        throw new Error('Razorpay not configured');
      }
      
      const razorpayInstance = getRazorpayInstance();
      const plan = await razorpayInstance.plans.create({
        period: planData.period,
        interval: planData.interval,
        item: {
          name: planData.item.name,
          description: planData.item.description,
          amount: planData.item.amount,
          currency: planData.item.currency,
        },
        notes: planData.notes || {},
      });
      
      return plan;
    } catch (error) {
      console.error('Error creating Razorpay plan:', error);
      throw error;
    }
  }

  /**
   * Search for existing customers by email or contact
   */
  static async findCustomers(searchQuery: {
    email?: string;
    contact?: string;
  }): Promise<any[]> {
    try {
      if (!isRazorpayConfigured()) {
        throw new Error('Razorpay not configured');
      }
      
      const razorpayInstance = getRazorpayInstance();
      
      // Get all customers and filter manually since Razorpay API doesn't support direct email/contact search
      try {
        const allCustomers = await razorpayInstance.customers.all({
          count: 100 // Get up to 100 customers to search through
        });
        
        const customers = allCustomers.items || [];
        const matchingCustomers = customers.filter((customer: any) => {
          const emailMatch = searchQuery.email && customer.email === searchQuery.email;
          const contactMatch = searchQuery.contact && customer.contact === searchQuery.contact;
          return emailMatch || contactMatch;
        });

        return matchingCustomers;
      } catch (error) {
        console.log('No customers found:', error);
        return [];
      }
    } catch (error) {
      console.error('Error searching for Razorpay customers:', error);
      return [];
    }
  }

  /**
   * Find existing customer or create new one
   */
  static async findOrCreateCustomer(customerData: {
    name: string;
    email: string;
    contact: string;
    notes?: Record<string, any>;
  }): Promise<any> {
    try {
      if (!isRazorpayConfigured()) {
        throw new Error('Razorpay not configured');
      }

      // First, try to find existing customer
      const existingCustomers = await this.findCustomers({
        email: customerData.email,
        contact: customerData.contact
      });

      if (existingCustomers.length > 0) {
        console.log('Found existing Razorpay customer:', existingCustomers[0].id);
        // Return the first matching customer
        const existingCustomer = existingCustomers[0];
        
                 // Update customer details if needed
         if (existingCustomer.name !== customerData.name || 
             existingCustomer.email !== customerData.email ||
             existingCustomer.contact !== customerData.contact) {
           try {
             const razorpayInstance = getRazorpayInstance();
             const updatedCustomer = await razorpayInstance.customers.edit(existingCustomer.id, {
               name: customerData.name,
               email: customerData.email,
               contact: customerData.contact
             });
             console.log('Updated existing customer details');
             return updatedCustomer;
           } catch (updateError: any) {
             console.log('Could not update customer details, using existing:', updateError);
             return existingCustomer;
           }
         }
        
        return existingCustomer;
      }

      // No existing customer found, create new one
      console.log('Creating new Razorpay customer for:', customerData.email);
      return await this.createCustomer(customerData);

    } catch (error) {
      console.error('Error in findOrCreateCustomer:', error);
      throw error;
    }
  }

  /**
   * Create a Razorpay customer
   */
  static async createCustomer(customerData: {
    name: string;
    email: string;
    contact: string;
    notes?: Record<string, any>;
  }): Promise<any> {
    try {
      if (!isRazorpayConfigured()) {
        throw new Error('Razorpay not configured');
      }
      
      const razorpayInstance = getRazorpayInstance();
      const customer = await razorpayInstance.customers.create({
        name: customerData.name,
        email: customerData.email,
        contact: customerData.contact,
        notes: customerData.notes || {},
      });
      
      console.log('Created new Razorpay customer:', customer.id);
      return customer;
    } catch (error) {
      console.error('Error creating Razorpay customer:', error);
      
      // Check if it's a "customer already exists" error
      const errorObj = error as any;
      if (errorObj.error && errorObj.error.code === 'BAD_REQUEST_ERROR' && 
          errorObj.error.description && errorObj.error.description.includes('Customer already exists')) {
        console.log('Customer already exists, attempting to find existing customer...');
        
        // Try to find the existing customer
        const existingCustomers = await this.findCustomers({
          email: customerData.email,
          contact: customerData.contact
        });

        if (existingCustomers.length > 0) {
          console.log('Found existing customer after creation failure:', existingCustomers[0].id);
          return existingCustomers[0];
        }
      }
      
      throw error;
    }
  }

  /**
   * Create a subscription
   */
  static async createSubscription(subscriptionData: any): Promise<any> {
    try {
      if (!isRazorpayConfigured()) {
        throw new Error('Razorpay not configured');
      }
      
      const razorpayInstance = getRazorpayInstance();
      const subscription = await razorpayInstance.subscriptions.create(subscriptionData);
      return subscription;
    } catch (error) {
      console.error('Error creating Razorpay subscription:', error);
      throw error;
    }
  }

  /**
   * Fetch subscription details
   */
  static async getSubscription(subscriptionId: string): Promise<any> {
    try {
      if (!isRazorpayConfigured()) {
        throw new Error('Razorpay not configured');
      }
      
      const razorpayInstance = getRazorpayInstance();
      const subscription = await razorpayInstance.subscriptions.fetch(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error fetching Razorpay subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = false): Promise<any> {
    try {
      if (!isRazorpayConfigured()) {
        throw new Error('Razorpay not configured');
      }
      
      const razorpayInstance = getRazorpayInstance();
      const subscription = await razorpayInstance.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
      return subscription;
    } catch (error) {
      console.error('Error cancelling Razorpay subscription:', error);
      throw error;
    }
  }

  /**
   * Pause a subscription
   */
  static async pauseSubscription(subscriptionId: string, pauseAt?: 'now' | number): Promise<any> {
    try {
      if (!isRazorpayConfigured()) {
        throw new Error('Razorpay not configured');
      }
      
      const razorpayInstance = getRazorpayInstance();
      const payload: any = {};
      if (pauseAt) {
        payload.pause_at = pauseAt;
      }
      
      const subscription = await razorpayInstance.subscriptions.pause(subscriptionId, payload);
      return subscription;
    } catch (error) {
      console.error('Error pausing Razorpay subscription:', error);
      throw error;
    }
  }

  /**
   * Resume a subscription
   */
  static async resumeSubscription(subscriptionId: string, resumeAt?: 'now' | number): Promise<any> {
    try {
      if (!isRazorpayConfigured()) {
        throw new Error('Razorpay not configured');
      }
      
      const razorpayInstance = getRazorpayInstance();
      const payload: any = {};
      if (resumeAt) {
        payload.resume_at = resumeAt;
      }
      
      const subscription = await razorpayInstance.subscriptions.resume(subscriptionId, payload);
      return subscription;
    } catch (error) {
      console.error('Error resuming Razorpay subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription details and update local status
   */
  static async syncSubscriptionStatus(subscriptionId: string): Promise<any> {
    try {
      if (!isRazorpayConfigured()) {
        throw new Error('Razorpay not configured');
      }
      
      const razorpayInstance = getRazorpayInstance();
      const subscription = await razorpayInstance.subscriptions.fetch(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error syncing subscription status:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Verify payment signature as per Razorpay Integration Guide
   * generated_signature = hmac_sha256(razorpay_payment_id + "|" + subscription_id, secret);
   */
  static verifyPaymentSignature(
    razorpayPaymentId: string,
    razorpaySubscriptionId: string,
    razorpaySignature: string
  ): boolean {
    try {
      if (!isRazorpayConfigured()) {
        throw new Error('Razorpay not configured');
      }

      const crypto = require('crypto');
      const payload = `${razorpayPaymentId}|${razorpaySubscriptionId}`;
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_CONFIG.key_secret)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(razorpaySignature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Error verifying payment signature:', error);
      return false;
    }
  }

  /**
   * Convert amount from rupees to paise
   */
  static toPaise(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Convert amount from paise to rupees
   */
  static toRupees(amount: number): number {
    return amount / 100;
  }

  /**
   * Generate receipt ID
   */
  static generateReceiptId(prefix: string = RAZORPAY_CONFIG.receipt_prefix): string {
    return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default RazorpayService; 