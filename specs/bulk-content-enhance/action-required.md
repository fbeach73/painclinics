# Action Required: Bulk Content Enhancement

Manual steps that must be completed by a human. These cannot be automated.

## Before Using

- [x] **Ensure OpenRouter API key is configured** - Required for AI content generation
  - Environment variable: `OPENROUTER_API_KEY`
  - Get key from: https://openrouter.ai/settings/keys

## After Implementation

- [x] **Verify old Content Optimization removed** - Confirm `/admin/optimize` returns 404
- [x] **Test bulk selection** - Select multiple clinics in admin table
- [x] **Test enhancement modal** - Run bulk enhance on 2-3 test clinics
- [x] **Verify content saved** - Check `newPostContent` field populated in database
- [ ] **Review generated content quality** - Spot-check enhanced descriptions on public clinic pages

## Cleanup (Optional)

- [ ] **Delete old spec folder** - Remove `specs/content-optimization/` if no longer needed for reference
- [ ] **Remove unused AI utilities** - Check if `src/lib/ai/` folder has orphaned files from old system

---

## Environment Variables Required

```env
# OpenRouter (required for AI content generation)
OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_MODEL=openai/gpt-4o-mini  # Optional, defaults to gpt-4o-mini
```

---

## Notes

- The bulk enhancement reuses the existing single-clinic enhance API
- No new environment variables were added for this feature
- Rate limiting is handled client-side with 500ms delays between requests
- Clinics with existing enhanced content are automatically skipped

---

> **Note:** This feature replaces the complex Content Optimization system. See `implementation-plan.md` for comparison table.
