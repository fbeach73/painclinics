import { notFound } from 'next/navigation';
import { ClinicAbout } from '@/components/clinic/clinic-about';
import { ClinicGallery } from '@/components/clinic/clinic-gallery';
import { ClinicHeader } from '@/components/clinic/clinic-header';
import { ClinicHours } from '@/components/clinic/clinic-hours';
import { ClinicInsurance } from '@/components/clinic/clinic-insurance';
import { ClinicServices } from '@/components/clinic/clinic-services';
import { EmbeddedMap } from '@/components/map/embedded-map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getClinicBySlug } from '@/data/mock-clinics';

interface ClinicDetailPageProps {
  params: Promise<{
    clinicId: string;
  }>;
}

export default async function ClinicDetailPage({ params }: ClinicDetailPageProps) {
  const { clinicId } = await params;
  const clinic = getClinicBySlug(clinicId);

  if (!clinic) {
    notFound();
  }

  return (
    <main className="flex-1">
      <div className="container py-8">
        {/* Clinic Header */}
        <ClinicHeader clinic={clinic} className="mb-8" />

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            <ClinicAbout about={clinic.about} />
            <ClinicServices services={clinic.services} />
            <ClinicInsurance insurance={clinic.insuranceAccepted} />
            <ClinicGallery photos={clinic.photos} clinicName={clinic.name} />
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Location Map */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <EmbeddedMap clinic={clinic} className="h-[250px]" />
              </CardContent>
            </Card>

            {/* Hours */}
            <ClinicHours hours={clinic.hours} />

            {/* Contact Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-sm">{clinic.address.formatted}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <a
                    href={`tel:${clinic.phone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {clinic.phone}
                  </a>
                </div>
                {clinic.email && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${clinic.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {clinic.email}
                    </a>
                  </div>
                )}
                {clinic.website && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Website</p>
                    <a
                      href={clinic.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {clinic.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
