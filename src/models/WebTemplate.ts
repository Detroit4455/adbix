import mongoose, { Schema, Document } from 'mongoose';

export interface IWebTemplate extends Document {
  templateId: string;
  name: string;
  description: string;
  businessCategory: string;
  templateType: string;
  tags: string[];
  s3Path: string;
  previewImage?: string;
  isActive: boolean;
  isPublic: boolean;
  customMobileNumber?: string; // For custom templates - mobile number of specific user
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    hasIndexHtml: boolean;
    fileCount: number;
    totalSize: number;
    lastModified: Date;
  };
}

const WebTemplateSchema = new Schema<IWebTemplate>({
  templateId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  businessCategory: {
    type: String,
    required: true,
    enum: [
      'e-commerce',
      'restaurant',
      'portfolio',
      'business',
      'blog',
      'education',
      'healthcare',
      'real-estate',
      'travel',
      'fitness',
      'technology',
      'creative',
      'non-profit',
      'beauty-salon',
      'other'
    ]
  },
  templateType: {
    type: String,
    required: true,
    enum: [
      'landing-page',
      'multi-page',
      'blog',
      'e-commerce',
      'portfolio',
      'corporate',
      'personal',
      'other'
    ]
  },
  tags: [{
    type: String,
    trim: true
  }],
  s3Path: {
    type: String,
    required: true,
    unique: true
  },
  previewImage: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  customMobileNumber: {
    type: String,
    default: null,
    index: true // Add index for efficient filtering
  },
  createdBy: {
    type: String,
    required: true
  },
  metadata: {
    hasIndexHtml: {
      type: Boolean,
      default: false
    },
    fileCount: {
      type: Number,
      default: 0
    },
    totalSize: {
      type: Number,
      default: 0
    },
    lastModified: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
WebTemplateSchema.index({ businessCategory: 1 });
WebTemplateSchema.index({ templateType: 1 });
WebTemplateSchema.index({ isActive: 1, isPublic: 1 });
WebTemplateSchema.index({ isActive: 1, isPublic: 1, customMobileNumber: 1 }); // For custom template filtering
WebTemplateSchema.index({ tags: 1 });
WebTemplateSchema.index({ createdAt: -1 });

// Static method to get business categories
WebTemplateSchema.statics.getBusinessCategories = function() {
  return [
    'e-commerce',
    'restaurant', 
    'portfolio',
    'business',
    'blog',
    'education',
    'healthcare',
    'real-estate',
    'travel',
    'fitness',
    'technology',
    'creative',
    'non-profit',
    'beauty-salon',
    'other'
  ];
};

// Static method to get template types
WebTemplateSchema.statics.getTemplateTypes = function() {
  return [
    'landing-page',
    'multi-page',
    'blog',
    'e-commerce',
    'portfolio',
    'corporate',
    'personal',
    'other'
  ];
};

// Pre-save middleware to generate templateId if not provided
WebTemplateSchema.pre('save', function(next) {
  if (!this.templateId) {
    this.templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

const WebTemplate = mongoose.models.WebTemplate || mongoose.model<IWebTemplate>('WebTemplate', WebTemplateSchema);

export default WebTemplate; 