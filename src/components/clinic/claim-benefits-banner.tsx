'use client';

import { useState } from 'react';
import { ShieldCheck, Edit, BarChart3, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { ClaimFormModal } from './claim-form-modal';

interface ClaimBenefitsBannerProps {
  clinicId: string;
  clinicName: string;
  className?: string;
}

const benefits = [
  {
    icon: Edit,
    title: 'Update Information',
    description: 'Keep your clinic details accurate and up-to-date',
  },
  {
    icon: Star,
    title: 'Boost Visibility',
    description: 'Get verified badge and featured placement options',
  },
  {
    icon: BarChart3,
    title: 'Access Analytics',
    description: 'See how patients find and engage with your listing',
  },
];

export function ClaimBenefitsBanner({
  clinicId,
  clinicName,
  className,
}: ClaimBenefitsBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { data: session } = useSession();

  if (isDismissed) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          'relative rounded-lg border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6',
          className
        )}
      >
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Is this your clinic?</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 shrink-0">
                    <benefit.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{benefit.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0">
            <Button
              size="lg"
              onClick={() => setIsModalOpen(true)}
              className="w-full lg:w-auto"
            >
              <ShieldCheck className="h-4 w-4" />
              Claim This Listing
            </Button>
          </div>
        </div>
      </div>

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
