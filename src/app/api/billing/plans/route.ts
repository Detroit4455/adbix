import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import AdbixPlan from '@/models/AdbixPlan';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch active plans, sorted by display order
    const plans = await AdbixPlan.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({ 
      success: true, 
      plans: plans.map(plan => ({
        id: plan._id,
        planId: plan.planId,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        features: plan.features,
        isRecommended: plan.isRecommended,
        buttonText: plan.buttonText,
        buttonColor: plan.buttonColor,
        displayOrder: plan.displayOrder,
        razorpayPlanId: plan.razorpayPlanId
      }))
    });

  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication - only admin can create plans
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const planData = await request.json();
    
    // Validate required fields
    const { planId, name, description, price, features } = planData;
    if (!planId || !name || !description || price === undefined || !features) {
      return NextResponse.json(
        { error: 'Missing required fields: planId, name, description, price, features' },
        { status: 400 }
      );
    }

    // Ensure dates are stored as ISODate
    const newPlan = new AdbixPlan({
      ...planData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await newPlan.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Plan created successfully',
      plan: newPlan
    });

  } catch (error: any) {
    console.error('Error creating plan:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Plan ID already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
} 