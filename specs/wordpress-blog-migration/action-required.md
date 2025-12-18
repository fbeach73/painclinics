# Action Required: WordPress Blog Migration

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [ ] **Verify WordPress REST API access** - Confirm `https://painclinics.com/wp-json/wp/v2/posts` is accessible without authentication
- [ ] **Check sitemap availability** - Verify `post-sitemap1.xml` and `post-sitemap2.xml` exist at painclinics.com

## During Implementation

None required - all implementation steps can be automated.

## After Implementation

- [ ] **Add redirects to next.config.ts** - Copy the generated redirect config from the migration results to `next.config.ts` redirects array (preserves SEO from old URLs)
- [ ] **Deploy to production** - Deploy the Next.js app with the new blog pages and redirects
- [ ] **Verify redirects work** - Test a few old WordPress URLs to confirm they 301 redirect to the new blog URLs
- [ ] **Monitor for 404s** - Check analytics/logs after launch for any missed URLs
- [ ] **Shut down WordPress blog** - Once verified, disable the WordPress blog (keep clinic data if needed)

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`
