import { NextRequest, NextResponse } from 'next/server';
import ServerSettings from '@/models/ServerSettings';

export async function GET(request: NextRequest) {
  try {
    // Get current settings
    const settings = await ServerSettings.getSettings();
    
    return NextResponse.json({
      success: true,
      message: 'Server settings retrieved successfully',
      settings: settings,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to test server settings',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('TEST: Updating server settings with:', body);
    
    // Test update
    const updatedSettings = await ServerSettings.updateSettings(body);
    
    console.log('TEST: Updated settings result:', updatedSettings);
    
    return NextResponse.json({
      success: true,
      message: 'Server settings updated successfully',
      settings: updatedSettings,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update server settings',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
