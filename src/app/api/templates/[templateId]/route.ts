import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectMongoose } from '@/lib/db';
import WebTemplate from '@/models/WebTemplate';

export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoose();

    const templateId = params.templateId;
    const userMobileNumber = session.user.mobileNumber;

    // Build filter to find the template - check both public and private templates for this user
    const filter = {
      templateId,
      isActive: true,
      $or: [
        { isPublic: true, customMobileNumber: null }, // Public templates
        { isPublic: false, customMobileNumber: userMobileNumber } // Custom templates for this user
      ]
    };

    // Find the template
    const template = await WebTemplate.findOne(filter)
      .select('templateId name description businessCategory templateType tags previewImage isPublic customMobileNumber metadata createdAt')
      .lean();

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Add preview URL to the template
    const templateWithUrl = {
      ...template,
      previewUrl: template.metadata.hasIndexHtml 
        ? `https://${process.env.AWS_S3_BUCKET_NAME || 'dt-web-sites'}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/web-templates/${template.templateId}/index.html`
        : null
    };

    return NextResponse.json({ template: templateWithUrl });

  } catch (error) {
    console.error('Template GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}
