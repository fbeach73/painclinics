'use client';

import Link from 'next/link';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';

interface ClinicEditButtonProps {
  clinicId: string;
  ownerUserId: string | null;
}

/**
 * Client-side edit button that only shows for admins or clinic owners.
 * Handles auth check client-side to avoid static/dynamic conflicts.
 */
export function ClinicEditButton({ clinicId, ownerUserId }: ClinicEditButtonProps) {
  const { user, isLoading } = useCurrentUser();

  // Don't render anything while loading or if no user
  if (isLoading || !user) {
    return null;
  }

  const isAdmin = user.role === 'admin';
  const isClinicOwner = !!(user.id && ownerUserId === user.id);
  const canEdit = isAdmin || isClinicOwner;

  if (!canEdit) {
    return null;
  }

  // Determine the edit URL based on role
  const editUrl = isAdmin
    ? `/admin/clinics/${clinicId}`
    : `/my-clinics/${clinicId}/edit`;

  return (
    <div className="mb-6 flex justify-end">
      <Button asChild variant="outline" size="sm">
        <Link href={editUrl}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Listing
        </Link>
      </Button>
    </div>
  );
}
