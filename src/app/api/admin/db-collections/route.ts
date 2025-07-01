import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectMongoose } from '@/lib/db';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoose();

    // Get collection statistics using direct MongoDB connection
    const collections = [
      {
        name: 'users',
        displayName: 'Users',
        description: 'User accounts with authentication, roles, and permissions',
        summary: 'Stores user authentication data, mobile numbers, roles (admin, user, devops, manager), and website manager permissions'
      },
      {
        name: 'images',
        displayName: 'Images',
        description: 'Global image repository with metadata and S3 storage information',
        summary: 'Contains image metadata including dimensions, file sizes, S3 URLs, types (photo, icon, banner, logo), and uploader information'
      },
      {
        name: 'contactuswidgetsettings',
        displayName: 'Contact Us Widget Settings',
        description: 'Configuration settings for contact form widgets',
        summary: 'Stores widget customization including colors, fields, templates, and styling options for contact forms'
      },
      {
        name: 'contactusmessages',
        displayName: 'Contact Us Messages',
        description: 'Messages submitted through contact form widgets',
        summary: 'Contains form submissions with user data, timestamps, IP addresses, and form field values'
      },
      {
        name: 'serversettings',
        displayName: 'Server Settings',
        description: 'Global server configuration settings',
        summary: 'Manages system-wide settings like maximum images per user and other operational parameters'
      },
      {
        name: 'rbacsettings',
        displayName: 'RBAC Settings',
        description: 'Role-Based Access Control matrix and permissions',
        summary: 'Defines resource access permissions for different user roles across the application'
      }
    ];

    const collectionsData = await Promise.all(
      collections.map(async (collection) => {
        try {
          const db = mongoose.connection.db;
          if (!db) {
            throw new Error('Database connection not available');
          }
          const mongoCollection = db.collection(collection.name);
          
          const count = await mongoCollection.countDocuments();
          let lastUpdated = null;
          
          try {
            const latest = await mongoCollection.findOne({}, { 
              sort: { updatedAt: -1 },
              projection: { updatedAt: 1 }
            });
            lastUpdated = latest?.updatedAt || null;
          } catch (queryError) {
            // Some collections might not have updatedAt field
            console.log(`No updatedAt field for ${collection.name}`);
          }
          
          return {
            name: collection.name,
            displayName: collection.displayName,
            description: collection.description,
            summary: collection.summary,
            count: count,
            lastUpdated: lastUpdated
          };
        } catch (error) {
          console.error(`Error fetching data for ${collection.name}:`, error);
          return {
            name: collection.name,
            displayName: collection.displayName,
            description: collection.description,
            summary: collection.summary,
            count: 0,
            lastUpdated: null,
            error: 'Unable to fetch data'
          };
        }
      })
    );

    return NextResponse.json({ collections: collectionsData });
  } catch (error) {
    console.error('Error fetching database collections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 