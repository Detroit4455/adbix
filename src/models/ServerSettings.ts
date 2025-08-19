import { Schema, model, models, Model } from 'mongoose';
import { connectMongoose } from '@/lib/db';

export interface IServerSettings {
  maxImagesPerUser: number;
  allowNewUserRegistration: boolean;
  
  // Trial Period Configuration
  enableTrialPeriod: boolean;
  trialPeriodDays: number;
  trialDescription: string;
  
  createdAt: Date;
  updatedAt: Date;
}

interface ServerSettingsModel extends Model<IServerSettings> {
  getSettings(): Promise<IServerSettings>;
  updateSettings(settings: Partial<IServerSettings>): Promise<IServerSettings>;
  initializeDefaultSettings(): Promise<void>;
}

const serverSettingsSchema = new Schema<IServerSettings>({
  maxImagesPerUser: {
    type: Number,
    default: 50,
    min: 1,
    max: 1000
  },
  allowNewUserRegistration: {
    type: Boolean,
    default: true
  },
  
  // Trial Period Configuration
  enableTrialPeriod: {
    type: Boolean,
    default: false
  },
  trialPeriodDays: {
    type: Number,
    default: 30,
    min: 1,
    max: 365
  },
  trialDescription: {
    type: String,
    default: 'Free trial period for new subscriptions'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Get current settings (creates default if none exist)
serverSettingsSchema.statics.getSettings = async function(): Promise<IServerSettings> {
  try {
    await connectMongoose();
    
    let settings = await this.findOne().maxTimeMS(5000).lean().exec();
    
    if (!settings) {
      await (this as any).initializeDefaultSettings();
      settings = await this.findOne().maxTimeMS(5000).lean().exec();
    }
    
    return settings as IServerSettings;
  } catch (error) {
    console.error('Error getting server settings:', error);
    // Return default settings if there's an error
    return {
      maxImagesPerUser: 50,
      allowNewUserRegistration: true,
      enableTrialPeriod: false,
      trialPeriodDays: 30,
      trialDescription: 'Free trial period for new subscriptions',
      createdAt: new Date(),
      updatedAt: new Date()
    } as IServerSettings;
  }
};

// Update settings
serverSettingsSchema.statics.updateSettings = async function(newSettings: Partial<IServerSettings>): Promise<IServerSettings> {
  try {
    await connectMongoose();
    
    console.log('MongoDB: Updating server settings with:', newSettings);
    
    const settings = await this.findOneAndUpdate(
      {}, 
      newSettings, 
      { new: true, upsert: true, runValidators: true }
    );
    
    console.log('MongoDB: Updated settings result:', settings);
    
    return settings;
  } catch (error) {
    console.error('Error updating server settings:', error);
    throw error;
  }
};

// Initialize with default settings
serverSettingsSchema.statics.initializeDefaultSettings = async function(): Promise<void> {
  try {
    await connectMongoose();
    
    const exists = await this.findOne().maxTimeMS(5000).lean().exec();
    
    if (!exists) {
      await this.create({
        maxImagesPerUser: 50,
        allowNewUserRegistration: true,
        enableTrialPeriod: false,
        trialPeriodDays: 30,
        trialDescription: 'Free trial period for new subscriptions'
      });
    }
  } catch (error) {
    console.error('Error initializing server settings:', error);
  }
};

export default (models.ServerSettings || model<IServerSettings, ServerSettingsModel>('ServerSettings', serverSettingsSchema)) as ServerSettingsModel; 