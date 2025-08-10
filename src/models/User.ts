import { Schema, model, models } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  mobileNumber: string;
  password: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  businessName?: string;
  businessCategory?: string;
  businessAddress?: string;
  area?: string;
  pincode?: string;
  instagramId?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  permissions?: {
    websiteManager?: {
      canCreate?: boolean;
      canEdit?: boolean;
      canDelete?: boolean;
      canDeploy?: boolean;
    }
  };
  requireSubscriptionCheck?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    validate: {
      validator: function(v: string) {
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid mobile number!`
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'devops', 'manager'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  businessName: {
    type: String,
    trim: true
  },
  businessCategory: {
    type: String,
    trim: true
  },
  businessAddress: {
    type: String,
    trim: true
  },
  area: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^[0-9]{6}$/.test(v);
      },
      message: props => `${props.value} is not a valid pincode!`
    }
  },
  instagramId: {
    type: String,
    trim: true
  },
  instagramUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/(www\.)?instagram\.com\//.test(v);
      },
      message: props => `${props.value} is not a valid Instagram URL!`
    }
  },
  facebookUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/(www\.)?facebook\.com\//.test(v);
      },
      message: props => `${props.value} is not a valid Facebook URL!`
    }
  },
  permissions: {
    websiteManager: {
      canCreate: { type: Boolean, default: false },
      canEdit: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
      canDeploy: { type: Boolean, default: false }
    }
  },
  requireSubscriptionCheck: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default models.User || model<IUser>('User', userSchema); 