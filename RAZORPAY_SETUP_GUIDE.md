# Razorpay UPI Autopay Integration Setup Guide

This guide will help you set up Razorpay UPI Autopay for automatic recurring payments in your Web as a Service application.

## Prerequisites

1. **Razorpay Account**: Sign up at [https://dashboard.razorpay.com/signup](https://dashboard.razorpay.com/signup)
2. **UPI Autopay Enabled**: Request UPI Autopay feature activation from Razorpay support
3. **Business Verification**: Complete KYC and business verification on Razorpay

## Step 1: Environment Variables Setup

Add the following environment variables to your `.env.local` file:

```env
# Razorpay Configuration (Required for UPI Autopay)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### Getting Your Razorpay Credentials

1. **API Keys**:
   - Go to [Razorpay Dashboard](https://dashboard.razorpay.com/) → Settings → API Keys
   - Generate new API Keys or use existing ones
   - Copy the `Key ID` and `Key Secret`

2. **Webhook Secret**:
   - Go to Settings → Webhooks
   - Create a new webhook endpoint: `https://yourdomain.com/api/webhooks/razorpay`
   - Copy the webhook secret

## Step 2: Razorpay Dashboard Configuration

### 2.1 Enable UPI Autopay

1. Contact Razorpay support to enable UPI Autopay for your account
2. Provide business documentation and use case details
3. Wait for approval (usually 2-3 business days)

### 2.2 Create Webhook Endpoint

1. Navigate to Settings → Webhooks
2. Click "Create New Webhook"
3. Configure the webhook:
   - **URL**: `https://yourdomain.com/api/webhooks/razorpay`
   - **Events**: Select all subscription and payment events:
     - `subscription.activated`
     - `subscription.charged`
     - `subscription.completed`
     - `subscription.cancelled`
     - `subscription.paused`
     - `subscription.resumed`
     - `subscription.authenticated`
     - `subscription.pending`
     - `subscription.halted`
     - `payment.failed`
4. Save the webhook and copy the webhook secret

### 2.3 Create Plans (via Admin Panel or API)

Option 1: Use the Admin Panel
1. Go to `https://yourdomain.com/admin/billing`
2. Create plans with the following details:
   - Plan ID, Name, Description
   - Price (in rupees)
   - Billing cycle (monthly/yearly)
   - Features list
   - **Important**: Add Razorpay Plan ID after creating the plan in Razorpay

Option 2: Create plans directly in Razorpay Dashboard
1. Go to Products → Plans
2. Create new plans and copy the Plan IDs
3. Update your database plans with the Razorpay Plan IDs

## Step 3: Database Setup

### 3.1 Seed Initial Data

Run the seeding script to populate initial plans and add-ons:

```bash
node scripts/seed-billing-data.js
```

### 3.2 Update Plans with Razorpay Plan IDs

After creating plans in Razorpay, update your database:

1. Go to Admin Panel → Plan & Add-on Manager
2. Edit each plan and add the corresponding Razorpay Plan ID
3. Save the changes

## Step 4: UPI Autopay Flow

### 4.1 Customer Journey

1. **Plan Selection**: Customer selects a plan and add-ons
2. **Customer Info**: Customer provides name, email, and phone number
3. **UPI Autopay Setup**: Customer is redirected to Razorpay checkout
4. **Mandate Creation**: Customer approves UPI Autopay mandate
5. **Automatic Billing**: Subsequent payments are automatically deducted

### 4.2 Subscription States

- **Created**: Subscription created, waiting for authentication
- **Authenticated**: UPI Autopay mandate approved
- **Active**: Subscription is active and being billed
- **Paused**: Subscription temporarily paused
- **Cancelled**: Subscription cancelled
- **Completed**: Subscription completed (all cycles done)
- **Expired**: Subscription expired

## Step 5: Testing

### 5.1 Test Mode

1. Use test API keys during development
2. Use test UPI IDs for testing:
   - `success@razorpay` - Always succeeds
   - `failure@razorpay` - Always fails

### 5.2 Test Subscription Flow

1. Create a test subscription
2. Use Razorpay test UPI ID
3. Verify webhook events are received
4. Check database updates

### 5.3 Test Webhook Events

Use Razorpay's webhook testing tool:
1. Go to Dashboard → Webhooks
2. Select your webhook
3. Use "Test Webhook" to simulate events

## Step 6: Production Deployment

### 6.1 Switch to Live Mode

1. Replace test API keys with live keys
2. Update webhook URL to production domain
3. Ensure SSL certificate is valid

### 6.2 Compliance Requirements

1. **Terms of Service**: Include UPI Autopay terms
2. **Privacy Policy**: Update for payment data handling
3. **Cancellation Policy**: Clear cancellation terms
4. **Customer Support**: Provide support for payment issues

## Step 7: Monitoring and Maintenance

### 7.1 Monitor Webhook Events

- Set up logging for webhook events
- Monitor failed webhook deliveries
- Set up alerts for payment failures

### 7.2 Handle Failed Payments

- Implement retry logic for failed payments
- Send notifications to customers
- Pause/cancel subscriptions after multiple failures

### 7.3 Customer Communication

- Send email notifications for:
  - Successful mandate creation
  - Payment confirmations
  - Payment failures
  - Subscription changes

## API Endpoints Reference

### Subscription Management

- `POST /api/subscriptions` - Create new subscription
- `GET /api/subscriptions` - Get user subscriptions
- `GET /api/subscriptions/[id]` - Get specific subscription
- `PUT /api/subscriptions/[id]` - Update subscription (cancel/pause/resume)
- `DELETE /api/subscriptions/[id]` - Cancel subscription

### Webhook Handler

- `POST /api/webhooks/razorpay` - Handle Razorpay webhooks

### Billing Data

- `GET /api/billing/plans` - Get active plans
- `GET /api/billing/addons` - Get active add-ons
- `GET /api/admin/billing/plans` - Get all plans (admin only)
- `GET /api/admin/billing/addons` - Get all add-ons (admin only)

## Troubleshooting

### Common Issues

1. **Webhook not received**:
   - Check webhook URL is accessible
   - Verify SSL certificate
   - Check firewall settings

2. **Payment failures**:
   - Verify UPI ID is correct
   - Check bank account balance
   - Ensure UPI app is active

3. **Authentication errors**:
   - Verify API keys are correct
   - Check environment variables
   - Ensure keys match the environment (test/live)

### Support Contacts

- **Razorpay Support**: support@razorpay.com
- **UPI Issues**: Contact customer's bank
- **Technical Issues**: Check Razorpay documentation

## Security Considerations

1. **API Keys**: Never expose secret keys in frontend code
2. **Webhook Verification**: Always verify webhook signatures
3. **SSL/TLS**: Use HTTPS for all webhook endpoints
4. **Data Protection**: Encrypt sensitive customer data
5. **Access Control**: Restrict admin panel access

## Additional Resources

- [Razorpay UPI Autopay Documentation](https://razorpay.com/docs/payments/upi-autopay/)
- [Subscription API Reference](https://razorpay.com/docs/api/subscriptions/)
- [Webhook Events Reference](https://razorpay.com/docs/webhooks/events/)
- [UPI Autopay Guidelines](https://razorpay.com/docs/payments/upi-autopay/guidelines/)

---

**Note**: This integration handles real money transactions. Test thoroughly before going live and ensure compliance with all applicable regulations. 