import { Schema, model, models, Model } from 'mongoose';
import { connectMongoose } from '@/lib/db';

export interface IBusinessCategory {
  _id?: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface BusinessCategoryModel extends Model<IBusinessCategory> {
  initializeDefaultCategories(): Promise<void>;
}

const businessCategorySchema = new Schema<IBusinessCategory>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxLength: [100, 'Category name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add index for better query performance
businessCategorySchema.index({ name: 1 });
businessCategorySchema.index({ isActive: 1 });

// Initialize with default categories if none exist
businessCategorySchema.statics.initializeDefaultCategories = async function(): Promise<void> {
  try {
    await connectMongoose();
    
    const count = await this.countDocuments();
    
    if (count === 0) {
      const defaultCategories = [
        {
          name: 'Restaurant',
          description: 'Food and dining establishments',
          isActive: true
        },
        {
          name: 'E-commerce',
          description: 'Online retail and shopping platforms',
          isActive: true
        },
        {
          name: 'Technology',
          description: 'Tech companies and software services',
          isActive: true
        },
        {
          name: 'Healthcare',
          description: 'Medical and healthcare services',
          isActive: true
        },
        {
          name: 'Education',
          description: 'Educational institutions and learning platforms',
          isActive: true
        },
        {
          name: 'Real Estate',
          description: 'Property and real estate services',
          isActive: true
        },
        {
          name: 'Professional Services',
          description: 'Consulting, legal, and business services',
          isActive: true
        },
        {
          name: 'Entertainment',
          description: 'Media, gaming, and entertainment industry',
          isActive: true
        }
      ];

      await this.insertMany(defaultCategories);
      console.log('Default business categories initialized');
    }
  } catch (error) {
    console.error('Error initializing default business categories:', error);
  }
};

const BusinessCategoryModel = models.BusinessCategory || model<IBusinessCategory, BusinessCategoryModel>('BusinessCategory', businessCategorySchema);
export default BusinessCategoryModel as unknown as BusinessCategoryModel;
