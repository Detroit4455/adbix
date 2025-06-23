import { connectMongoose } from '@/lib/db';
import RbacSettings from '@/models/RbacSettings';

export async function checkResourceAccess(resource: string, role: string): Promise<boolean> {
  try {
    await connectMongoose();
    
    // Initialize default settings if not exists
    await RbacSettings.initializeDefaultSettings();
    
    // Check access using the static method
    return await RbacSettings.hasAccess(resource, role);
  } catch (error) {
    console.error(`Error checking access to ${resource} for role ${role}:`, error);
    // Default to admin only if error
    return role === 'admin';
  }
} 