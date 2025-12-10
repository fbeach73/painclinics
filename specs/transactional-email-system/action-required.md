# Action Required: Transactional Email System

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [ ] **Add MAILGUN_WEBHOOK_SIGNING_KEY to .env.local** - Required for webhook signature verification. Get this from Mailgun dashboard: Sending > Webhooks > Webhook Signing Key

## During Implementation

- [ ] **Configure Mailgun webhooks in dashboard** - Set webhook URL to `https://painclinics.com/api/webhooks/mailgun` and enable events: delivered, opened, clicked, bounced, complained, failed

## After Implementation

- [ ] **Update COMPANY_ADDRESS environment variable** - Replace placeholder with actual physical mailing address for CAN-SPAM compliance in email footer

- [ ] **Test email delivery in production** - Send test emails and verify they appear in Mailgun logs and database

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`
