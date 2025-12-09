# Action Required: Clinic Data Import System

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [ ] **Set ADMIN_EMAIL in .env.local** - Required to get admin access to the import tool. Add your Google OAuth email address.

## During Implementation

- [ ] **Configure Vercel Blob token** - Required for production image storage. Get token from Vercel dashboard → Storage → Blob → Create store → Get read/write token. Set as `BLOB_READ_WRITE_TOKEN` in .env.local.

## After Implementation

- [ ] **Login to assign admin role** - After implementation, login with Google OAuth using the ADMIN_EMAIL address to trigger automatic admin role assignment.

- [ ] **Verify import data in Drizzle Studio** - After running the import, open Drizzle Studio (`pnpm db:studio`) to inspect the imported clinic data and verify data integrity.

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`
