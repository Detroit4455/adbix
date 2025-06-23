import { Schema, model, models, Model } from 'mongoose';
import { connectMongoose } from '@/lib/db';

export interface IRbacMatrix {
  resource: string;
  roles: {
    admin?: boolean;
    devops?: boolean;
    user?: boolean;
    manager?: boolean;
    [key: string]: boolean | undefined;
  };
}

export interface IRbacSettings {
  matrix: IRbacMatrix[];
  createdAt: Date;
  updatedAt: Date;
}

// Define static methods interface
interface RbacSettingsModel extends Model<IRbacSettings> {
  hasAccess(resource: string, role: string): Promise<boolean>;
  initializeDefaultSettings(): Promise<void>;
}

const rbacMatrixSchema = new Schema({
  resource: {
    type: String,
    required: [true, 'Resource name is required'],
    unique: true
  },
  roles: {
    type: Map,
    of: Boolean,
    default: {
      admin: true,
      devops: false,
      user: false,
      manager: false
    }
  }
}, {
  _id: false, // Don't add _id to each embedded document
  toJSON: { virtuals: true, getters: true },
  toObject: { virtuals: true, getters: true }
});

const rbacSettingsSchema = new Schema<IRbacSettings>({
  matrix: [rbacMatrixSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Convert Map to plain object for serialization
rbacSettingsSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret.matrix) {
      ret.matrix = ret.matrix.map((item: any) => {
        if (item.roles instanceof Map) {
          const plainRoles: Record<string, boolean> = {};
          item.roles.forEach((value: boolean, key: string) => {
            plainRoles[key] = value;
          });
          return {
            ...item,
            roles: plainRoles
          };
        }
        return item;
      });
    }
    return ret;
  }
});

// Helper method to check if a role has access to a resource
rbacSettingsSchema.statics.hasAccess = async function(resource: string, role: string): Promise<boolean> {
  try {
    // Ensure mongoose is connected before running queries
    await connectMongoose();
    
    const settings = await this.findOne().maxTimeMS(5000).lean().exec();
    
    if (!settings) {
      // Default: only admin has access if no settings exist
      return role === 'admin';
    }
    
    const resourceSettings = settings.matrix.find((m: any) => m.resource === resource);
    
    if (!resourceSettings) {
      // Resource not found in settings, default to admin only
      return role === 'admin';
    }
    
    // Check if the role has access to this resource
    // Handle both Map and plain object
    if (resourceSettings.roles instanceof Map) {
      return resourceSettings.roles.get(role) === true;
    } else {
      return resourceSettings.roles[role] === true;
    }
  } catch (error) {
    console.error('Error checking access:', error);
    // Default to admin only if there's an error
    return role === 'admin';
  }
};

// Initialize with default settings if not exists
rbacSettingsSchema.statics.initializeDefaultSettings = async function(): Promise<void> {
  try {
    // Ensure mongoose is connected before running queries
    await connectMongoose();
    
    const exists = await this.findOne().maxTimeMS(5000).lean().exec();
    
    if (!exists) {
      await this.create({
        matrix: [
          {
            resource: 'website-manager',
            roles: {
              admin: true,
              devops: true,
              user: false,
              manager: false
            }
          },
          {
            resource: 'image-repo',
            roles: {
              admin: true,
              devops: true,
              user: false,
              manager: false
            }
          },
          {
            resource: 'my-images',
            roles: {
              admin: true,
              devops: true,
              user: true,
              manager: true
            }
          }
        ]
      });
    }
  } catch (error) {
    console.error('Error initializing RBAC settings:', error);
    // Just log the error but don't throw, as we want the app to continue working
  }
};

export default (models.RbacSettings || model<IRbacSettings, RbacSettingsModel>('RbacSettings', rbacSettingsSchema)) as RbacSettingsModel; 