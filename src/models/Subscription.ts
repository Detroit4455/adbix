import { Schema, model, models, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: string; // User's mobile number or unique ID
  planId: string; // Our internal plan ID
  razorpaySubscriptionId: string; // Razorpay subscription ID
  razorpayPlanId: string; // Razorpay plan ID
  razorpayCustomerId?: string; // Razorpay customer ID
  status: 'created' | 'authenticated' | 'active' | 'paused' | 'cancelled' | 'completed' | 'expired';
  startDate: Date;
  endDate?: Date;
  nextBillingDate?: Date;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  totalCount?: number; // Total billing cycles
  paidCount?: number; // Completed billing cycles
  remainingCount?: number; // Remaining billing cycles
  shortUrl?: string; // Razorpay subscription short URL
  notes?: Record<string, any>;
  addons: Array<{
    addonId: string;
    razorpayItemId?: string;
    quantity: number;
    unitAmount: number;
  }>;
  paymentMethod?: {
    type: 'card' | 'upi' | 'netbanking' | 'wallet';
    details?: Record<string, any>;
  };
  amount: number; // Total subscription amount in paise
  currency: string;
  webhookEvents: Array<{
    eventType: string;
    eventData: Record<string, any>;
    processedAt: Date;
  }>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    trim: true,
    index: true
  },
  planId: {
    type: String,
    required: [true, 'Plan ID is required'],
    trim: true
  },
  razorpaySubscriptionId: {
    type: String,
    required: [true, 'Razorpay Subscription ID is required'],
    unique: true,
    trim: true
    // Note: index is created automatically by unique: true
  },
  razorpayPlanId: {
    type: String,
    required: [true, 'Razorpay Plan ID is required'],
    trim: true
  },
  razorpayCustomerId: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['created', 'authenticated', 'active', 'paused', 'cancelled', 'completed', 'expired'],
    default: 'created',
    required: true,
    index: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  nextBillingDate: {
    type: Date
  },
  currentPeriodStart: {
    type: Date
  },
  currentPeriodEnd: {
    type: Date
  },
  totalCount: {
    type: Number,
    min: 0
  },
  paidCount: {
    type: Number,
    min: 0,
    default: 0
  },
  remainingCount: {
    type: Number,
    min: 0
  },
  shortUrl: {
    type: String,
    trim: true
  },
  notes: {
    type: Schema.Types.Mixed,
    default: {}
  },
  addons: [{
    addonId: {
      type: String,
      required: true,
      trim: true
    },
    razorpayItemId: {
      type: String,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    unitAmount: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  paymentMethod: {
    type: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'wallet']
    },
    details: {
      type: Schema.Types.Mixed
    }
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    required: true,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  webhookEvents: [{
    eventType: {
      type: String,
      required: true
    },
    eventData: {
      type: Schema.Types.Mixed,
      required: true
    },
    processedAt: {
      type: Date,
      required: true,
      default: Date.now
    }
  }],
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
subscriptionSchema.index({ userId: 1, status: 1 });
// Note: razorpaySubscriptionId index is created automatically by unique: true
subscriptionSchema.index({ status: 1, nextBillingDate: 1 });
subscriptionSchema.index({ createdAt: -1 });

// Virtual for formatted amount
subscriptionSchema.virtual('formattedAmount').get(function() {
  return `${this.currency === 'INR' ? '₹' : '$'}${(this.amount / 100).toLocaleString()}`;
});

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return ['authenticated', 'active'].includes(this.status);
};

// Method to check if subscription can be cancelled
subscriptionSchema.methods.canBeCancelled = function() {
  return ['created', 'authenticated', 'active'].includes(this.status);
};

// Static method to find active subscription for user
subscriptionSchema.statics.findActiveSubscription = function(userId: string) {
  return this.findOne({ 
    userId, 
    status: { $in: ['authenticated', 'active'] } 
  }).sort({ createdAt: -1 });
};

const Subscription = models.Subscription || model<ISubscription>('Subscription', subscriptionSchema);

export default Subscription; 