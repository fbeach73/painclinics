# Action Required: Clinic Claiming & Paid Featured Listings

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [ ] **Set up Mailgun account** - Required for sending claim/payment notification emails
- [ ] **Verify domain in Mailgun** - Configure painclinics.com domain for email sending
- [ ] **Get Mailgun API key** - Add to environment as `MAILGUN_API_KEY`

## During Implementation

- [ ] **Create Polar products** - Set up in Polar dashboard:
  - Basic Featured Listing: $99/month, $990/year
  - Premium Featured Listing: $199/month, $1990/year
- [ ] **Get Polar product IDs** - Add to environment as `POLAR_BASIC_PRODUCT_ID` and `POLAR_PREMIUM_PRODUCT_ID`
- [ ] **Configure Polar webhook endpoint** - Set webhook URL to `https://painclinics.com/api/auth/polar/webhooks` in Polar dashboard

## After Implementation

- [ ] **Test Polar checkout in sandbox** - Verify payment flow works before going live
- [ ] **Switch Polar to production** - Change server from 'sandbox' to 'production' when ready
- [ ] **Monitor first claims** - Review initial claim submissions to tune approval process

---

## Environment Variables to Add

```env
# Mailgun (required for emails)
MAILGUN_API_KEY=xxx
MAILGUN_DOMAIN=painclinics.com

# Polar Products (create in Polar dashboard first)
POLAR_BASIC_PRODUCT_ID=xxx
POLAR_PREMIUM_PRODUCT_ID=xxx
```

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`
