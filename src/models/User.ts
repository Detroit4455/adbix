import { Schema, model, models } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  mobileNumber: string;
  password: string;
  name?: string;
  email?: string;
  role?: string;
  permissions?: {
    websiteManager?: {
      canCreate?: boolean;
      canEdit?: boolean;
      canDelete?: boolean;
      canDeploy?: boolean;
    }
  };
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
  permissions: {
    websiteManager: {
      canCreate: { type: Boolean, default: false },
      canEdit: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
      canDeploy: { type: Boolean, default: false }
    }
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