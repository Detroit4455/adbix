import { NextResponse } from 'next/server';
import ServerSettings from '@/models/ServerSettings';

export async function GET() {
  try {
    const serverSettings = await ServerSettings.getSettings();
    return NextResponse.json({
      allowNewUserRegistration: serverSettings.allowNewUserRegistration
    });
  } catch (error) {
    console.error('Error checking registration status:', error);
    // Default to allowing registration if there's an error
    return NextResponse.json({
      allowNewUserRegistration: true
    });
  }
} 