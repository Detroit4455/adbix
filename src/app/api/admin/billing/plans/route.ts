import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import AdbixPlan from '@/models/AdbixPlan';

export async function GET(request: NextRequest) {
  try {
    // Check authentication - only admin can view all plans
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch ALL plans (including inactive ones), sorted by display order
    const plans = await AdbixPlan.find({})
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({ 
      success: true, 
      plans: plans.map(plan => ({
        _id: plan._id,
        planId: plan.planId,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        features: plan.features,
        isRecommended: plan.isRecommended,
        isActive: plan.isActive,
        buttonText: plan.buttonText,
        buttonColor: plan.buttonColor,
        displayOrder: plan.displayOrder,
        razorpayPlanId: plan.razorpayPlanId,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching admin plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
} 