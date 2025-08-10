import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Subscription from '@/models/Subscription';

// In-memory cache for subscription status
interface CacheEntry {
  data: {
    userExists: boolean;
    requireSubscriptionCheck: boolean;
    subscriptionActive: boolean;
  };
  expiresAt: number;
}

class SubscriptionCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 2 * 60 * 1000; // 2 minutes cache
  private readonly maxEntries = 1000; // Limit memory usage

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  private evictOldest(): void {
    if (this.cache.size >= this.maxEntries) {
      // Remove 10% oldest entries
      const entries = Array.from(this.cache.entries());
      const toRemove = Math.floor(this.maxEntries * 0.1);
      
      // Sort by expiration time and remove oldest
      entries
        .sort((a, b) => a[1].expiresAt - b[1].expiresAt)
        .slice(0, toRemove)
        .forEach(([key]) => this.cache.delete(key));
    }
  }

  async getSubscriptionStatus(mobileNumber: string): Promise<{
    userExists: boolean;
    requireSubscriptionCheck: boolean;
    subscriptionActive: boolean;
  }> {
    // Check cache first
    const cached = this.cache.get(mobileNumber);
    if (cached && !this.isExpired(cached)) {
      console.log(`📦 Cache HIT for user: ${mobileNumber}`);
      return cached.data;
    }

    console.log(`🔍 Cache MISS for user: ${mobileNumber} - fetching from DB`);

    // Cache miss or expired - fetch from database
    try {
      await dbConnect();
      
      // Single combined query to get both user and subscription data
      const user = await User.findOne({ mobileNumber })
        .select('requireSubscriptionCheck')
        .lean();

      let subscriptionActive = false;
      
      if (user && user.requireSubscriptionCheck !== false) {
        // Only check subscription if user exists and has checking enabled
        const subscription = await Subscription.findOne({ 
          userId: mobileNumber, 
          status: { $in: ['authenticated', 'active'] } 
        }).select('status').lean();
        
        subscriptionActive = !!subscription;
      } else if (user && user.requireSubscriptionCheck === false) {
        // User has subscription checking disabled
        subscriptionActive = true; // Allow access
      }

      const result = {
        userExists: !!user,
        requireSubscriptionCheck: user?.requireSubscriptionCheck !== false,
        subscriptionActive
      };

      // Store in cache
      this.cache.set(mobileNumber, {
        data: result,
        expiresAt: Date.now() + this.TTL
      });

      // Periodic cleanup
      if (Math.random() < 0.01) { // 1% chance
        this.cleanupExpired();
        this.evictOldest();
      }

      return result;

    } catch (error) {
      console.error('Error fetching subscription status:', error);
      // On error, return conservative result (redirect to error)
      return {
        userExists: false,
        requireSubscriptionCheck: true,
        subscriptionActive: false
      };
    }
  }

  // Invalidate cache for a specific user (call when subscription changes)
  invalidateUser(mobileNumber: string): void {
    this.cache.delete(mobileNumber);
    console.log(`🗑️ Cache invalidated for user: ${mobileNumber}`);
  }

  // Clear all cache (for admin operations)
  clearAll(): void {
    this.cache.clear();
    console.log('🗑️ All subscription cache cleared');
  }

  // Get cache stats
  getStats() {
    const now = Date.now();
    const activeEntries = Array.from(this.cache.values()).filter(entry => !this.isExpired(entry));
    
    return {
      totalEntries: this.cache.size,
      activeEntries: activeEntries.length,
      expiredEntries: this.cache.size - activeEntries.length,
      memoryUsage: `${Math.round(this.cache.size * 100 / this.maxEntries)}%`
    };
  }
}

// Singleton instance
export const subscriptionCache = new SubscriptionCache();

// Convenience function for easy use in route handlers
export async function checkSubscriptionCached(mobileNumber: string): Promise<{
  shouldCheckSubscription: boolean;
  subscriptionActive: boolean;
  shouldAllowAccess: boolean;
}> {
  const status = await subscriptionCache.getSubscriptionStatus(mobileNumber);
  
  return {
    shouldCheckSubscription: status.userExists && status.requireSubscriptionCheck,
    subscriptionActive: status.subscriptionActive,
    shouldAllowAccess: !status.userExists || !status.requireSubscriptionCheck || status.subscriptionActive
  };
}