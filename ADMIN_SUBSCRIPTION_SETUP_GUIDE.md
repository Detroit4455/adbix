# Admin Subscription Setup Guide

This comprehensive guide will help you as an administrator set up the UPI Autopay subscription system for your Web as a Service platform.

## 🎯 Overview

The subscription system enables:
- **UPI Autopay** for automatic recurring payments
- **Flexible billing plans** with add-ons
- **Real-time payment tracking** via webhooks
- **Customer subscription management**
- **Revenue analytics** and reporting

## ✅ Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Admin access** to your Web as a Service platform
- [ ] **Razorpay account** (business account recommended)
- [ ] **Bank account** linked to Razorpay
- [ ] **Domain with SSL** (required for production webhooks)
- [ ] **MongoDB access** for subscription data
- [ ] **Development environment** for testing

## 📋 Step-by-Step Setup Process

### Phase 1: Razorpay Account Setup

#### Checkpoint 1.1: Create Razorpay Account
- [ ] Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
- [ ] Complete business verification process
- [ ] Upload required documents (PAN, GST, Bank details)
- [ ] Wait for account approval (1-2 business days)

#### Checkpoint 1.2: Get API Credentials
- [ ] Login to Razorpay Dashboard
- [ ] Navigate to **Settings → API Keys**
- [ ] Generate **Test API Keys** for development
  - [ ] Copy `Key ID` (starts with `rzp_test_`)
  - [ ] Copy `Key Secret` (keep this secure)
- [ ] Generate **Live API Keys** for production (after testing)

#### Checkpoint 1.3: Enable UPI Autopay
- [ ] Go to **Products → Recurring Payments**
- [ ] Enable **UPI Autopay** feature
- [ ] Set up **authorization limits** (per transaction/daily/monthly)
- [ ] Configure **retry settings** for failed payments

### Phase 2: Environment Configuration

#### Checkpoint 2.1: Configure Environment Variables
Create `.env.local` file with these variables:

```env
# Razorpay Configuration (Test Mode)
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_KEY_SECRET_HERE
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE

# Database
MONGODB_URI=mongodb://localhost:27017/web-as-a-service

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-minimum-32-characters

# Application Settings
NODE_ENV=development
DEBUG=true
```

#### Checkpoint 2.2: Verify Configuration
- [ ] Restart your development server: `npm run dev`
- [ ] Navigate to `/billing` page
- [ ] Confirm no "Payment service not configured" errors
- [ ] Check browser console for any Razorpay initialization errors

### Phase 3: Billing Plans Setup

#### Checkpoint 3.1: Access Admin Panel
- [ ] Login with admin credentials
- [ ] Navigate to `/admin/billing` page
- [ ] Verify admin access permissions

#### Checkpoint 3.2: Create Billing Plans
- [ ] **Basic Plan Setup:**
  ```
  Plan ID: basic
  Name: Basic Plan
  Price: ₹999/month
  Features: Basic website hosting, 5GB storage, Email support
  ```

- [ ] **Pro Plan Setup:**
  ```
  Plan ID: pro  
  Name: Pro Plan
  Price: ₹1999/month
  Features: Advanced hosting, 25GB storage, Priority support, Analytics
  ```

- [ ] **Enterprise Plan Setup:**
  ```
  Plan ID: enterprise
  Name: Enterprise Plan
  Price: ₹4999/month
  Features: Unlimited hosting, 100GB storage, 24/7 phone support, Custom domains
  ```

#### Checkpoint 3.3: Create Add-ons
- [ ] **Additional Storage:**
  ```
  Addon ID: extra-storage-10gb
  Name: Extra Storage (10GB)
  Price: ₹299/month
  Category: storage
  ```

- [ ] **Priority Support:**
  ```
  Addon ID: priority-support
  Name: Priority Support
  Price: ₹499/month
  Category: support
  ```

### Phase 4: Razorpay Plans Configuration

#### Checkpoint 4.1: Create Plans in Razorpay Dashboard
For each billing plan, create corresponding Razorpay plan:

- [ ] Go to **Subscriptions → Plans** in Razorpay Dashboard
- [ ] Click **Create Plan**
- [ ] Configure plan details:
  ```
  Plan Name: Basic Plan
  Billing Cycle: Monthly
  Amount: ₹999 (in paise: 99900)
  Max Retry Count: 3
  Notes: Plan for basic website hosting
  ```

#### Checkpoint 4.2: Link Razorpay Plan IDs
- [ ] Copy the `plan_xxxxx` ID from Razorpay
- [ ] Update your database plans with `razorpayPlanId` field
- [ ] Test plan creation via API: `POST /api/billing/plans`

### Phase 5: Webhook Configuration

#### Checkpoint 5.1: Setup Webhook Endpoint
- [ ] **Development:** Use ngrok for local testing
  ```bash
  ngrok http 3000
  # Copy the HTTPS URL: https://abc123.ngrok.io
  ```

- [ ] **Production:** Use your domain with SSL
  ```
  Webhook URL: https://yourdomain.com/api/webhooks/razorpay
  ```

#### Checkpoint 5.2: Configure Webhooks in Razorpay
- [ ] Go to **Settings → Webhooks** in Razorpay Dashboard
- [ ] Click **Add Webhook**
- [ ] Enter webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
- [ ] Select these events:
  - [ ] `subscription.activated`
  - [ ] `subscription.charged`
  - [ ] `subscription.completed`
  - [ ] `subscription.cancelled`
  - [ ] `subscription.paused`
  - [ ] `subscription.resumed`
  - [ ] `subscription.authenticated`
  - [ ] `payment.failed`

#### Checkpoint 5.3: Test Webhook
- [ ] Generate webhook secret and add to environment variables
- [ ] Test webhook signature verification
- [ ] Monitor webhook logs in Razorpay dashboard

### Phase 6: Testing & Validation

#### Checkpoint 6.1: Test Subscription Flow
- [ ] Create test customer account
- [ ] Navigate to `/billing` page
- [ ] Select a plan and add-ons
- [ ] Test UPI Autopay signup with test UPI ID: `success@razorpay`
- [ ] Verify subscription creation in database
- [ ] Check subscription status updates via webhooks

#### Checkpoint 6.2: Test Payment Scenarios
- [ ] **Successful payment:** Use `success@razorpay`
- [ ] **Failed payment:** Use `failure@razorpay`
- [ ] **Subscription pause/resume:** Test via admin panel
- [ ] **Subscription cancellation:** Test cancellation flow

#### Checkpoint 6.3: Validate Data Integrity
- [ ] Check subscription records in MongoDB
- [ ] Verify webhook event logging
- [ ] Test subscription status synchronization
- [ ] Validate customer notification emails

### Phase 7: Production Deployment

#### Checkpoint 7.1: Switch to Live Mode
- [ ] Generate **Live API Keys** in Razorpay Dashboard
- [ ] Update environment variables with live credentials:
  ```env
  RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
  RAZORPAY_KEY_SECRET=YOUR_LIVE_KEY_SECRET
  NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
  ```

#### Checkpoint 7.2: Production Webhooks
- [ ] Update webhook URL to production domain
- [ ] Ensure SSL certificate is valid
- [ ] Test webhook delivery in production
- [ ] Monitor webhook success rate

#### Checkpoint 7.3: Go-Live Checklist
- [ ] **Legal compliance** - Terms of service updated
- [ ] **Customer communication** - Billing emails configured
- [ ] **Support processes** - Handle payment issues
- [ ] **Monitoring setup** - Payment success/failure alerts
- [ ] **Backup plans** - Manual payment processing fallback

## 🔧 Admin Management Tasks

### Daily Tasks
- [ ] Monitor payment success rates
- [ ] Check failed payment notifications
- [ ] Review new subscriptions
- [ ] Handle customer support tickets

### Weekly Tasks
- [ ] Analyze subscription metrics
- [ ] Review webhook delivery logs
- [ ] Update pricing if needed
- [ ] Generate revenue reports

### Monthly Tasks
- [ ] Reconcile Razorpay settlements
- [ ] Update billing plans based on analytics
- [ ] Review and optimize failed payment retry logic
- [ ] Compliance and audit checks

## 🚨 Troubleshooting Common Issues

### Issue 1: "Payment service not configured"
**Solution:**
- Verify all environment variables are set
- Restart development server
- Check Razorpay credential validity

### Issue 2: Webhook signature verification failed
**Solution:**
- Ensure webhook secret matches environment variable
- Check request timestamp tolerance
- Verify webhook payload integrity

### Issue 3: UPI Autopay mandate creation fails
**Solution:**
- Verify customer UPI ID format
- Check Razorpay account UPI Autopay enablement
- Ensure proper authorization limits

### Issue 4: Subscription status not updating
**Solution:**
- Check webhook endpoint accessibility
- Verify webhook event processing logic
- Monitor webhook delivery in Razorpay dashboard

## 📊 Success Metrics

Track these KPIs to measure subscription system success:

- **Subscription Conversion Rate:** % of visitors who subscribe
- **Payment Success Rate:** % of successful recurring payments
- **Churn Rate:** % of customers who cancel subscriptions
- **Revenue Growth:** Monthly recurring revenue (MRR) trends
- **Customer Support Tickets:** Payment-related issues
- **Webhook Delivery Success:** % of successful webhook deliveries

## 🔐 Security Best Practices

### API Security
- [ ] Never expose API secrets in client-side code
- [ ] Use HTTPS for all webhook endpoints
- [ ] Implement proper webhook signature verification
- [ ] Rotate API keys periodically

### Data Protection
- [ ] Encrypt sensitive customer data
- [ ] Implement proper access controls
- [ ] Regular security audits
- [ ] Comply with PCI DSS guidelines

## 📞 Support & Resources

### Documentation
- [Razorpay Subscriptions API](https://razorpay.com/docs/subscriptions/)
- [UPI Autopay Integration](https://razorpay.com/docs/payments/upi-autopay/)
- [Webhook Implementation](https://razorpay.com/docs/webhooks/)

### Support Channels
- **Razorpay Support:** support@razorpay.com
- **Technical Issues:** Check logs in `/api/subscriptions`
- **Business Queries:** Razorpay business dashboard

---

## ✅ Final Verification Checklist

Before going live, ensure ALL checkpoints are completed:

### Technical Setup
- [ ] Razorpay account verified and approved
- [ ] API credentials configured correctly
- [ ] UPI Autopay feature enabled
- [ ] Billing plans created in system
- [ ] Razorpay plans linked properly
- [ ] Webhooks configured and tested
- [ ] Payment flows tested thoroughly
- [ ] Production environment ready

### Business Setup
- [ ] Pricing strategy finalized
- [ ] Terms of service updated
- [ ] Customer support processes ready
- [ ] Billing notifications configured
- [ ] Revenue tracking setup
- [ ] Compliance requirements met

### Monitoring & Maintenance
- [ ] Payment success monitoring enabled
- [ ] Failed payment alerts configured
- [ ] Webhook delivery monitoring setup
- [ ] Customer support ticket system ready
- [ ] Regular reconciliation process defined

**🎉 Congratulations! Your subscription system is ready for production.** 