import { NextResponse } from 'next/server';
import { ContactUsWidgetSettingsModel } from '@/models/ContactUsWidget';
import connectToDatabase from '@/lib/mongoose';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await connectToDatabase();
    
    const settings = await ContactUsWidgetSettingsModel.findOne({ userId }).lean();
    
    return NextResponse.json({
      found: !!settings,
      template: settings?.template,
      allData: settings,
      fieldNames: settings ? Object.keys(settings) : []
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
} 