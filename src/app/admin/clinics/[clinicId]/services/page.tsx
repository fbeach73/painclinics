import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ClinicServicesTab } from "@/components/admin/clinics/clinic-services-tab";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClinicById } from "@/lib/clinic-queries";
import { getClinicServices } from "@/lib/clinic-services-queries";
import { getAllServices } from "@/lib/services-queries";

interface PageProps {
  params: Promise<{ clinicId: string }>;
}

export default async function ClinicServicesPage({ params }: PageProps) {
  const { clinicId } = await params;

  // Fetch clinic and services data in parallel
  const [clinic, clinicServices, allServices] = await Promise.all([
    getClinicById(clinicId),
    getClinicServices(clinicId),
    getAllServices(true), // only active services
  ]);

  if (!clinic) {
    notFound();
  }

  // Calculate available services (those not already assigned)
  const assignedServiceIds = new Set(clinicServices.map((cs) => cs.serviceId));
  const availableServices = allServices.filter((s) => !assignedServiceIds.has(s.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/clinics/${clinicId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clinic
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Services for {clinic.title}
          </h1>
          <p className="text-muted-foreground">
            {clinic.city}, {clinic.stateAbbreviation}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Services</CardTitle>
          <CardDescription>
            Select which services this clinic offers. Mark up to 8 services as
            featured to display them prominently on the clinic page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClinicServicesTab
            clinicId={clinic.id}
            clinicName={clinic.title}
            initialServices={clinicServices}
            availableServices={availableServices}
          />
        </CardContent>
      </Card>
    </div>
  );
}
