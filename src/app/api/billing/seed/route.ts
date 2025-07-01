import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import AdbixPlan from '@/models/AdbixPlan';
import AdbixAddon from '@/models/AdbixAddon';

export async function POST(request: NextRequest) {
  try {
    // Check authentication - only admin can seed data
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Sample plans data
    const samplePlans = [
      {
        planId: 'basic',
        name: 'Basic',
        description: 'For individuals and small projects.',
        price: 1999,
        currency: 'INR',
        billingCycle: 'monthly',
        features: [
          '1 Website',
          'Basic Analytics',
          'Community Support'
        ],
        isRecommended: false,
        isActive: true,
        displayOrder: 1,
        buttonText: 'Select Plan',
        buttonColor: 'gray'
      },
      {
        planId: 'pro',
        name: 'Pro',
        description: 'For growing businesses and advanced users.',
        price: 4999,
        currency: 'INR',
        billingCycle: 'monthly',
        features: [
          'Unlimited Websites',
          'Advanced Analytics',
          'Priority Support',
          'Custom Domain'
        ],
        isRecommended: true,
        isActive: true,
        displayOrder: 2,
        buttonText: 'Select Plan',
        buttonColor: 'purple'
      },
      {
        planId: 'premium',
        name: 'Premium',
        description: 'For large enterprises and ultimate performance.',
        price: 9999,
        currency: 'INR',
        billingCycle: 'monthly',
        features: [
          'All Pro features',
          'Dedicated Support Manager',
          'Custom Integrations',
          'Uptime SLA'
        ],
        isRecommended: false,
        isActive: true,
        displayOrder: 3,
        buttonText: 'Select Plan',
        buttonColor: 'gradient'
      }
    ];

    // Sample add-ons data
    const sampleAddons = [
      {
        addonId: 'image-gallery',
        name: 'Image Gallery',
        description: 'Showcase your visuals with stunning galleries.',
        price: 500,
        currency: 'INR',
        billingCycle: 'monthly',
        category: 'widget',
        icon: '🖼️',
        isActive: true,
        displayOrder: 1,
        requirements: []
      },
      {
        addonId: 'contact-us',
        name: 'Contact Us Widget',
        description: 'Professional contact forms for your website.',
        price: 300,
        currency: 'INR',
        billingCycle: 'monthly',
        category: 'widget',
        icon: '📧',
        isActive: true,
        displayOrder: 2,
        requirements: []
      },
      {
        addonId: 'custom-domain',
        name: 'Custom Domain',
        description: 'Connect your own professional domain name.',
        price: 1000,
        currency: 'INR',
        billingCycle: 'monthly',
        category: 'service',
        icon: '🌐',
        isActive: true,
        displayOrder: 3,
        requirements: []
      },
      {
        addonId: 'advanced-analytics',
        name: 'Advanced Analytics',
        description: 'Gain deeper insights into your website\'s performance.',
        price: 600,
        currency: 'INR',
        billingCycle: 'monthly',
        category: 'feature',
        icon: '📊',
        isActive: true,
        displayOrder: 4,
        requirements: []
      },
      {
        addonId: 'shop-status',
        name: 'Shop Status Widget',
        description: 'Display your shop open/close status to customers.',
        price: 200,
        currency: 'INR',
        billingCycle: 'monthly',
        category: 'widget',
        icon: '🏪',
        isActive: true,
        displayOrder: 5,
        requirements: []
      }
    ];

    // Clear existing data (optional - remove if you want to keep existing data)
    await AdbixPlan.deleteMany({});
    await AdbixAddon.deleteMany({});

    // Insert sample plans
    const insertedPlans = await AdbixPlan.insertMany(samplePlans);
    console.log(`Inserted ${insertedPlans.length} plans`);

    // Insert sample add-ons
    const insertedAddons = await AdbixAddon.insertMany(sampleAddons);
    console.log(`Inserted ${insertedAddons.length} add-ons`);

    return NextResponse.json({ 
      success: true, 
      message: 'Database seeded successfully',
      data: {
        plansInserted: insertedPlans.length,
        addonsInserted: insertedAddons.length
      }
    });

  } catch (error: any) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: error.message },
      { status: 500 }
    );
  }
} 