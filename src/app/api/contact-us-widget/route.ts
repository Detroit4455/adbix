import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { ContactUsWidgetSettingsModel } from '@/models/ContactUsWidget';
import connectToDatabase from '@/lib/mongoose';

// GET - Fetch widget settings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await connectToDatabase(); // Ensure MongoDB connection
    
    let settings = await ContactUsWidgetSettingsModel.findOne({ userId });
    
    if (!settings) {
      // Create default settings if none exist
      const defaultFields = [
        {
          id: 'name',
          name: 'name',
          type: 'text' as const,
          label: 'Your Name',
          placeholder: 'Enter your name',
          required: true,
          order: 1
        },
        {
          id: 'email',
          name: 'email',
          type: 'email' as const,
          label: 'Your Email',
          placeholder: 'Enter your email',
          required: true,
          order: 2
        },
        {
          id: 'message',
          name: 'message',
          type: 'textarea' as const,
          label: 'Your Message',
          placeholder: 'Enter your message',
          required: true,
          order: 3
        }
      ];

      settings = new ContactUsWidgetSettingsModel({
        userId,
        title: 'Contact Us',
        subtitle: 'Get in touch with us',
        fields: defaultFields,
        backgroundColor: '#ffffff',
        backgroundOpacity: 1,
        textColor: '#333333',
        textOpacity: 1,
        buttonColor: '#3b82f6',
        buttonOpacity: 1,
        buttonTextColor: '#ffffff',
        buttonTextOpacity: 1,
        placeholderColor: '#9ca3af',
        placeholderOpacity: 1,
        placeholderBgColor: '#ffffff',
        placeholderBgOpacity: 1,
        template: 'modern-card',
        titleFontSize: 24
      });
      
      await settings.save();
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching widget settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST - Update widget settings
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      userId, title, subtitle, fields, backgroundColor, backgroundOpacity,
      textColor, textOpacity, buttonColor, buttonOpacity, buttonTextColor, buttonTextOpacity,
      placeholderColor, placeholderOpacity, placeholderBgColor, placeholderBgOpacity, template, titleFontSize
    } = await request.json();
    
    if (!userId || session.user.mobileNumber !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase(); // Ensure MongoDB connection
    
    console.log('Saving template value:', template);
    
    const updateData = {
      title,
      subtitle,
      fields,
      backgroundColor,
      backgroundOpacity,
      textColor,
      textOpacity,
      buttonColor,
      buttonOpacity,
      buttonTextColor,
      buttonTextOpacity,
      placeholderColor,
      placeholderOpacity,
      placeholderBgColor,
      placeholderBgOpacity,
      template: template || 'modern-card', // Ensure template is never undefined
      titleFontSize: titleFontSize || 24, // Default font size
      updatedAt: new Date()
    };
    
    console.log('Update data with template:', updateData.template);
    
    const updatedSettings = await ContactUsWidgetSettingsModel.findOneAndUpdate(
      { userId },
      updateData,
      { upsert: true, new: true }
    );
    
    console.log('Updated settings template:', updatedSettings.template);
    
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating widget settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
} 