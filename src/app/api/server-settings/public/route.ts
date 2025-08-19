import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import ServerSettings from '@/models/ServerSettings';

/**
 * GET /api/server-settings/public - Get public server settings (trial period info)
 * This endpoint is accessible to all authenticated users and only returns non-sensitive settings
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication - any authenticated user can access this
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production'
    });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get server settings
    const settings = await ServerSettings.getSettings();
    
    // Return only public/non-sensitive settings
    const publicSettings = {
      enableTrialPeriod: settings.enableTrialPeriod || false,
      trialPeriodDays: settings.trialPeriodDays || 30,
      trialDescription: settings.trialDescription || 'Free trial period for new subscriptions'
    };

    console.log('Public server settings requested by user:', token.email, 'Settings:', publicSettings);

    return NextResponse.json(publicSettings);

  } catch (error) {
    console.error('Error fetching public server settings:', error);
    
    // Return safe defaults if there's an error
    return NextResponse.json({
      enableTrialPeriod: false,
      trialPeriodDays: 30,
      trialDescription: 'Free trial period for new subscriptions'
    });
  }
}
