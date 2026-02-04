'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContactClinicModal } from './contact-clinic-modal';

interface ContactClinicButtonProps {
  clinicId: string;
  clinicName: string;
  clinicEmail?: string | null;
  clinicCity: string;
  clinicState: string;
}

export function ContactClinicButton({
  clinicId,
  clinicName,
  clinicCity,
  clinicState,
}: ContactClinicButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className={cn(
          // Position - mobile: center, desktop: right
          'fixed top-4 left-1/2 -translate-x-1/2 z-[9999]',
          'md:top-6 md:right-6 md:left-auto md:translate-x-0',
          // Size
          'px-5 py-2.5 md:px-6 md:py-3',
          // Gradient
          'bg-gradient-to-r from-teal-500 to-blue-600',
          // Text
          'text-white font-semibold text-sm md:text-base',
          // Shape & shadow
          'rounded-full shadow-lg',
          // Animation
          'contact-cta-pulse',
          // Hover
          'hover:scale-105 hover:shadow-xl transition-all duration-300',
          // Focus
          'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2'
        )}
      >
        <span className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
          Contact This Clinic
        </span>
      </button>

      <ContactClinicModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        clinicId={clinicId}
        clinicName={clinicName}
        clinicCity={clinicCity}
        clinicState={clinicState}
      />
    </>
  );
}
