# Environment Setup Guide

This guide will help you set up the required environment variables for the Web as a Service application.

## Required Environment Variables

Create a `.env.local` file in the root directory of your project with the following variables:

### NextAuth Configuration
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here
```

### MongoDB Configuration
```env
MONGODB_URI=mongodb://localhost:27017/web-as-a-service
```

### Razorpay Configuration (Required for billing features)
```env
RAZORPAY_KEY_ID=rzp_test_1234567890
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_1234567890
```

### Development Settings
```env
NODE_ENV=development
DEBUG=true
```

## How to Get Razorpay Credentials

1. **Sign up for Razorpay**: Go to [Razorpay Dashboard](https://dashboard.razorpay.com/) and create an account
2. **Get API Keys**: 
   - Go to Settings → API Keys
   - Generate Test API Keys for development
   - Copy the Key ID and Key Secret
3. **Setup Webhooks**:
   - Go to Settings → Webhooks
   - Add webhook URL: `https://your-domain.com/api/webhooks/razorpay`
   - Copy the webhook secret
   - Enable subscription-related events

## Test Mode vs Live Mode

### Test Mode (Development)
- Use test API keys that start with `rzp_test_`
- Use test UPI IDs for testing:
  - Success: `success@razorpay`
  - Failure: `failure@razorpay`

### Live Mode (Production)
- Use live API keys that start with `rzp_live_`
- Ensure your domain is SSL enabled
- Set up proper webhook endpoints
- Test thoroughly before going live

## Environment File Template

Create `.env.local` with this template:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-strong-secret-key-32-chars-min

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/web-as-a-service

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_KEY_SECRET_HERE
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE

# Development Settings
NODE_ENV=development
DEBUG=true
```

## Verification

After setting up the environment variables:

1. Restart your development server
2. Navigate to `/billing` to test the Razorpay integration
3. Check the console for any configuration errors
4. Run the test script: `node scripts/test-razorpay-integration.js`

## Security Notes

- Never commit `.env.local` to version control
- Use different credentials for development and production
- Rotate secrets regularly
- Use HTTPS in production for webhook endpoints
- Keep webhook secrets secure and never expose them in client-side code

## Troubleshooting

### "Razorpay credentials not configured" Error
- Ensure all required Razorpay environment variables are set
- Check that variable names match exactly (case-sensitive)
- Restart your development server after adding variables

### Webhook Issues
- Ensure webhook URL is accessible from the internet
- Check webhook signature verification
- Monitor webhook logs in Razorpay dashboard
- Ensure webhook secret matches the one in your environment

### Database Connection Issues
- Ensure MongoDB is running
- Check the MONGODB_URI format
- Verify database permissions 