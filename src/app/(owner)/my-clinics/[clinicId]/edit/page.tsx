import { notFound } from "next/navigation";
import { requireClinicOwnership } from "@/lib/session";
import { ClinicEditForm } from "@/components/owner/clinic-edit-form";

export default async function ClinicEditPage({
  params,
}: {
  params: Promise<{ clinicId: string }>;
}) {
  const { clinicId } = await params;
  const { clinic } = await requireClinicOwnership(clinicId);

  if (!clinic) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Clinic</h1>
        <p className="text-muted-foreground">
          Update your clinic information
        </p>
      </div>

      <ClinicEditForm clinic={clinic} />
    </div>
  );
}
