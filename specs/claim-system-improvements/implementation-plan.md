# Implementation Plan: Clinic Claiming System Improvements

## Overview

Four enhancements to the clinic claiming and verification system:
1. Admin email notification on new claim submissions
2. Ability to remove clinic ownership in admin panel
3. Dashboard link in profile menu for clinic_owner users
4. Email branding updates (Painclinics.com in header)

---

## Phase 1: Email Branding Updates

Update email header to display "Painclinics.com" for stronger domain branding.

### Tasks

- [x] Update EmailLayout header text from "Pain Clinics Directory" to "Painclinics.com"

### Technical Details

**File to modify:** `src/emails/components/email-layout.tsx`

**Change location:** Line 33 in `headerStyle` section

```tsx
// Before
<Text style={logoStyle}>Pain Clinics Directory</Text>

// After
<Text style={logoStyle}>Painclinics.com</Text>
```

**Leave unchanged:**
- Line 43: Footer text "Pain Clinics Directory"
- Line 53: Copyright "Pain Clinics Directory"
- Line 57: Footer note text

---

## Phase 2: Admin Email Notification on Claims

Send notification to admins when new clinic claims are submitted.

### Tasks

- [x] Create `claim-pending-admin.tsx` email template
- [x] Add template export to `src/emails/index.ts`
- [x] Add `sendClaimPendingAdminNotificationEmail()` function to `src/lib/email.ts`
- [x] Call admin notification in `POST /api/claims` after successful claim creation

### Technical Details

**New file:** `src/emails/claim-pending-admin.tsx`

```tsx
import * as React from "react";
import { Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { EmailCard } from "./components/email-card";

export interface ClaimPendingAdminProps {
  clinicName: string;
  claimantName: string;
  claimantEmail: string;
  claimantRole: string;
  submittedAt: string;
}

export function ClaimPendingAdminEmail({
  clinicName,
  claimantName,
  claimantEmail,
  claimantRole,
  submittedAt,
}: ClaimPendingAdminProps) {
  // Template implementation
}

export async function renderClaimPendingAdminEmail(
  props: ClaimPendingAdminProps
): Promise<string> {
  const { render } = await import("@react-email/render");
  return render(<ClaimPendingAdminEmail {...props} />);
}
```

**Update `src/emails/index.ts`:**
- Add `CLAIM_PENDING_ADMIN: "claim-pending-admin"` to `EMAIL_TEMPLATES`
- Export `renderClaimPendingAdminEmail` and `ClaimPendingAdminProps`

**New function in `src/lib/email.ts`:**

```typescript
export async function sendClaimPendingAdminNotificationEmail(
  clinicName: string,
  claimantName: string,
  claimantEmail: string,
  claimantRole: string,
  options?: {
    clinicId?: string;
    claimId?: string;
  }
): Promise<SendEmailResult> {
  const subject = `New Claim Pending Review - ${clinicName}`;
  // Send to ADMIN_EMAILS array
  // Use EMAIL_TEMPLATES.CLAIM_PENDING_ADMIN
}
```

**Update `src/app/api/claims/route.ts`:**
- Import `sendClaimPendingAdminNotificationEmail`
- After line ~85 where claim is created and user email sent, add admin notification call
- Pass: clinicName, user fullName, user businessEmail, user role, clinicId, claimId

---

## Phase 3: Dashboard Link for Clinic Owners

Add "My Clinics" link in profile dropdown for users with `clinic_owner` role.

### Tasks

- [x] Create `GET /api/user/role` endpoint to return authenticated user's role (used existing `/api/user/me` endpoint)
- [x] Update `UserProfile` component to check for clinic_owner role
- [x] Add "My Clinics" menu item for clinic_owner and admin users

### Technical Details

**New file:** `src/app/api/user/role/route.ts`

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { role: true },
  });

  return NextResponse.json({ role: dbUser?.role ?? "user" });
}
```

**Update `src/components/auth/user-profile.tsx`:**

```typescript
// Add import
import { Building2 } from "lucide-react";

// Add state
const [isClinicOwner, setIsClinicOwner] = useState(false);

// Add to useEffect (can combine with admin check)
useEffect(() => {
  if (session?.user?.id) {
    fetch("/api/user/role")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        setIsAdmin(data?.role === "admin");
        setIsClinicOwner(data?.role === "clinic_owner" || data?.role === "admin");
      })
      .catch(() => {
        setIsAdmin(false);
        setIsClinicOwner(false);
      });
  }
}, [session?.user?.id]);

// Add menu item after "Your Profile" (line ~87)
{isClinicOwner && (
  <DropdownMenuItem asChild>
    <Link href="/my-clinics" className="flex items-center">
      <Building2 className="mr-2 h-4 w-4" />
      My Clinics
    </Link>
  </DropdownMenuItem>
)}
```

---

## Phase 4: Admin Clinic Ownership Management

Allow admins to remove user ownership from clinics.

### Tasks

- [x] Add `removeClinicOwnership()` function to `src/lib/clinic-queries.ts`
- [x] Create `DELETE /api/admin/clinics/[clinicId]/ownership` endpoint
- [x] Add ownership section to `ClinicDetailsTab` component [complex]
  - [x] Fetch current owner info for display
  - [x] Display owner details or "Unclaimed" badge
  - [x] Add "Remove Ownership" button with confirmation dialog

### Technical Details

**Update `src/lib/clinic-queries.ts`:**

```typescript
export async function removeClinicOwnership(clinicId: string) {
  return db
    .update(clinics)
    .set({
      ownerUserId: null,
      isVerified: false,
      claimedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(clinics.id, clinicId))
    .returning();
}
```

**New file:** `src/app/api/admin/clinics/[clinicId]/ownership/route.ts`

```typescript
import { NextResponse } from "next/server";
import { checkAdminApi } from "@/lib/admin-auth";
import { removeClinicOwnership } from "@/lib/clinic-queries";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  const { clinicId } = await params;

  try {
    await removeClinicOwnership(clinicId);
    console.log(`[Admin] Ownership removed from clinic ${clinicId} by admin ${adminCheck.user.id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing ownership:", error);
    return NextResponse.json(
      { error: "Failed to remove ownership" },
      { status: 500 }
    );
  }
}
```

**Update `src/components/admin/clinics/clinic-details-tab.tsx`:**

Need to add:
1. Props for owner data (ownerUserId, isVerified, claimedAt, ownerName, ownerEmail)
2. "Ownership" section at top of form with:
   - Current owner display (avatar, name, email) OR "Unclaimed" badge
   - Verification status badge
   - Claimed date if applicable
   - "Remove Ownership" button (only if owned)
3. Confirmation dialog for remove action
4. API call handler for removal
5. Refresh page after successful removal

**Update parent page** `src/app/admin/clinics/[clinicId]/page.tsx`:
- Fetch owner info when clinic has `ownerUserId`
- Pass owner data to `ClinicDetailsTab`

**Database fields used:**
- `clinics.ownerUserId` - FK to user table
- `clinics.isVerified` - boolean
- `clinics.claimedAt` - timestamp

---

## Execution Order

1. **Phase 1** - Email branding (simple, no dependencies)
2. **Phase 2** - Admin notification (uses updated branding)
3. **Phase 3** - Profile menu (independent)
4. **Phase 4** - Ownership management (most complex)

## Verification

After each phase:
```bash
pnpm lint && pnpm typecheck
```

Manual testing:
- Phase 1: Preview any email template
- Phase 2: Submit test claim, verify admin receives email
- Phase 3: Log in as clinic_owner, verify menu shows "My Clinics"
- Phase 4: Use admin panel to remove ownership from test clinic
