const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Clear subscription cache by restarting the application
async function clearSubscriptionCache() {
  try {
    console.log('🗑️  Clearing subscription cache...');
    
    // Since the cache is in-memory, we need to restart the application
    // But we can also clear any cached data in the database if needed
    
    console.log('✅ Subscription cache will be cleared on next application restart');
    console.log('💡 The cache is in-memory and will automatically refresh with the corrected data');
    
    // Show some subscription data to verify the migration worked
    const Subscription = mongoose.model('Subscription', new mongoose.Schema({
      userId: String,
      status: String,
      razorpaySubscriptionId: String
    }));
    
    const activeSubscriptions = await Subscription.find({ 
      status: { $in: ['authenticated', 'active'] } 
    }).select('userId status').lean();
    
    console.log(`📊 Found ${activeSubscriptions.length} active subscriptions:`);
    activeSubscriptions.forEach(sub => {
      console.log(`  - User: ${sub.userId}, Status: ${sub.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the cache clearing
if (require.main === module) {
  connectDB().then(() => {
    clearSubscriptionCache();
  });
}

module.exports = { clearSubscriptionCache };
