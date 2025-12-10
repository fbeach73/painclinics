import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireClinicOwnership } from "@/lib/session";
import { getClinicServices, getAvailableServicesForClinic } from "@/lib/clinic-services-queries";
import { ServicesManager } from "@/components/owner/services-manager";

export default async function ServicesManagementPage({
  params,
}: {
  params: Promise<{ clinicId: string }>;
}) {
  const { clinicId } = await params;
  const { clinic } = await requireClinicOwnership(clinicId);

  if (!clinic) {
    notFound();
  }

  const [currentServices, availableServices] = await Promise.all([
    getClinicServices(clinicId),
    getAvailableServicesForClinic(clinicId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/my-clinics/${clinicId}`}
          className="flex items-center justify-center w-8 h-8 rounded-md border hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">
            Manage the services offered at {clinic.title}
          </p>
        </div>
      </div>

      <ServicesManager
        clinicId={clinicId}
        currentServices={currentServices}
        availableServices={availableServices}
      />
    </div>
  );
}
