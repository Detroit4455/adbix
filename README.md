# WebAsAService Landing Page

A modern landing page for a website-as-a-service business built with Next.js, Tailwind CSS, and MongoDB.

## Features

- Responsive design that works on all devices
- Modern UI with smooth animations
- Contact form with MongoDB integration
- SEO-friendly structure
- Fast loading times with Next.js

## Prerequisites

- Node.js 18.x or later
- MongoDB instance (local or cloud)

## Getting Started

### Quick Start

#### For Windows Users:
```bash
scripts\start.bat
```

#### For Mac/Linux Users:
```bash
chmod +x scripts/start.sh
./scripts/start.sh
```

### Manual Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/web-as-a-service.git
cd web-as-a-service
```

2. Install dependencies:
```bash
npm install
```

3. Set up MongoDB connection:
```bash
npm run setup
```
This will prompt you to enter your MongoDB connection string. If you don't have one, it will use the default local connection.

4. Set up AWS S3 and CloudFront for the S3 hosting feature:
   - Create an S3 bucket with public read access
   - Set up CloudFront distribution pointing to your S3 bucket
   - Add your AWS credentials and CloudFront configuration to a `.env.local` file:
   ```
   # AWS S3 Configuration (for file uploads and management)
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_REGION=your_aws_region
   AWS_S3_BUCKET_NAME=your_bucket_name
   S3_BASE_URL=https://dt-web-sites.s3.ap-south-1.amazonaws.com
   
   # CloudFront Configuration (for website serving to users)
   CLOUDFRONT_DOMAIN=your-cloudfront-distribution-domain.cloudfront.net
   CLOUDFRONT_BASE_URL=https://your-cloudfront-distribution-domain.cloudfront.net
   
   # Frontend Environment Variables (for client-side components)
   NEXT_PUBLIC_S3_BASE_URL=https://dt-web-sites.s3.ap-south-1.amazonaws.com
   NEXT_PUBLIC_CLOUDFRONT_BASE_URL=https://your-cloudfront-distribution-domain.cloudfront.net
   ```

5. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

- `src/app/page.tsx` - Main landing page component
- `src/app/api/contact/route.ts` - API route for contact form submissions
- `src/lib/mongodb.ts` - MongoDB connection utility
- `public/hero-image.svg` - Hero section illustration
- `scripts/` - Helper scripts for setup and running the project

## Customization

- Update the content in `src/app/page.tsx` to match your business
- Modify the color scheme in the Tailwind classes (currently using indigo as the primary color)
- Replace the hero image in `public/hero-image.svg` with your own illustration

## Deployment

This project can be easily deployed to Vercel:

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Add your MongoDB connection string as an environment variable
4. Deploy!

## License

MIT

## Enhanced Image Replacement in Preview Mode

The Website Preview & Editor now includes enhanced image replacement functionality that handles various types of images, including hero images and complex layouts.

### Features

- **Universal Image Detection**: Detects all types of images including hero banners, data URLs, and dynamically loaded images
- **Smart Positioning**: Automatically adjusts overlay positions for different image types
- **High Z-Index Management**: Ensures replace buttons are always visible even with complex CSS layouts
- **Retry Mechanism**: Automatically retries wrapping images that might load after initial page load
- **Responsive Design**: Handles images that change size or position during window resize

### How It Works

When in preview mode (`?preview=true`), the system:

1. **Detects Image Types**:
   - Regular `<img>` elements
   - Hero/banner images (large or full-width)
   - Data URL and blob URL images
   - S3-hosted images in various URL formats

2. **Applies Smart Wrapping**:
   - Adds replace overlays with very high z-index (99999+)
   - Detects and handles complex parent positioning
   - Applies special styling for hero images
   - Uses forced visibility for problematic layouts

3. **Provides Multiple Replace Options**:
   - Upload new image files (replaces file on S3)
   - Use external image URLs (updates HTML files automatically)
   - Automatic HTML file updates across the entire website

### Troubleshooting Missing Replace Buttons

If some images don't show replace buttons:

1. **Check Browser Console**: Look for console logs about image detection
2. **Verify Image Source**: Ensure images have valid `src` attributes
3. **Wait for Retry**: The system automatically retries 3 times over 6 seconds
4. **Check for JavaScript Errors**: Ensure no scripts are blocking the functionality
5. **Hover Carefully**: Some overlays only appear on precise hover over the image

### Supported Image Formats

- **File Uploads**: JPEG, PNG, GIF, WebP (max 10MB)
- **External URLs**: Any valid image URL
- **Data URLs**: Supported for URL replacement
- **Blob URLs**: Supported for URL replacement

### Technical Details

The enhanced system includes:
- Mutation observers for dynamic content
- Image load event listeners for lazy-loaded images
- Window resize handlers for responsive images
- Advanced parent element analysis
- Debounced reprocessing to avoid performance issues
