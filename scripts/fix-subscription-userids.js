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

// User Schema (for reference)
const userSchema = new mongoose.Schema({
  mobileNumber: String,
  _id: mongoose.Schema.Types.ObjectId
});

// Subscription Schema
const subscriptionSchema = new mongoose.Schema({
  userId: String,
  planId: String,
  razorpaySubscriptionId: String,
  status: String,
  // ... other fields
});

const User = mongoose.model('User', userSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);

async function fixSubscriptionUserIds() {
  try {
    console.log('🔍 Starting subscription userId migration...');
    
    // Get all subscriptions
    const subscriptions = await Subscription.find({});
    console.log(`📊 Found ${subscriptions.length} total subscriptions`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const subscription of subscriptions) {
      try {
        const userId = subscription.userId;
        
        // Check if userId is an ObjectId (24 character hex string)
        if (userId && userId.length === 24 && /^[0-9a-fA-F]{24}$/.test(userId)) {
          console.log(`🔄 Processing subscription ${subscription._id} with ObjectId userId: ${userId}`);
          
          // Find the user by ObjectId
          const user = await User.findById(userId);
          
          if (user && user.mobileNumber) {
            // Update subscription with mobileNumber
            await Subscription.updateOne(
              { _id: subscription._id },
              { userId: user.mobileNumber }
            );
            
            console.log(`✅ Fixed subscription ${subscription._id}: ${userId} → ${user.mobileNumber}`);
            fixedCount++;
          } else {
            console.log(`⚠️  User not found for ObjectId: ${userId}, skipping subscription ${subscription._id}`);
            skippedCount++;
          }
        } else {
          // userId is already a mobileNumber or invalid format
          console.log(`⏭️  Skipping subscription ${subscription._id} - userId already looks like mobileNumber: ${userId}`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing subscription ${subscription._id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Fixed: ${fixedCount} subscriptions`);
    console.log(`⏭️  Skipped: ${skippedCount} subscriptions`);
    console.log(`❌ Errors: ${errorCount} subscriptions`);
    console.log(`📊 Total processed: ${subscriptions.length} subscriptions`);
    
    if (fixedCount > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('💡 The subscription cache should now work correctly.');
    } else {
      console.log('\nℹ️  No subscriptions needed fixing.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  connectDB().then(() => {
    fixSubscriptionUserIds();
  });
}

module.exports = { fixSubscriptionUserIds };
