const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'dt-web-sites';

async function uploadSettingsToS3() {
  try {
    // Read existing settings from local file
    const localSettingsPath = path.join(process.cwd(), 'user-data', '9421468640', 'settings.json');
    
    if (!fs.existsSync(localSettingsPath)) {
      console.log('No local settings file found. Creating default settings...');
      
      // Create default settings
      const defaultSettings = {
        "beauty-salon": {
          "parlour_info": {
            "name": "S3 Beauty Parlour",
            "tagline": "Where elegance meets expertise.",
            "about_us": "S3 Beauty Parlour is dedicated to providing an exceptional beauty experience. Our team of certified professionals is committed to using the highest quality products and techniques to help you look and feel your best. We specialize in a wide range of services, from hair care and styling to advanced skincare and nail art."
          },
          "contact_details": {
            "phone": "+91 9876543210",
            "email": "info@s3beautyparlour.com",
            "address": "123, Beauty Lane, Pune, Maharashtra 411001"
          },
          "hours_of_operation": {
            "monday": "10:00 AM - 8:00 PM",
            "tuesday": "10:00 AM - 8:00 PM",
            "wednesday": "10:00 AM - 8:00 PM",
            "thursday": "10:00 AM - 8:00 PM",
            "friday": "10:00 AM - 8:00 PM",
            "saturday": "11:00 AM - 6:00 PM",
            "sunday": "Closed"
          },
          "social_media": {
            "instagram": "https://www.instagram.com/s3beauty",
            "facebook": "https://www.facebook.com/s3beauty",
            "google_maps_link": "https://goo.gl/maps/example_location",
            "pinterest": "https://www.pinterest.com/s3beauty"
          },
          "services": [
            {
              "name": "Haircuts & Styling",
              "description": "Our expert stylists are trained in the latest techniques to give you the perfect look.",
              "image_url": "https://your-s3-bucket.com/images/haircut_styling.jpg",
              "price_range": "₹500 - ₹2500"
            },
            {
              "name": "Facials & Skincare",
              "description": "Rejuvenate your skin with our range of professional facial treatments.",
              "image_url": "https://your-s3-bucket.com/images/facials_skincare.jpg",
              "price_range": "₹1200 - ₹5000"
            },
            {
              "name": "Nail Care (Manicure & Pedicure)",
              "description": "Treat your hands and feet to our luxurious manicure and pedicure services.",
              "image_url": "https://your-s3-bucket.com/images/nail_care.jpg",
              "price_range": "₹700 - ₹2000"
            },
            {
              "name": "Bridal & Party Makeup",
              "description": "Flawless and stunning makeup for your special occasions.",
              "image_url": "https://your-s3-bucket.com/images/makeup.jpg",
              "price_range": "Contact for quote"
            }
          ],
          "testimonials": [
            {
              "author": "Priya Sharma",
              "quote": "Amazing service! The staff is so friendly and professional. I love my new haircut!",
              "rating": 5
            },
            {
              "author": "Rahul Singh",
              "quote": "Excellent facial. My skin feels so refreshed. Highly recommended!",
              "rating": 5
            }
          ],
          "gallery_images": [
            {
              "url": "https://your-s3-bucket.com/images/gallery1.jpg",
              "alt_text": "A client with a new hairstyle"
            },
            {
              "url": "https://your-s3-bucket.com/images/gallery2.jpg",
              "alt_text": "Interior of the beauty parlour"
            },
            {
              "url": "https://your-s3-bucket.com/images/gallery3.jpg",
              "alt_text": "Manicure in progress"
            }
          ]
        }
      };
      
      // Upload default settings to S3
      const key = `sites/9421468640/settings.json`;
      const putCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(defaultSettings, null, 2),
        ContentType: 'application/json',
      });

      await s3Client.send(putCommand);
      console.log(`✅ Default settings uploaded to S3: s3://${BUCKET_NAME}/${key}`);
      
    } else {
      // Read existing settings
      const settingsData = fs.readFileSync(localSettingsPath, 'utf8');
      const settings = JSON.parse(settingsData);
      
      // Upload to S3
      const key = `sites/9421468640/settings.json`;
      const putCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: settingsData,
        ContentType: 'application/json',
      });

      await s3Client.send(putCommand);
      console.log(`✅ Settings uploaded to S3: s3://${BUCKET_NAME}/${key}`);
    }
    
    console.log('🎉 Settings successfully uploaded to S3!');
    
  } catch (error) {
    console.error('❌ Error uploading settings to S3:', error);
    process.exit(1);
  }
}

// Run the upload
uploadSettingsToS3();
