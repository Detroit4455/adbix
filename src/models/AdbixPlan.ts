import { Schema, model, models, Document } from 'mongoose';

export interface IAdbixPlan extends Document {
  planId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  isRecommended: boolean;
  isActive: boolean;
  displayOrder: number;
  buttonText: string;
  buttonColor: string;
  razorpayPlanId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const adbixPlanSchema = new Schema<IAdbixPlan>({
  planId: {
    type: String,
    required: [true, 'Plan ID is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Plan description is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Plan price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  features: [{
    type: String,
    required: true,
    trim: true
  }],
  isRecommended: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  buttonText: {
    type: String,
    default: 'Select Plan'
  },
  buttonColor: {
    type: String,
    default: 'purple'
  },
  razorpayPlanId: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for better query performance
adbixPlanSchema.index({ isActive: 1, displayOrder: 1 });
// Note: planId index is created automatically by unique: true

// Virtual for formatted price
adbixPlanSchema.virtual('formattedPrice').get(function() {
  if (this.currency === 'INR') {
    return `₹${this.price.toLocaleString('en-IN')}`;
  } else if (this.currency === 'USD') {
    return `$${this.price}`;
  } else if (this.currency === 'EUR') {
    return `€${this.price}`;
  }
  return `${this.currency} ${this.price}`;
});

export default models.AdbixPlan || model<IAdbixPlan>('AdbixPlan', adbixPlanSchema); 