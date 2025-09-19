import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'dt-web-sites';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mobileNumber = searchParams.get('mobileNumber');
    const businessType = searchParams.get('businessType') || 'beauty-salon';
    const fileName = searchParams.get('fileName');

    if (!mobileNumber) {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    // Check if user is accessing their own data or is admin
    const isSelf = session.user.mobileNumber === mobileNumber;
    const isAdmin = session.user.role === 'admin' || session.user.role === 'manager';
    
    if (!isSelf && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Construct S3 key - use custom fileName if provided, otherwise default to settings.json
    const key = `sites/${mobileNumber}/${fileName || 'settings.json'}`;

    try {
      // Check if settings file exists in S3
      await s3Client.send(new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }));
      
      // Read existing settings from S3
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });
      
      const response = await s3Client.send(command);
      
      if (!response.Body) {
        return NextResponse.json({ 
          success: true, 
          settings: null,
          businessType 
        });
      }
      
      const settingsData = await response.Body.transformToString();
      const settings = JSON.parse(settingsData);
      
      // If fileName is provided (e.g., menu.json), return the entire file content
      // Otherwise, return settings for the specific business type from settings.json
      const businessSettings = fileName ? settings : (settings[businessType] || null);
      
      return NextResponse.json({ 
        success: true, 
        settings: businessSettings,
        businessType 
      });
    } catch (error) {
      // File doesn't exist in S3, return null
      return NextResponse.json({ 
        success: true, 
        settings: null,
        businessType 
      });
    }
  } catch (error) {
    console.error('Error loading user settings:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mobileNumber, businessType, settings, fileName } = body;

    if (!mobileNumber || !businessType || !settings) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user is accessing their own data or is admin
    const isSelf = session.user.mobileNumber === mobileNumber;
    const isAdmin = session.user.role === 'admin' || session.user.role === 'manager';
    
    if (!isSelf && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Construct S3 key - use custom fileName if provided, otherwise default to settings.json
    const key = `sites/${mobileNumber}/${fileName || 'settings.json'}`;

    try {
      let dataToSave;
      
      if (fileName) {
        // If fileName is provided (e.g., menu.json), save the settings directly as the file content
        dataToSave = settings;
      } else {
        // For settings.json, maintain the business type structure
        let existingSettings = {};
        
        // Try to read existing settings from S3
        try {
          const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
          });
          
          const response = await s3Client.send(command);
          
          if (response.Body) {
            const settingsData = await response.Body.transformToString();
            existingSettings = JSON.parse(settingsData);
          }
        } catch (error) {
          // File doesn't exist in S3, start with empty object
          existingSettings = {};
        }

        // Update settings for the specific business type
        (existingSettings as any)[businessType] = settings;
        dataToSave = existingSettings;
      }

      // Write data to S3
      const putCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(dataToSave, null, 2),
        ContentType: 'application/json',
      });

      await s3Client.send(putCommand);

      return NextResponse.json({ 
        success: true, 
        message: 'Settings saved successfully to S3' 
      });
    } catch (error) {
      console.error('Error saving user settings to S3:', error);
      return NextResponse.json({ error: 'Failed to save settings to S3' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
