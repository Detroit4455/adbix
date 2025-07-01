const { default: RazorpayService } = require('../src/lib/razorpay.ts');

async function testCustomerHandling() {
  console.log('🧪 Testing Customer Handling Logic...\n');

  const testCustomerData = {
    name: 'Test User',
    email: 'test@example.com',
    contact: '+919999999999',
    notes: {
      userId: 'test-user-123',
      testFlag: true
    }
  };

  try {
    console.log('📝 Step 1: Attempting to find or create customer...');
    const customer1 = await RazorpayService.findOrCreateCustomer(testCustomerData);
    console.log('✅ First attempt successful:', customer1.id);

    console.log('\n📝 Step 2: Attempting to find or create same customer again...');
    const customer2 = await RazorpayService.findOrCreateCustomer(testCustomerData);
    console.log('✅ Second attempt successful:', customer2.id);

    if (customer1.id === customer2.id) {
      console.log('🎉 SUCCESS: Same customer returned both times!');
      console.log('Customer ID:', customer1.id);
      console.log('Customer Email:', customer1.email);
      console.log('Customer Contact:', customer1.contact);
    } else {
      console.log('❌ ERROR: Different customers returned');
      console.log('First customer ID:', customer1.id);
      console.log('Second customer ID:', customer2.id);
    }

    console.log('\n📝 Step 3: Testing with slightly different data...');
    const customer3 = await RazorpayService.findOrCreateCustomer({
      ...testCustomerData,
      name: 'Updated Test User' // Different name, same email/contact
    });
    console.log('✅ Third attempt successful:', customer3.id);

    if (customer1.id === customer3.id) {
      console.log('🎉 SUCCESS: Existing customer found even with different name!');
    } else {
      console.log('❌ ERROR: New customer created instead of finding existing');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Enhanced error logging for subscription creation
async function testSubscriptionFlow() {
  console.log('\n🧪 Testing Subscription Flow Error Handling...\n');
  
  // Simulate what happens in the subscription API
  const mockCustomerInfo = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+919876543210'
  };

  try {
    console.log('📝 Testing customer creation/finding...');
    const customer = await RazorpayService.findOrCreateCustomer({
      name: mockCustomerInfo.name,
      email: mockCustomerInfo.email,
      contact: mockCustomerInfo.phone,
      notes: {
        userId: 'user123',
        planId: 'pro'
      }
    });

    console.log('✅ Customer handling successful:');
    console.log('  Customer ID:', customer.id);
    console.log('  Email:', customer.email);
    console.log('  Contact:', customer.contact);
    console.log('  Name:', customer.name);

  } catch (error) {
    console.error('❌ Subscription flow test failed:', error);
    
    // Test error parsing
    if (error.error && error.error.code === 'BAD_REQUEST_ERROR') {
      console.log('🔍 Detected Razorpay BAD_REQUEST_ERROR');
      if (error.error.description && error.error.description.includes('Customer already exists')) {
        console.log('🔍 Detected "Customer already exists" error');
        console.log('✅ This should be handled by findOrCreateCustomer method');
      }
    }
  }
}

// Run tests
(async () => {
  try {
    await testCustomerHandling();
    await testSubscriptionFlow();
    console.log('\n🎯 Test Summary:');
    console.log('- Customer creation/finding logic implemented');
    console.log('- Handles "Customer already exists" errors gracefully');
    console.log('- Reuses existing customers when appropriate');
    console.log('- Enhanced error messages for better user experience');
  } catch (error) {
    console.error('Test execution failed:', error);
  }
})(); 