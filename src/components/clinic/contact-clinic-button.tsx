'use client';

import { useState, useEffect } from 'react';
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const threshold = window.innerWidth >= 768 ? 200 : 100;
      setIsVisible(scrollPosition > threshold);
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);

    // Check initial scroll position
    handleScroll();

    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          // Hover
          'hover:scale-105 hover:shadow-xl transition-all duration-300',
          // Focus
          'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
          // Visibility based on scroll - animation only when visible to prevent opacity override
          isVisible ? 'opacity-100 contact-cta-pulse' : 'opacity-0 pointer-events-none'
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
