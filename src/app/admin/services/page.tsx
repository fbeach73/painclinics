import { revalidatePath } from "next/cache";
import { ServiceList } from "@/components/admin/services/service-list";
import { getServicesWithClinicCount, deleteService } from "@/lib/services-queries";

async function handleDelete(serviceId: string) {
  "use server";
  await deleteService(serviceId);
  revalidatePath("/admin/services");
}

export default async function ServicesPage() {
  const services = await getServicesWithClinicCount();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Services</h1>
        <p className="text-muted-foreground">
          Manage the global catalog of services that clinics can offer
        </p>
      </div>
      <ServiceList services={services} onDelete={handleDelete} />
    </div>
  );
}
