const { MongoClient } = require('mongodb');

// Replace with your MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database';

async function testAdminBilling() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const plansCollection = db.collection('adbixplans');
    const addonsCollection = db.collection('adbixaddons');
    
    // Clear existing data
    await plansCollection.deleteMany({});
    await addonsCollection.deleteMany({});
    console.log('🗑️ Cleared existing data');
    
    // Create test plans with proper dates and mixed status
    const testPlans = [
      {
        planId: 'basic',
        name: 'Basic Plan',
        description: 'Perfect for small businesses just getting started',
        price: 1999,
        currency: 'INR',
        billingCycle: 'monthly',
        features: ['5 Websites', 'Basic Templates', 'Email Support'],
        isRecommended: false,
        isActive: true,
        displayOrder: 0,
        buttonText: 'Get Started',
        buttonColor: 'gray',
        razorpayPlanId: 'plan_M5Y6ZxABCDEFGH12',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        planId: 'pro',
        name: 'Pro Plan',
        description: 'For growing businesses and advanced users',
        price: 4999,
        currency: 'INR',
        billingCycle: 'monthly',
        features: ['Unlimited Websites', 'Premium Templates', 'Priority Support', 'Advanced Analytics'],
        isRecommended: true,
        isActive: true,
        displayOrder: 1,
        buttonText: 'Choose Pro',
        buttonColor: 'purple',
        razorpayPlanId: 'plan_N7X8YZABCDEFGH34',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        planId: 'premium',
        name: 'Premium Plan',
        description: 'For large businesses and agencies',
        price: 9999,
        currency: 'INR',
        billingCycle: 'monthly',
        features: ['Everything in Pro', 'White Label', 'API Access', 'Dedicated Support'],
        isRecommended: false,
        isActive: true,
        displayOrder: 2,
        buttonText: 'Go Premium',
        buttonColor: 'gradient',
        razorpayPlanId: 'plan_P9Z0ABCDEFGH5678',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        planId: 'holiday-special',
        name: 'Holiday Special',
        description: 'Limited time holiday offer',
        price: 2999,
        currency: 'INR',
        billingCycle: 'monthly',
        features: ['10 Websites', 'Holiday Templates', 'Extended Support'],
        isRecommended: false,
        isActive: false, // Inactive for testing
        displayOrder: 3,
        buttonText: 'Get Special',
        buttonColor: 'purple',
        razorpayPlanId: null, // No Razorpay plan for inactive plan
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Create test add-ons with proper dates and mixed status
    const testAddons = [
      {
        addonId: 'image-gallery',
        name: 'Image Gallery',
        description: 'Beautiful image galleries for your websites',
        price: 500,
        currency: 'INR',
        billingCycle: 'monthly',
        category: 'widget',
        icon: '🖼️',
        isActive: true,
        displayOrder: 0,
        requirements: ['Basic Plan or higher'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        addonId: 'contact-us',
        name: 'Contact Us Widget',
        description: 'Advanced contact forms and lead management',
        price: 300,
        currency: 'INR',
        billingCycle: 'monthly',
        category: 'widget',
        icon: '📞',
        isActive: true,
        displayOrder: 1,
        requirements: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        addonId: 'legacy-widget',
        name: 'Legacy Widget',
        description: 'Old widget for backward compatibility',
        price: 200,
        currency: 'INR',
        billingCycle: 'monthly',
        category: 'widget',
        icon: '📦',
        isActive: false, // Inactive for testing
        displayOrder: 2,
        requirements: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Insert test data
    await plansCollection.insertMany(testPlans);
    await addonsCollection.insertMany(testAddons);
    
    console.log('✅ Created test plans:', testPlans.length);
    console.log('✅ Created test add-ons:', testAddons.length);
    
    // Verify data
    const activeCountPlans = await plansCollection.countDocuments({ isActive: true });
    const inactiveCountPlans = await plansCollection.countDocuments({ isActive: false });
    const activeCountAddons = await addonsCollection.countDocuments({ isActive: true });
    const inactiveCountAddons = await addonsCollection.countDocuments({ isActive: false });
    
    console.log(`📊 Plans: ${activeCountPlans} active, ${inactiveCountPlans} inactive`);
    console.log(`📊 Add-ons: ${activeCountAddons} active, ${inactiveCountAddons} inactive`);
    
    console.log('🎉 Test data created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

// Run the test
testAdminBilling().catch(console.error); 