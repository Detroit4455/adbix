#!/usr/bin/env node

const fetch = require('node-fetch');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function seedBillingData() {
  try {
    // Get the base URL from command line arguments or use default
    const baseUrl = process.argv[2] || 'http://localhost:3000';
    
    console.log('🌱 Starting billing data seeding...');
    console.log(`🔗 Target URL: ${baseUrl}`);
    
    // Ask for admin credentials
    const mobileNumber = await new Promise((resolve) => {
      rl.question('Enter admin mobile number: ', resolve);
    });
    
    const password = await new Promise((resolve) => {
      rl.question('Enter admin password: ', resolve);
    });
    
    // Login to get session cookie
    console.log('🔐 Logging in...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mobileNumber,
        password
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Failed to login. Please check your credentials.');
    }
    
    // Extract session cookie
    const sessionCookie = loginResponse.headers.get('set-cookie');
    if (!sessionCookie) {
      throw new Error('No session cookie received. Login might have failed.');
    }
    
    console.log('✅ Login successful!');
    
    // Seed billing data
    console.log('🌱 Seeding billing data...');
    const seedResponse = await fetch(`${baseUrl}/api/billing/seed`, {
      method: 'POST',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json',
      }
    });
    
    const seedResult = await seedResponse.json();
    
    if (seedResponse.ok && seedResult.success) {
      console.log('🎉 Billing data seeded successfully!');
      console.log(`📊 Plans inserted: ${seedResult.data.plansInserted}`);
      console.log(`🔧 Add-ons inserted: ${seedResult.data.addonsInserted}`);
      
      console.log('\n📋 Seeded Plans:');
      console.log('- Basic Plan (₹1999/month)');
      console.log('- Pro Plan (₹4999/month) - Recommended');
      console.log('- Premium Plan (₹9999/month)');
      
      console.log('\n🔧 Seeded Add-ons:');
      console.log('- Image Gallery Widget (₹500/month)');
      console.log('- Contact Us Widget (₹300/month)');
      console.log('- Custom Domain (₹1000/month)');
      console.log('- Advanced Analytics (₹600/month)');
      console.log('- Shop Status Widget (₹200/month)');
      
      console.log('\n🚀 You can now visit the billing page at:');
      console.log(`${baseUrl}/billing`);
      
    } else {
      console.error('❌ Failed to seed billing data:', seedResult.error || 'Unknown error');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the seeder
console.log('🔥 Billing Data Seeder');
console.log('====================');
console.log('This script will populate your database with sample billing plans and add-ons.');
console.log('Make sure you have admin credentials ready.\n');

seedBillingData(); 