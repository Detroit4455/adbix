import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    
    if (!keyId) {
      return NextResponse.json(
        { error: 'Razorpay configuration not found' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      keyId: keyId
    });
  } catch (error) {
    console.error('Error fetching Razorpay config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Razorpay configuration' },
      { status: 500 }
    );
  }
}
