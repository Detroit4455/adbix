import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-as-a-service';
const MONGODB_DB = process.env.MONGODB_DB || 'web-as-a-service';

// Check if MongoDB URI is defined
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Check if MongoDB DB is defined
if (!MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global as any;
if (!cached.mongo) {
  cached.mongo = { conn: null, promise: null };
}

if (!cached.mongoose) {
  cached.mongoose = { conn: null, promise: null };
}

// Configure mongoose to handle promise rejection
mongoose.set('strictQuery', false);

// Connect to MongoDB with Mongoose
export async function connectMongoose() {
  if (cached.mongoose.conn) {
    return cached.mongoose.conn;
  }

  if (!cached.mongoose.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    cached.mongoose.promise = mongoose.connect(MONGODB_URI, opts).catch(err => {
      console.error('Mongoose connection error:', err);
      cached.mongoose.promise = null; // Reset the promise on error
      throw err;
    });
  }

  try {
    cached.mongoose.conn = await cached.mongoose.promise;
    return cached.mongoose.conn;
  } catch (e) {
    cached.mongoose.promise = null;
    throw e;
  }
}

// Connect to MongoDB with native client
export async function connectToDatabase() {
  if (cached.mongo.conn) {
    return cached.mongo.conn;
  }

  if (!cached.mongo.promise) {
    const opts = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    cached.mongo.promise = MongoClient.connect(MONGODB_URI, opts)
      .then((client) => {
        return {
          client,
          db: client.db(MONGODB_DB),
        };
      })
      .catch(err => {
        console.error('MongoDB connection error:', err);
        cached.mongo.promise = null; // Reset the promise on error
        throw err;
      });
  }

  try {
    cached.mongo.conn = await cached.mongo.promise;
    // Also connect mongoose since many functions expect both
    await connectMongoose();
    return cached.mongo.conn;
  } catch (e) {
    cached.mongo.promise = null;
    throw e;
  }
} 