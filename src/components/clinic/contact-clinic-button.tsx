'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactClinicModal } from './contact-clinic-modal';

interface ContactClinicButtonProps {
  clinicId: string;
  clinicName: string;
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
      <Button variant="outline" className="w-full" onClick={() => setModalOpen(true)}>
        <MessageCircle className="h-4 w-4 mr-2" />
        Contact This Clinic
      </Button>

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
