# Action Required: Content Optimization & AI Enhancement System

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [x] **Configure OPENROUTER_API_KEY** - Required for AI model access via OpenRouter
  - Get API key from https://openrouter.ai/settings/keys
  - Add to `.env.local`: `OPENROUTER_API_KEY=sk-or-v1-...`

- [x] **Ensure admin role is configured** - Required to access optimization admin pages
  - Verify `ADMIN_EMAIL` is set in `.env.local`
  - Login to trigger auto-promotion to admin role

## During Implementation

No additional manual steps required during implementation - all phases are complete.

## After Implementation

- [ ] **Review sample batch results** - Verify AI output quality before full processing
  - Run a small test batch (10-20 clinics)
  - Review optimized content for accuracy
  - Check that critical elements (names, addresses, phones) are preserved

- [ ] **Monitor API costs** - Track OpenRouter usage during batch processing
  - Check OpenRouter dashboard for usage: https://openrouter.ai/usage
  - Estimated cost: ~$82.50 for all 5500 clinics

- [ ] **Backup database before full processing** - Safety measure for rollback
  - Export current `clinics.content` data before applying changes
  - The system stores original content in `content_versions` table, but external backup is recommended

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`
