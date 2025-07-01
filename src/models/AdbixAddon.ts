import { Schema, model, models, Document } from 'mongoose';

export interface IAdbixAddon extends Document {
  addonId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  category: 'widget' | 'feature' | 'service';
  icon?: string;
  isActive: boolean;
  displayOrder: number;
  requirements?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const adbixAddonSchema = new Schema<IAdbixAddon>({
  addonId: {
    type: String,
    required: [true, 'Add-on ID is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Add-on name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Add-on description is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Add-on price is required'],
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
  category: {
    type: String,
    enum: ['widget', 'feature', 'service'],
    default: 'widget'
  },
  icon: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  requirements: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for better query performance
adbixAddonSchema.index({ isActive: 1, displayOrder: 1 });
// Note: addonId index is created automatically by unique: true
adbixAddonSchema.index({ category: 1 });

// Virtual for formatted price
adbixAddonSchema.virtual('formattedPrice').get(function() {
  if (this.currency === 'INR') {
    return `₹${this.price.toLocaleString('en-IN')}`;
  } else if (this.currency === 'USD') {
    return `$${this.price}`;
  } else if (this.currency === 'EUR') {
    return `€${this.price}`;
  }
  return `${this.currency} ${this.price}`;
});

export default models.AdbixAddon || model<IAdbixAddon>('AdbixAddon', adbixAddonSchema); 