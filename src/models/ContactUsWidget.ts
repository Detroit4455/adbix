import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for individual form fields
export interface FormField {
  id: string;
  name: string;
  type: 'text' | 'email' | 'textarea' | 'tel';
  label: string;
  placeholder: string;
  required: boolean;
  order: number;
}

// Interface for widget settings
export interface ContactUsWidgetSettings extends Document {
  userId: string;
  title: string;
  subtitle: string;
  fields: FormField[];
  backgroundColor: string;
  backgroundOpacity: number;
  textColor: string;
  textOpacity: number;
  buttonColor: string;
  buttonOpacity: number;
  buttonTextColor: string;
  buttonTextOpacity: number;
  placeholderColor: string;
  placeholderOpacity: number;
  placeholderBgColor: string;
  placeholderBgOpacity: number;
  template: string;
  titleFontSize: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for contact messages
export interface ContactUsMessage extends Document {
  userId: string;
  widgetId: string;
  formData: Record<string, string>;
  submissionTime: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Schema for form fields
const FormFieldSchema = new Schema<FormField>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['text', 'email', 'textarea', 'tel'], required: true },
  label: { type: String, required: true },
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: false },
  order: { type: Number, required: true }
});

// Schema for widget settings
const ContactUsWidgetSettingsSchema = new Schema<ContactUsWidgetSettings>({
  userId: { type: String, required: true, unique: true },
  title: { type: String, default: 'Contact Us' },
  subtitle: { type: String, default: 'Get in touch with us' },
  fields: [FormFieldSchema],
  backgroundColor: { type: String, default: '#ffffff' },
  backgroundOpacity: { type: Number, default: 1, min: 0, max: 1 },
  textColor: { type: String, default: '#333333' },
  textOpacity: { type: Number, default: 1, min: 0, max: 1 },
  buttonColor: { type: String, default: '#3b82f6' },
  buttonOpacity: { type: Number, default: 1, min: 0, max: 1 },
  buttonTextColor: { type: String, default: '#ffffff' },
  buttonTextOpacity: { type: Number, default: 1, min: 0, max: 1 },
  placeholderColor: { type: String, default: '#9ca3af' },
  placeholderOpacity: { type: Number, default: 1, min: 0, max: 1 },
  placeholderBgColor: { type: String, default: '#ffffff' },
  placeholderBgOpacity: { type: Number, default: 1, min: 0, max: 1 },
  template: { type: String, default: 'modern-card' },
  titleFontSize: { type: Number, default: 24, min: 16, max: 48 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Schema for contact messages
const ContactUsMessageSchema = new Schema<ContactUsMessage>({
  userId: { type: String, required: true },
  widgetId: { type: String, required: true },
  formData: { type: Map, of: String, required: true },
  submissionTime: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String }
});

// Update the updatedAt field before saving
ContactUsWidgetSettingsSchema.pre<ContactUsWidgetSettings>('save', function() {
  this.updatedAt = new Date();
});

// Create models
let ContactUsWidgetSettingsModel: Model<ContactUsWidgetSettings>;
let ContactUsMessageModel: Model<ContactUsMessage>;

try {
  ContactUsWidgetSettingsModel = mongoose.model<ContactUsWidgetSettings>('ContactUsWidgetSettings');
  ContactUsMessageModel = mongoose.model<ContactUsMessage>('ContactUsMessage');
} catch {
  ContactUsWidgetSettingsModel = mongoose.model<ContactUsWidgetSettings>('ContactUsWidgetSettings', ContactUsWidgetSettingsSchema);
  ContactUsMessageModel = mongoose.model<ContactUsMessage>('ContactUsMessage', ContactUsMessageSchema);
}

export { ContactUsWidgetSettingsModel, ContactUsMessageModel }; 