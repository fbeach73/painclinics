# Action Required: Blog Automation Webhook

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [ ] **Generate webhook secret** - Run `openssl rand -hex 32` to create a secure 32-character secret

## During Implementation

- [ ] **Add secret to `.env.local`** - Set `BLOG_WEBHOOK_SECRET=<your-generated-secret>`
- [ ] **Add secret to Vercel** - Add `BLOG_WEBHOOK_SECRET` to production environment variables

## After Implementation

- [ ] **Configure ZimmWriter** - Set webhook URL to `https://your-domain.com/api/webhooks/blog` with `X-Webhook-Secret` header
- [ ] **Test webhook** - Send a test post from ZimmWriter and verify it appears as draft in admin

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`
