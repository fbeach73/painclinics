'use client';

import { useState } from 'react';
import { ShieldCheck, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/auth-client';
import { ClaimFormModal } from './claim-form-modal';

interface ClaimListingButtonProps {
  clinicId: string;
  clinicName: string;
  isOwned: boolean;
  isOwnedByCurrentUser: boolean;
  className?: string;
}

export function ClaimListingButton({
  clinicId,
  clinicName,
  isOwned,
  isOwnedByCurrentUser,
  className,
}: ClaimListingButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: session } = useSession();

  // If owned by current user, show "Your Listing" badge
  if (isOwnedByCurrentUser) {
    return (
      <Badge
        variant="default"
        className={cn(
          'gap-1.5 bg-green-600 hover:bg-green-600 text-white',
          className
        )}
      >
        <CheckCircle className="h-3.5 w-3.5" />
        Your Listing
      </Badge>
    );
  }

  // If owned by another user, don't show anything
  if (isOwned) {
    return null;
  }

  // Show claim button
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn('gap-1.5', className)}
        onClick={() => setIsModalOpen(true)}
      >
        <ShieldCheck className="h-4 w-4" />
        Claim This Listing
      </Button>

      <ClaimFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        clinicId={clinicId}
        clinicName={clinicName}
        isLoggedIn={!!session}
      />
    </>
  );
}
